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

  var mongoProxy = require('mongodb-proxy');
  //var MemCache = require('mongodb-proxy-memcache');
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
  var mongo = mongoProxy.create({
        port: 27017,
        host: "localhost",
        name: "os"
    });

  mongo.mdb.open(function(err, result){
    mongo.mdb.listCollections().toArray(function(err, result){
        var collections = result.map(function(f){ return f.name} );
        mongo.configure(function (config) { 
            //config.cache(new MemCache());
            collections.forEach(function(collection){
                this.register({name:collection});
            }, config);
        });
    });
  });
    
  // Open Connection For Fns
  mongo.handleCmd = function(req,res,next,cmd){
    mongo.mdb.eval(
      cmd, 
      function(error, results){
        if (error) {
            if (typeof (error) === 'object') {
                if (error.code && error.messages) {
                    res.status(error.code).send(error.messages)
                } else {
                    res.status(500).send(error.message)
                }
            } else {
                res.status(500).send(error)
            }
        } else {
            res.send(results)
        }
        res.end();
    });
  }

 /*
  server.get('/api/columns/:table', function(req, res, next){
    var cmd = format("fnGetAllColumns('%s')",req.params.table);
    console.log(cmd);
    mongo.handleCmd(req, res, next, cmd);
  });

  server.get('/api/factorcount/:table/:column', function (req, res, next){
    var cmd = format("fnGetFactorCount('%s','%s')",req.params.table, req.params.column)
    console.log(cmd);
    mongo.handleCmd(req, res, next, cmd);
  });
  */

  server.get('/api/:collection*', 
    cache.route(),
    function (req, res, next) {    
      console.log("PROCESSED"+req._parsedUrl);
        // prepare an info object for the routing function     
        var route = {
            method: req.method,
            collection: req.params.collection,
            path: req._parsedUrl.pathname.substring('/api/'.length + req.params.collection.length),
            query: req.query.q,
            data: req.body,
            req: req,
            res: res
        }

        // get the post data 
        var postdata = ""        
        req.on('data', function (postdataChunk) {
            postdata += postdataChunk
        })  
        
        req.on('end', function () {
            var jsonData = JSON.parse(postdata || '{}')
            route.data = jsonData
            // pass the work on the proxy 
            mongo.handle(route, next, function (error, results) {
                if (error) {
                    if (typeof (error) === 'object') {
                        if (error.code && error.messages) {
                            res.status(error.code).send(error.messages)
                        } else {
                            res.status(500).send(error.message)
                        }
                    } else {
                        res.status(500).send(error)
                    }
                } else {
                    res.send(results)
                }
            })
        })
    })

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