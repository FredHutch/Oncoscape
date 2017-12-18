const express = require('express');
const jsonfile = require("jsonfile");
const _ = require("underscore");
const asyncLoop = require('node-async-loop');
const XLSX =require("xlsx");
const HugoGenes = require('./HugoGenes.json');
const mongoose = require('mongoose');
var option = {
    server: {
        socketOptions: {
            keepAlive: 30000000,
            connectTimeoutMS: 3000000
        }
    }
}
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
    console.log("Child Process File Upload connect success!");
}, function (err){
    console.log("Child Process File Upload connect error: ", err);
});
const db = mongoose.connection;

const tool_req = require("./tool_requirements.json")      

var errorMessage = {};
errorMessage['PATIENT_SHEET'] = '';
errorMessage['PATIENTEVENT_SHEETS'] = {};
errorMessage['MOLECULAR_SHEETS'] = {};
var checkHugoGeneSymbols = (geneArr) => {
    var overLappedNames = _.intersection(geneArr, HugoGenes);
    var unvalidGeneNames = _.difference(geneArr, overLappedNames);
    return {
        validNameNumber: overLappedNames.length,
        unvalidNamesArr: unvalidGeneNames
    }
};
var camelToDash = (str) => {
    return str.replace(/\W+/g, '-')
              .replace(/([a-z\d])([A-Z])/g, '$1-$2')
              .replace("-", "_")
              .toLowerCase();

 };


