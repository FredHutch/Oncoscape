/*
*   Oncoscape Proxy Server
*
*   The proxy server sits in from of both the Oncoscape Web and Socket Servers
*   Arguably a seperate http from express is not nessisary, but will add some flexibility when 
*	authorization functionality is solidified.
*
*/
var exports = module.exports = {};
exports.start = function(config){

	var http = require('http');
	var httpProxy = require('http-proxy');

	// Create Proxy Server
	var proxy = httpProxy.createProxyServer({ws:true});

	// Create Http Server and Proxy Calls To Http
	var server = http.createServer(function(req, res) {
	  proxy.web(req, res, { target: 'http://127.0.0.1:'+config.getPortHttp() });
	});

	// Proxy Calls To Socket
	server.on('upgrade', function (req, socket, head) {
	  proxy.ws(req, socket, head, { target: 'ws://127.0.0.1:'+config.getPortSocket() });
	});

	// Proxy Listen
	server.listen(config.getPortProxy(), function () {
	  console.log('Proxy Server Started On: ' +config.getPortProxy());
	});

};