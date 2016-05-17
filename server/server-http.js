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

  mongo.configure(function (config) { 
    ["TCGA_METADATA","TCGA_ACC_DRUG","TCGA_ACC_F1","TCGA_ACC_NTE","TCGA_ACC_NTE_F1","TCGA_ACC_OMF","TCGA_ACC_PT","TCGA_ACC_RAD","TCGA_BLCA_DRUG","TCGA_BLCA_F1","TCGA_BLCA_F2","TCGA_BLCA_NTE","TCGA_BLCA_NTE_F1","TCGA_BLCA_OMF","TCGA_BLCA_PT","TCGA_BLCA_RAD","TCGA_BRCA_DRUG","TCGA_BRCA_F1","TCGA_BRCA_F2","TCGA_BRCA_F3","TCGA_BRCA_NTE","TCGA_BRCA_NTE_F1","TCGA_BRCA_OMF","TCGA_BRCA_PT","TCGA_BRCA_RAD","TCGA_CESC_DRUG","TCGA_CESC_F1","TCGA_CESC_F2","TCGA_CESC_NTE","TCGA_CESC_NTE_F1","TCGA_CESC_OMF","TCGA_CESC_PT","TCGA_CESC_RAD","TCGA_CHOL_DRUG","TCGA_CHOL_F1","TCGA_CHOL_NTE","TCGA_CHOL_NTE_F1","TCGA_CHOL_OMF","TCGA_CHOL_PT","TCGA_CHOL_RAD","TCGA_COAD_DRUG","TCGA_COAD_F1","TCGA_COAD_NTE","TCGA_COAD_NTE_F1","TCGA_COAD_OMF","TCGA_COAD_PT","TCGA_COAD_RAD","TCGA_DISEASE","TCGA_DLBC_DRUG","TCGA_DLBC_F1","TCGA_DLBC_NTE","TCGA_DLBC_NTE_F1","TCGA_DLBC_PT","TCGA_DLBC_RAD","TCGA_ESCA_DRUG","TCGA_ESCA_F1","TCGA_ESCA_NTE","TCGA_ESCA_NTE_F1","TCGA_ESCA_OMF","TCGA_ESCA_PT","TCGA_ESCA_RAD","TCGA_GBM_DRUG","TCGA_GBM_F1","TCGA_GBM_NTE","TCGA_GBM_NTE_F1","TCGA_GBM_OMF","TCGA_GBM_PT","TCGA_GBM_RAD","TCGA_HNSC_DRUG","TCGA_HNSC_F1","TCGA_HNSC_F2","TCGA_HNSC_NTE","TCGA_HNSC_NTE_F1","TCGA_HNSC_OMF","TCGA_HNSC_PT","TCGA_HNSC_RAD","TCGA_KICH_DRUG","TCGA_KICH_F1","TCGA_KICH_NTE","TCGA_KICH_NTE_F1","TCGA_KICH_OMF","TCGA_KICH_PT","TCGA_KICH_RAD","TCGA_KIRC_DRUG","TCGA_KIRC_F1","TCGA_KIRC_NTE","TCGA_KIRC_OMF","TCGA_KIRC_PT","TCGA_KIRC_RAD","TCGA_KIRP_DRUG","TCGA_KIRP_F1","TCGA_KIRP_NTE","TCGA_KIRP_OMF","TCGA_KIRP_PT","TCGA_KIRP_RAD","TCGA_LAML_PT","TCGA_LGG_DRUG","TCGA_LGG_F1","TCGA_LGG_NTE","TCGA_LGG_OMF","TCGA_LGG_PT","TCGA_LGG_RAD","TCGA_LICH_DRUG","TCGA_LICH_F1","TCGA_LICH_NTE","TCGA_LICH_NTE_F1","TCGA_LICH_OMF","TCGA_LICH_PT","TCGA_LICH_RAD","TCGA_LUAD_DRUG","TCGA_LUAD_F1","TCGA_LUAD_NTE","TCGA_LUAD_OMF","TCGA_LUAD_PT","TCGA_LUAD_RAD","TCGA_LUSC_DRUG","TCGA_LUSC_F1","TCGA_LUSC_NTE","TCGA_LUSC_OMF","TCGA_LUSC_PT","TCGA_LUSC_RAD","TCGA_MESO_DRUG","TCGA_MESO_F1","TCGA_MESO_NTE","TCGA_MESO_NTE_F1","TCGA_MESO_OMF","TCGA_MESO_PT","TCGA_MESO_RAD","TCGA_OV_DRUG","TCGA_OV_F1","TCGA_OV_NTE","TCGA_OV_NTE_F1","TCGA_OV_OMF","TCGA_OV_PT","TCGA_OV_RAD","TCGA_PAAD_DRUG","TCGA_PAAD_F1","TCGA_PAAD_NTE","TCGA_PAAD_NTE_F1","TCGA_PAAD_OMF","TCGA_PAAD_PT","TCGA_PAAD_RAD","TCGA_PCPG_DRUG","TCGA_PCPG_F1","TCGA_PCPG_NTE","TCGA_PCPG_NTE_F1","TCGA_PCPG_OMF","TCGA_PCPG_PT","TCGA_PCPG_RAD","TCGA_PRAD_DRUG","TCGA_PRAD_F1","TCGA_PRAD_NTE","TCGA_PRAD_OMF","TCGA_PRAD_PT","TCGA_PRAD_RAD","TCGA_READ_DRUG","TCGA_READ_F1","TCGA_READ_NTE","TCGA_READ_NTE_F1","TCGA_READ_OMF","TCGA_READ_PT","TCGA_READ_RAD","TCGA_SARC_DRUG","TCGA_SARC_F1","TCGA_SARC_NTE","TCGA_SARC_NTE_F1","TCGA_SARC_OMF","TCGA_SARC_PT","TCGA_SARC_RAD","TCGA_SKCM_DRUG","TCGA_SKCM_F1","TCGA_SKCM_NTE","TCGA_SKCM_OMF","TCGA_SKCM_PT","TCGA_SKCM_RAD","TCGA_STAD_DRUG","TCGA_STAD_F1","TCGA_STAD_NTE","TCGA_STAD_OMF","TCGA_STAD_PT","TCGA_STAD_RAD","TCGA_TABLE","TCGA_TGCT_DRUG","TCGA_TGCT_F1","TCGA_TGCT_NTE","TCGA_TGCT_NTE_F1","TCGA_TGCT_OMF","TCGA_TGCT_PT","TCGA_TGCT_RAD","TCGA_THCA_DRUG","TCGA_THCA_F1","TCGA_THCA_F2","TCGA_THCA_NTE","TCGA_THCA_NTE_F1","TCGA_THCA_NTE_F2","TCGA_THCA_OMF","TCGA_THCA_PT","TCGA_THCA_RAD","TCGA_THYM_DRUG","TCGA_THYM_F1","TCGA_THYM_NTE","TCGA_THYM_NTE_F1","TCGA_THYM_OMF","TCGA_THYM_PT","TCGA_THYM_RAD","TCGA_UCEC_DRUG","TCGA_UCEC_F1","TCGA_UCEC_F2","TCGA_UCEC_F3","TCGA_UCEC_NTE","TCGA_UCEC_NTE_F1","TCGA_UCEC_OMF","TCGA_UCEC_PT","TCGA_UCEC_RAD","TCGA_UCS_DRUG","TCGA_UCS_F1","TCGA_UCS_NTE","TCGA_UCS_NTE_F1","TCGA_UCS_OMF","TCGA_UCS_PT","TCGA_UCS_RAD","TCGA_UVM_DRUG","TCGA_UVM_F1","TCGA_UVM_NTE","TCGA_UVM_OMF","TCGA_UVM_PT","TCGA_UVM_RAD"]
    .forEach(function(collection){
        this.register({name:collection});
    }, config);
  });

  server.all('/api/:collection*', function (req, res, next) {    

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