var https = require('https');
var http = require('http');

var param = require('./param');

// Wrap HTTP/HTTPS calls
module.exports = function(req, data, callback) {

	var r = (req.protocol === 'https:' ? https : http).request(req, function(res) {
		var buffer = '';
		res.on('data', function(data) {
			buffer += data;
		});
		res.on('end', function() {

			var data = buffer.toString();

			// Extract the response into data
			var json = {};
			try {
				json = JSON.parse(data);
			}
			catch (e) {
				try {
					json = param(data);
				}
				catch (ee) {
					console.error('ERROR', 'REQUEST: ' + req.url, 'RESPONSE: ' + data);
				}
			}

			callback(null, res, buffer, json);
		});
	});

	r.on('error', function(err) {
		callback(err);
	});

	if (data) {
		r.write(data);
	}

	r.end();

	return r;
};
