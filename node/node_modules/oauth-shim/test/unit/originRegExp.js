var originRegExp = require('../../src/utils/originRegExp');

describe('originRegExp', function() {

	it('should set return a regular expression', function() {

		var valid_url = 'https://test.com:8080/awesome';
		var reg = originRegExp("");
		expect(reg).to.be.a('regexp');
		expect(valid_url.match(reg)).to.be.ok();

	});

	it('should interpret the following patterns', function() {

		// Valid test url
		var valid_url = 'https://test.com:8080/awesome';
		var invalid_url = 'https://test.org/awesome';
		var mal_url = 'https://t.st.com/awesome/https://test.com';

		// Valid
		['test.com'
		,'//test.com'
		,'://test.com'
		,'https://test.com',
		,'http://test.com, https://test.com',
		,'https://test.com:8080/awesome'
		,'test.com:8080/*'
		].forEach(function(pattern) {
			var reg = originRegExp(pattern);

			expect(valid_url.match(reg)).to.be.ok();

			expect(invalid_url.match(reg)).to.not.be.ok();

			expect(mal_url.match(reg)).to.not.be.ok();

		});

	});

	it('should not break', function() {

		// Valid test url
		var valid_url = 'https://test.com:8080/awesome';

		// Invalid syntax
		['?&*)SDASD'
		,'//\/\/\&(ASDT$%£!"£$%^&*()'
		].forEach(function(pattern) {
			var reg = originRegExp(pattern);

			expect(valid_url.match(reg)).to.not.be.ok();

		});

	});

});
