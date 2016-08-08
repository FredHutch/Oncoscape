const comongo = require('co-mongodb');
const co = require('co');
var onError = function(e){ console.log(e); }

co(function *() {

	var disease = "brain"
	var result,
		collection, collections, 
		fields, field;

	var db = yield comongo.client.connect('mongodb://rootAdmin:JbzCsumeFXKG53K@oncoscape-dev-db1.sttrcancer.io:27017,oncoscape-dev-db2.sttrcancer.io:27017,oncoscape-dev-db3.sttrcancer.io:27017/BnB?authSource=admin&replicaSet=rs0');
	collection = yield comongo.db.collection(db, "lookup_oncoscape_datasources");
	result = yield collection.find({ disease:disease }).toArray();
	collections = result[0].collections;

	collection = yield comongo.db.collection(db, collections.patient);
	result = yield collection.find().toArray();

	fields = Object.keys(result[0]).filter(function(f){ 
		if (f=="_id") return false;
		if (f=="patient_ID") return false;
		return true;
	});

	var colors = ['#2e63cf','#df3700','#ff9a00','#009700','#9b009b','#0099c9','#df4176','#64ac00','#ba2c28','#2e6297'];

	collection = yield comongo.db.collection(db, 'render_patient');
	// Loop Through Each Field In Table
	for (var fieldIndex=0; fieldIndex<fields.length; fieldIndex++){

		var field = fields[fieldIndex];
		var factors = result.reduce(function(p,c){
			var f = p.field;
			var o = p.out;
			var v = c[f];
			if (!o.hasOwnProperty(v)) o[v] = [];
			o[v].push(c["patient_ID"])
			return p;
		}, {field:field, out:{}});

		// Omit Fields With More Than 10 Values
		var factorCount = Object.keys(factors.out).length;
		if (factorCount>10 || factorCount<2 ) continue;
		
		var colorOption = {
			dataset: disease,
			type: "color",
			name: field.replace(/_/gi," ").toLowerCase().replace(/(\b[a-z](?!\s))/g, function(x){return x.toUpperCase();}),
			data: []
		};
		var keys = Object.keys(factors.out);
		for (var i=0; i<keys.length; i++){
			colorOption.data.push({
				"name": keys[i].replace(/_/gi," ").toLowerCase().replace(/(\b[a-z](?!\s))/g, function(x){return x.toUpperCase();}),
				"color": colors[i],
				"values": factors.out[keys[i]]
			})
		}
		colorOption.data = colorOption.data.sort(function(a,b){
			if (a.name < b.name) return -1;
			if (a.name > b.name) return 1;
			return 0;
		}).sort(function(a,b){
			if (a.name=='Null') return 1;
			if (b.name=='Null') return -1;
			return 0;
		});

		yield collection.insert(colorOption, {w:"majority"});
		console.dir(colorOption, {depth:null})
	}

	yield comongo.db.close(db);
}).catch(onError);