/*
*   Oncoscape Configuration
*
*   This utility module is responsible for housing the default configuration.
*	A json string can be passed to the config's get function to override any values.
*	The most common scenario is to relay arguments passed from the command line.
*	This should likely be refactored to be a singleton, but left as is during development.
*
*/
var exports = module.exports = {};
exports.get = function(argv){
	
	// Configuration Defaults
	var config = {
		port_proxy:80,
		port_http:3000,
		port_socket:3001,
		port_mongo:3002
	};

	// Configuration Override
	if (argv!==undefined) argv.forEach(function (val, index, array) {
		if (val.indexOf(":")>0){
			var kv = val.split(":");
			config[kv[0]] = (kv[0].indexOf('port')==0) ? parseInt(kv[1]) : kv[1];
		}
	});

	// String Represenation
	var serialized = JSON.stringify(config).replace(/\s+|\s+$|"|\{|\}/g,'').split(',');

	// Return Getters
	return {
		getPortHttp: function(){ return config.port_http; },
		getPortProxy: function(){ return config.port_proxy; },
		getPortSocket: function(){ return config.port_socket; },
		getPortMongo: function(){ return config.port_mongo; },
		toString: function(){ return serialized; }
	};
};