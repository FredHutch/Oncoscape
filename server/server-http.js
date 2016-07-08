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


  var mongoose = require('mongoose');
  var express = require('express');
  var bodyParser = require('body-parser');
  var cookieParser = require('cookie-parser');
  var auth = require('./auth-module.js');
  var uuid = require('node-uuid');
  var pdf = require('pdfkit');
  var format = require('util').format;
  var cache = require('express-redis-cache')();

  // Construct Http Server With Body Parsing Capabilities
  var server = express();
  server.use(bodyParser.json());
  server.use(bodyParser.urlencoded({ extended: true })); 
  server.use(cookieParser())
  server.use(function(req, res, next) { // Diable Cors
     var oneof = false;
    if(req.headers.origin) {
        res.header('Access-Control-Allow-Origin', req.headers.origin);
        oneof = true;
    }
    if(req.headers['access-control-request-method']) {
        res.header('Access-Control-Allow-Methods', req.headers['access-control-request-method']);
        oneof = true;
    }
    if(req.headers['access-control-request-headers']) {
        res.header('Access-Control-Allow-Headers', req.headers['access-control-request-headers']);
        oneof = true;
    }
    if(oneof) {
        res.header('Access-Control-Max-Age', 60 * 60 * 24 * 365);
    }
    next();
  });

  // Ping
  server.get('/ping', function (req, res) { res.send('ping'); });

  // Socket Upgrade
  server.get('/oncoscape/info', function (req, res) {  
    res.setHeader('cache-control','no-store, no-cache, must-revalidate, max-age=0');
    res.setHeader('connection','close');
    res.setHeader('content-type','application/json; charset=UTF-8');
    res.setHeader('date', new Date().toString());
    res.setHeader('transfer-encoding','chunked');
    res.setHeader('vary','Origin');
    res.write('{"websocket":true,"origins":["*:*"],"cookie_needed":false,"entropy":1292163056}');
    res.end();
  });

  // Mongo Api
  console.log('MongoDb v3.2.6 bound to "/api"');
  //mongoose.connect('mongodb://localhost/os');

  mongoose.connect(
      'mongodb://oncoscape-dev-db1.sttrcancer.io:27017,oncoscape-dev-db2.sttrcancer.io:27017,oncoscape-dev-db3.sttrcancer.io:27017/os', 
      {
        db: { native_parser: true },
        server: { 
          poolSize: 5, 
          reconnectTries: Number.MAX_VALUE 
        },
        replset: { rs_name: 'rs0' },
        user: 'oncoscapeRead',
        pass: 'i1f4d9botHD4xnZ'
      }
  );

  server.get('/api/:collection*', 
    cache.route(),    
    function(req, res, next){
      mongoose.connection.db.collection(req.params.collection, function (err, collection) {
        if (err) {
          res.status(err.code).send(err.messages);
          res.end();
          return;
        }

        // Process Query
        var query = (req.query.q ) ? JSON.parse(req.query.q) : {};
        
        // Todo: Process Limit
        if (query.$limit){
          delete query.$limit;
        }

        // Process Fields
        var fields = {_id:0};
        if (query.$fields){
          query.$fields.forEach(function(field){ this[field] = 1; }, fields);
          delete query.$fields;
        }

        console.log("------");
        console.log(query);
        console.log(fields);
        
        collection.find(query, fields).toArray(function(err, results) {
          res.send(results);
          res.end();
        });
      });
  });


  // Logout
  server.get('/logout', function (req, res){
    res.clearCookie('token');
    res.sendFile(__dirname + '/public/index.html');
  });
  
  // Login
  server.post('/login', function (req, res){
    var username = req.body.username;
    var password = req.body.password;
    var domain = req.body.domain;

    auth.login(username, password, domain, function(isValid, datasets){
      if (isValid, datasets){
        res.json({success:true, token:uuid.v1(), datasets});
      }else{
        res.json({success:false});
      }
    });
  });

  // Home Page
  server.get('/', function (req, res){
    res.sendFile( __dirname + '/public/index.html' );
  });

  // Use Public Directory To Serve Static Files
  server.use(express.static('public'));

  // Open Port 
  server.listen(config.getPortHttp(), function () {
    console.log('Http Server Started On: ' +config.getPortHttp());
  });
}