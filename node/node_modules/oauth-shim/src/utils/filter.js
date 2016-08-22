
//
// filter
// @param sorts the returning resultset
//
module.exports = function filter(o) {
	if (['string', 'number'].indexOf(typeof(o)) !== -1) {
		return o;
	}

	var r = (Array.isArray(o) ? [] : {});

	for (var x in o) {
		if (o.hasOwnProperty(x)) {
			if (o[x] !== null) {
				if (typeof(x) === 'number') {
					r.push(this.filter(o[x]));
				}
				else {
					r[x] = this.filter(o[x]);
				}
			}
		}
	}
	return r;
};
