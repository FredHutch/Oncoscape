const mongoose = require('mongoose');
const express = require('express');
const compression = require('compression');
const bodyParser = require('body-parser');
const auth = require('./auth-module.js');
const uuid = require('node-uuid');

//mongoose.connect('mongodb://localhost/os');
mongoose.connect(
    'mongodb://oncoscape-dev-db1.sttrcancer.io:27017,oncoscape-dev-db2.sttrcancer.io:27017,oncoscape-dev-db3.sttrcancer.io:27017/pancan12?authSource=admin', {
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
        user: 'oncoscapeRead',
        pass: 'i1f4d9botHD4xnZ'
    });

var app = express();

// Compression
app.use(compression());

// Parsers
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(function(req, res, next) { // Diable Cors
    var oneof = false;
    if (req.headers.origin) {
        res.header('Access-Control-Allow-Origin', req.headers.origin);
        oneof = true;
    }
    if (req.headers['access-control-request-method']) {
        res.header('Access-Control-Allow-Methods', req.headers['access-control-request-method']);
        oneof = true;
    }
    if (req.headers['access-control-request-headers']) {
        res.header('Access-Control-Allow-Headers', req.headers['access-control-request-headers']);
        oneof = true;
    }
    if (oneof) {
        res.header('Access-Control-Max-Age', 60 * 60 * 24 * 365);
    }
    next();
});

app.get('/api/time', function(req, res, next){
    res.send(new Date());
    res.end();
});


var processQuery = function(req, res, next, query){

    mongoose.connection.db.collection(req.params.collection, function(err, collection) {
        if (err) {
            res.status(err.code).send(err.messages);
            res.end();
            return;
        }

        var limit = null
        if (query.$limit) {
            limit = query.$limit;
            delete query.$limit;
        }
        var skip = null;
        if (query.$skip) {
            skip = query.$skip;
            delete query.$skip;
        }

        // Process Fields
        var fields = {
            _id: 0
        };
        if (query.$fields) {
            query.$fields.forEach(function(field) {
                this[field] = 1;
            }, fields);
            delete query.$fields;
        }

        var find = collection.find(query, fields);
        if (limit)  find = find.limit(limit);
        if (skip)   find = find.skip(skip);
        find.toArray(function(err, results) {
            res.send(results);
            res.end();
        });
    });
};

// Mongoose Gateway Route
app.get('/api/:collection/:query', function(req, res, next){
    var query = (req.params.query) ? JSON.parse(req.params.query) : {};
    processQuery(req, res, next, query);
});
app.get('/api/:collection*', function(req, res, next) {
    var query = (req.query.q) ? JSON.parse(req.query.q) : {};
    processQuery(req, res, next, query);
});
app.post('/api/login', function(req, res) {
    var username = req.body.username;
    var password = req.body.password;
    var domain = req.body.domain;
    auth.login(username, password, domain, function(isValid) {
        if (isValid) {
            res.json({
                success: true,
                token: uuid.v1()
            });
        } else {
            res.json({
                success: false
            });
        }
    });
});

// Start Listening
app.listen(9999, function(){
    console.log("GO");
});