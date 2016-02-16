/*
*   Oncoscape Authentication
*
*   This utility module is responsible for delegating authentication requests based off domain.
*	Today there is no real security requirements and anyone can login.  
*	So unless the user supplies a bad username/password combination they
*	will be successfully authenticated.
*
*/
var exports = module.exports = {};
var ldap = require('ldapjs');
var soap = require('soap');

exports.login = function(username, password, domain, cb){
	
	// Switch Authentication Method Based On Domain
	switch(domain.toUpperCase()){
		case "FHCRC":
			authSoap(username, password, 'fhcrc', 'https://admaims47.fhcrc.org/breeze/Authentication.asmx?wsdl', cb);
			//authLdap(username+'@fhcrc', password, 'ldaps://dc42.fhcrc.org:636', cb);
			break;
		case "SCCA":
			authSoap(username, password, 'scca', 'https://admaims47.fhcrc.org/breeze/Authentication.asmx?wsdl', cb);
			break;
		default:
			cb(true); // Authentication is not required
			break;
	}
};

exports.authorize = function(req){

};

// Authenticate Using Soap
var authSoap = function(username, password, domain, url, cb){
  	var args = {username: username, password:password, domain:domain};
  	soap.createClient(url, function(err, client) {
      client.Logon(args, function(err, result) {
      	  cb(result.LogonResult==='<success />');
      });
  });
};

// Authenticate Using Ldap
var authLdap = function(username, password, url, cb){
	// Password Must Be Supplied To Avoid Authenticating Anon
	if (password.trim().length<5) { cb(false); return; }	
	var client = ldap.createClient( { url:url });
	client.bind(username, password, function(err) {
    	client.unbind();
    	cb(err===null);
    });
};