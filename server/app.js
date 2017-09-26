const express = require('express');
const oauthshim = require('oauth-shim'); //used by Oncoscape
const { fork } = require('child_process');
const request = require('request');
const _ = require("underscore");
const cors = require('cors');
const mongoose = require('mongoose');
const asyncLoop = require('node-async-loop');
const nodemailer = require('nodemailer');
const XLSX =require("xlsx");
const fs = require("fs");
var path = require('path');
var jsonfile = require("jsonfile");
var multer = require('multer');
var bodyParser = require('body-parser'); //parses information from POST
var filebrowser = require('file-browser');
var User = require("./models/user");
var Project = require("./models/project");
var File = require("./models/file");
var IRB = require("./models/irb");
var Permission = require("./models/permission");
var GeneSymbolLookupTable;
var HugoGenes;


// ----------------------- //
// -----  Middleware ----- //
// ----------------------- //
var app = express();
app.use(function (req, res, next) { //allow cross origin requests
    res.setHeader("Access-Control-Allow-Methods", "POST, PUT, OPTIONS, DELETE, GET");
    res.header("Access-Control-Allow-Origin", "http://localhost:" + process.env.NODE_PORT + "/");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    res.header("Access-Control-Allow-Credentials", true);
    next();
});
app.use(bodyParser.urlencoded({
    limit: '400mb',
    extended: true
}));
app.use(bodyParser.json({limit: '400mb'}));
const corsOptions = {
	origin: ['http://localhost:4200','http://localhost:8080', 'http://localhost:8080']
}
app.use(cors(corsOptions));
// ------------- Begin Data Upload Functions ------------- //
request('http://dev.oncoscape.sttrcancer.io/api/lookup_oncoscape_genes/?q=&apikey=password', function(err, resp, body){
    GeneSymbolLookupTable = JSON.parse(body);
    HugoGenes = GeneSymbolLookupTable.map(function(m){return m.hugo;});
    jsonfile.writeFile("HugoGenes.json", HugoGenes, {spaces: 2}, function(err){ console.error(err);});  
    if(err) console.log(err);
    console.log(HugoGenes.length);
});
var transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'jennylouzhang@gmail.com',
      pass: process.env.GMAIL_PASSWORD
    }
  });
  
