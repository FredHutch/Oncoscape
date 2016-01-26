/*
*   Starts Oncoscape Servers
*
*   There are 3 servers involved:
*   1) Proxy Server that delegates to an http and socket servers
*   2) Http Server based on Express that delivers static files, preforms authentiation, etc
*   3) Socket Server that delegates commands to individual R processes
*
*	The configuration.js file sets default ports, but allows the user to override them using
*   command line arguments.  See configuration.js for details.
*/

// Load Configuration
var config = require('./configuration.js').get(process.argv);

// Start Servers
var http = require('./server-http.js').start(config);
var socket = require('./server-socket.js').start(config);
var proxy = require('./server-proxy.js').start(config);