console.log("  ___  _ __   ___ ___  ___  ___ __ _ _ __   ___ \n / _ \\| '_ \\ / __/ _ \\/ __|/ __/ _` | '_ \\ / _ \\\n| (_) | | | | (_| (_) \\__ \\ (_| (_| | |_) |  __/\n \\___/|_| |_|\\___\\___/|___/\\___\\__,_| .__/ \\___|\n                                    |_|         ");

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
//var mongo = require('./server-mongo.js').start(config);
var http = require('./server-http.js').start(config);
var socket = require('./server-socket.js').start(config);
var proxy = require('./server-proxy.js').start(config);