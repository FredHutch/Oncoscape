//
// Proxy Server
// -------------
// Proxies requests with the Access-Control-Allow-Origin Header
//
// @author Andrew Dodson
// Heavily takes code design from ConnectJS

var url = require('url');
var http = require('http');
var https = require('https');
var EventEmitter = require('events').EventEmitter;

function request(opts, callback) {

	/*
	// Use fiddler?
	opts.path = (opts.protocol === 'https:'? 'https' : 'http') + '://' + opts.host + (opts.port?':' + opts.port:'') + opts.path;
	if (!opts.headers) {
		opts.headers = {};
	}
	opts.headers.host = opts.host;
	opts.host = '127.0.0.1';
//	opts.host = 'localhost';
	opts.port = 8888;
//	opts.protocol = null;

	/**/
	var req;
	try {
		req = (opts.protocol === 'https:' ? https : http).request(opts, callback);
	}
	catch (e) {
		console.error(e);
		console.error(JSON.stringify(opts, null, 2));
	}
	return req;
};

//
// @param req				- Request Object
// @param options || url	- Map request to this
// @param res				- Response, bind response to this
exports.proxy = function(req, res, options, buffer) {

	//////////////////////////
	// Inherit from events
	//////////////////////////

	// TODO:
	// make this extend the instance
	var self = new EventEmitter();


	///////////////////////////
	// Define where this request is going
	///////////////////////////

	if (typeof(options) === 'string') {
		options = url.parse(options);
		options.method = req.method;
	}
	else {
		if (!options.method) {
			options.method = req.method;
		}
	}

	if (!options.headers) {
		options.headers = {};
	}

	if (options.method === 'DELETE') {
		options.headers['content-length'] = req.headers['content-length'] || '0';
	}


	// Loop through all req.headers
	for (var header in req.headers) {
		// Is this a custom header?
		if (header.match(/^(x-|content-type)/i)) {
			options.headers[header] = req.headers[header];
		}
	}


	options.agent = false;


	///////////////////////////////////
	// Preflight request
	///////////////////////////////////

	if (req.method.toUpperCase() === 'OPTIONS') {

		// Response headers
		var obj = {
			'access-control-allow-origin': '*',
			'access-control-allow-methods': 'OPTIONS, TRACE, GET, HEAD, POST, PUT, DELETE',
			'content-length': 0
//			'Access-Control-Max-Age': 3600, // seconds
		};

		// Return any headers the client has specified
		if (req.headers['access-control-request-headers']) {
			obj['access-control-allow-headers'] = req.headers['access-control-request-headers'];
		}

		res.writeHead(204, 'no content', obj);

		return res.end();
	}


	///////////////////////////////////
	// Define error handler
	///////////////////////////////////
	function proxyError(err) {

		errState = true;

		//
		// Emit an `error` event, allowing the application to use custom
		// error handling. The error handler should end the response.
		//
		if (self.emit('proxyError', err, req, res)) {
			return;
		}

		res.writeHead(502, {
			'Content-Type': 'text/plain',
			'Access-Control-Allow-Origin': '*',
			'Access-Control-Allow-Methods': 'OPTIONS, TRACE, GET, HEAD, POST, PUT'
		});

		if (req.method !== 'HEAD') {

			//
			// This NODE_ENV=production behavior is mimics Express and
			// Connect.
			//if (process.env.NODE_ENV === 'production') {
			//	res.write('Internal Server Error');
			//}
			res.write(JSON.stringify({error: err}));
		}

		try { res.end(); }
		catch (ex) { console.error('res.end error: %s', ex.message); }
	}



	///////////////////////////////////
	// Make outbound call
	///////////////////////////////////
	var _req = request(options, function(_res) {

		// Process the `reverseProxy` `response` when it's received.
		//
		if (req.httpVersion === '1.0') {
			if (req.headers.connection) {
				_res.headers.connection = req.headers.connection;
			} else {
				_res.headers.connection = 'close';
			}
		} else if (!_res.headers.connection) {
			if (req.headers.connection) {
				_res.headers.connection = req.headers.connection;
			}
			else {
				_res.headers.connection = 'keep-alive';
			}
		}

		// Remove `Transfer-Encoding` header if client's protocol is HTTP/1.0
		// or if this is a DELETE request with no content-length header.
		// See: https://github.com/nodejitsu/node-http-proxy/pull/373
		if (req.httpVersion === '1.0' || (req.method === 'DELETE' && !req.headers['content-length'])) {
			delete _res.headers['transfer-encoding'];
		}


		//
		// When the `reverseProxy` `response` ends, end the
		// corresponding outgoing `res` unless we have entered
		// an error state. In which case, assume `res.end()` has
		// already been called and the 'error' event listener
		// removed.
		//
		var ended = false;
		_res.on('close', function () {
			if (!ended) { _res.emit('end'); }
		});


		//
		// After reading a chunked response, the underlying socket
		// will hit EOF and emit a 'end' event, which will abort
		// the request. If the socket was paused at that time,
		// pending data gets discarded, truncating the response.
		// This code makes sure that we flush pending data.
		//
		_res.connection.on('end', function () {
			if (_res.readable && _res.resume) {
				_res.resume();
			}
		});

		_res.on('end', function () {
			ended = true;
			if (!errState) {
				try { res.end(); }
				catch (ex) { console.error('res.end error: %s', ex.message); }

				// Emit the `end` event now that we have completed proxying
				self.emit('end', req, res, _res);
			}
		});
		// Allow observer to modify headers or abort response
		try { self.emit('proxyResponse', req, res, _res); }
		catch (ex) {
			errState = true;
			return;
		}

		// Set the headers of the client response
		Object.keys(_res.headers).forEach(function (key) {
			res.setHeader(key, _res.headers[key]);
		});
		res.setHeader('access-control-allow-methods', 'OPTIONS, TRACE, GET, HEAD, POST, PUT');
		res.setHeader('access-control-allow-origin', '*');

		//
		// StatusCode
		// Should we supress error codes
		//
		var suppress_response_codes = url.parse(req.url, true).query.suppress_response_codes;

		// Overwrite the nasty ones
		res.writeHead(suppress_response_codes ? 200 : _res.statusCode);


		//
		// Data
		//
		_res.on('data', function (chunk, encoding) {
			if (res.writable) {
				// Only pause if the underlying buffers are full,
				// *and* the connection is not in 'closing' state.
				// Otherwise, the pause will cause pending data to
				// be discarded and silently lost.
				if (false === res.write(chunk, encoding) && _res.pause && _res.connection.readable) {
					_res.pause();
				}
			}
		});

		res.on('drain', function() {
			if (_res.readable && _res.resume) {
				_res.resume();
			}
		});
	});

	if (!req) {
		console.error('proxyError');
		proxyError();
		return;
	}

	var errState = false;

	///////////////////////////
	// Set Listeners to handle errors
	///////////////////////////

	req.on('error', proxyError);
	_req.on('error', proxyError);

	req.on('aborted', function() {
		_req.abort();
	});

	_req.on('aborted', function() {
		_req.abort();
	});


	///////////////////////////
	// Set Listeners to write data
	///////////////////////////

	req.on('data', function (chunk, encoding) {

		if (errState) {
			return;
		}

		// Writing chunk data doesn not require an encoding parameter
		var flushed = _req.write(chunk);

		if (flushed) {
			return;
		}

		req.pause();
		_req.once('drain', function () {
			try {
				req.resume();
			}
			catch (er) {
				console.error('req.resume error: %s', er.message);
			}
		});

		//
		// Force the `drain` event in 100ms if it hasn't
		// happened on its own.
		//
		setTimeout(function() {
			_req.emit('drain');
		}, 100);
	});

	//
	// When the incoming `req` ends, end the corresponding `reverseProxy`
	// request unless we have entered an error state.
	//
	req.on('end', function () {
		if (!errState) {
			_req.end();
		}
	});

	//
	// Buffer
	if (buffer) {
		return !errState ? buffer.resume() : buffer.destroy();
	}

	return this;
};


// __Attribution:__ This approach is based heavily on
// [Connect](https://github.com/senchalabs/connect/blob/master/lib/utils.js#L157).
// However, this is not a big leap from the implementation in node-http-proxy < 0.4.0.
// This simply chooses to manage the scope of the events on a new Object literal as opposed to
// [on the HttpProxy instance](https://github.com/nodejitsu/node-http-proxy/blob/v0.3.1/lib/node-http-proxy.js#L154).
//
exports.buffer = function (obj) {
	var events = [],
		onData,
		onEnd;

	obj.on('data', onData = function (data, encoding) {
		events.push(['data', data, encoding]);
	});

	obj.on('end', onEnd = function (data, encoding) {
		events.push(['end', data, encoding]);
	});

	return {
		end: function () {
			obj.removeListener('data', onData);
			obj.removeListener('end', onEnd);
		},
		destroy: function () {
			this.end();
			this.resume = function () {
				console.error('Cannot resume buffer after destroying it.');
			};

			onData = onEnd = events = obj = null;
		},
		resume: function () {
			this.end();
			for (var i = 0, len = events.length; i < len; i++) {
				obj.emit.apply(obj, events[i]);
			}
		}
	};
};
