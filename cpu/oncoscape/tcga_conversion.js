// add dataset to database for v2 compliance
// 1. add dataset to lookup_datasources

const comongo = require('co-mongodb');
const co = require('co');
var fs = require('fs');
var onError = function(e){ console.log(e); }

co(function *() {

    var user = "oncoscape"
    var pw= process.env.dev_oncoscape_pw
    var repo = "tcga"
    var host = 'mongodb://'+user+":"+pw+"@oncoscape-dev-db1.sttrcancer.io:27017,oncoscape-dev-db2.sttrcancer.io:27017,oncoscape-dev-db3.sttrcancer.io:27017/"+repo+"?authSource=admin&replicaSet=rs0"
    var db = yield comongo.client.connect(host);
    
    // Create Datasources Lookup Collection
    collection = yield comongo.db.collection(db, "lookup_dataTypes");
    var dataTypes = yield collection.find().toArray()
    
    // Create Datasources Lookup Collection
    collection = yield comongo.db.collection(db, "lookup_oncoscape_datasources");
    var datasets = yield collection.find().toArray()

    var molecular = []

    datasets.forEach(function(d){
        if(d.source =="TCGA"){
            d.molecular.forEach(function(m){
                console.log(m.collection)
                var category = dataTypes.filter(function(x){return x.dataType == m.type})[0]
                molecular.push({dataset: d.disease, name:m.type, collection:m.collection, default:m.default, type:category.class, schema:category.schema})
        })}
    })

    var json = JSON.stringify(molecular);
    fs.writeFile('./tcga_molecular_lookup.json', json);

yield comongo.db.close(db);
}).catch(onError);