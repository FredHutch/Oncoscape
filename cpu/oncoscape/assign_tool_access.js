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
    var repo = "tcga"
    var host = 'mongodb://'+user+":"+pw+"@oncoscape-dev-db1.sttrcancer.io:27017,oncoscape-dev-db2.sttrcancer.io:27017,oncoscape-dev-db3.sttrcancer.io:27017/"+repo+"?authSource=admin&replicaSet=rs0"
    var db = yield comongo.client.connect(host);

    var json_meta = require("./tool_requirements.json")      
        
    //read from JSON object
    //read from lookup collection
    //  -- if dataset not found - add document with default metadata 
    //  -- req params first time. {dataset: projectID, source: [File, TCGA, GEO, ...], name: user readable dataset name}
    //insert collection metadata into lookup_datasources based on dataset name
    //-- req params per collection.  {collection: collection name, name: user readable collection name, type: }
    //-- optional defaults: {default:False, schema: hugo_sample}
    var lookup = yield comongo.db.collection(db, "lookup_oncoscape_datasources_v2");    
    var ds = yield lookup.find().toArray()
    var con_phenowrap = yield comongo.db.collection(db, "phenotype_wrapper");    
    

    for(j=0;j<ds.length; j++){
        var d = ds[j]
        var con_collections = yield comongo.db.collection(db, d.dataset +"_collections")
        var collections = yield con_collections.find({}, {s:0,m:0}).toArray()

        var con_pheno = yield comongo.db.collection(db, d.dataset +"_phenotype")
        var phenotype = yield con_pheno.find({}).toArray()
        var pheno_wrap = yield con_phenowrap.find({dataset: d.dataset}).toArray()

        var tools = d.tools
        for(i=0;i<json_meta.length; i++){
            var t = json_meta[i]
          
            for(r=0;r<t.req.length;r++){  // loop through all requirements for tool
                var pass = true
                if(t.req[r].type == "molecular"){
                    var subset = collections.filter(function(c){ return _.contains(t.req[r].value,c[t.req[r].field])})
                    if(subset.length ==0){ pass = false}
                }
                if(pass & t.req[r].type =="clinical"){
                    var subset = phenotype.filter(function(d){ return _.contains(t.req[r].value, d[t.req[r].field] ) })
                    if(subset.length == 0) pass = false
                }
                if(pass){
                    tools = _.union(tools, d.name)
                } else if(_.contains(tools, t.name)){
                    tools = _.without(tools, t.name);
                }
            }
            var res =  yield lookup.update({dataset: d.dataset}, {$set:{"tools": d.tools}}, {writeConcern:{w:"majority"}})
        }
        
    } 

yield comongo.db.close(db);
}).catch(onError);