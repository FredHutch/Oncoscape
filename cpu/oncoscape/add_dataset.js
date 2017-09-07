// add dataset to database for v2 compliance
// 1. read metadata from JSON object 
// 2. add dataset to lookup_datasources

const comongo = require('co-mongodb');
const co = require('co');
var _ = require('underscore')
var onError = function(e){ console.log(e); }


co(function *() {

    var user = "oncoscape"
    var pw= process.env.dev_oncoscape_pw
    var repo = "v2"
    var host = 'mongodb://'+user+":"+pw+"@oncoscape-dev-db1.sttrcancer.io:27017,oncoscape-dev-db2.sttrcancer.io:27017,oncoscape-dev-db3.sttrcancer.io:27017/"+repo+"?authSource=admin&replicaSet=rs0"
    var db = yield comongo.client.connect(host);

     
    var source = "TCGA"
    var json_meta = require("./tcga_molecular_lookup.json")
    json_meta = json_meta.filter(function(d){ return d.schema == "hugo_sample"})

    for(i=0;i<json_meta.length; i++){
        var j = json_meta[i]
        
        var meta = {    "dataset" : "",
                        "source" : "",
                        "beta" : false,
                        "name" : "",
                        "img" : "DSdefault.png",
                        "tools" : [ ],
                        "collections" : []
        }
    //read from JSON object
    //read from lookup collection
    //  -- if dataset not found - add document with default metadata 
    //  -- req params first time. {dataset: projectID, source: [File, TCGA, GEO, ...], name: user readable dataset name}
    //insert collection metadata into lookup_datasources based on dataset name
    //-- req params per collection.  {collection: collection name, name: user readable collection name, type: }
    //-- optional defaults: {default:False, schema: hugo_sample}
        var lookup = yield comongo.db.collection(db, "lookup_oncoscape_datasources");    
        var ds = yield lookup.find({dataset: j.dataset}).toArray()
        if( ds.length  == 0){
            ds = [meta]
            ds[0].dataset = j.dataset
            ds[0].source = typeof j.source == "undefined" ? source : j.source
            ds[0].name =   j.dataset
        }
        schema = typeof j.schema == "undefined" ? "hugo_sample" : j.schema
        def_coll = typeof j.default == "undefined" ? false : j.default
        ds[0].collections.push({name: j.name, collection:j.collection, type: j.type, schema:schema, default:def_coll})
        
        var res = yield lookup.update({dataset: j.dataset}, ds[0], {upsert: true, writeConcern: {w:"majority"}})
        
    } 

yield comongo.db.close(db);
}).catch(onError);