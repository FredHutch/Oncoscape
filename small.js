const mongoose = require('mongoose');
const express = require('express');
const bodyParser = require('body-parser');
var app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
var domain = process.env.MONGO_DOMAIN;
mongoose.connect(
    process.env.MONGO_CONNECTION, {  
    db: { native_parser: true },
    server: { poolSize: 5, reconnectTries: Number.MAX_VALUE },
    replset: { rs_name: 'rs0' },
    user: process.env.MONGO_USERNAME, pass: process.env.MONGO_PASSWORD
});
mongoose.connection.on('connected', function() {
var processQuery = function(req, res, next, query) {
    res.setHeader("Cache-Control", "public, max-age=86400");
    mongoose.connection.db.collection(req.params.collection, 
        function(err, collection) {
        if (err) { res.status(err.code).send(err.messages); res.end(); return; }
        var limit = null
        if (query.$limit) { limit = query.$limit; delete query.$limit; }
        var skip = null;
        if (query.$skip) { skip = query.$skip; delete query.$skip; }
        var fields = { _id: 0 };
        if (query.$fields) { query.$fields.forEach(
            function(field) { this[field] = 1; }, fields); 
            delete query.$fields; }
        var find = collection.find(query, fields);
        if (limit) find = find.limit(limit);
        if (skip) find = find.skip(skip);
        find.toArray(function(err, results) { res.send(results); res.end(); });
    });
};
app.get('/api/:collection/:query', function(req, res, next) {
    res.setHeader("Cache-Control", "public, max-age=86400");        
    var query = (req.params.query) ? JSON.parse(req.params.query) : {};
    processQuery(req, res, next, query);
});
app.get('/api/:collection*', function(req, res, next) {
    res.setHeader("Cache-Control", "public, max-age=86400");
    var query = (req.query.q) ? JSON.parse(req.query.q) : {};
    processQuery(req, res, next, query);
});
});
app.listen(process.env.NODE_PORT, function() { console.log("UP"); });