// add dataset to database for v2 compliance
// 1. read metadata from JSON object 
// 2. add dataset to lookup_datasources

const comongo = require('co-mongodb');
const co = require('co');
var _ = require('underscore')
var onError = function(e){ console.log(e); }


co(function *() {

    var user = "oncoscape"
    var pw= process.env.MONGO_PASSWORD
    var repo = "v2"
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
        console.log(d.dataset)
        var con_collections = yield comongo.db.collection(db, d.dataset +"_collections")
        var collections = yield con_collections.find({}, {s:0,m:0}).toArray()

        var con_pheno = yield comongo.db.collection(db, d.dataset +"_phenotype")
        var phenotype = yield con_pheno.find({}).toArray()
        var pheno_wrap = yield con_phenowrap.find({dataset: d.dataset}).toArray()
        var con_network = yield comongo.db.collection(db, d.dataset +"_network")
        var network = yield con_network.find({}).toArray()
        var con_events = yield comongo.db.collection(db, d.dataset +"_events")
        var events = yield con_events.find({}).toArray()

        var tools = d.tools
        for(i=0;i<json_meta.length; i++){
            var t = json_meta[i]
            var pass = true
            var mol_subset = collections
            var clin_subset = phenotype
            var net_subset = network
            var event_subset = events
            for(r=0;r<t.and.length & pass;r++){  // loop through all requirements for tool
                if(t.and[r].type == "molecular"){
                    if(t.and[r].logic== "in")
                        mol_subset = mol_subset.filter(function(c){ return _.contains(t.and[r].value,c[t.and[r].field])})
                    else if(t.and[r].logic== "is")
                        mol_subset = mol_subset.filter(function(c){ return c[t.and[r].field] == t.and[r].value })
                    if(mol_subset.length ==0){ pass = false}
                }
                else if(pass & t.and[r].type =="clinical"){
                    if(t.and[r].logic== "in")
                        clin_subset = clin_subset.filter(function(d){ return _.contains(t.and[r].value, d[t.and[r].field] ) })
                    else if(t.and[r].logic== "is")
                        clin_subset = clin_subset.filter(function(d){ return d[t.and[r].field] == t.and[r].value })
                    else if(t.and[r].logic== "matches")
                        clin_subset = clin_subset.filter(function(d){ 
                            //console.log(d[t.and[r].field])
                            return d[t.and[r].field] ? 
                            d[t.and[r].field].toString().match(t.and[r].value ).length >0 : 
                            false})    
                    if(clin_subset.length == 0) pass = false
                } else if(pass & t.and[r].type =="network"){
                   
                    if(t.and[r].logic== "matches")
                        net_subset = net_subset.filter(function(d){ 
                            //console.log(d[t.and[r].field])
                            return d[t.and[r].field] ? 
                            d[t.and[r].field].toString().match(t.and[r].value ).length >0 : 
                            false})    
                    if(net_subset.length == 0) pass = false
                } 
                else if (pass & t.and[r].type =="events"){
                    if(event_subset.length == 0) pass = false
                }

            }
            if(pass){                           tools = _.union(tools, [t.name])}
            else if(_.contains(tools, t.name)){ tools = _.without(tools, t.name); }
        }
        var res =  yield lookup.update({dataset: d.dataset}, {$set:{"tools": tools}}, {writeConcern:{w:"majority"}})
    } 

yield comongo.db.close(db);
}).catch(onError);