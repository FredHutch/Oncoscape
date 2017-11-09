process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
const kong = "https://dev.oncoscape.sttrcancer.io/admin/";
const mongoose = require('mongoose');
const request = require('sync-request');


function put(obj) {
    try {
        var req = request('put', obj.url, { json: obj.json });
        console.log("ADD " + req.statusCode + " " + obj.url);
        console.log(req.getBody("utf8"));
    } catch (e) {
        console.log(e);
        console.log("---");
    }
}

function post(obj) {
    try {
        var req = request('post', obj.url, { json: obj.json });
        console.log("ADD " + req.statusCode + " " + obj.url);
        console.log(req.getBody("utf8"));
    } catch (e) { console.log("---"); }
}


// // Add Mogno APIs

 var disconnect = function() { db.close(); }
 mongoose.connect(
    "mongodb://oncoscape-dev-db1.sttrcancer.io:27017,oncoscape-dev-db2.sttrcancer.io:27017,oncoscape-dev-db3.sttrcancer.io:27017/v2?authSource=admin",{
    // process.env.MONGO_CONNECTION, {  
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
}).then(function(){
    console.log("Child Process Kong Configure connect success!");
}, function (err){
    console.log("Child Process Kong Configure connect error: ", err);
});
 
const db = mongoose.connection;

const updateKong= (msg) => {
    var projectID = msg.projectID;
    console.log('%%%%%%%%% Updating Kong');
    console.log('msg: ', msg);
    console.time("Exposing Project Collections");
     
    function addCollection(collections){
        collections = collections
            .sort();
        console.log("adding collections: ")
        console.dir(collections);

        // Configure Api
        collections.map(function(v) {
            
            return {
                url: kong + "apis/",
                json: {
                    //"request_host": "127.0.0.1",
                    "name": "Oncoscape" + v.split("_").map(function(f) { return f.charAt(0).toUpperCase() + f.substring(1); }).join(""),
                    "request_path": "/" + v,
                    "strip_request_path": true,
                    "preserve_host": false,
                    "upstream_url": "http://127.0.0.1:8002/api/" + v
                }
            };
            
        }).forEach(put);

        // Configure Cors
        collections.map(function(v) {
            return {
                url: kong + "apis/Oncoscape" + v.split("_").map(function(f) { return f.charAt(0).toUpperCase() + f.substring(1); }).join("") + "/plugins",
                json: {
                    "name": "cors",
                    "config.origin": "*",
                    "config.methods": "GET",
                    "config.max_age": 3600
                }
            };
        }).forEach(put);

        // List of Groups
        var groups = collections.map(function(v) {
            return v.substring(0, v.indexOf("_"));
        }).filter(function(v, i, a) {
            return a.indexOf(v) === i;
        }).filter(function(v) {
            return v != "";
        });

        console.log(groups);

        return collections
    }
    
    db.on('open', function () {
        db.db.listCollections().toArray(function (err, names) {
            //console.log(names);
            var collections = names.map(function(d){return d.name})
                            .filter(function(name){return name.indexOf(projectID)!=-1;})
            
            console.log(collections)
            addCollection(collections)
            process.send("DONE: Kong Configure");
        });
    });


    // mongoose.connection.db.collections().then(function(collections) {
    //     console.log("adding collections for project: "+ projectID)
    //     addCollections(collections)
    // })
}


process.on('message', (projectID) => {
    updateKong(projectID);
    
});


