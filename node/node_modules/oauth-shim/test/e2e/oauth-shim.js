//
// OAuth Shim Tests
// Run from root with using command 'npm test'
//
// @author Andrew Dodson
// @since July 2013
//
//

////////////////////////////////
// Dependiencies
////////////////////////////////

var sign = require('../../src/sign'),
	oauthshim = require('../../index'),
	querystring = require('querystring'),
	fs = require('fs'),
	path = require('path');

// Setup a test server
var request = require('supertest'),
	expect = require('expect.js'),
	express = require('express');
var app = express();

////////////////////////////////
// SETUP SHIM LISTENING
////////////////////////////////

oauthshim.init([{
	// OAuth 1
	client_id: 'oauth_consumer_key',
	client_secret: 'oauth_consumer_secret'
}, {
	// OAuth 2
	client_id: 'client_id',
	client_secret: 'client_secret'
}]);

// Start listening
app.all('/proxy', oauthshim);

////////////////////////////////
// SETUP REMOTE SERVER
// This reproduces a third party OAuth and API Server
////////////////////////////////

var connect = require('connect');
var remoteServer = connect();
var srv;
var test_port = 3333;

beforeEach(function() {
	oauthshim.onauthorization = null;
	srv = remoteServer.listen(test_port);
});

// tests here
afterEach(function() {
	srv.close();
});

////////////////////////////////
// Helper functions
////////////////////////////////

function param(o) {
	var r = {};
	for (var x in o) {
		if (o.hasOwnProperty(x)) {
			if (typeof(o[x]) === 'object') {
				r[x] = JSON.stringify(o[x]);
			}
			else {
				r[x] = o[x];
			}
		}
	}

	return querystring.stringify(r);
}

////////////////////////////////
// TEST OAUTH2 SIGNING
////////////////////////////////

var oauth2codeExchange = '';

remoteServer.use('/oauth/grant', function(req, res) {

	res.writeHead(200);
	res.write(oauth2codeExchange);
	res.end();
});

var error_unrecognised = {
	error: {
		code: 'invalid_request',
		message: 'The request is unrecognised'
	}
};

