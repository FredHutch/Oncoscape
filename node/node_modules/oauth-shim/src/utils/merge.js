//
// merge
// recursive merge two objects into one, second parameter overides the first
// @param a array
//

module.exports = function merge(a, b) {

	var x, r = {};

	if (typeof(a) === 'object' && typeof(b) === 'object') {
		for (x in a) {
			if (Object.prototype.hasOwnProperty.call(a, x)) {
				r[x] = a[x];
				if (x in b) {
					r[x] = merge(a[x], b[x]);
				}
			}
		}
		for (x in b) {
			if (Object.prototype.hasOwnProperty.call(b, x)) {
				if (!(x in a)) {
					r[x] = b[x];
				}
			}
		}
	}
	else {
		r = b;
	}
	return r;
};
