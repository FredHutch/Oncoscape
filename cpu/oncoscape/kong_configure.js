process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
const kong = "https://oncoscape-test.fhcrc.org/admin/";
//const kong = "https://dev.oncoscape.sttrcancer.io/admin/";
//const kong = "http://localhost:8001/";
//const kong = "https://oncoscape.sttrcancer.org/admin/";
const mongoose = require('mongoose');
const request = require('sync-request');




// // Kong Request Wrappers
// function del(name) {
//     try {
//         console.log(kong + name);
//         var req = request('DELETE', kong + name)
//             //console.log(req.getBody("utf8"));
//         console.log("DEL " + req.statusCode);

//     } catch (e) {
//         console.dir(e);
//         console.log("---");
//     }
// }

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

// function post(obj) {
//     try {
//         var req = request('post', obj.url, { json: obj.json });
//         console.log("ADD " + req.statusCode + " " + obj.url);
//         console.log(req.getBody("utf8"));
//     } catch (e) { console.log("---"); }
// }

// // for (var i=0; i<100; i++){
// // 	var req = request('GET','https://dev.oncoscape.sttrcancer.io/admin/apis');
// // 	var apis = JSON.parse(req.getBody('utf8'));
// // 	apis.data.forEach(function(api){
// // 		del('/apis/'+api.name);
// // 	})
// // }

// // Authentication API
// // put({
// //     url: kong + "apis/",
// //     json: {
// //         //"request_host": "127.0.0.1",
// //         "name": "OncoscapeAuth",
// //         "request_path": "/auth",
// //         "strip_request_path": true,
// //         "preserve_host": false,
// //         "upstream_url": "http://127.0.0.1:8002/api/auth"
// //     }
// // });
// // put({
// //     url: kong + "apis/OncoscapeAuth/plugins",
// //     json: {
// //         "name": "cors",
// //         "config.origin": "*",
// //         "config.methods": "GET",
// //         "config.max_age": 3600
// //     }
// // });

// // // Admin Account

// // post({
// //     url: kong + "apis/",
// //     json: {
// //         "name": "kong",
// //         "request_path": "/kong",
// //         "strip_request_path": true,
// //         "preserve_host": false,
// //         "upstream_url": "http://localhost:8001"
// //     }
// // });
// // post({
// //     url: kong + "apis/kong/plugins",
// //     json: {
// //         "name": "basic-auth",
// //         "config.hide_credentials": "true"
// //     }
// // });
// // post({
// //     url: kong + "consumers/",
// //     json: {
// //         "username": "kong_admin",
// //         "custom_id": "8a0f4c41-a9a9-4f84-8bd4-d9b9085b4569",
// //     }
// // });
// // post({
// //     url: kong + "consumers/kong_admin/basic-auth",
// //     json: {
// //         "username": "mzager@fhcrc.org",
// //         "password": "oncoscape"
// //     }
// // });
// // post({
// //     url: kong + "apis/kong/plugins",
// //     json: {
// //         "name": "cors",
// //         "config.credentials": "false",
// //         "config.origin": "*",
// //         "config.preflight_continue": "false",
// //         "config.max_age": 3600
// //     }
// // });




// // Configure Logging
// post({
//     url: kong + "plugins",
//     json: {
//         "name": "loggly",
//         "config.key": "2ea5c2ac-bec1-405b-92ba-5fe9273551e9"
//     }
// });


// // Add Mogno APIs

 var disconnect = function() { mongoose.connection.close(); }
 mongoose.connect('mongodb://oncoscapeRead:i1f4d9botHD4xnZ@oncoscape-dev-db1.sttrcancer.io:27017,oncoscape-dev-db2.sttrcancer.io:27017,oncoscape-dev-db3.sttrcancer.io:27017/v2?authSource=admin&replicaSet=rs0');
// mongoose.connect('mongodb://oncoscapeRead:i1f4d9botHD4xnZ@oncoscape-dev-db1.sttrcancer.io:27017,oncoscape-dev-db2.sttrcancer.io:27017,oncoscape-dev-db3.sttrcancer.io:27017/tcga?authSource=admin&replicaSet=rs0');
// //mongoose.connect('mongodb://oncoscapeRead:CTp6DtfRNWfFLUP@oncoscape-prod-db1.sttrcancer.io:27017,oncoscape-prod-db2.sttrcancer.io:27017,oncoscape-prod-db3.sttrcancer.io:27017/tcga?authSource=admin&replicaSet=rs0');
 mongoose.connection.on('open', function(ref) {

     mongoose.connection.db.collections().then(function(collections) {


        collections = collections
            .map(function(collection) {
                return collection.s.name;
            })
            // .filter( function( collection){
            //     return collection.indexOf('z_')!=-1;
            // } )
            // .filter(function(collection){
            // 	return collection.indexOf("tcga_")!=-1;
            // })
            .filter(function(collection) {
                return (collection == "kong" || (collection.toLowerCase().indexOf("system") != -1)) ? false : true;
            })
            .filter(function(collection) {
                return (collection.indexOf("+") == -1);
            }).sort();

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

        // // Configure Security
        // collections.map(function(v) {
        //     return {
        //         url: kong + "apis/Oncoscape" + v.split("_").map(function(f) { return f.charAt(0).toUpperCase() + f.substring(1); }).join("") + "/plugins",
        //         json: {
        //             "name": "key-auth",
        //             "config.key_names": "apikey",
        //             "config.hide_credentials": false
        //         }
        //     };
        // }).forEach(put);


        // // Configure ACLs
        // collections.map(function(v) {
        //     return {
        //         url: kong + "apis/Oncoscape" + v.split("_").map(function(f) { return f.charAt(0).toUpperCase() + f.substring(1); }).join("") + "/plugins",
        //         json: {
        //             "name": "acl",
        //             "config.whitelist": "admin," + v.substring(0, v.indexOf("_"))
        //         }
        //     };
        // }).forEach(post);

        // Dont Rate Limit For Admin
        // Configure Rate Limiting
        // collection.map(function(v){
        // 	return {
        // 		url: kong+"apis/Oncoscape"+v.split("_").map(function(f){return f.charAt(0).toUpperCase() + f.substring(1);}).join("")+"/plugins",
        // 		json:{
        // 			"name": "rate-limiting",
        // 			"config.second": 10,
        // 			"config.hour": 10000
        // 		}
        // 	};
        // }).forEach(post);


        // List of Groups
        var groups = collections.map(function(v) {
            return v.substring(0, v.indexOf("_"));
        }).filter(function(v, i, a) {
            return a.indexOf(v) === i;
        }).filter(function(v) {
            return v != "";
        });

        console.log(groups);


        // // Create Admin Account Type
        // put({
        //     url: kong + "consumers/",
        //     json: { username: 'admin' }
        // });

        // // Associate Admin Account Type With Admin Group
        // groups.push("admin");
        // // Loop Through Groups + Add
        // put({
        //     url: kong + "consumers/admin/acls/",
        //     json: { group: 'admin' }
        // });

        // // Set Admin Password
        // put({
        //     url: kong + "consumers/admin/key-auth",
        //     json: { key: "password" }
        // });

        disconnect();
    });

});





console.log("Fin");