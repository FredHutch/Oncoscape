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

    var json_meta = require("./tool_requirements.json")

    for(i=0;i<json_meta.length; i++){
        var t = json_meta[i]
        
        
    //read from JSON object
    //read from lookup collection
    //  -- if dataset not found - add document with default metadata 
    //  -- req params first time. {dataset: projectID, source: [File, TCGA, GEO, ...], name: user readable dataset name}
    //insert collection metadata into lookup_datasources based on dataset name
    //-- req params per collection.  {collection: collection name, name: user readable collection name, type: }
    //-- optional defaults: {default:False, schema: hugo_sample}
        var lookup = yield comongo.db.collection(db, "lookup_oncoscape_datasources");    
        var ds = yield lookup.find().toArray()
        for(j=0;j<ds.length; j++){
            var d = ds[j]
            var collections = d.collections
            //if( d.collections.length  == 0){        }
            for(r=0;r<t.req.length;r++){
                collections = collections.filter(function(c){ return _.contains(t.req[r].value,c[t.req[r].field])})
            }
            if(collections.length >0){
                var res = yield lookup.update({dataset:d.dataset}, {$addToSet:{"tools": t.name}}, {writeConcern:{w:"majority"}})
            } else{
                if(_.contains(d.tools, t.name)){
                    d.tools = _.without(d.tools, t.name);
                    yield lookup.update({dataset: d.dataset}, {$set:{"tools": d.tools}}, {writeConcern:{w:"majority"}})
                }
            }
        }
        
    } 

yield comongo.db.close(db);
}).catch(onError);