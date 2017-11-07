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

const json_meta = require("./tool_requirements.json")      

const add2Lookup= (msg) => {
        
        var projectID = msg.projectID;
        console.log('%%%%%%%%%received file');
        console.log('projectID is: ', projectID);
        console.time("Adding additional v2 data");

        function getProjectCollections(projectID){
            console.log("get Project Collections: "+ projectID + "_collections" )
            
            db.collection(projectID + "_collections").find({},{s:0,m:0}, function(err,collections){
                    if (err){ console.log('there was a problem: ', err); return }
                    
                    

                    db.collection(projectID +"_phenotype").find({}, function(error, phenotype){
                        var tools = get_tools(collections, phenotype)
                        add_lookup(tools)
                    })
                })
        }

        // add new collection to lookup table for each JSON object
        // skip if collection not yet written
        function add_lookup(tools){

            var meta = {    "dataset" : projectID,
                            "source" : "File",
                            "beta" : false,
                            "name" : "",
                            "img" : "thumb.png",
                            "tools" : tools,
                            "geneset" : "Oncoplex"
            }

        
            db.collection("lookup_oncoscape_datasources_v2").update({dataset: projectID}, meta, {upsert: true, writeConcern: {w:"majority"}})
        
        }     
        function get_tools(collections, phenotype){
            console.log(phenotype)
            var tools = []
            for(i=0; i<json_meta.length;i++){
                var t =json_meta[i]
                var pass = true
                var mol_subset = collections
                var clin_subset = phenotype
                    
                for(r=0;r<t.and.length & pass;r++){  // loop through all requirements for tool
                    if(t.and[r].type == "molecular"){
                        if(t.and[r].logic== "in")
                            mol_subset = mol_subset.filter(function(c){ return _.contains(t.and[r].value,c[t.and[r].field])})
                        else if(t.and[r].logic== "is")
                            mol_subset = mol_subset.filter(function(c){ return c[t.and[r].field] == t.and[r].value })
                        if(mol_subset.length ==0){ pass = false}
                    }
                    else if(pass & t.and[r].type =="clinical"){
                        console.log(t.and[r].value, t.and[r].field)
                        if(t.and[r].logic== "in")
                            clin_subset = clin_subset.filter(function(d){ 
                                console.log(d)
                                console.log(d[t.and[r].field])
                                return _.contains(t.and[r].value, d[t.and[r].field] ) })
                        else if(t.and[r].logic== "is")
                            clin_subset = clin_subset.filter(function(d){ return d[t.and[r].field] == t.and[r].value })
                        else if(t.and[r].logic== "matches")
                            clin_subset = clin_subset.filter(function(d){ 
                                return d[t.and[r].field] ? 
                                d[t.and[r].field].toString().match(t.and[r].value ).length >0 : 
                                false})    
                        if(clin_subset.length == 0) pass = false
                    }

                }
                if(pass){                           tools = _.union(tools, [t.name])}
                else if(_.contains(tools, t.name)){ tools = _.without(tools, t.name); }
            }

            return tools
        } 
        
        getProjectCollections(projectID)
    }

process.on('message', (msg) => {
     
        console.log("v2 add data message triggered")
  //      add2Lookup(msg);
        process.send("DONE adding to lookup table");
    
});

