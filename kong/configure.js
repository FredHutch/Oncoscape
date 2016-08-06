const kong = "http://apigateway.fhcrc.org:8001/";
//const kong = "http://localhost:8001/";
const mongoose = require('mongoose');
const request = require('sync-request');


// Kong Request Wrappers
function del(name){
	
	try{
		console.log(kong+name);
		var req = request('DELETE', kong+name)
		//console.log(req.getBody("utf8"));
		console.log("DEL " + req.statusCode);

	}catch(e){ console.dir(e);
		console.log("---"); }
}
function put(obj){
	try{
		var req = request('put', obj.url, { json:obj.json });
    	console.log("ADD " + req.statusCode + " " + obj.url);
    	console.log(req.getBody("utf8"));
	}catch(e){ console.log("---"); }
}
function post(obj){
	try{
		var req = request('post', obj.url, { json:obj.json });
	    console.log("ADD " + req.statusCode + " " + obj.url);
	    console.log(req.getBody("utf8"));
	}catch(e){ console.log("---"); }
}

/* 05922b6d-d036-4362-8eb3-1db6240b726a */

var username = "oncoscape";


// Add Consumer
put({
	url: kong+"consumers/",
	json: {
		username : username
	}
});

// Add Consumer To Group
put({
	url: kong+"consumers/"+username+"/acls/",
	json:{
		group:'admin'
	}
});

put({
	url: kong+"consumers/"+username+"/key-auth",
	json:{
		key: "mypassword"
	}
});


// Add Mogno APIs
var disconnect = function () { mongoose.connection.close(); }
mongoose.connect('mongodb://oncoscapeRead:i1f4d9botHD4xnZ@oncoscape-dev-db1.sttrcancer.io:27017,oncoscape-dev-db2.sttrcancer.io:27017,oncoscape-dev-db3.sttrcancer.io:27017/BnB?authSource=admin&replicaSet=rs0');
mongoose.connection.on('open', function (ref) {

	mongoose.connection.db.collections().then(function(collections) {


		collections = collections
			.map(function(collection){ 
				return collection.s.name; 
			})
			.filter(function(collection){
				return (collection=="kong" || collection=="system.indexes") ? false : true;
			});


		//del("apis/OncoscapeLogin");
		// collections.map(function(v){
		// 	return "apis/Oncoscape"+v.split("_").map(function(f){return f.charAt(0).toUpperCase() + f.substring(1);}).join("");
		// }).forEach(del);


			// Configure Api
			collections.map(function(v){
				return {
					url: kong+"apis/",
					json: {
						//"request_host": "127.0.0.1",
						"name": "Oncoscape"+v.split("_").map(function(f){return f.charAt(0).toUpperCase() + f.substring(1);}).join(""),
			    		"request_path": "/api/"+v,
			    		"strip_request_path": false,
			    		"preserve_host": false,
			    		"upstream_url": "http://dev.oncoscape.sttrcancer.io/api/"+v
			    	}
				};
			 }).forEach(put);

			// Configure Cors
			collections.map(function(v){
				return {
					url: kong+"apis/Oncoscape"+v.split("_").map(function(f){return f.charAt(0).toUpperCase() + f.substring(1);}).join("")+"/plugins",
					json:{
						"name": "cors",
						"config.origin": "*",
						"config.methods": "GET",
						"config.max_age": 3600
					}
				};
			}).forEach(put);

			// Configure Security
			collections.map(function(v){
				return {
					url: kong+"apis/Oncoscape"+v.split("_").map(function(f){return f.charAt(0).toUpperCase() + f.substring(1);}).join("")+"/plugins",
					json:{
						"name": "key-auth",
						"config.key_names": "apikey",
						"config.hide_credentials": false
					}
				};
			}).forEach(put);
			
			// Configure ACLs
			collections.map(function(v){
				return {
					url: kong+"apis/Oncoscape"+v.split("_").map(function(f){return f.charAt(0).toUpperCase() + f.substring(1);}).join("")+"/plugins",
					json:{
						"name": "acl",
						"config.whitelist": "admin"
					}
				};
			}).forEach(post);

			// Configure Rate Limiting
			collection.map(function(v){
				return {
					url: kong+"apis/Oncoscape"+v.split("_").map(function(f){return f.charAt(0).toUpperCase() + f.substring(1);}).join("")+"/plugins",
					json:{
						"name": "rate-limiting",
						"config.second": 1,
						"config.hour": 10000
					}
				};
			}).forEach(post);



		disconnect();
	});

});

console.log("Fin");
