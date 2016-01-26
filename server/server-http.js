/*
*   Oncoscape Http Server
*
*   The http server is based off of Express.  The server is respnsible for:
*   1) Serving static files
*   2) Initial Authentication
*   3) Client upgrade requests to utilize the socket server
*
*/
var exports = module.exports = {};
exports.start = function(config){

  var express = require('express');
  var bodyParser = require('body-parser');
  var cookieParser = require('cookie-parser')
  var auth = require('./auth-module.js');
  var uuid = require('node-uuid');

  // Construct Http Server With Body Parsing Capabilities
  var server = express();
  server.use(bodyParser.json());
  server.use(bodyParser.urlencoded({ extended: true })); 
  server.use(cookieParser())

  // Ping
  server.get('/ping', function (req, res) { res.send('ping'); });

  server.get('/oncoscape/info', function (req, res) {  
    res.setHeader('access-control-allow-credentials','true');
    res.setHeader('access-control-allow-origin', 'http://localhost:9000');//req.headers.referer.match(/^(?:https?:\/\/)?(?:[^@\n]+@)?(?:www\.)?([^:\/\n]+)/)[0]);
    res.setHeader('cache-control','no-store, no-cache, must-revalidate, max-age=0');
    res.setHeader('connection','close');
    res.setHeader('content-type','application/json; charset=UTF-8');
    res.setHeader('date', new Date().toString());
    res.setHeader('transfer-encoding','chunked');
    res.setHeader('vary','Origin');
    res.write('{"websocket":true,"origins":["*:*"],"cookie_needed":false,"entropy":1292163056}');
    res.end();
  });

  server.get('/logout', function (req, res){
    res.clearCookie('token');
    res.sendFile(__dirname + '/public/login.html');
  });

  server.post('/', function (req, res){

    var username = req.body.username;
    var password = req.body.password;
    var domain = req.body.domain;

    auth.login(username, password, domain, function(isValid){
      if (isValid){
        var token = uuid.v1();
        res.cookie('token', token);
        res.sendFile(__dirname + '/public/index.html');
      }else{
        res.sendFile(__dirname + '/public/login.html');
      }
    });
  });

  server.get('/', function (req, res){
    res.sendFile( (req.cookies.token==undefined) ?
      __dirname + '/public/login.html' :
      __dirname + '/public/index.html'
    );
  });

  server.get('/Login', function(req, res){
    res.sendFile(__dirname + '/public/login.html');
  });

  // Use Public Directory To Serve Static Files
  server.use(express.static('public'));

  // Open Port 
  server.listen(config.getPortHttp(), function () {
    console.log('Http Server Started On: ' +config.getPortHttp());
  });
}