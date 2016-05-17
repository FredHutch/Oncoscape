var MongoClient = require('mongodb').MongoClient
var assert = require('assert');
var url = 'mongodb://localhost:27017/oncoscape';
const fs = require('fs');
const rl = require('readline');
const request = require('request');
const xml = require('xmldom');


// Connect To Mongo
MongoClient.connect(url, function(err, db) {
	assert.equal(null, err);
	console.log("CONNECTED")

	var collection = db.collection("TCGA_METADATA");;

	// Read File System
	fs.readdir('.', function(err, data) {

		var files = data.filter(function(d){ return d.indexOf("metadata.json")!=-1; })

		files.forEach(function(file){

			var file = files[0];
			var data = JSON.parse(fs.readFileSync(file));
			var columnNames = data[0]
			var cdeIds = data[1];


			for (var prop in cdeIds) {

				var cde = cdeIds[prop];
				var col = columnNames[prop];
				if (cde==="") continue;
				var url = "http://cadsrapi.nci.nih.gov/cadsrapi41/GetXML?query=DataElement[@publicId="+cde+"]";


				(function(cde, url, col, collection){

					request.get(url, function (error, response, body) {
						if (!error && response.statusCode == 200) {

							var xmlDoc = new xml.DOMParser().parseFromString(body);
							var elements = xmlDoc.getElementsByTagName("field");
							var longName = "";
							var definition = "";
							
							for (var i=0; i<elements.length; i++){
								var element = elements[i];
								if (element.hasAttribute("name")){

									if (element.getAttribute("name")=="longName"){
										longName = element.childNodes[0].nodeValue;
									}
									if (element.getAttribute("name")=="preferredDefinition"){
										definition = element.childNodes[0].nodeValue;
									}
								}
							}

							var o = {
									cdeId: cde,
									columnName: col,
									name: longName,
									desc: definition
								};
							collection.insert( o );
							

							console.log(o)

		     			}
					});



				})(cde, url, col, collection);

	  
			}
		});
	})

});
/*
// Connect To Mongo
MongoClient.connect(url, function(err, db) {
	assert.equal(null, err);
	console.log("CONNECTED")

	// Read Files in Directory
	fs.readdir('.', function(err, data) {
	    if (err) { throw err; }
	    var files = data.filter(function(d){ return d.indexOf(".json")!=-1; })
	    var collection;
	    
		var tables = files.map(function (f){ return f.replace(".json","").replace(".","-").trim(); });
	    collection = db.collection('TCGA_TABLE');
		collection.insertMany(tables.map(function(t){ return {name:t.replace("TCGA","TCGA_").toUpperCase(), disease:t.substring(0, t.indexOf("_")).replace("TCGA","TCGA_").toUpperCase() } }), {w:1}, function(err, result){ console.log(err); });

		var diseases = tables.map(function(f){ return f.substring(0, f.indexOf("_")); });
	    diseases = diseases.filter( function(item, pos) { return diseases.indexOf(item) == pos; });
		collection = db.collection('TCGA_DISEASE');
		collection.insertMany(diseases.map(function(t){ return {name:t.replace("TCGA","TCGA_").toUpperCase()} }), {w:1}, function(err, result){ console.log(err); });
		
	    // Process Files
	    files.forEach(function(file){
	    	var collectionName = file.replace(".json","").replace(".","-").trim().toUpperCase().replace("TCGA","TCGA_");
	    	var collection = db.collection(collectionName);
	    	var data = JSON.parse(fs.readFileSync(file));
	    	collection.insertMany(data.values, {w:1}, function(err, result){
	    		console.log(err);
	    	});
	    });
	});

});
*/