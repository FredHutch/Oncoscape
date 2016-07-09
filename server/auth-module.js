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
var data = require('./permissions');


exports.login = function(username, password, domain, cb){
	
	// Switch Authentication Method Based On Domain
	switch(domain.toUpperCase()){
		case "FHCRC":
			//authSoap(username, password, 'fhcrc', 'https://admaims47.fhcrc.org/breeze/Authentication.asmx?wsdl', cb);
			authLdap(username, password, 'ldaps://rodc1.fhcrc.org:636', cb);
			break;
		case "SCCA":
			authSoap(username, password, 'scca', 'https://admaims47.fhcrc.org/breeze/Authentication.asmx?wsdl', cb);
			break;
		case "UW":
			if (data.users[username]!=null){
				cb( true, data.users[username].concat(data.guest) );
			}else{
				cb(false);
			}
			break;
		default:
			cb(true, data.guest); // Authentication is not required
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
	var ds = (data.users[username+"@fhcrc.org"]!=null) ? data.users[username+"@fhcrc.org"].concat(data.guest) : data.guest;
	client.bind( username + "@fhcrc", password, function(err) {
    	client.unbind();
    	cb(err===null, ds);
    });
};