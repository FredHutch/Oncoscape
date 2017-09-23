// read TCGA db lookup table to aggregate info on molecular collections
// then save JSON file with collection metadata for adding to v2 database

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
    var clinical = []

    datasets.forEach(function(d){
        if(d.source =="TCGA"){
            d.molecular.forEach(function(m){
                console.log(m.collection)
                var category = dataTypes.filter(function(x){return x.dataType == m.type})[0]
                molecular.push({dataset: d.dataset, name:m.type, collection:m.collection, default:m.default, type:category.class, schema:category.schema})
        })}
    })
 
    var json = JSON.stringify(molecular);
    fs.writeFile('./tcga_molecular_lookup.json', json);

    datasets.forEach(function(d){
        if(d.source =="TCGA"){
            d.clinical.forEach(function(m){
                console.log(m)
                event = ""
                if(grepl(m.key ))
                    type="event"
                clinical.push({dataset: d.dataset, name:m.key, collection:m.value, type:category.class, schema:category.schema})
        })}
    })
    var json = JSON.stringify(molecular);
    fs.writeFile('./tcga_clinical_lookup.json', json);


yield comongo.db.close(db);
}).catch(onError);