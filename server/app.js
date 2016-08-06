const mongoose = require('mongoose');
const express = require('express');
const compression = require('compression');
const bodyParser = require('body-parser');
const auth = require('./auth-module.js');
const uuid = require('node-uuid');
const favicon = require('serve-favicon');



//mongoose.connect('mongodb://localhost/os');
mongoose.connect(
    'mongodb://oncoscape-dev-db1.sttrcancer.io:27017,oncoscape-dev-db2.sttrcancer.io:27017,oncoscape-dev-db3.sttrcancer.io:27017/BnB?authSource=admin', {
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


app.get('/ping', function(req, res){
  res.send('pong');
});

// Mongoose Gateway Route
app.get('/api/:collection*', function(req, res, next) {
    
 
    
        mongoose.connection.db.collection(req.params.collection, function(err, collection) {
            if (err) {
                res.status(err.code).send(err.messages);
                res.end();
                return;
            }

            // Process Query
            var query = (req.query.q) ? JSON.parse(req.query.q) : {};

            // Todo: Process Limit
            if (query.$limit) {
                delete query.$limit;
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

            collection.find(query, fields).toArray(function(err, results) {
                res.send(results);
                res.end();
            });
        });
});

// Login + Logout
app.get('/logout', function(req, res) {
    res.sendFile(__dirname + '/public/index.html');
});
app.post('/login', function(req, res) {
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

// Static Assets 
app.use(favicon('public/favicon.ico'));
app.use(express.static('public'));

// Default Page
app.get('/', function(req, res) {
    res.sendFile(__dirname + '/public/index.html');
});

// Start Listening
app.listen(9999, function() {
    console.log("OK");
});
