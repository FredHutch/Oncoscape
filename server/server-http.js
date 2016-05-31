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

  var mongoProxy = require('mongodb-proxy')
  var express = require('express');
  var bodyParser = require('body-parser');
  var cookieParser = require('cookie-parser')
  var auth = require('./auth-module.js');
  var uuid = require('node-uuid');
  var pdf = require('pdfkit');
  var format = require('util').format;

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
        name: "oncoscape"
    });

  mongo.mdb.open(function(err, result){});

    var collections = [
    "_collections",
    "_fields",
    "_stats",
    "tcga_brca_pt",
    "tcga_cesc_pt",
    "tcga_chol_pt",
    "tcga_coad_pt",
    "tcga_dlbc_pt",
    "tcga_esca_pt",
    "tcga_gbm_pt",
    "tcga_hnsc_pt",
    "tcga_kich_pt",
    "tcga_kirc_pt",
    "tcga_kirp_pt",
    "tcga_laml_pt",
    "tcga_lgg_pt",
    "tcga_lich_pt",
    "tcga_luad_pt",
    "tcga_lusc_pt",
    "tcga_meso_pt",
    "tcga_ov_pt",
    "tcga_paad_pt",
    "tcga_pcpg_drug",
    "tcga_pcpg_f1",
    "tcga_pcpg_pt",
    "tcga_pcpg_rad",
    "tcga_prad_pt",
    "tcga_read_pt",
    "tcga_sarc_pt",
    "tcga_skcm_drug",
    "tcga_skcm_f1",
    "tcga_skcm_pt",
    "tcga_skcm_rad",
    "tcga_stad_drug",
    "tcga_stad_f1",
    "tcga_stad_pt",
    "tcga_stad_rad",
    "tcga_tgct_drug",
    "tcga_tgct_f1",
    "tcga_tgct_pt",
    "tcga_tgct_rad",
    "tcga_thca_drug",
    "tcga_thca_f1",
    "tcga_thca_f2",
    "tcga_thca_nte",
    "tcga_thca_nte_f1",
    "tcga_thca_nte_f2",
    "tcga_thca_omf",
    "tcga_thca_pt",
    "tcga_thca_rad",
    "tcga_thym_drug",
    "tcga_thym_f1",
    "tcga_thym_nte",
    "tcga_thym_nte_f1",
    "tcga_thym_omf",
    "tcga_thym_pt",
    "tcga_thym_rad",
    "tcga_ucec_drug",
    "tcga_ucec_f1",
    "tcga_ucec_f2",
    "tcga_ucec_f3",
    "tcga_ucec_nte",
    "tcga_ucec_nte_f1",
    "tcga_ucec_omf",
    "tcga_ucec_pt",
    "tcga_ucec_rad",
    "tcga_ucs_drug",
    "tcga_ucs_f1",
    "tcga_ucs_nte",
    "tcga_ucs_nte_f1",
    "tcga_ucs_omf",
    "tcga_ucs_pt",
    "tcga_ucs_rad",
    "tcga_uvm_drug",
    "tcga_uvm_f1",
    "tcga_uvm_nte",
    "tcga_uvm_omf",
    "tcga_uvm_pt",
    "tcga_uvm_rad"
    ];

  mongo.configure(function (config) { 
    collections.forEach(function(collection){
        this.register({name:collection});
    }, config);
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


  server.get('/api/:collection*', function (req, res, next) {    

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