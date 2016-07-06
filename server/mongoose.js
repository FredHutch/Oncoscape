var mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/os');
var express = require('express');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');


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




function find (collec, query, callback) {
    mongoose.connection.db.collection(collec, function (err, collection) {
    	collection.find(query).toArray(callback);
    });
}

// Ping
server.get('/', function (req, res) { 
	mongoose.connection.db.collection("edge_brca_tcgapancancermutated", function (err, collection) {
		collection.find().toArray(function(err, results) {
			console.log(err);
			
			res.send(results);
		});

	});

});


 server.listen(9999, function () {
    console.log('Http Server Started On: 9999');
  });