function processResult(req, res, next , query){
    return function(err, data){
        if (err) {
            console.log(err);
            res.status(404).send("Not Found").end();
        }else{
            res.json(data).end();
        }
    };
};
function routerFactory(Model) {
    var router = express.Router();
    router.use(bodyParser.json()); 
    router.use(bodyParser.urlencoded({ extended: true }));

    router.get('/', function(req, res){	
        Model.find({}, processResult(req,res));
    });
    router.post('/', function(req, res) {
        Model.create(req.body, processResult(req,res));
    });
    router.route('/:id')
    .get(function(req, res){
        Model.findById(req.params.id, processResult(req,res));
    })
    .put(function(req, res){
        Model.findOneAndUpdate({_id: req.params.id}, req.body, {upsert: false}, processResult(req,res));
    })
    .delete(function(req, res){
        Model.remove({_id: req.params.id}, processResult(req,res));
    });
    return router;
};
function fileRouterFactory(){
    console.log('in server fileRouterFactory');
    var router = express.Router();
    var projectCollections;
    router.use(bodyParser.json()); 
    router.use(bodyParser.urlencoded({ extended: true }));
    router.get('/', function(req, res){	
        console.log("in Files");
        res.status(200).end();
    });
    router.post('/', function(req, res) {
        console.log("in post");
    });
    router.route('/:id')
    .get(function(req, res){
        console.log("Getting Project-Related Collections...");
        console.log(req.params.id);
        var projectID = req.params.id;
        db.db.listCollections().toArray(function(err, collectionMeta) {
            if (err) {
                console.log(err);
            }
            else {
                projectCollections = collectionMeta.map(function(m){
                    return m.name;
                }).filter(function(m){
                    return m.indexOf(projectID) > -1;
                });
                
                if(projectCollections.length === 0){
                    res.status(404).send("Not Found").end();
                    // res.send('Not Find').end();
                } else {
                    var arr = [];

                    asyncLoop(projectCollections, function(m, next){ 
                        db.collection(m).find().toArray(function(err, data){
                            var obj = {};
                            obj.collection = m;
                            if(m.indexOf("clinical") > -1){
                                obj.category = "clinical";
                                obj.patients = data.map(function(m){return m.id});
                                obj.metatdata = data[0].metadata;
                                obj.enums_fields = data.map(function(m){return Object.keys(m.enums);})
                                                    .reduce(function(a, b){return a = _.uniq(a.concat(b));});
                                obj.nums_fields = data.map(function(m){return Object.keys(m.nums);})
                                                    .reduce(function(a, b){return a = _.uniq(a.concat(b));});               
                                obj.time_fields = data.map(function(m){return Object.keys(m.time);})
                                                    .reduce(function(a, b){return a = _.uniq(a.concat(b));});   
                                obj.boolean_fields = data.map(function(m){return Object.keys(m.boolean);})
                                                    .reduce(function(a, b){return a = _.uniq(a.concat(b));});                                                                     
                                arr.push(obj);
                            } else if (m.indexOf("molecular") > -1) {
                                obj.category = "molecular";
                                var types = _.uniq(data.map(function(m){return m.type}));
                                types.forEach(function(n){
                                    obj[n] = {};
                                    typeObjs = data.filter(function(v){return v.type === n});
                                    obj[n].markers = typeObjs.map(function(v){return v.marker});
                                    obj[n].patients = _.uniq(typeObjs.map(function(v){return Object.keys(v.data);})
                                                                    .reduce(function(a, b){return a = _.uniq(a.concat(b));}));
                                });
                                arr.push(obj);
                            } else {
                                arr.push(data);
                            }
                            next();
                        });
                        
                    }, function(err){
                        if(err){
                            console.log(err);
                            res.status(404).send(err).end();
                        } else {
                            res.json(arr).end();
                        }    
                        
                    });
                    
                }  
            }
        });
    }).delete(function(req, res){
        console.log("in delete");
        console.log(req.params.id);
        var projectID = req.params.id;
        db.db.listCollections().toArray(function(err, collectionMeta) {
            if (err) {
                console.log(err);
            }
            else {
                collectionMeta.map(function(m){
                    return m.name;
                }).filter(function(m){
                    return m.indexOf(projectID) > -1;
                }).forEach(function(m){
                    db.db.dropCollection(m,function(err, result) {
                        console.log("DELETING", m);
                        if(err) console.log(err);
                        console.log(result);
                    });
                });
            }
        });
        res.status(200).send("files are deleted").end();
    });
    return router;
};
function camelToDash(str) {
      return str.replace(/\W+/g, '-')
                .replace(/([a-z\d])([A-Z])/g, '$1-$2')
                .replace("-", "_")
                .toLowerCase();
};
var storage = multer.diskStorage({
    destination: function (req, file, cb) {
       cb(null, process.env.APP_ROOT + '/uploads')
    },
    filename: function (req, file, cb) {
      var newFileName = file.fieldname + '-' + Date.now() + '.xlsx';
      cb(null, newFileName);
    }
});
var upload = multer({
    storage: storage, 
    preservePath: true
}).single('file');
// ------------- End Data Upload Functions ------------- //

// --------------------- //
// ----- OAuth API ----- //
// --------------------- //
function oauthHandler(req, res, next) {
    // Check that this is a login redirect with an access_token (not a RESTful API call via proxy) 
    if (req.oauthshim &&
        req.oauthshim.redirect &&
        req.oauthshim.data &&
        req.oauthshim.data.access_token &&
        req.oauthshim.options &&
        !req.oauthshim.options.path) {}
    next()
}
app.all('/api/auth',
    oauthshim.interpret,
    oauthHandler,
    oauthshim.proxy,
    oauthshim.redirect,
    oauthshim.unhandled);

