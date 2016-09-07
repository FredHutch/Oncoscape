# OAuth-shim
Middleware offering OAuth1/OAuth2 authorization handshake for web applications using the [HelloJS](http://adodson.com/hello.js) clientside authentication library.


## tl;dr;

[https://auth-server.herokuapp.com](https://auth-server.herokuapp.com) is a service which utilizes this package. If you dont want to implement your own you can simply and freely register thirdparty application Key's and Secret's there.


## Implement


```bash
npm install oauth-shim
```

Middleware for Express/Connect


```javascript
var oauthshim = require('oauth-shim'),
	express = require('express');

var app = express();
app.listen(3000);
app.all('/oauthproxy', oauthshim);

// Initiate the shim with Client ID's and secret, e.g.
oauthshim.init([{
	// id : secret
	client_id: '12345',
	client_secret: 'secret678910',
	// Define the grant_url where to exchange Authorisation codes for tokens
	grant_url: 'https://linkedIn.com',
	// Restrict the callback URL to a delimited list of callback paths
	domain: 'test.com, example.com/redirect'
}
, ...
]);
```

The above code will put your shimming service to the pathname `http://localhost:3000/oauthproxy`.


## Example

An example of the above script can be found at [example.js](./example.js).

To run `node example.js` locally:

* Install developer dependencies `npm install -l`.
* Create a `credentials.json` file. e.g.

```json
[
	{
		"name": "twitter",
		"domain": "http://myapp.com",
		"client_id": "app1234",
		"client_secret": "secret1234",
		"grant_url": "https://api.twitter.com/oauth/access_token"
	},
	{
		"name": "yahoo",
		"domain": "http://myapp.com",
		"client_id": "app1234",
		"client_secret": "secret1234",
	},
	...
]
```

* Start up the server...

```bash
PORT=5500 node example.js
```

Configure your [HelloJS](https://github.com/MrSwitch/hello.js) to use this service.

```javascript
hello.init({
	twitter: 'app1234',
	yahoo: 'app1234,'
}, {
	oauth_proxy: `http://localhost:5500/proxy`
});
```

Then use helloJS as normal.

## Customised Middleware

### Capture Access Tokens

Use the middleware to capture the access_token registered with your app at any point in the series of operations that this module steps through. In the example below they are disseminated with a `customHandler` in the middleware chain to capture the access_token...


```javascript

app.all('/oauthproxy',
			oauthshim.interpret,
			customHandler,
			oauthshim.proxy,
			oauthshim.redirect,
			oauthshim.unhandled);


function customHandler(req, res, next){

	// Check that this is a login redirect with an access_token (not a RESTful API call via proxy)
	if( req.oauthshim &&
		req.oauthshim.redirect &&
		req.oauthshim.data &&
		req.oauthshim.data.access_token &&
		req.oauthshim.options &&
		!req.oauthshim.options.path ){

			// do something with the token (req.oauthshim.data.access_token)
	}

	// Call next to complete the operation
	next()
}

```


### Asynchronsly retrieve the secret

Rewrite the function `getCredentials` to change the way the client secret is stored/retrieved. This method is asyncronous, to access the secret from a database etc..
e.g...

```javascript
// Overwrite the credentials `get` method
oauthshim.credentials.get = function(query, callback){
	// Return
	if(query.client_id === '12345'){
		callback({
			client_secret: 'secret678910'
		});
	}
	if(query.client_id === 'abcde'){
		callback({
			client_secret: 'secret123456'
		});
	}
}
```

## Authentication API

The API adopts similar URL format as the standard OAuth2. Additional metadata about how to handle the request is communicated through the `state` parameter as a JSON string.

### Authentication OAuth 2.0

[STATE] includes:

||key||value||
|oauth.version|2|
|oauth.grant|[PROVIDERS_OAUTH2_GRANT_URL]|


The OAuth2 flow for the shim starts after a web application sends a client out to a providers site to grant permissions. The response is an authorization code "[AUTH_CODE]" which is returned to your site, this needs to be exchanged for an Access Token. Your page then needs to send this code to an //auth-server to be exhchanged for an access token, e.g.


	?redirect_uri=[REDIRECT_PATH]
	&code=[AUTH_CODE]
	&client_id=[APP_KEY]
	&state=[STATE]

The //auth-server exchanges the Authorization code for an access_token and redirects the client back to the location of [REDIRECT_PATH], with the contents of the server response as well as whatever was defined in the [STATE] in the hash. e.g...


	[REDIRECT_PATH]#state=[STATE]&access_token=ABCD1233234&expires=123123123



### Authentication OAuth 1.0 &amp; 1.0a

[STATE] includes:

||key||value||
|oauth.version|1.0a|
|oauth.request|[OAUTH_REQUEST_TOKEN_URL]|
|oauth.auth|[OAUTH_AUTHORIZATION_URL]|
|oauth.token|[OAUTH_TOKEN_URL]|
|oauth_proxy|//auth-server|

OAuth 1.0 has a number of steps so forgive the verbosity here. An app is required to make an initial request to the //auth-server, which in-turn initiates the authentication flow.


	//auth-server?redirect_uri=[REDIRECT_PATH]
	&client_id=[APP_KEY]
	&state=[STATE]


The //auth-server signs the client request and redirects the user to the providers login page defined by `[OAUTH_AUTHRIZATION_URL]`.

Once the user has signed in they are redirected back to a page on the developers app defined by `[REDIRECT_PATH]`.

The provider should have included an oauth_callback parameter which was defined by //auth-server, this includes part of the path where the token can be returned for an access token. The total path response shall look something like this.


	[REDIRECT_PATH]
	?state=[STATE]
	&client_id=[APP_KEY]
	&oauth_token=abc12465


The page you defined locally as the `[REDIRECT_PATH]`, must then construct a call to //auth-server to exchange the unauthorized oauth_token for an access token. This would look like this...


	//auth-server?oauth_token=abc12465
	&redirect_uri=[REDIRECT_PATH]
	&client_id=[APP_KEY]
	&state=[STATE]


Finally the //auth-server returns the access_token to your redirect path and its the responsibility of your script to store this in the client in order to make subsequent API calls.

	[REDIRECT_PATH]#state=[STATE]&access_token=ABCD1233234&expires=123123123


This access token still needs to be signed via //auth-server every time an API request is made - read on...





## API: Signing API Requests

The OAuth 1.0 API requires that each request is uniquely signed with the application secret. This restriction was removed in OAuth 2.0, so only applied to OAuth1 endpoints.

### A simple GET Redirect

To sign a request to `[API_PATH]`, use the `[ACCESS_TOKEN]` returned in OAuth 1.0 above and send to the auth-server.

	?access_token=[ACCESS_TOKEN]
	&path=[API_PATH]

The oauth shim signs and redirects the requests to the `[API_PATH]` e.g.

	[API_PATH]?oauth_token=asdf&oauth_consumer_key=asdf&...&oauth_signature=1234

If the initial request was other than a GET request, it will be proxied through the oauthshim by default. CORS headers would be added to the response from the end server.

### Signing a Request and returning the Signed Request URL

If the end server supports CORS and a lot of data is expected to be either sent or returned. The burded on the oauthshim can be lessened by merely returning the signed request url and handling the action elsewhere.

	?access_token=[ACCESS_TOKEN]
	&path=[API_PATH]
	&then=return

### Proxying the Request
Conversely forcing the request to proxy through the oauthshim is achieved by applying the flag then=proxy. CORS headers are added to the response. This naturally is the slow route for data and is best avoided.

	?access_token=[ACCESS_TOKEN]
	&path=[API_PATH]
	&then=proxy


### Change the method and add callback for JSONP
Add a JSONP callback function and override the method. E.g.

	?access_token=[ACCESS_TOKEN]
	&path=[API_PATH]
	&then=return
	&method=post
	&callback=myJSONP


## Specs

```bash
# Install the test dependencies.
npm install -l

# Run tests
npm test
```