const writingXLSX2Mongo = (msg) => {
    
    console.log('%%%%%%%%%received file');
    console.log('projectID is: ', msg);
    console.log('%%%%%%%%%XLSX.readFile');
    console.time("Reading XLSX file");

    var filePath = msg.filePath;
    var projectID = msg.projectID;
    var workbook = XLSX.readFile(filePath);

    var allSheetNames =  Object.keys(workbook.Sheets);
    console.log('%%%%%%%%% XLSX.readFile(filePath): ', filePath);
    console.timeEnd("Reading XLSX file");           
    console.log(allSheetNames);


    if (allSheetNames.indexOf("PATIENT") === -1) {
       err = "PATIENT Sheet is missing!";
       res.json({ error_code: 1, err_desc: err }).end(); 
       return;
    }
    
    var collections = [];
    var phenotype = []

    function add2Lookup(projectID){
        var tools = get_tools(collections, phenotype)
        add_lookup(tools)
    }
    // add new collection to lookup table for each JSON object
    // skip if collection not yet written
    function add_lookup(tools){
        console.log(tools)
        var meta = {    "dataset" : projectID,
                        "source" : "File",
                        "beta" : false,
                        "name" : "",
                        "img" : "Thumb.png",
                        "tools" : tools,
                        "geneset" : "Oncoplex"

        }

    
        db.collection("lookup_oncoscape_datasources_v2").update({dataset: projectID}, meta, {upsert: true, writeConcern: {w:"majority"}})
    
    }     
    
    function getPropByString(obj, propString) {
        if (!propString)
            return obj;
    
        var prop, props = propString.split('.');
    
        for (var i = 0, iLen = props.length - 1; i < iLen; i++) {
            prop = props[i];
    
            var candidate = obj[prop];
            if (candidate !== undefined) {
                obj = candidate;
            } else {
                break;
            }
        }
        return obj[props[i]];
    }

    function get_tools(collections, phenotype){
        
        var tools = []
        for(i=0; i<tool_req.length;i++){
            var t =tool_req[i]
            var pass = true
            var mol_subset = collections
            var clin_subset = phenotype
                
            for(r=0;r<t.and.length & pass;r++){  // loop through all requirements for tool
                if(t.and[r].type == "molecular"){
                    if(t.and[r].logic== "in")
                        mol_subset = mol_subset.filter(function(c){ return _.contains(t.and[r].value,getPropByString(c,t.and[r].field))})
                    else if(t.and[r].logic== "is")
                        mol_subset = mol_subset.filter(function(c){ return getPropByString(c,t.and[r].field) == t.and[r].value })
                    if(mol_subset.length ==0){ pass = false}
                }
                else if(pass & t.and[r].type =="clinical"){
                    
                    if(t.and[r].logic== "in")
                        clin_subset = clin_subset.filter(function(d){ 
                            return _.contains(t.and[r].value, getPropByString(d,t.and[r].field) ) })
                    else if(t.and[r].logic== "is")
                        clin_subset = clin_subset.filter(function(d){ return getPropByString(d,t.and[r].field) == t.and[r].value })
                    else if(t.and[r].logic== "matches")
                        clin_subset = clin_subset.filter(function(d){ 
                            var val = getPropByString(d,t.and[r].field)
                            return val ? 
                            val.toString().match(t.and[r].value ).length >0 : 
                            false})    
                    if(clin_subset.length == 0) pass = false
                } else{ pass=false}

            }
            if(pass){                           tools = _.union(tools, [t.name])}
            else if(_.contains(tools, t.name)){ tools = _.without(tools, t.name); }
        }

        return tools
    } 

    allSheetNames.forEach(function(sheetname){
        
        console.log(sheetname)

        // sheet/collection data
        var data = XLSX.utils.sheet_to_json(workbook.Sheets[sheetname], {header:1})
        var sheet = {
            type : sheetname.split("-")[0]
        }     
        sheet.header = data[0]
        sheet.data = data.splice(1, data.length)

        var records = []

        if(sheet.type === "MOLECULAR"){
            var collection = {
                name: sheetname.replace(/^\w+\-\w+\-/,""), 
                type: sheetname.split("-")[1].toLowerCase(), 
                collection: projectID + sheetname.replace(/^\w+\-/,"_"), 
                s : sheet.header.splice(1, sheet.header.length),
                m : sheet.data.map(function(m){return m[0].trim()}),
                "date_modified": new Date(),
                schema : "hugo_sample"
            }
            collection.geneSymbolValidation = checkHugoGeneSymbols(collection.m);

            console.time("Insert Molecular records");
            console.log("inserting molecular data")
            sheet.data.forEach(function(record){
                var data = record.splice(1, record.length)
                if(_.contains(["prot_expr", "expr", "cnv","cnv_thd", "mut01"], collection.type))
                    data = data.map(function(d){ return parseFloat(d)})
                records.push({
                    m: record[0], 
                    m_type: "hugo", 
                    d: data, 
                    d_type: collection.type, 
                    name: collection.name,
                    s: collection.s})
            });
            
            db.collection(collection.collection).insertMany(records, function(err, result){
                if (err) console.log(err)
            });                    
            collections.push(collection);
            console.timeEnd("Insert Molecular records");

        } else if (sheet.type == "SAMPLE") {
            
            var samplemap = {}
            sheet.data.forEach(function(r){
                samplemap[r[0]] = r[1]
            })
            db.collection(projectID+"_samplemap").insert(samplemap, function(err, result){
                if (err) console.log(err);
            });
            collections.push({
                name: "samplemap", 
                type: "map", 
                collection: projectID + "_samplemap", 
                "date_modified": new Date(),
                schema : "map"
            })

            if(sheet.header.length > 2){
                var collection = {
                    name: sheetname.toLowerCase(), 
                    type: sheet.type.toLowerCase(), 
                    collection: projectID + "_phenotype", 
                    s : _.uniq(sheet.data.map(function(m){return m[0];})),
                    "date_modified": new Date(),
                    schema : "subject"
                }
                records = collection.s.map(function(id){
                    
                    return sheet.data.filter(function(record){ return record[0] === id;
                    }).reduce(function(fields,r){

                        //fields.patient = r[1]

                        sheet.header.forEach(function(h,i){
                            if(i<2) return //skip sample and patient id
                            
                            var field = h.split("-")[0];
                            var type = h.split("-")[1];
                            if(type) type = type.toLowerCase()

                            if(type == "date") {
                                fields.date[camelToDash(field)] = r[i];
                            } else if (type == "string") {
                                fields.enum[camelToDash(field)] = r[i]
                            } else if (type == "number")  {
                                fields.num[camelToDash(field)] = r[i]
                            } else if (type == "boolean")  {
                                fields.boolean[camelToDash(field)] = r[i]
                            } else { fields.other[camelToDash(field)] = r[i]}
                        });

                        return fields;
                    }, {id: id, type:"sample", enum : {}, num : {}, date : {}, boolean : {}, other : {} } );                               
                    
                });   
                db.collection(projectID+"_phenotype").insertMany(records, function(err, result){
                    if (err) console.log(err);
                });
                collections.push(collection);
            }

        } else if(sheet.type === "PATIENT") {
            var collection = {
                name: sheetname.toLowerCase(), 
                type: sheet.type.toLowerCase(), 
                collection: projectID + "_phenotype", 
                s : _.uniq(sheet.data.map(function(m){return m[0];})),
                "date_modified": new Date(),
                schema : "subject"
            }
            
            records = collection.s.map(function(id){
                
                return sheet.data.filter(function(record){ return record[0] === id;
                }).reduce(function(fields,r){

                    sheet.header.forEach(function(h,i){
                        if(i<1)return
                        var field = h.split("-")[0];
                        var type = h.split("-")[1]
                        if(type) type = type.toLowerCase();
                        
                        if(type == "date") {
                            fields.date[camelToDash(field)] = r[i];
                        } else if (type == "string") {
                            fields.enum[camelToDash(field)] = r[i]
                        } else if (type == "number")  {
                            fields.num[camelToDash(field)] = r[i]
                        } else if (type == "boolean")  {
                            fields.boolean[camelToDash(field)] = r[i]
                        } else { fields.other[camelToDash(field)] = r[i]}
                    });

                    return fields;
                }, {id: id,type:"patient", enum : {}, num : {}, date : {}, boolean : {}, other : {} } );                               
                
            });   
            
            phenotype = records
            // Collect unique values of enums from the entire sheetObjData
            collection.enum =
                records.reduce(function(p,c){
                    Object.keys(c.enum).map(function(f){
                        if(!p.hasOwnProperty(f)) p[f] = [c.enum[f]]
                        else if (!_.contains(p[f], c.enum[f])) p[f].push(c.enum[f])
                    })
                    return p                                       
                }, {});

            db.collection(projectID+"_phenotype").insertMany(records, function(err, result){
                if (err) console.log(err);
            });
            collections.push(collection);

        } else if (sheet.type === "PATIENTEVENT"){
            
            var collection = {
                name: sheetname.replace(/^\w+\-/,"").toLowerCase(), 
                type: sheet.type.toLowerCase(), 
                collection: projectID + "_phenotype", 
                s : _.uniq(sheet.data.map(function(m){return m[0];})),
                "date_modified": new Date(),
                schema : "events"
            }
        

            records = sheet.data.reduce(function(arr, record){
                var p = arr.filter(function(r){ return r.id == record[0]})
                if(p.length == 0) p = [{id:record[0], events: []}]
                
                p[0].events.push( 
                    sheet.header.reduce(function(r, h, i){
                        var field = h.split("-")[0]
                        r[field] =record[i]
                        return r
                    }, {type: collection.name})
                )
                
                var i = _.findIndex(arr,{id:record[0]})
                if(i == -1) arr.push(p[0])
                else arr[i] = p[0]
                
                return arr
            }, [] );

            records.forEach(function(r){
                db.collection(projectID+"_phenotype").update({id: r.id, type:"patient"}, {$addToSet: {events:  {$each:r.events}}}, function(err, result){
                    if (err) console.log(err);
                });

            })
            collections.push(collection)
        }
        
    });
    
    console.log('*********************()****************');
    db.collection(projectID+"_collections").insertMany(collections, function(err, result){
        if (err) console.log(err);
    });
    

    add2Lookup(projectID);
    return _.uniq(collections.map(function(d){return d.collection}))
            .concat(projectID+"_collections");
}

process.on('message', (filePath, HugoGenes, db) => {
    
        var collections = writingXLSX2Mongo(filePath, HugoGenes, db);
        process.send(collections);
    

});

