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
    json_mol = json_mol.filter(function(d){ return _.contains(["hugo_sample", "prot_sample"], d.schema )})
    var json_clin = require("./tcga_clinical_lookup.json")
    //var json_meta = json_clin.concat(json_mol)
    var json_meta = json_clin;

    // // Clean Project 
    // // 1. drop collections, and clear Collections & Tools list in lookup table 
    // // 2. drop ptdashboard collection
    // // 3. drop samplemap collection
    // // 4. drop phenotype_wrapper
    var drop = {collection: false, 
                samplemap: false,
                phenowrapper: false,
                collections: false,
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
           var pheno_wrap = yield wrapper_collection.find({dataset: j.dataset}).toArray()
           // var req = typeof j.req == "undefined" ?  "null" : j.req
           // var pheno_wrapper = {dataset: j.dataset, req:req, enums:[],time:[], nums:[], boolean:[], events: [], strings: [] }
           var pheno_wrapper = {
               enums: _.pluck(pheno_wrap[0].enums, "path"),
               time:_.pluck(pheno_wrap[0].time, "path"),
               nums:_.pluck(pheno_wrap[0].nums, "path"),
               boolean:_.pluck(pheno_wrap[0].boolean, "path"),
               events: _.pluck(pheno_wrap[0].events, "path"),
               strings: _.pluck(pheno_wrap[0].strings, "path")
            }

            for(var z=0;z<pheno_data.length;z++){
                var elem = pheno_data[z]

                var fields = Object.keys(elem)
                var doc = {id: elem.patient_ID, type: "patient", enum:{}, num:{}, date:{}, boolean:{}, other:{}, events:[]}

                fields.map(function(f){
                    if(_.contains(pheno_wrapper.enums, f))
                        doc.enum[f] = elem[f]
                    else if(_.contains(pheno_wrapper.time, f))
                        doc.time[f] = elem[f]
                    else if(_.contains(pheno_wrapper.nums, f))
                        doc.num[f] = elem[f]
                    else if(_.contains(pheno_wrapper.boolean, f))
                        doc.boolean[f] = elem[f]
                    else if(_.contains(pheno_wrapper.strings, f))
                        doc.other[f] = elem[f]
                    else if(typeof elem[f] == "object" & elem[f].length >0){
                        elem[f].forEach(function(e){
                            e.type = f
                            doc.events.push(e)
                        })
                        
                    }
                })
                
                var count = yield collection.count({id:doc.id})
                if(count == 0)
                    collection.insert(doc, 
                        {upsert: true, writeConcern: {w:"majority"}})

            }

        }

    } //end json_meta loop


yield comongo.db.close(db);
}).catch(onError);