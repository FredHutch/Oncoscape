const comongo = require('co-mongodb');
const co = require('co');
var sizeof = require('object-sizeof');

var onerror = function(e){
	console.dir(e);
}

co(function * () {

	 var db = yield comongo.client.connect('mongodb://oncoscapeRead:i1f4d9botHD4xnZ@oncoscape-dev-db1.sttrcancer.io:27017,oncoscape-dev-db2.sttrcancer.io:27017,oncoscape-dev-db3.sttrcancer.io:27017/oncoscape?authSource=admin&replicaSet=rs0');
	 var collection = yield comongo.db.collection(db, "molecular_tcga_brca_rna");
	 console.log("START");
	 console.log(new Date());
	 var result = yield collection.find().toArray();
	 console.log("END");
	 console.log(new Date());
	 console.log("LENGTH : "+result.length);
	 console.log("SIZE : "+sizeof(result));
  	

}).catch(onerror);

console.log("HI");
