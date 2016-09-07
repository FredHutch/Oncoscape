var param = require('./param');


// Append the querystring to a url
// @param string url
// @param object parameters

module.exports = function(url, params) {
	if (params) {
		var reg;
		for (var x in params) {
			if (url.indexOf(x) > -1) {
				var str = '[\\?\\&]' + x + '=[^\\&]*';
				reg = new RegExp(str);
				url = url.replace(reg, '');
			}
		}
	}
	return url + (!empty(params) ? (url.indexOf('?') > -1 ? '&' : '?') + param(params) : '');
};

// empty
// Checks whether an Array has length 0, an object has no properties etc
function empty(o) {
	if (isObject(o)) {
		return Object.keys(o).length === 0;
	}
	if (Array.isArray(o)) {
		return o.length === 0;
	}
	else {
		return !!o;
	}
}

function isObject(obj) {
	return Object.prototype.toString.call(obj) === '[object Object]';
}
