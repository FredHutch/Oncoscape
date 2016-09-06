const mongoose = require('mongoose');
const express = require('express');
const compression = require('compression');
const bodyParser = require('body-parser');
const uuid = require('node-uuid');
const oauthshim = require('oauth-shim');

// --------------------------------------------------------- //
// ----- Configure Webserver Middleware -------------------- //
// --------------------------------------------------------- //

var app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
// app.use(function(req, res, next) { // Diable Cors
//     var oneof = false;
//     if (req.headers.origin) {
//         res.header('Access-Control-Allow-Origin', req.headers.origin);
//         oneof = true;
//     }
//     if (req.headers['access-control-request-method']) {
//         res.header('Access-Control-Allow-Methods', req.headers['access-control-request-method']);
//         oneof = true;
//     }
//     if (req.headers['access-control-request-headers']) {
//         res.header('Access-Control-Allow-Headers', req.headers['access-control-request-headers']);
//         oneof = true;
//     }
//     if (oneof) {
//         res.header('Access-Control-Max-Age', 60 * 60 * 24 * 365);
//     }
//     next();
// });

// ----------------------------------------------- //
// ----- Configure OAuth API  -------------------- //
// ----------------------------------------------- //

function oauthHandler(req, res, next){

    // Check that this is a login redirect with an access_token (not a RESTful API call via proxy) 
    if( req.oauthshim &&
        req.oauthshim.redirect &&
        req.oauthshim.data &&
        req.oauthshim.data.access_token &&
        req.oauthshim.options &&
        !req.oauthshim.options.path ){       
    }

    // Call next to complete the operation 
    next()
}

// Oauth Proxy
app.all('/api/auth', 
    oauthshim.interpret,
    oauthHandler,
    oauthshim.proxy,
    oauthshim.redirect,
    oauthshim.unhandled);

// Connect To Mongo
var domain = "https://dev.oncoscape.sttrcancer.io";
mongoose.connect(
    "mongodb://oncoscape-dev-db1.sttrcancer.io:27017,oncoscape-dev-db2.sttrcancer.io:27017,oncoscape-dev-db3.sttrcancer.io:27017/pancan12?authSource=admin", {
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
        user: "oncoscapeRead",
        pass: "i1f4d9botHD4xnZ"
    });

mongoose.connection.on('connected', function(){  

    // Pull Networks From Databse
    mongoose.connection.db.collection("lookup_oncoscape_authentication").find().toArray(function(err, response){
        var networks = response.map(function(v){ v.domain = domain; return v; });
        oauthshim.init(networks);    
    });

    // ----------------------------------------------- //
    // ----- Configure Mongo API  -------------------- //
    // ----------------------------------------------- //

    // Generic Method For Querying Mongo
    var processQuery = function(req, res, next, query){

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

            // Skup
            var skip = null;
            if (query.$skip) {
                skip = query.$skip;
                delete query.$skip;
            }

            // Fields
            var fields = { _id: 0 };    // Omit Mongo IDs
            if (query.$fields) {
                query.$fields.forEach(function(field) {
                    this[field] = 1;
                }, fields);
                delete query.$fields;
            }

            // Execute
            var find = collection.find(query, fields);
            if (limit)  find = find.limit(limit);
            if (skip)   find = find.skip(skip);
            find.toArray(function(err, results) {
                res.send(results);
                res.end();
            });
        });
    };
    app.get("/api/time", function(req,res,next){
        var d = new Date();
        res.send(d.toString());
        res.end();
    })
    app.get('/api/token/:user', function(req,res,next){
        var user = (req.params.user) ? JSON.parse(req.params.user) : {};
        console.dir(user);
        res.send("dONE");
        res.end();
    });

    // Query using file path (client cache)
    app.get('/api/:collection/:query', function(req, res, next){
        var query = (req.params.query) ? JSON.parse(req.params.query) : {};
        processQuery(req, res, next, query);
    });

    // Query using get querystring (no client cache)
    app.get('/api/:collection*', function(req, res, next) {
        var query = (req.query.q) ? JSON.parse(req.query.q) : {};
        processQuery(req, res, next, query);
    });

});


// If Dev + Running Gulp Proxy Everything Else
// const httpProxy = require('http-proxy');
// var proxy = httpProxy.createProxyServer();
// app.all('/*', function (req, res, next) {
//     proxy.web(req, res, {
//         target: 'http://localhost:3000'
//     });
// });

// Start Listening
app.listen(9999, function(){
    console.log("GO");
});
