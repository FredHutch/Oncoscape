const comongo = require('co-mongodb');
const co = require('co');
var onError = function(e){ console.log(e); }

co(function *() {

	var disease = "brain"
	var result,
		collection, collections, 
		fields, field;

	var db = yield comongo.client.connect('mongodb://rootAdmin:JbzCsumeFXKG53K@oncoscape-dev-db1.sttrcancer.io:27017,oncoscape-dev-db2.sttrcancer.io:27017,oncoscape-dev-db3.sttrcancer.io:27017/BnB?authSource=admin&replicaSet=rs0');

	collection = yield comongo.db.collection(db, "brain_colorcategory_tcga_import");
	result = yield collection.find({type:'colorCategory'}).toArray();

	var r = result.map(function(option){
		var colors = option.data[0];
		colors = colors.map(function (color){
			return {
				name:color.name,
				color: color.color,
				values: color.values[0].map(function(f){
					return f.replace(/\./gi,"-")+"-01";
				}) 
			}

		});

		return {
			"dataset" : "brain",
    		"type" : "color",
    		"name" : option.name,
    		"data" : colors
    	};
	});

	collection = yield comongo.db.collection(db, 'render_patient');
	for (var i=0; i<r.length; i++){
		yield collection.insert(r[i], {w:"majority"});
	}

	





	// var r = result.map(function(v){






	yield comongo.db.close(db);
}).catch(onError);