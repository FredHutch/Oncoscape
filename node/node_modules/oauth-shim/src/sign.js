//
// Sign
// -------------------------
// Sign OAuth requests
//
// @author Andrew Dodson

var crypto = require('crypto'),
	url = require('url'),
	querystring = require('querystring');

var merge = require('./utils/merge');

function hashString(key, str, encoding) {
	var hmac = crypto.createHmac('sha1', key);
	hmac.update(str);
	return hmac.digest(encoding);
}

function encode(s) {
	return encodeURIComponent(s).replace(/\!/g, '%21')
         .replace(/\'/g, '%27')
         .replace(/\(/g, '%28')
         .replace(/\)/g, '%29')
         .replace(/\*/g, '%2A');
}

module.exports = function(uri, opts, consumer_secret, token_secret, nonce, method, data) {

	// Damage control
	if (!opts.oauth_consumer_key) {
		console.error('OAuth requires opts.oauth_consumer_key');
	}

	// Seperate querystring from path
	var path = uri.replace(/[\?\#].*/, ''),
		qs = querystring.parse(url.parse(uri).query);

	// Create OAuth Properties
	var query = {
		oauth_nonce: nonce || parseInt(Math.random() * 1e20, 10).toString(16),
		oauth_timestamp: nonce || parseInt((new Date()).getTime() / 1000, 10),
		oauth_signature_method: 'HMAC-SHA1',
		oauth_version: '1.0'
	};

	// Merge opts and querystring
	query = merge(query, opts || {});
	query = merge(query, qs || {});
	query = merge(query, data || {});

	// Sort in order of properties
	var keys = Object.keys(query);
	keys.sort();
	var params = [],
		_queryString = [];

	keys.forEach(function(k) {
		if (query[k]) {
			params.push(k + '=' + encode(query[k]));
			if (!data || !(k in data)) {
				_queryString.push(k + '=' + encode(query[k]));
			}
		}
	});

	params = params.join('&');
	_queryString = _queryString.join('&');

	var http = [method || 'GET', encode(path).replace(/\+/g, ' ').replace(/\%7E/g, '~'), encode(params).replace(/\+/g, ' ').replace(/\%7E/g, '~') ];

	// Create oauth_signature
	query.oauth_signature = hashString(consumer_secret + '&' + (token_secret || ''),
		http.join('&'),
		'base64');

	return path + '?' + _queryString + '&oauth_signature=' + encode(query.oauth_signature);
};
