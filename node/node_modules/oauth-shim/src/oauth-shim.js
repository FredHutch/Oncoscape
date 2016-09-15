//
// Node-OAuth-Shim
// A RESTful API for interacting with OAuth1 and 2 services.
//
// @author Andrew Dodson
// @since July 2013

var url = require('url');

var qs = require('./utils/qs');
var merge = require('./utils/merge');
var param = require('./utils/param');


var sign = require('./sign.js');
var proxy = require('./proxy.js');

var oauth2 = require('./oauth2');
var oauth1 = require('./oauth1');

// Export a new instance of the API
module.exports = oauth_shim;

// Map default options
function oauth_shim(req, res, next) {
	return oauth_shim.request(req, res, next);
};

// Get the credentials object for managing the getting and setting of credentials.
var credentials = require('./credentials');

// Assign the credentials object for remote access to overwrite its functions
oauth_shim.credentials = credentials;

// Set pretermined client-id's and client-secret
oauth_shim.init = function(arr) {

	// Apply the credentials
	credentials.set(arr);
};

// Request
// Compose all the default operations of this component
oauth_shim.request = function(req, res, next) {

	var self = oauth_shim;

	return self.interpret(req, res,
			self.proxy.bind(self, req, res,
			self.redirect.bind(self, req, res,
			self.unhandled.bind(self, req, res, next))));
};

