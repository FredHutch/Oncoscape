// error_credentials

module.exports = function(p) {
	return {
		error: ((p.client_id || p.id) ? 'invalid' : 'required') + '_credentials',
		error_message: 'Could not find the credentials that match the provided client_id: ' + (p.client_id || p.id),
		state: p.state || ''
	};
};