// --------------------- //
// ----- Mongo API ----- //
// --------------------- //
var domain = process.env.MONGO_DOMAIN;
mongoose.connect(
    //"mongodb://oncoscape-dev-db1.sttrcancer.io:27017,oncoscape-dev-db2.sttrcancer.io:27017,oncoscape-dev-db3.sttrcancer.io:27017/tcga?authSource=admin",{
    process.env.MONGO_CONNECTION, {  
    db: {
        native_parser: true
    },
    server: {
        poolSize: 5,
        reconnectTries: Number.MAX_VALUE
    },
    replset: {
        rs_name: 'rs0'
    },
    user: process.env.MONGO_USERNAME,
    pass: process.env.MONGO_PASSWORD
});
var db = mongoose.connection; 
db.on("error", console.error.bind(console, "connection error"));
db.once("open", function (callback) {
    console.log("Connection succeeded.");
    // ------------------------------- //
    // ----- Oncoscape Mongo API ----- //
    //  ------------------------------ //
    // Pull OAuth Networks From Databas + Init OAuth
    mongoose.connection.db.collection("lookup_oncoscape_authentication").find().toArray(function(err, response) {
        var networks = response.map(function(v) {
           v.domain = domain;
           return v;
       });
       oauthshim.init(networks);
   });

    // Generic Method For Querying Mongo
    var processQuery = function(req, res, next, query) {
        // Add Response header
        res.setHeader("Cache-Control", "public, max-age=86400");
        mongoose.connection.db.collection(req.params.collection, function(err, collection) {
            if (err) {
                res.status(err.code).send(err.messages);
                res.end();
                return;
            }

            // Limits
            var limit = null
            if (query.$limit) {
                limit = query.$limit;
                delete query.$limit;
            }

            // Skip
            var skip = null;
            if (query.$skip) {
                skip = query.$skip;
                delete query.$skip;
            }

            // Fields
            var fields = {
                _id: 0
            }; // Omit Mongo IDs
            if (query.$fields) {
                query.$fields.forEach(function(field) {
                    this[field] = 1;
                }, fields);
                delete query.$fields;
            }

            // Execute
            var find = collection.find(query, fields);
            if (limit) find = find.limit(limit);
            if (skip) find = find.skip(skip);
            find.toArray(function(err, results) {
                res.send(results);
                res.end();
            });
        });
    };

    // Query using file path (client cache)
    app.get('/api/:collection/:query', function(req, res, next) {
        res.setHeader("Cache-Control", "public, max-age=86400");        
        var query = (req.params.query) ? JSON.parse(req.params.query) : {};
        processQuery(req, res, next, query);
    });

    // Query using get querystring (no client cache)
    app.get('/api/:collection*', function(req, res, next) {
        res.setHeader("Cache-Control", "public, max-age=86400");
        var query = (req.query.q) ? JSON.parse(req.query.q) : {};
        processQuery(req, res, next, query);
    });

    // If Dev + Running Gulp Proxy Everything Else
    if (process.env.NODE_DEBUG=="1"){
        const httpProxy = require('http-proxy');
        var proxy = httpProxy.createProxyServer();
        app.all('/*', function(req, res, next) {
            proxy.web(req, res, {
                target: 'http://localhost:3000'
            });
        });
    }
  
});

// -------------------------------- //
// ----- Data Upload Functions ---- //
// -------------------------------- // 
app.use('/api/users', routerFactory(User));
app.use('/api/projects', routerFactory(Project));
app.use('/api/files', fileRouterFactory());
app.use('/api/irbs', routerFactory(IRB));
app.use('/api/permissions', routerFactory(Permission));
app.use('/api/upload/', express.static('./uploads'));
app.post('/api/upload/:id/:email', function (req, res) {
    console.log('................');
    console.log(req.params.id);
    var projectID = req.params.id;
    var userEmail = req.params.email;
    console.log('user: ', userEmail);
    var mailOptions = {
        from: 'jennylouzhang@gmail.com',
        to: userEmail,
        subject: 'Notification from Oncoscape Data Uploading App',
        text: 'Data are in database, ready to share.'
      };
    var molecularColleciton = mongoose.model(projectID + "_data_molecular", File.schema);
    var sampleMapCollection = mongoose.model(projectID + "_data_samples", File.schema);
    var clinicalColleciton = mongoose.model(projectID + "_data_clinical", File.schema);
    var uploadingSummaryCollection = mongoose.model(projectID + "_uploadingSummary", File.schema);
    upload(req, res, function (err) {
        console.log("This section is triggered");
        if (err) {
            console.log(err);
            return;
        } else {
            // const writing2Mongo = fork('/Users/jennyzhang/Desktop/canaantt/NG4-Data-Upload/server/fileUpload.js', 
            const writing2Mongo = fork(process.env.APP_ROOT + 'server/fileUpload.js', 
            { execArgv: ['--max-old-space-size=1000']});
            writing2Mongo.send({ filePath: res.req.file.path, 
                                 projectID: projectID
                              });
            writing2Mongo.on('message', () => {
                res.end('Writing is done');
                console.log("*********************!!!!!!!********************");
                transporter.sendMail(mailOptions, function(error, info){
                    if (error) {
                      console.log(error);
                    } else {
                      console.log('Email sent: ' + info.response);
                    }
                  });
            });
        }
    });
    res.status(200).end();
});

// Ping Method - Used For Testing
app.get("/api/ping", function(req, res, next) {
    res.setHeader("Cache-Control", "public, max-age=86400");
    res.send((new Date()).toString());
    res.end();
});

// Start Listening
app.listen(process.env.NODE_PORT, function() {
    console.log("UP");
});
