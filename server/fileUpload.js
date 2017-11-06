const express = require('express');
const { fork } = require('child_process');
const jsonfile = require("jsonfile");
const _ = require("underscore");
const asyncLoop = require('node-async-loop');
const XLSX =require("xlsx");
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
//    "mongodb://oncoscape-dev-db1.sttrcancer.io:27017,oncoscape-dev-db2.sttrcancer.io:27017,oncoscape-dev-db3.sttrcancer.io:27017/v2?authSource=admin",{
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

const HugoGenes = require('../HugoGenes.json');

var checkHugoGeneSymbols = function (geneArr) {
    var overLappedNames = _.intersection(geneArr, HugoGenes);
    var unvalidGeneNames = _.difference(geneArr, overLappedNames);
    return {
        validNameNumber: overLappedNames.length,
        unvalidNamesArr: unvalidGeneNames
    }
};
function camelToDash(str) {
    return str.replace(/\W+/g, '-')
              .replace(/([a-z\d])([A-Z])/g, '$1-$2')
              .replace("-", "_")
              .toLowerCase();
}

const writingXLSX2Mongo = (msg) => {
    
    console.log('%%%%%%%%%received file');
    console.log('projectID is: ', msg);
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
            sheet.data.forEach(function(record){
                records.push({
                    m: record[0], 
                    m_type: "hugo", 
                    d:record.splice(1, record.length), 
                    d_type: collection.type, 
                    name: collection.name,
                    s: collection.s})
            });
            
            db.collection(collection.collection).insertMany(records, function(err, result){
                if (err) console.log(err)
            });                    
            collections.push(collection);
            console.timeEnd("Insert Molecular records");

        } else if(sheet.type === "PATIENT") {
            var collection = {
                name: sheetname, 
                type: sheet.type.toLowerCase(), 
                collection: projectID + "_phenotype", 
                s : _.uniq(sheet.data.map(function(m){return m[0];})),
                "date_modified": new Date(),
                schema : "patient"
            }
            
            records = collection.s.map(function(id){
                console.log("adding patient: " + id)
                return sheet.data.filter(function(record){ return record[0] === id;
                }).reduce(function(fields,r){

                    sheet.header.forEach(function(h,i){
                        var field = h.split("-")[0];
                        var type = h.split("-")[1];
                        
                        if(type == "Date") {
                            fields.date[camelToDash(field)] = r[i];
                        } else if (type == "String") {
                            fields.enum[camelToDash(field)] = r[i]
                        } else if (type == "Number")  {
                            fields.num[camelToDash(field)] = r[i]
                        } else if (type == "Boolean")  {
                            fields.boolean[camelToDash(field)] = r[i]
                        } else { fields.other[camelToDash(field)] = r[i]}
                    });

                    return fields;
                }, {id: id, enum : {}, num : {}, date : {}, boolean : {}, other : {} } );                               
                
            });   
            
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
                name: sheetname.replace(/^\w+\-/,""), 
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
                    }, {})
                )
                
                var i = _.findIndex(arr,{id:record[0]})
                if(i == -1) arr.push(p[0])
                else arr[i] = p[0]
                
                return arr
            }, [] );

            records.forEach(function(r){
                console.log(r)
                db.collection(projectID+"_phenotype").update({id: r.id}, {$addToSet: {events: r}}, function(err, result){
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
}

process.on('message', (filePath, HugoGenes, db) => {
    // db.once("open", function (callback) {
        writingXLSX2Mongo(filePath, HugoGenes, db);
        process.send("DONE from child");
    // });
});

