// initiate database
// creates skeleton templates of necessary collections for v2
//  1. Lookup_datasources
//  2. lookup_tools
//  3. Hugo_map
//  4. Chromosome locations

const comongo = require('co-mongodb');
const co = require('co');
var onError = function(e){ console.log(e); }

co(function *() {

var collection, count;

// Connect To Database
var user = "oncoscape"
var pw= process.env.dev_oncoscape_pw
var repo = "v2"
var host = 'mongodb://'+user+":"+pw+"@oncoscape-dev-db1.sttrcancer.io:27017,oncoscape-dev-db2.sttrcancer.io:27017,oncoscape-dev-db3.sttrcancer.io:27017/"+repo+"?authSource=admin&replicaSet=rs0"
var db = yield comongo.client.connect(host);

// Create Datasources Lookup Collection --- unnecessary; add_dataset script handles creation if necessary
// collection = yield comongo.db.collection(db, "lookup_oncoscape_datasources");
// var count = yield collection.count();
// if(count == 0){    yield collection.insert({}); }

// Create Tools Lookup Collection
collection = yield comongo.db.collection(db, "lookup_oncoscape_tools");
count = yield collection.count();
if(count == 0){    
    var default_tools = require("./default_tools.json")
    yield collection.insert(default_tools);
 }

// Create Genesets Lookup Collection
collection = yield comongo.db.collection(db, "lookup_genesets");
count = yield collection.count();
if(count == 0){    
    default_genesets = require("./default_genesets.json")
    yield collection.insert(default_genesets);
 }

// Create Genesets Lookup Collection
collection = yield comongo.db.collection(db, "lookup_genepos");
count = yield collection.count();
if(count == 0){    
    default_genepos = require("./gene_minTSS_scaled.json")
    yield collection.insert(default_genepos);
 }


yield comongo.db.close(db);
}).catch(onError);