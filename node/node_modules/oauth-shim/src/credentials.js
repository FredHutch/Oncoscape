//
// Credentials..
// Given an object containing {client_id, ...},
// Append the property client_secret to the original request object
// This must be called in the scope of an object containing an array of credentials.
//

var originRegExp = require('./utils/originRegExp');

module.exports = {

	// Store the credentials in an array
	credentials: [],

	// Set the credentials too the array
	// The input needs to be an array of objects {client_id, client_secret, ...}
	set: function(credentials) {
		this.credentials.push.apply(this.credentials, credentials);
	},

	// Retrieve the credentials
	get: function(query, callback) {

		// Loop through the services
		for(var i = 0, len = this.credentials.length; i < len; i++) {

			// Item
			var item = this.credentials[i];

			// Does matches the client_id
			if (item.client_id === query.client_id) {
				callback(item);
				return;
			}
		}

		// Return
		callback(false);
	},

	check: function(query, match) {

		// Is the client_id defined
		if (!query.client_id) {
			// No client id
			return error('required_credentials', 'The client_id "' + query.client_id + '" is missing from the request');
		}
		else if(!match) {
			// No matching details found
			return error('invalid_credentials', 'The client_id "' + query.client_id + '" is unknown');
		}

		// Define the grant_url base upon the query
		if (!query.grant_url && query.oauth && query.oauth.grant) {
			query.grant_url = query.oauth.grant;
		}

		// Verify this request is for the correct grant_url/token_url
		// If a grant is defined, throw an error if it is wrong.
		if (match.grant_url && query.grant_url && query.grant_url !== match.grant_url) {

			// Execute callback
			return error('invalid_credentials', 'Grant URL "' + query.grant_url + '" must match "' + match.grant_url + '"');
		}

		else if (match.domain && query.redirect_uri && !query.redirect_uri.match(originRegExp(match.domain))) {

			// Execute callback
			return error('invalid_credentials', 'Redirect URL "' + query.redirect_uri + '" must match "' + match.domain + '"');
		}
		// Return
		return {success:true};
	}
};

function error(code, message) {
	return {
		error: {
			code: code,
			message: message
		}
	};
}
