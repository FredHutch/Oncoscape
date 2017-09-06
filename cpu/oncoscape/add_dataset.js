// add dataset to database for v2 compliance
// 1. add dataset to lookup_datasources

const mongoose = require('mongoose');
const Regex = require("regex");
var onError = function(e){ console.log(e); }

// Connect To Database
var user = "oncoscape"
var pw= process.env.dev_oncoscape_pw
var repo = "v2"
var host = 'mongodb://'+user+":"+pw+"@oncoscape-dev-db1.sttrcancer.io:27017,oncoscape-dev-db2.sttrcancer.io:27017,oncoscape-dev-db3.sttrcancer.io:27017/"+repo+"?authSource=admin&replicaSet=rs0"

const connection = mongoose.connect(host);

var projectID = "tcga_blca";
var proj_match = new Regex("^"+projectID);

mongoose.connection.on('open', function () {

    // Add to Datasources lookup table
    mongoose.connection.db.listCollections().toArray(function (err, names) {
        if (err) { console.log(err);
        } else {
            console.log(names.filter(function(d){return proj_match.test(d)}));
        }
    });

    




    mongoose.connection.close();
  
});