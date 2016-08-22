var proxy = require('../../src/proxy'),
	url = require('url');

// Setup a test server
var request = require('supertest'),
	express = require('express');
var app = express();

/////////////////////////////////
// PROXY SERVER
/////////////////////////////////

app.all('/proxy', function(req, res) {
	var path = req.query.path;
	var method = req.query.method || req.method;

	var options = url.parse(path);
	options.method = method;

	// Proxy request
	proxy.proxy(req, res, options);
});


/////////////////////////////////
// FAKE REMOTE SERVER
/////////////////////////////////

var connect = require('connect');
var remoteServer = connect(), srv;
var test_port = 1337,
	api_url = 'http://localhost:' + test_port;



////////////////////////////////
// REMOTE SERVER API
////////////////////////////////

remoteServer.use('/', function(req, res) {

	// If an Number is passed on the URL then return that number as the StatusCode
	if (req.url.replace(/^\//, '') > 200) {
		res.writeHead(req.url.replace(/^\//, '') * 1);
		res.end();
		return;
	}

	res.writeHead(200);

	res.write([req.method, req.headers.header].filter(function(a) {return !!a;}).join('&') + '&');

//	console.log(req.headers);

	req.on('data', function(data, encoding) {
		res.write(data, encoding);
	});

	req.on('end', function() {
		////////////////////
		// TAILOR THE RESPONSE TO MATCH THE REQUEST
		////////////////////
		res.end();
	});

});



beforeEach(function() {
	srv = remoteServer.listen(test_port);
});
// tests here
afterEach(function() {
	srv.close();
});



describe('Proxying unsigned requests', function() {

	///////////////////////////////
	// PROXY REQUESTS - UNSIGNED
	///////////////////////////////

	it('with a GET request', function(done) {
		request(app)
			.get('/proxy?path=' + api_url)
			.expect('GET&')
			.end(function(err, res) {
				if (err) throw err;
				done();
			});
	});

	it('with a GET request and x-headers', function(done) {
		request(app)
			.get('/proxy?path=' + api_url)
			.set('x-custom-header', 'custom-header')
			.expect('GET&')
			.end(function(err, res) {
				if (err) throw err;
				done();
			});
	});

	it('with a POST request', function(done) {
		request(app)
			.post('/proxy?path=' + api_url)
			.send('POST_DATA')
			.expect('POST&POST_DATA')
			.end(function(err, res) {
				if (err) throw err;
				done();
			});
	});

	it('with a multipart POST request', function(done) {
		request(app)
			.post('/proxy?path=' + api_url)
			.attach('package.json', __dirname + '/../../package.json')
			.expect(/^POST\&(\-\-.*?)[\s\S]*(\1)\-\-(\r\n)?$/)
			.end(function(err, res) {
				if (err) throw err;
				done();
			});
	});

	it('with a multipart DELETE request', function(done) {
		request(app)
			.del('/proxy?path=' + api_url)
			.expect('DELETE&')
			.end(function(err, res) {
				if (err) throw err;
				done();
			});
	});

});
