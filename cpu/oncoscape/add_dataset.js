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
    //var json_meta = require("./tcga_molecular_lookup.json")
    //json_meta = json_meta.filter(function(d){ return d.schema == "hugo_sample"})
    var json_meta = require("./tcga_clinical_lookup.json")
    
    // // Clean Project 
    // // 1. drop collections, and clear Collections & Tools list in lookup table 
    // // 2. drop ptdashboard collection
    // // 3. drop samplemap collection
    // var lookup = yield comongo.db.collection(db, "lookup_oncoscape_datasources");    
    // var ds = yield lookup.find().toArray()
    // for(var i=0;i<ds.length; i++){
    //     console.log(ds[i].dataset)
    //     for(var c=0;c<ds[i].collections.length;c++){
    //         var coll = yield comongo.db.collection(db, ds[i].collections[c].collection);  
    //         yield coll.drop()  
    //     }
    //     ds[i].collections = []
    //     ds[i].tools = []
    //     yield lookup.update({dataset:ds[i].dataset}, ds[i], {upsert: true, writeConcern: {w:"majority"}})
       
    //     // var ptdashboard = yield comongo.db.collection(db, ds[i].dataset+"_ptdashboard");  
    //     // var exists = yield ptdashboard.count()
    //     // if(exists != 0)
    //     //     yield ptdashboard.drop()  
    //     var smplmap = yield comongo.db.collection(db, ds[i].dataset+"_samplemap");  
    //     var exists = yield smplmap.count()
    //     if(exists != 0)
    //         yield smplmap.drop()  
    // }
    

    // add new collection to lookup table for each JSON object
    // skip if collection not yet written
    for(i=0;i<json_meta.length; i++){
        var j = json_meta[i]
        console.log(j.dataset +" "+j.collection)

        // var m = yield comongo.db.collection(db, j.dataset +"_molecular_matrix")
        // var count = yield m.count({"name": j.name})
        // // var m = yield comongo.db.collection(db, j.collection)
        // // var count = yield m.count({})
        // if(count == 0){
        //     console.log("---not yet stored")
        //     continue;
        // }
            

        // var meta = {    "dataset" : "",
        //                 "source" : "",
        //                 "beta" : false,
        //                 "name" : "",
        //                 "img" : "DSdefault.png",
        //                 "tools" : [ ],
        //                 "collections" : []
        // }
    
    // //Add to lookup collection
    // //  -- if project/dataset new or not found - add document with default metadata 
    // //  -- req params first time. {dataset: projectID, source: [File, TCGA, GEO, ...], name: user readable dataset name}
    // //insert collection metadata into lookup_datasources based on dataset name
    // //-- req params per collection.  {collection: collection name, name: user readable collection name, type: }
    // //-- optional defaults: {default:False, schema: hugo_sample}
    //     var lookup = yield comongo.db.collection(db, "lookup_oncoscape_datasources");    
    //     var ds = yield lookup.find({dataset: j.dataset}).toArray()
    //     if( ds.length  == 0){
    //         ds = [meta]
    //         ds[0].dataset = j.dataset
    //         ds[0].source = typeof j.source == "undefined" ? source : j.source
    //         ds[0].name =   j.dataset
    //     }
    //     schema = typeof j.schema == "undefined" ? "hugo_sample" : j.schema
    //     def_coll = typeof j.default == "undefined" ? false : j.default

        

    // //create/add to samplemap
    //     var samplemap = yield comongo.db.collection(db, j.dataset+"_samplemap");    
        
    //     var keyval = {};
        
    //     if(j.schema == "hugo_sample"){
    //         var collection = yield comongo.db.collection(db, j.dataset+"_molecular_matrix");   
    //         samples = yield collection.findOne({"name":j.name}, {"s":1})
    //         samples = samples.s

    //         if(j.source = "TCGA"){
    //             patients = samples.map(function(s){return s.replace(/\-\w{2}$/,"")})
    //         }
    //     }
    //     keyval = _.object(samples, patients)
    //     var res = yield samplemap.update({}, {$set: keyval}, {upsert: true, writeConcern: {w:"majority"}})
    //         // res = yield lookup.update({dataset: j.dataset}, {$set: keyval}, {upsert: true, writeConcern: {w:"majority"}})

    //     // insert into lookup collection
    //     var markers = yield collection.distinct("m", {"name":j.name})
    //     var new_collection = {name: j.name, type: j.type, schema:schema, default:def_coll, s:samples, m:markers}
    //     if(_.where(ds[0].collections, new_collection).length ==0)
    //         ds[0].collections.push(new_collection)
        
    //     var res = yield lookup.update({dataset: j.dataset}, ds[0], {upsert: true, writeConcern: {w:"majority"}})


    //create/add to patient reference collection
     
    //    var def_pt = {patient_ID:null, gender:null, status_vital:null, days_to_death:null,"days_to_last_follow_up":null};
        // var ptIDs = yield ptdashboard.distinct("patient_ID")

        // var new_ptIDs = _.difference(patients, ptIDs)
        // //var new_ptIDs = patients
        // for(var p=0;p<new_ptIDs.length;p++){
        //     var res = yield ptdashboard.update(
        //         {patient_ID: new_ptIDs[p]}, 
        //         {patient_ID:new_ptIDs[p], gender:null, status_vital:null, days_to_death:null, "days_to_last_follow_up": null}, 
        //         {upsert: true, writeConcern: {w:"majority"}})
        // }


        // add clinical data to phenotype wrapper
        if(j.schema == "clinical"){
            var collection = yield comongo.db.collection(db, j.dataset+"_phenotype");   
            var pheno_data = yield collection.find()
            samples = samples.s

            if(j.source = "TCGA"){
                patients = samples.map(function(s){return s.replace(/\-\w{2}$/,"")})
            }
        }

    } //end json_meta loop


yield comongo.db.close(db);
}).catch(onError);