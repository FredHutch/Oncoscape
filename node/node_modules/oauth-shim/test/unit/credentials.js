var credentials = require('../../src/credentials');

describe('credentials', function() {

	beforeEach(function() {
		// reset internal values
		credentials.credentials = [];
	});

	describe('set', function() {

		it('should set credentials to an internal array', function() {

			// Set conf
			var conf = {
				client_id: 'token',
				client_secret: 'secret'
			};

			credentials.set([conf]);
			expect(credentials.credentials).to.be.an('array');
			expect(credentials.credentials[0]).to.be.equal(conf);
		});
	});


	describe('get', function() {
		var match;

		beforeEach(function() {
			match = {
				client_id: 'token',
				client_secret: 'secret',
			};

			// Set the default credentials
			credentials.credentials = [match];
		});

		it('should find and return credentials matching an object containing a client_id', function() {

			// Spy
			var spy = sinon.spy(function(val) {
				expect(val).to.eql(match);
			});

			var requestObject = {
				client_id: 'token'
			};

			// Execute the credentials.get
			credentials.get(requestObject, spy);

			expect(spy.called).to.be.ok();
		});

		it('should return false when no match is found', function() {

			// Spy
			var spy = sinon.spy(function(val) {
				expect(val).to.eql(false);
			});

			var requestObject = {
				client_id: 'unregistered_token'
			};

			// Execute the credentials.get
			credentials.get(requestObject, spy);
			expect(spy.called).to.be.ok();
		});
	});

	describe('check', function() {

		var match;

		beforeEach(function() {

			match = {
				client_id: 'token',
				client_secret: 'secret',
				grant_url: 'https://grant/',
				domain: 'test.com'
			};

			// Set the default credentials
			credentials.credentials = [match];
		});

		it('should error invalid_credentials when match is empty', function() {

			var query = {
				client_id: 'unregistered_token'
			};

			var a = [false, null, 0];

			a.forEach(function(match) {
				var output = credentials.check(query, match);
				expect(output).to.have.property('error');
				expect(output.error).to.have.property('code', 'invalid_credentials');
			});

		});

		it('should error required_credentials when client_id is missing from the query', function() {

			var output = credentials.check({}, match);

			expect(output).to.have.property('error');
			expect(output.error).to.have.property('code', 'required_credentials');

		});

		it('should error invalid_credentials when grant_url in query and match differ', function() {

			// Valid
			var query = {
				client_id: 'token',
				grant_url: 'https://grant/'
			};

			var output = credentials.check(query, match);
			expect(output).to.not.have.property('error');
			expect(output).to.have.property('success');


			// InValid
			query = {
				client_id: 'token',
				grant_url: 'https://grantmalicious/'
			};
			output = credentials.check(query, match);
			expect(output).to.have.property('error');
			expect(output.error).to.have.property('code', 'invalid_credentials');

		});

		it('should validate the redirect_uri againt the domain and error with invalid_credentials if does not match', function() {

			var unmatch = Object.create(match);
			unmatch.domain = 'other.com';

			// Valid
			['https://test.com/path', 'http://test.com/path'].forEach(function(redirect_uri) {
				var query = {
					client_id: 'token',
					redirect_uri: redirect_uri
				};
				var output = credentials.check(query, match);
				expect(output).to.not.have.property('error');

				output = credentials.check(query, unmatch);
				expect(output).to.have.property('error');
			});

		});
	});
});
