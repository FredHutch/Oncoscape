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
    var json_mol = require("./tcga_molecular_lookup.json")
    json_mol = json_mol.filter(function(d){ return d.schema == "hugo_sample"})
    var json_clin = require("./tcga_clinical_lookup.json")
    //var json_meta = json_clin.concat(json_mol)
    var json_meta = json_mol;

    // // Clean Project 
    // // 1. drop collections, and clear Collections & Tools list in lookup table 
    // // 2. drop ptdashboard collection
    // // 3. drop samplemap collection
    // // 4. drop phenotype_wrapper
    var drop = {collection: false, 
                samplemap: false,
                phenowrapper: false,
                collections: true,
                lookup_tools: false
            }

    if(_.some(_.toArray(drop))){
        var lookup = yield comongo.db.collection(db, "lookup_oncoscape_datasources_v2");    
        var ds = yield lookup.find().toArray()
        for(var i=0;i<ds.length; i++){
            console.log(ds[i].dataset)
            if(drop.collection){
                for(var c=0;c<ds[i].collections.length;c++){
                    var coll = yield comongo.db.collection(db, ds[i].collections[c].collection);  
                    yield coll.drop()  
                }
            }
           
            if (drop.lookup_tools)      ds[i].tools = []
                
            yield lookup.update({dataset:ds[i].dataset}, ds[i], {upsert: true, writeConcern: {w:"majority"}})
            
            if(drop.collections){
                var cllctn = yield comongo.db.collection(db, ds[i].dataset+"_collections");  
                var exists = yield cllctn.count()
                if(exists != 0)
                    yield cllctn.drop()  
            }
            if(drop.samplemap){
                var smplmap = yield comongo.db.collection(db, ds[i].dataset+"_samplemap");  
                var exists = yield smplmap.count()
                if(exists != 0)
                    yield smplmap.drop()  
            }
        
            if(drop.phenowrapper){
                var pheno = yield comongo.db.collection(db, "phenotype_wrapper");  
                var exists = yield pheno.count()
                if(exists != 0)
                    yield pheno.drop()  
            }
        }
    }
    
    // add new collection to lookup table for each JSON object
    // skip if collection not yet written
    for(i=0;i<json_meta.length; i++){
        var j = json_meta[i]
        if(j.schema == "hugo_sample"){
            console.log(j.dataset +" "+j.collection)
            
            j.collection_transformed = j.collection.replace("tcga_", "");
            var mm = yield comongo.db.collection(db, j.collection_transformed)
            count = yield mm.count({})
            
            if(count == 0){
                console.log("---not yet stored")
                continue;
            }

            var meta = {    "dataset" : "",
                            "source" : "",
                            "beta" : false,
                            "name" : "",
                            "img" : "thumb.png",
                            "tools" : [ ]
                            
            }
        
        //Add to lookup collection
        //  -- if project/dataset new or not found - add document with default metadata 
        //  -- req params first time. {dataset: projectID, source: [File, TCGA, GEO, ...], name: user readable dataset name}
        //insert collection metadata into lookup_datasources based on dataset name
        //-- req params per collection.  {collection: collection name, name: user readable collection name, type: }
        //-- optional defaults: {default:False, schema: hugo_sample}
            var lookup = yield comongo.db.collection(db, "lookup_oncoscape_datasources_v2");    
            var ds = yield lookup.find({dataset: j.dataset}).toArray()
            if( ds.length  == 0){
                ds = [meta]
                ds[0].dataset = j.dataset
                ds[0].source = typeof j.source == "undefined" ? source : j.source
                ds[0].name =   j.dataset
                var res = yield lookup.update({dataset: j.dataset}, ds[0], {upsert: true, writeConcern: {w:"majority"}})
            }
            schema = typeof j.schema == "undefined" ? "hugo_sample" : j.schema
            if(j.name.match(/protein/)){schema = "prot_sample"}
            isdefault = typeof j.default == "undefined" ? false : j.default

        //create/add to samplemap
            var samplemap = yield comongo.db.collection(db, j.dataset+"_samplemap");    
            var keyval = {};

            var collection = yield comongo.db.collection(db, j.collection_transformed);   
            samples = yield collection.findOne({"name":j.name}, {"s":1})
            samples = samples.s
            var add_samples_i = false
            // samples_i = yield collection.findOne({"name":j.name}, {"s_i":1})
            // samples_i = samples_i.s_i

            if(j.source = "TCGA"){
                if(samples){
                    patients = samples.map(function(s){return s.replace(/\-\w{2}$/,"")})
                    
                    // Note: overwrites previous sample -> patient mapping.  
                    // To Do: check if incoming patient id different than existing sample mapping
                    keyval = _.object(samples, patients)
                    var res =  yield samplemap.update({}, {$set: keyval}, {upsert: true, writeConcern: {w:"majority"}})
                }
            }
            
            //update collection & lookup to store index of sample id from samplemap
            if(samples & add_samples_i){ 
                // As of Mongo 2.6, keys maintain order on update (unless a particular key is renamed...)
                //https://docs.mongodb.com/master/release-notes/2.6/#insert-and-update-improvements
                var samplemapping = yield samplemap.find({}).toArray()
                var samples_i = samples.map(function(s){ return Object.keys(samplemapping[0]).indexOf(s) })
                var cres = yield collection.update({}, {$set: {"s_i": samples_i, "date_modified": new Date()}, $unset: {"s":""}}, {upsert: true, multi: true, writeConcern: {w:"majority"}})
           
            
                // insert new collection into lookup collection
                var markers = yield collection.distinct("m", {"name":j.name})
                var new_collection = {
                    name: j.name, 
                    type: j.type, 
                    schema:schema, 
                    collection: j.collection_transformed, 
                    default:isdefault, 
                    s:samples_i, 
                    m:markers,
                    date_modified: new Date()
                }
                //add collection metadata to lookup if DNE
                if(_.where(ds[0].collections,(({ name, type, schema,  }) => ({ name, type, schema }))(new_collection)).length ==0){
                    console.log("lookup adding dataset: ", j.collection_transformed)
                    ds[0].collections.push(new_collection)
                    var res = yield lookup.update({dataset: j.dataset}, ds[0], {upsert: true, writeConcern: {w:"majority"}})
                }
            }else if(!samples){
                var samplemapping = yield samplemap.find({}).toArray()
                var samples = samples_i.map(function(s){ return Object.keys(samplemapping[0])[s] })
                var cres = yield collection.update({},  {$set: {"date_modified": new Date(), "s": samples }}, {upsert: true, multi: true, writeConcern: {w:"majority"}})
            } else { 
                
                // insert new collection into lookup collection
               
                var markers = yield collection.distinct("m")
                var new_collection = {
                    name: j.name, 
                    type: j.type, 
                    schema:schema, 
                    collection: j.collection_transformed, 
                    default:isdefault, 
                    s:samples, 
                    m:markers,
                    date_modified: new Date()
                }
                //add collection metadata to lookup if DNE 
                // if(_.where(ds[0].collections,(({ name, type, schema,  }) => ({ name, type, schema }))(new_collection)).length ==0){
                //     console.log("lookup adding dataset: ", j.collection_transformed)
                //     ds[0].collections.push(new_collection)
                //     var res = yield lookup.update({dataset: j.dataset}, ds[0], {upsert: true, writeConcern: {w:"majority"}})
                // }
                //add collection metadata to dataset_collections if DNE 
                var ds_collection = yield comongo.db.collection(db, j.dataset+"_collections");   
                var count = yield ds_collection.count({name:j.name, type:j.type, schema:schema})
                if(count==0)
                    var insert_status = yield ds_collection.insert(new_collection, {writeConcern: {w:"majority"}})
            }
        }

         // add clinical data to phenotype wrapper
         if(j.schema == "clinical"){
             console.log(j.dataset)
            var collection = yield comongo.db.collection(db, j.dataset+"_phenotype");   
            var pheno_data = yield collection.find().toArray()
           
            var wrapper_collection = yield comongo.db.collection(db, "phenotype_wrapper");  
            var req = typeof j.req == "undefined" ?  "null" : j.req
            var pheno_wrapper = {dataset: j.dataset, req:req, enums:[],time:[], nums:[], boolean:[], events: [], strings: [] }

            var fields = pheno_data.map(function(elem){return Object.keys(elem);}).reduce(function(p,c){
                keys = c.filter(function(f){
                if (f =="_id") return false;
                if (f =="patient_ID") return false;
                if (f =="bcr_patient_uuid") return false;
                if (p.indexOf(f) != -1) return false;
                return true;
                })
        
                return p.concat(keys);
            }, []);

            // Loop Through Each Field
            for (var fieldIndex=0; fieldIndex<fields.length; fieldIndex++){
                
                // Count Distinct Field Values (Factors Only @ This Point)
                var field = fields[fieldIndex];
                		console.log("---",field)
        
                var factors = pheno_data.reduce(function(p,c){
                    var f = p.field;
                    var o = p.out;
                    var t = p.types;
                    var v = c[f];
                    if( typeof v === 'undefined') v = 'null';
                    var y = typeof v;
                    //if(y == "string" & v.formatDate) y = "date"

                    if (o.indexOf(v) == -1) o.push(v);
                    if (t.indexOf(y) == -1 && v != null && v != 'null'){
                        t.push(y);
                    }  

                    return p;
                }, {field:field, out:[], types:[]});
                

                var factorCount = Object.keys(factors.out).length;
                
                if ( factors.types.every( x => x == "number")){
                    pheno_wrapper.nums.push({path: field, name:field})
                } else if (factors.types.every( x => x == "date")){
                    pheno_wrapper.time.push({path: field, name:field})
                } else if (factors.types.every( x => x == "boolean")){
                    pheno_wrapper.boolean.push({path: field, name:field})
                } else if (factors.types.every( x => x == "object")){
                    pheno_wrapper.events.push({path: field.replace(" ","_"), name:field})
                } else if (factorCount<10 ){
                    pheno_wrapper.enums.push({path: field, name:field})
                } else {
                    pheno_wrapper.strings.push({path: field, name:field})
                }
                // NOTE: "date" not actually an type - how to declare time?
                //  & fields with >10 factor types not currently documented in wrapper - where do they belong?
            }
            var res = yield wrapper_collection.update(
                {dataset: j.dataset}, 
                {$set: pheno_wrapper}, 
                {upsert: true, writeConcern: {w:"majority"}})
        }

    } //end json_meta loop


yield comongo.db.close(db);
}).catch(onError);