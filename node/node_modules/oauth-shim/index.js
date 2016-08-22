//
// Implement oauth-shim with a webservice
//

var oauthshim = require('./src/oauth-shim');
var url = require('url');

oauthshim.listen = function(server, requestPathname) {

	// Store old Listeners
	var oldListeners = server.listeners('request');
	server.removeAllListeners('request');

	server.on('request', function(req, res) {

		// Lets let something else handle this.
		// Trigger all oldListeners
		function passthru() {
			oldListeners.forEach(function(handler) {
				handler.call(server, req, res);
			});
		}

		// If the request is limited to a given path, here it is.
		if (requestPathname && requestPathname !== url.parse(req.url).pathname) {
			passthru();
			return;
		}

		oauthshim.request(req, res);
	});
};

module.exports = oauthshim;
