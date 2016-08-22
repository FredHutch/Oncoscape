
//
// Param
// Explode/Encode the parameters of an URL string/object
// @param string s, String to decode
//
module.exports = function(s, encode) {

	var a = {},
		m;

	if (typeof(s) === 'string') {

		var decode = encode || decodeURIComponent;

		m = s.replace(/^[\#\?]/, '').match(/([^=\/\&]+)=([^\&]+)/g);

		if (m) {
			m.forEach(function(match) {
				var b = match.split('=');
				a[b[0]] = decode(b[1]);
			});
		}
		return a;
	}
	else {
		var o = s;
		encode = encode || encodeURIComponent;

		a = [];

		for (var x in o) {
			if (o.hasOwnProperty(x) && o[x] !== null) {
				a.push([x, o[x] === '?' ? '?' : encode(o[x]) ].join('='));
			}
		}

		return a.join('&');
	}
};
