// Given a string representing various domain options.
// Create a regular expression which can match those domains.
module.exports = function(str) {

	// Split the string up into parts
	str = '^(' + str.split(/[\,\s]+/).map(function(pattern) {

		// Escape weird characters
		pattern = pattern.replace(/[^a-z0-9\/\:\*]/g, '\\$&');

		// Prefix
		if (!pattern.match(/^https?:\/\//)) {
			pattern = 'https?://' + pattern.replace(/^:?\/+/, '');
		}

		// Format wildcards
		return pattern.replace('*', '.*');
	}).join('|') + ')';

	return new RegExp(str);
};