describe('OAuth2 exchanging code for token, ', function() {

	var query = {};

	beforeEach(function() {
		query = {
			'code': '123456',
			'client_id': 'client_id',
			'redirect_uri': 'http://localhost:' + test_port + '/response',
			'state': JSON.stringify({
				'oauth': {
					'grant': 'http://localhost:' + test_port + '/oauth/grant'
				}
			})
		};

		oauth2codeExchange = querystring.stringify({
			expires_in: 'expires_in',
			access_token: 'access_token',
			state: query.state
		});

	});

	function redirect_uri(o) {
		var hash = [];
		for (var x in o) {
			hash.push(x + '=' + o[x]);
		}
		return new RegExp(query.redirect_uri.replace(/\//g, '\\/') + '#' + hash.join('&'));
	}

	it('should return an access_token, and redirect back to redirect_uri', function(done) {

		request(app)
			.get('/proxy?' + querystring.stringify(query))
			.expect('Location', query.redirect_uri + '#' + oauth2codeExchange)
			.expect(302)
			.end(function(err, res) {
				if (err) throw err;
				done();
			});
	});

	xit('should trigger the listener on authorization', function(done) {

		oauthshim.onauthorization = function(session) {
			expect(session).to.have.property('access_token');
			done();
		};

		request(app)
			.get('/proxy?' + querystring.stringify(query))
			.end(function(err, res) {
				if (err) throw err;
			});
	});

	it('should fail if the state.oauth.grant is missing, and redirect back to redirect_uri', function(done) {

		query.state = JSON.stringify({});

		request(app)
			.get('/proxy?' + querystring.stringify(query))
			.expect('Location', redirect_uri({
				error: 'required_grant',
				error_message: '([^&]+)',
				state: encodeURIComponent(query.state)
			}))
			.expect(302)
			.end(function(err, res) {
				if (err) throw err;
				done();
			});
	});

	it('should fail if the state.oauth.grant is invalid, and redirect back to redirect_uri', function(done) {

		query.state = JSON.stringify({
			oauth: {
				grant: 'http://localhost:5555'
			}
		});

		request(app)
			.get('/proxy?' + querystring.stringify(query))
			.expect('Location', redirect_uri({
				error: 'invalid_grant',
				error_message: '([^&]+)',
				state: encodeURIComponent(query.state)
			}))
			.expect(302)
			.end(function(err, res) {
				if (err) throw err;
				done();
			});
	});


	it('should error with required_credentials if the client_id was not provided', function(done) {

		delete query.client_id;

		request(app)
			.get('/proxy?' + querystring.stringify(query))
			.expect('Location', redirect_uri({
				error: 'required_credentials',
				error_message: '([^&]+)',
				state: encodeURIComponent(query.state)
			}))
			.expect(302)
			.end(function(err, res) {
				if (err) throw err;
				done();
			});
	});

	it('should error with invalid_credentials if the supplied client_id had no associated client_secret', function(done) {

		query.client_id = 'unrecognised';

		request(app)
			.get('/proxy?' + querystring.stringify(query))
			.expect('Location', redirect_uri({
				error: 'invalid_credentials',
				error_message: '([^&]+)',
				state: encodeURIComponent(query.state)
			}))
			.expect(302)
			.end(function(err, res) {
				if (err) throw err;
				done();
			});
	});

});


// /////////////////////////////
// OAuth2 Excahange refresh_token for access_token
// /////////////////////////////

describe('OAuth2 exchange refresh_token for access token', function() {

	var query = {};

	beforeEach(function() {
		query = {
			'refresh_token': '123456',
			'client_id': 'client_id',
			'redirect_uri': 'http://localhost:' + test_port + '/response',
			'state': JSON.stringify({
				'oauth': {
					'grant': 'http://localhost:' + test_port + '/oauth/grant'
				}
			})
		};
		oauth2codeExchange = querystring.stringify({
			expires_in: 'expires_in',
			access_token: 'access_token',
			state: query.state
		});
	});

	function redirect_uri(o) {
		var hash = [];
		for (var x in o) {
			hash.push(x + '=' + o[x]);
		}
		return new RegExp(query.redirect_uri.replace(/\//g, '\\/') + '#' + hash.join('&'));
	}

	it('should redirect back to redirect_uri with an access_token and refresh_token', function(done) {

		request(app)
			.get('/proxy?' + querystring.stringify(query))
			.expect('Location', query.redirect_uri + '#' + oauth2codeExchange + '&refresh_token=123456')
			.expect(302)
			.end(function(err, res) {
				if (err) throw err;
				done();
			});
	});


	context('should permit a variety of redirect_uri\'s', function() {

		['http://99problems.com', 'https://problems', , 'file:///problems'].forEach(function(s) {

			it('should regard ' + s + ' as valid', function(done) {

				query.redirect_uri = s;
				request(app)
					.get('/proxy?' + querystring.stringify(query))
					.expect(302)
					.end(function(err, res) {
						if (err) throw err;
						done();
					});
			});

		});
	});


	xit('should trigger on authorization handler', function(done) {

		oauthshim.onauthorization = function(session) {
			expect(session).to.have.property('access_token');
			done();
		};

		request(app)
			.get('/proxy?' + querystring.stringify(query))
			.end(function(err, res) {
				if (err) throw err;
			});
	});
});




////////////////////////////////
// REMOTE SERVER AUTHENTICATION
////////////////////////////////

// Step 1: Return oauth_token & oauth_token_secret
remoteServer.use('/oauth/request', function(req, res) {

	res.writeHead(200);
	var body = querystring.stringify({
		oauth_token: 'oauth_token',
		oauth_token_secret: 'oauth_token_secret'
	});
	res.write(body);
	res.end();
});

// Step 3: Return verified token and secret
remoteServer.use('/oauth/token', function(req, res) {

	res.writeHead(200);
	var body = querystring.stringify({
		oauth_token: 'oauth_token',
		oauth_token_secret: 'oauth_token_secret'
	});
	res.write(body);
	res.end();
});



////////////////////////////////
// TEST OAUTH SIGNING
////////////////////////////////

describe('OAuth authenticate', function() {

	var query = {};

	beforeEach(function() {
		query = {
			state: {
				oauth: {
					version: '1.0a',
					request: 'http://localhost:' + test_port + '/oauth/request',
					token: 'http://localhost:' + test_port + '/oauth/token',
					auth: 'http://localhost:' + test_port + '/oauth/auth'
				}
			},
			client_id: 'oauth_consumer_key',
			redirect_uri: 'http://localhost:' + test_port + '/'
		};
	});

	function redirect_uri(o) {
		var hash = [];
		for (var x in o) {
			hash.push(x + '=' + o[x]);
		}
		return new RegExp((query.redirect_uri || '').replace(/\//g, '\\/') + '#' + hash.join('&'));
	}


	it('should correctly sign a request', function() {
		var callback = 'http://location.com/?wicked=knarly&redirect_uri=' +
					encodeURIComponent('http://local.knarly.com/hello.js/redirect.html' +
						'?state=' + encodeURIComponent(JSON.stringify({proxy: 'http://localhost'})));
		var signed = sign('https://api.dropbox.com/1/oauth/request_token', {'oauth_consumer_key': 't5s644xtv7n4oth', 'oauth_callback': callback}, 'h9b3uri43axnaid', '', '1354345524');
		expect(signed).to.equal('https://api.dropbox.com/1/oauth/request_token?oauth_callback=http%3A%2F%2Flocation.com%2F%3Fwicked%3Dknarly%26redirect_uri%3Dhttp%253A%252F%252Flocal.knarly.com%252Fhello.js%252Fredirect.html%253Fstate%253D%25257B%252522proxy%252522%25253A%252522http%25253A%25252F%25252Flocalhost%252522%25257D&oauth_consumer_key=t5s644xtv7n4oth&oauth_nonce=1354345524&oauth_signature_method=HMAC-SHA1&oauth_timestamp=1354345524&oauth_version=1.0&oauth_signature=7hCq53%2Bcl5PBpKbCa%2FdfMtlGkS8%3D');
	});

	it('should redirect users to the path defined as `state.oauth.auth` with the oauth_token in 1.0a', function(done) {

		request(app)
			.get('/proxy?' + param(query))
			.expect('Location', new RegExp(query.state.oauth.auth.replace(/\//g, '\\/') + '\\?oauth_token\\=oauth_token'))
			.expect(302)
			.end(function(err, res) {
				if (err) throw err;
				done();
			});
	});

	it('should redirect users to the path defined as `state.oauth.auth` with the oauth_token and oauth_callback in 1.0', function(done) {

		query.state.oauth.version = 1;

		request(app)
			.get('/proxy?' + param(query))
			.expect('Location', new RegExp(query.state.oauth.auth.replace(/\//g, '\\/') + '\\?oauth_token\\=oauth_token\\&oauth_callback\\=' + encodeURIComponent(query.redirect_uri).replace(/\//g, '\\/')))
			.expect(302)
			.end(function(err, res) {
				if (err) throw err;
				done();
			});
	});


	it('should return an #error if given a wrong `state.oauth.request`', function(done) {

		query.state.oauth.request = 'http://localhost:' + test_port + '/oauth/brokenrequest';

		request(app)
			.get('/proxy?' + param(query))
			.expect('Location', redirect_uri({
				error: 'auth_failed',
				error_message: '([^&]+)',
				state: encodeURIComponent(JSON.stringify(query.state))
			}))
			.expect(302)
			.end(function(err, res) {
				if (err) throw err;
				done();
			});
	});

	it('should return an Error `server_error` if given a wrong domain', function(done) {

		query.state.oauth.request = 'http://localhost:' + (test_port + 1) + '/wrongdomain';

		request(app)
			.get('/proxy?' + param(query))
			.expect('Location', redirect_uri({
				error: 'server_error',
				error_message: '([^&]+)',
				state: encodeURIComponent(JSON.stringify(query.state))
			}))
			.expect(302)
			.end(function(err, res) {
				if (err) throw err;
				done();
			});
	});

	it('should return Error `required_request_url` if `state.oauth.request` url is missing', function(done) {

		delete query.state.oauth.request;

		request(app)
			.get('/proxy?' + param(query))
			.expect('Location', redirect_uri({
				error: 'required_request_url',
				error_message: '([^&]+)',
				state: encodeURIComponent(JSON.stringify(query.state))
			}))
			.expect(302)
			.end(function(err, res) {
				if (err) throw err;
				done();
			});
	});

	it('should return error `invalid_request` if redirect_uri is missing', function(done) {

		delete query.redirect_uri;

		request(app)
			.get('/proxy?' + param(query))
			.expect(200, JSON.stringify(error_unrecognised, null, 2))
			.end(function(err, res) {
				if (err) throw err;
				done();
			});
	});

	it('should return error `invalid_request` if redirect_uri is not a URL', function(done) {

		query.redirect_uri = 'should be a url';

		request(app)
			.get('/proxy?' + param(query))
			.expect(200, JSON.stringify(error_unrecognised, null, 2))
			.end(function(err, res) {
				if (err) throw err;
				done();
			});
	});


	it('should error with `required_credentials` if the client_id was not provided', function(done) {

		delete query.client_id;

		request(app)
			.get('/proxy?' + param(query))
			.expect('Location', redirect_uri({
				error: 'required_credentials',
				error_message: '([^&]+)',
				state: encodeURIComponent(JSON.stringify(query.state))
			}))
			.expect(302)
			.end(function(err, res) {
				if (err) throw err;
				done();
			});
	});

	it('should error with `invalid_credentials` if the supplied client_id had no associated client_secret', function(done) {

		query.client_id = 'unrecognised';

		request(app)
			.get('/proxy?' + param(query))
			.expect('Location', redirect_uri({
				error: 'invalid_credentials',
				error_message: '([^&]+)',
				state: encodeURIComponent(JSON.stringify(query.state))
			}))
			.expect(302)
			.end(function(err, res) {
				if (err) throw err;
				done();
			});
	});


});


////////////////////////////////
// TEST OAUTH EXCHANGE TOKEN
////////////////////////////////

describe('OAuth exchange token', function() {

	var query = {};

	beforeEach(function() {
		query = {
			oauth_token: 'oauth_token',
			redirect_uri: 'http://localhost:' + test_port + '/',
			client_id: 'oauth_consumer_key',
			state: {
				oauth: {
					token: 'http://localhost:' + test_port + '/oauth/token',
				}
			}
		};
	});

	function redirect_uri(o) {
		var hash = [];
		for (var x in o) {
			hash.push(x + '=' + o[x]);
		}
		return new RegExp(query.redirect_uri.replace(/\//g, '\\/') + '#' + hash.join('&'));
	}


	it('should exchange an oauth_token, and return an access_token', function(done) {

		request(app)
			.get('/proxy?' + param(query))
			.expect('Location', redirect_uri({
				oauth_token: encodeURIComponent('oauth_token'),
				oauth_token_secret: encodeURIComponent('oauth_token_secret'),
				access_token: encodeURIComponent('oauth_token:oauth_token_secret@' + query.client_id)
			}))
			.expect(302)
			.end(function(err, res) {
				if (err) throw err;
				done();
			});
	});


	xit('should trigger on authorization handler', function(done) {

		oauthshim.onauthorization = function(session) {
			expect(session).to.have.property('access_token');
			done();
		};

		request(app)
			.get('/proxy?' + param(query))
			.expect(302)
			.end(function(err, res) {
				if (err) throw err;
			});
	});


	it('should return an #error if given an erroneous token_url', function(done) {

		query.state.oauth.token = 'http://localhost:' + test_port + '/oauth/brokentoken';

		request(app)
			.get('/proxy?' + param(query))
			.expect('Location', redirect_uri({
				error: 'auth_failed',
				error_message: '([^&]+)',
				state: encodeURIComponent(JSON.stringify(query.state))
			}))
			.expect(302)
			.end(function(err, res) {
				if (err) throw err;
				done();
			});
	});

	it('should return an #error if token_url is missing', function(done) {

		delete query.state.oauth.token;

		request(app)
			.get('/proxy?' + param(query))
			.expect('Location', redirect_uri({
				error: 'required_token_url',
				error_message: '([^&]+)',
				state: encodeURIComponent(JSON.stringify(query.state))
			}))
			.expect(302)
			.end(function(err, res) {
				if (err) throw err;
				done();
			});
	});

	it('should return an #error if the oauth_token is wrong', function(done) {

		query.oauth_token = 'boom';

		request(app)
			.get('/proxy?' + param(query))
			.expect('Location', redirect_uri({
				error: 'invalid_oauth_token',
				error_message: '([^&]+)',
				state: encodeURIComponent(JSON.stringify(query.state))
			}))
			.expect(302)
			.end(function(err, res) {
				if (err) throw err;
				done();
			});
	});

});











////////////////////////////////
// REMOTE SERVER API
////////////////////////////////

remoteServer.use('/api/', function(req, res) {

	// If an Number is passed on the URL then return that number as the StatusCode
	if (req.url.replace(/^\//, '') > 200) {
		res.writeHead(req.url.replace(/^\//, '') * 1);
		res.end();
		return;
	}

	res.setHeader('x-test-url', req.url);
	res.setHeader('x-test-method', req.method);
	res.writeHead(200);

//	console.log(req.headers);

	var buf = '';
	req.on('data', function(data) {
		buf += data;
	});

	req.on('end', function() {
		////////////////////
		// TAILOR THE RESPONSE TO MATCH THE REQUEST
		////////////////////
		res.write([req.method, req.headers.header, buf].filter(function(a) {return !!a;}).join('&'));
		res.end();
	});

});



// Test path
var api_url = 'http://localhost:' + test_port + '/api/',
	access_token = 'token_key:token_secret@oauth_consumer_key';




////////////////////////////////
// TEST PROXY
////////////////////////////////

describe('Proxying requests with a shimed access_token', function() {



	///////////////////////////////
	// REDIRECT THE AGENT
	///////////////////////////////

	it('should correctly sign and return a 302 redirection, implicitly', function() {

		request(app)
			.get('/proxy?access_token=' + access_token + '&path=' + api_url)
			.expect('Location', new RegExp(api_url + '\\?oauth_consumer_key\\=oauth_consumer_key\\&oauth_nonce\\=.+&oauth_signature_method=HMAC-SHA1\\&oauth_timestamp=[0-9]+\\&oauth_token\\=token_key\\&oauth_version\\=1\\.0\\&oauth_signature\\=.+\\%3D'))
			.expect(302)
			.end(function(err, res) {
				if (err) throw err;
			});
	});

	it('should correctly sign and return a 302 redirection, explicitly', function() {

		request(app)
			.get('/proxy?access_token=' + access_token + '&then=redirect&path=' + api_url)
			.expect('Location', new RegExp(api_url + '\\?oauth_consumer_key\\=oauth_consumer_key\\&oauth_nonce\\=.+&oauth_signature_method=HMAC-SHA1\\&oauth_timestamp=[0-9]+\\&oauth_token\\=token_key\\&oauth_version\\=1\\.0\\&oauth_signature\\=.+\\%3D'))
			.expect(302)
			.end(function(err, res) {
				if (err) throw err;
			});
	});


	///////////////////////////////
	// RETURN THE SIGNED REQUEST
	///////////////////////////////

	it('should correctly return a signed uri', function() {

		request(app)
			.get('/proxy?then=return&access_token=' + access_token + '&path=' + api_url)
			.expect(200, new RegExp(api_url + '\\?oauth_consumer_key\\=oauth_consumer_key\\&oauth_nonce\\=.+&oauth_signature_method=HMAC-SHA1\\&oauth_timestamp=[0-9]+\\&oauth_token\\=token_key\\&oauth_version\\=1\\.0\\&oauth_signature\\=.+\\%3D'))
			.end(function(err, res) {
				if (err) throw err;
			});
	});

	it('should correctly return signed uri in a JSONP callback', function() {

		request(app)
			.get('/proxy?then=return&access_token=' + access_token + '&path=' + api_url + '&callback=myJSON')
			.expect(200, new RegExp('myJSON\\(([\'\"])' + api_url + '\\?oauth_consumer_key\\=oauth_consumer_key\\&oauth_nonce\\=.+&oauth_signature_method=HMAC-SHA1\\&oauth_timestamp=[0-9]+\\&oauth_token\\=token_key\\&oauth_version\\=1\\.0\\&oauth_signature\\=.+\\%3D(\\1)\\)'))
			.end(function(err, res) {
				if (err) throw err;
			});
	});

	it('should accept the method and correctly return a signed uri accordingly', function() {

		request(app)
			.get('/proxy?then=return&method=POST&access_token=' + access_token + '&path=' + api_url)
			.expect(200, new RegExp(api_url + '\\?oauth_consumer_key\\=oauth_consumer_key\\&oauth_nonce\\=.+&oauth_signature_method=HMAC-SHA1\\&oauth_timestamp=[0-9]+\\&oauth_token\\=token_key\\&oauth_version\\=1\\.0\\&oauth_signature\\=.+\\%3D'))
			.end(function(err, res) {
				if (err) throw err;
			});
	});


	///////////////////////////////
	// PROXY REQUESTS - SIGNED
	///////////////////////////////

	it('should correctly sign the path and proxy GET requests', function(done) {
		request(app)
			.get('/proxy?then=proxy&access_token=' + access_token + '&path=' + api_url)
			.expect('GET')
			.end(function(err, res) {
				if (err) throw err;
				done();
			});
	});

	it('should correctly sign the path and proxy POST body', function(done) {

		request(app)
			.post('/proxy?then=proxy&access_token=' + access_token + '&path=' + api_url)
			.send('POST_DATA')
			.expect('Access-Control-Allow-Origin', '*')
			.expect('POST&POST_DATA')
			.end(function(err, res) {
				if (err) throw err;
				done();
			});
	});

	it('should correctly sign the path and proxy POST asynchronously', function(done) {

		oauthshim.getCredentials = function(id, callback) {
			setTimeout(function() {
				callback('oauth_consumer_secret');
			}, 1000);
		};

		request(app)
			.post('/proxy?then=proxy&access_token=' + access_token + '&path=' + api_url)
			.attach('file', './package.json')
			.expect('Access-Control-Allow-Origin', '*')
			.expect(/^POST\&(\-\-.*?)[\s\S]*(\1)\-\-(\r\n)?$/)
			.end(function(err, res) {
				if (err) throw err;
				done();
			});
	});
});



describe('Proxying unsigned requests', function() {

	var access_token = 'token';

	///////////////////////////////
	// PROXY REQUESTS - UNSIGNED
	///////////////////////////////

	it('should append the access_token to the path - if it does not conform to an OAuth1 token, and needs not be signed', function(done) {
		request(app)
			.get('/proxy?then=proxy&access_token=' + access_token + '&path=' + api_url)
			.expect('GET')
			.expect('x-test-url', /access_token\=token/)
			.end(function(err, res) {
				if (err) throw err;
				done();
			});
	});

	xit('should not sign the request if the OAuth1 access_token does not match any on record', function(done) {

		var get = credentials.get;
		credentials.get = function(query, callback) {
			callback(null);
		}

		var unknown_oauth1_token = "user_token_key:user_token_secret@app_token_key";

		request(app)
			.get('/proxy?then=proxy&access_token=' + unknown_oauth1_token + '&path=' + api_url)
			.expect('GET')
			// .expect('x-test-url', /access_token\=token/)
			.end(function(err, res) {
				if (err) throw err;
				done();
			});
	});

	it('should correctly return a 302 redirection', function() {

		request(app)
			.get('/proxy?path=' + api_url)
			.expect('Location', api_url)
			.expect(302)
			.end(function(err, res) {
				if (err) throw err;
			});
	});

	it('should correctly proxy GET requests', function(done) {
		request(app)
			.get('/proxy?then=proxy&path=' + api_url)
			.expect('GET')
			.end(function(err, res) {
				if (err) throw err;
				done();
			});
	});

	it('should correctly proxy POST requests', function(done) {
		request(app)
			.post('/proxy?then=proxy&path=' + api_url)
			.send('POST_DATA')
			.expect('Access-Control-Allow-Origin', '*')
			.expect('POST&POST_DATA')
			.end(function(err, res) {
				if (err) throw err;
				done();
			});
	});

	it('should correctly proxy multipart POST requests', function(done) {
		request(app)
			.post('/proxy?then=proxy&path=' + api_url)
			.attach('file', './package.json')
			.expect('Access-Control-Allow-Origin', '*')
			.expect(/^POST\&(\-\-.*?)[\s\S]*(\1)\-\-(\r\n)?$/)
			.end(function(err, res) {
				if (err) throw err;
				done();
			});
	});

	/*
	it('should correctly pass through headers', function(done) {
		request(app)
			.post('/proxy?then=proxy&path=' + api_url)
			.set('header', 'header')
			.expect('Access-Control-Allow-Origin', '*')
			.expect('POST&header')
			.end(function(err, res) {
				if (err) throw err;
				done();
			});
	}); */

	it('should correctly proxy DELETE requests', function(done) {
		request(app)
			.del('/proxy?then=proxy&path=' + api_url)
			.expect('Access-Control-Allow-Origin', '*')
			.expect('DELETE')
			.end(function(err, res) {
				if (err) throw err;
				done();
			});
	});

	it('should handle invalid paths', function(done) {
		var fake_url = 'http://localhost:45673/';
		request(app)
			.post('/proxy?then=proxy&path=' + fake_url)
			.send('POST_DATA')
			.expect('Access-Control-Allow-Origin', '*')
			.expect(502)
			.end(function(err, res) {
				if (err) throw err;
				done();
			});
	});

	it('should return server errors', function(done) {

		request(app)
			.post('/proxy?then=proxy&path=' + api_url + '401')
			.send('POST_DATA')
			.expect('Access-Control-Allow-Origin', '*')
			.expect(401)
			.end(function(err, res) {
				if (err) throw err;
				done();
			});
	});


	it('should return a JSON error object if absent path parameter', function(done) {

		request(app)
			.post('/proxy')
			.expect('Access-Control-Allow-Origin', '*')
			.expect(200)
			.end(function(err, res) {
				var obj = JSON.parse(res.text);
				if (obj.error.code !== 'invalid_request') throw new Error('Not failing gracefully');
				done();
			});
	});

});
