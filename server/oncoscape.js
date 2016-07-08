console.log("  ___  _ __   ___ ___  ___  ___ __ _ _ __   ___ \n / _ \\| '_ \\ / __/ _ \\/ __|/ __/ _` | '_ \\ / _ \\\n| (_) | | | | (_| (_) \\__ \\ (_| (_| | |_) |  __/\n \\___/|_| |_|\\___\\___/|___/\\___\\__,_| .__/ \\___|\n                                    |_|         ");
const mongoose = require('mongoose');
const compression = require('compression');
const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const auth = require('./auth-module.js');
const uuid = require('node-uuid');
const format = require('util').format;

// Connect To Mongo Cluster
mongoose.connect('mongodb://localhost/os');
// mongoose.connect(
//     'mongodb://oncoscape-dev-db1.sttrcancer.io:27017,oncoscape-dev-db2.sttrcancer.io:27017,oncoscape-dev-db3.sttrcancer.io:27017/os', {
//         db: {
//             native_parser: true
//         },
//         server: {
//             poolSize: 5,
//             reconnectTries: Number.MAX_VALUE
//         },
//         replset: {
//             rs_name: 'rs0'
//         },
//         user: 'oncoscapeRead',
//         pass: 'i1f4d9botHD4xnZ'
//     }
// );

// Create App
var app = express();

// Add Middleware
app.use(compression());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(express.static('public'));
app.use(cookieParser());
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

// Mongoose Gateway Route
app.get('/api/:collection*',
    function(req, res, next) {
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

// Logout
app.get('/logout', function(req, res) {
    res.clearCookie('token');
    res.sendFile(__dirname + '/public/index.html');
});

// Login
app.post('/login', function(req, res) {
    var username = req.body.username;
    var password = req.body.password;
    var domain = req.body.domain;

    auth.login(username, password, domain, function(isValid, datasets) {
        if (isValid, datasets) {
            res.json({
                success: true,
                token: uuid.v1(),
                datasets
            });
        } else {
            res.json({
                success: false
            });
        }
    });
});

// Home Page
app.get('/', function(req, res) {
    res.sendFile(__dirname + '/public/index.html');
});

// Open Port 
app.listen(80, function() {
    console.log("Version 3.0");
});
