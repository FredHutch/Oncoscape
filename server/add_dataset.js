const { fork } = require('child_process');
const jsonfile = require("jsonfile");
const mongoose = require('mongoose');
var _ = require('underscore')
var onError = function(e){ console.log(e); }

var option = {
    server: {
        socketOptions: {
            keepAlive: 30000000,
            connectTimeoutMS: 3000000
        }
    }
}
console.log("Loaded script to add v2 data")

mongoose.connect(
    process.env.MONGO_CONNECTION, {  
    db: {
        native_parser: true
    },
    server: {
        poolSize: 5,
        reconnectTries: Number.MAX_VALUE
    },
    replset: {
        rs_name: 'rs0'
    },
    user: process.env.MONGO_USERNAME,
    pass: process.env.MONGO_PASSWORD
}).then(function(){
    console.log("Child Process MongoDB connect success!");
}, function (err){
    console.log("Child Process  MongoDB connect error: ", err);
});

const db = mongoose.connection;


const InsertAllJson= (msg) => {
  
        filePath = msg.filePath;
        projectID = msg.projectID;
        console.log('%%%%%%%%%received file');
        console.log('projectID is: ', msg);
        console.time("Adding additional v2 data");

        function getProjectCollections(projectID){
            console.log("get Project Collections: "+ projectID + "_collections" )
            
            db.collection(projectID + "_collections").find({}, function(err,sheetList){
                    if (err || !sheetList.length){
                        console.log('there was a problem');
                        console.log(err)
                        
                    }else{

                        var json_meta = []
                        for (i=0;i<sheetList.length;i++){
                            var name = sheetList[i].name
                            var type = name.split("-",1)
                            var subtype = name.split("-",2)[1]
                            if(type == "molecular")
                                json_meta.push({dataset: projectID, 
                                                name:    name.replace('^\w+\-\w+\-/', ""),
                                                type:    subtype, 
                                                schema:  "hugo_sample"})
                            else if(type == "clinical")
                                json_meta.push({dataset: projectID, 
                                                name: "mol subtype",
                                                type:subtype, 
                                                "req":{"patient_id":"patient_ID","days_to_death":"days_to_death","days_to_last_followup":"days_to_last_follow_up","status_vital":"status_vital"}, 
                                                schema: "clinical"})
                        }
                        for(i=0; i<json_meta.length;i++){
                            add_lookup(json_meta[i])
                            // if(json_meta[i].schema == "hugo_sample")
                            //     add_json_molecular(json_meta[i])
                            if(json_meta[i].schema == "clinical")
                                add_json_clinical(json_meta[i])
                        }
                    }
                })
        }

        // add new collection to lookup table for each JSON object
        // skip if collection not yet written
        function add_lookup(){

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
            var ds = db.collection(db, "lookup_oncoscape_datasources_v2").find({dataset: j.dataset}).toArray()
            if( ds.length  == 0){
            ds = [meta]
            ds[0].dataset = j.dataset
            ds[0].source = typeof j.source == "undefined" ? source : j.source
            ds[0].name =   j.dataset
            db.collection(db, "lookup_oncoscape_datasources_v2").update({dataset: j.dataset}, ds[0], {upsert: true, writeConcern: {w:"majority"}})
            }
            schema = typeof j.schema == "undefined" ? "hugo_sample" : j.schema
            if(j.name.match(/protein/)){schema = "prot_sample"}
            isdefault = typeof j.default == "undefined" ? false : j.default

        }

        function add_json_molecular(j){
            console.log("molecular: "+j.dataset +" "+j.collection)
            
            count = db.collection(db, j.collection).count({})
            
            if(count == 0){
                console.log("---not yet stored")
                return;
            }

        
            // insert new collection into lookup collection
            var markers = db.collection(db, j.collection).distinct("m")
            var new_collection = {
                name: j.name, 
                type: j.type, 
                schema:schema, 
                collection: j.collection, 
                default:isdefault, 
                s:samples, 
                m:markers,
                date_modified: new Date()
            }
            //add collection metadata to lookup if DNE 
            // if(_.where(ds[0].collections,(({ name, type, schema,  }) => ({ name, type, schema }))(new_collection)).length ==0){
            //     console.log("lookup adding dataset: ", j.collection)
            //     ds[0].collections.push(new_collection)
            //     var res = yield lookup.update({dataset: j.dataset}, ds[0], {upsert: true, writeConcern: {w:"majority"}})
            // }
            //add collection metadata to dataset_collections if DNE 
            var count = db.collection(db, j.dataset+"_collections").count({name:j.name, type:j.type, schema:schema})
            if(count==0)
                var insert_status = db.collection(db, j.dataset+"_collections").insert(new_collection, {writeConcern: {w:"majority"}})
        }
        
        function add_json_clinical(j){
            // add clinical data to phenotype wrapper
        
            console.log(j.dataset)
            var pheno_data = db.collection(db, j.dataset+"_phenotype").find().toArray()
        
            var wrapper_collection = db.collection(db, "phenotype_wrapper");  
            var req = typeof j.req == "undefined" ?  "null" : j.req
            var pheno_wrapper = {dataset: j.dataset, req:req, enums:[],time:[], nums:[], boolean:[], events: [], strings: [] }

            var res = wrapper_collection.update(
                {dataset: j.dataset}, 
                {$set: pheno_wrapper}, 
                {upsert: true, writeConcern: {w:"majority"}})
        }
        getProjectCollections(projectID)
    }

process.on('message', (filePath, db) => {
     
        console.log("v2 add data message triggered")
        InsertAllJson(filePath, db);
        process.send("DONE from child");
    
});

