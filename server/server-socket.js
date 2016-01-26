/*
*   Oncoscape Socket Server
*
*   The oncoscape socket server is responsible for two things: 
*   1) Lifecycle of child R processes
*   2) Marshalling requesets to and from the R process and the socket using IPC 
*
*/
var exports = module.exports = {};
exports.start = function(config){

	var http = require('http');
	var sockjs = require('sockjs');
	var fork = require('child_process').fork;

	// List of clients
	var clients = {};
	var socket = sockjs.createServer();
	socket.on('connection', function(conn) {
		
		// Fork R Process
		var r = fork(__dirname + '/r-process.js');

		// R To Socket
		r.on('message', function(data){
		 	conn.write(data);
		});

		// Socket To R
		conn.on('data', function(message){
			r.send(message);
		});

	  	// Add this client to the client list.
	  	clients[conn.id] = {conn: conn, r:r};

		// Destory Client and R Process
		conn.on('close', function() {
			clients[conn.id].r.kill();
			delete clients[conn.id];
		});
	});

	// Begin listening.
	var server = http.createServer();
	socket.installHandlers(server, {prefix: '/oncoscape'});

	// Open Port 
	server.listen(config.getPortSocket(), function () {
	  console.log('Socket Server Started On: ' +config.getPortSocket());
	});
};