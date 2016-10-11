const mongoose = require('mongoose');
const express = require('express');
const bodyParser = require('body-parser');
const oauthshim = require('oauth-shim');

// ----------------------- //
// -----  Middleware ----- //
// ----------------------- //
var app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));

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

mongoose.connection.on('connected', function() {

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