// Interpret the oauth login
// Append data to the request object to hand over to the 'redirect' handler
oauth_shim.interpret = function(req, res, next) {

	var self = oauth_shim;

	// if the querystring includes
	// An authentication 'code',
	// client_id e.g. '1231232123',
	// response_uri, '1231232123',
	var p = req.query || param(url.parse(req.url).search);
	var state = p.state;

	// Has the parameters been stored in the state attribute?
	try {
		// decompose the p.state, redefine p
		p = merge(p, JSON.parse(p.state));
		p.state = state; // set this back to the string
	}
	catch (e) {}

	// Convert p.id into p.client_id
	if (p.id && !p.client_id) {
		p.client_id = p.id;
	}

	// Define the options
	req.oauthshim = {
		options: p
	};

	// Generic formatting `redirect_uri` is of the correct format
	if (typeof p.redirect_uri === 'string' && !p.redirect_uri.match(/^[a-z]+:\/\//i)) {
		p.redirect_uri = '';
	}

	// OAUTH2
	if ((p.code || p.refresh_token) && p.redirect_uri) {

		// Get
		login(p, function(match) {

			// OAuth2
			oauth2(p, function(session) {

				// Redirect page
				// With the Auth response, we need to return it to the parent
				session.state = p.state || '';

				// OAuth Login
				redirect(req, p.redirect_uri, session, next);
			});

		}, function(error) {
			redirect(req, p.redirect_uri, error, next);
		});

		return;
	}

	// OAUTH1
	else if (p.redirect_uri && ((p.oauth && parseInt(p.oauth.version, 10) === 1) || p.oauth_token)) {

		// Credentials...
		login(p, function(match) {
			// Add environment info.
			p.location = url.parse('http' + (req.connection.encrypted ? 's' : '') + '://' + req.headers.host + req.url);

			// OAuth1
			oauth1(p, function(session) {

				var loc = p.redirect_uri;

				if (typeof session === 'string') {
					loc = session;
					session = {};
				}
				else {
					// Add the state
					session.state = p.state || '';
				}

				redirect(req, loc, session, next);
			});

		}, function(error) {
			redirect(req, p.redirect_uri, error, next);
		});

		return;
	}

	// Move on
	else if (next) {
		next();
	}

};

// Proxy
// Signs/Relays requests
oauth_shim.proxy = function(req, res, next) {

	var p = param(url.parse(req.url).search);

	// SUBSEQUENT SIGNING OF REQUESTS
	// Previously we've been preoccupoed with handling OAuth authentication/
	// However OAUTH1 also needs every request to be signed.
	if (p.access_token && p.path) {

		// errr
		var buffer = proxy.buffer(req);

		signRequest((p.method || req.method), p.path, p.data, p.access_token, proxyHandler.bind(null, req, res, next, p, buffer));

		return;
	}
	else if (p.path) {

		proxyHandler(req, res, next, p, undefined, p.path);

		return;
	}

	else if (next) {
		next();
	}
};



//
// Redirect Request
// Is this request marked for redirect?
//
oauth_shim.redirect = function(req, res, next) {

	if (req.oauthshim && req.oauthshim.redirect) {

		var hash = req.oauthshim.data;
		var path = req.oauthshim.redirect;

		path += (hash ? '#' + param(hash) : '');

		res.writeHead(302, {
			'Access-Control-Allow-Origin': '*',
			'Location': path
		});

		res.end();
	}
	else if (next) {
		next();
	}
};



//
// unhandled
// What to return if the request was previously unhandled
//
oauth_shim.unhandled = function(req, res, next) {

	var p = param(url.parse(req.url).search);

	serveUp(res, errorObj('invalid_request', 'The request is unrecognised'), p.callback);

};



//
//
//
//
// UTILITIES
//
//
//
//

function login(p, successHandler, errorHandler) {

	credentials.get(p, function(match) {

		// Handle error
		var check = credentials.check(p, match);

		// Handle errors
		if (check.error) {

			var e = check.error;

			errorHandler({
				error: e.code,
				error_message: e.message,
				state: p.state || ''
			});
		}
		else {

			// Add the secret
			p.client_secret = match.client_secret;

			// Success
			successHandler(match);
		}
	});
}

//
// Sign
//

function signRequest(method, path, data, access_token, callback) {

	var token = access_token.match(/^([^:]+)\:([^@]+)@(.+)$/);

	if (!token) {

		// If the access_token exists, append it too the path
		if (access_token) {
			path = qs(path, {
				access_token: access_token
			});
		}

		callback(path);
		return;
	}

	// Create a credentials object to append the secret too..
	var query = {
		client_id: token[3]
	};

	// Update the credentials object with the client_secret
	credentials.get(query, function(match) {

		if (match && match.client_secret) {
			path = sign(path, {
				oauth_token: token[1],
				oauth_consumer_key: query.client_id
			}, match.client_secret, token[2], null, method.toUpperCase(), data ? JSON.parse(data) : null);
		}

		callback(path);

	});
}



//
// Process, pass the request the to be processed,
// The returning function contains the data to be sent
function redirect(req, path, hash, next) {

	req.oauthshim = req.oauthshim || {};
	req.oauthshim.data = hash;
	req.oauthshim.redirect = path;

	if (next) {
		next();
	}
}


//
// Serve Up
//

function serveUp(res, body, jsonp_callback) {

	if (typeof(body) === 'object') {
		body = JSON.stringify(body, null, 2);
	}
	else if (typeof(body) === 'string' && jsonp_callback) {
		body = '"' + body + '"';
	}

	if (jsonp_callback) {
		body = jsonp_callback + '(' + body + ')';
	}

	res.writeHead(200, {'Access-Control-Allow-Origin': '*'});
	res.end(body, 'utf8');
}




function proxyHandler(req, res, next, p, buffer, path) {

	// Define Default Handler
	// Has the user specified the handler
	// determine the default`
	if (!p.then) {
		if (req.method === 'GET') {
			if (!p.method || p.method.toUpperCase() === 'GET') {
				// Change the location
				p.then = 'redirect';
			}
			else {
				// return the signed path
				p.then = 'return';
			}
		}
		else {
			// proxy the request through this server
			p.then = 'proxy';
		}
	}


	//
	if (p.then === 'redirect') {
		// redirect the users browser to the new path
		redirect(req, path, null, next);
	}
	else if (p.then === 'return') {
		// redirect the users browser to the new path
		serveUp(res, path, p.callback);
	}
	else {
		var options = url.parse(path);
		options.method = p.method ? p.method.toUpperCase() : req.method;

		//
		// Proxy
		proxy.proxy(req, res, options, buffer);
	}
}

function errorObj(code, message) {
	return {
		error: {
			code: code,
			message: message
		}
	};
}
