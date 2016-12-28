//const mongoose = require('mongoose');
const MongoClient = require('mongodb').MongoClient;
const express = require('express');
const bodyParser = require('body-parser');
const oauthshim = require('oauth-shim');
var db;

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
    next();
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

// Generic Method For Aggregation Query
var allowedAggregationMethods = ["$project", "$unwind", "$group", "$match", "$sort", "$limit", "$skip", "$let", "$map"];
var processAggregation = function(req, res, next, query) {
    if (!Array.isArray(query) || (query.map(function(v) { return Object.keys(v)[0]; }).filter(function(v) { return (allowedAggregationMethods.indexOf(v) == -1); }).length !== 0)) {
        res.send("INVALID AGGREGATION");
        res.end();
        return;
    }
    res.setHeader("Cache-Control", "public, max-age=86400");
    db.collection(req.params.collection, function(err, collection) {
        if (err) {
            res.status(err.code).send(err.messages);
            res.end();
            return;
        }
        var cursor = collection.aggregate(query, { cursor: { batchSize: 1 } });
        cursor.toArray(function(err, results) {
            res.send(results);
            res.end();
        });
    });
};

// Generic Method For Basic Query
var processQuery = function(req, res, next, query) {

    // Add Response header
    res.setHeader("Cache-Control", "public, max-age=86400");
    db.collection(req.params.collection, function(err, collection) {
        if (err) {
            res.status(err.code).send(err.messages);
            res.end();
            return;
        }

        // Limits
        var limit = null;
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

// Generic Method For Aggregation Query
app.get('/api/:collection/agg/:query', function(req, res, next) {
    res.setHeader("Cache-Control", "public, max-age=86400");
    var query = (req.params.query) ? JSON.parse(req.params.query) : {};
    processAggregation(req, res, next, query);
});

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

// If Dev + Running Gulp Create Proxy Server
// if (process.env.NODE_DEBUG == "1") {
//     const httpProxy = require('http-proxy');
//     var proxy = httpProxy.createProxyServer();
//     app.all('/*', function(req, res, next) {
//         proxy.web(req, res, {
//             target: 'http://localhost:3000'
//         });
//     });
// }

// Ping Method - Used For Testing
app.get("/api/ping", function(req, res, next) {
    res.setHeader("Cache-Control", "public, max-age=86400");
    res.send((new Date()).toString());
    res.end();
});


var username = process.env.MONGO_USERNAME;
var password = process.env.MONGO_PASSWORD;
var connection = process.env.MONGO_CONNECTION
    .replace("mongodb://", "mongodb://" + username + ":" + password + "@");

MongoClient.connect(
    connection, {
        db: {
            native_parser: true
        },
        server: {
            poolSize: 5,
            reconnectTries: Number.MAX_VALUE
        },
        replset: {
            rs_name: 'rs0'
        }
    },
    function(err, database) {

        if (err) throw err;
        db = database;

        // Pull OAuth Networks From Database + Init OAuth
        // db.collection("lookup_oncoscape_authentication").find().toArray(function(err, response) {
        //     var networks = response.map(function(v) {
        //         v.domain = domain;
        //         return v;
        //     });
        //     oauthshim.init(networks);
        // });

        // Start Listening
        app.listen(process.env.NODE_PORT, function() {
            console.log("UP");
        });
    });