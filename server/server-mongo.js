/*
*   Oncoscape Socket Server
*
*   The oncoscape mongo server is responsible for two things
*   1) Security of Mongo Requests (Currently Simply Read Only)
*   2) Marshalling requesets to and from the Mongo Server
*
*/
var exports = module.exports = {};
exports.start = function(config){

	var mongodbRest = require('mongodb-rest/server.js');

	mongodbRest.startServer({ 
	    "db": "mongodb://127.0.0.1:27017",
	    "server": {
	        "port": config.getPortMongo(),
	        "address": "127.0.0.1"
	    },
	    "accessControl": {
	        "allowOrigin": "*",
	        "allowMethods": "GET",//,POST,PUT,DELETE,HEAD,OPTIONS",
	        "allowCredentials": false
	    },
	    "mongoOptions": {
	        "serverOptions": {
	        },
	        "dbOptions": {
	            "w": 1
	        }
	    },
	    "humanReadableOutput": true,
	    "urlPrefix": "api"
	}, function(){
		console.log('Mongo Rest Server Started On: '+config.getPortMongo());
	});

	
};

