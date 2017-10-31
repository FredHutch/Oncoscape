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
// mongoose.connect("mongodb://localhost:27017/mydb", option)
//         .then(function(){
//             console.log("Child Process MongoDB connect success!");
//         }, function (err){
//             console.log("Child Process  MongoDB connect error: ", err);
//         });
mongoose.connect(
    "mongodb://oncoscape-dev-db1.sttrcancer.io:27017,oncoscape-dev-db2.sttrcancer.io:27017,oncoscape-dev-db3.sttrcancer.io:27017/v2?authSource=admin",{
    // process.env.MONGO_CONNECTION, {  
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
    filePath = msg.filePath;
    projectID = msg.projectID;
    console.log('%%%%%%%%%received file');
    console.log('projectID is: ', msg);
    console.log('%%%%%%%%%XLSX.readFile(filePath): ', filePath);
    console.time("Reading XLSX file");
    var workbook = XLSX.readFile(filePath);
    console.timeEnd("Reading XLSX file");           
    var allSheetNames =  Object.keys(workbook.Sheets);
    console.log(allSheetNames);
    if (allSheetNames.indexOf("PATIENT") === -1) {
       err = "PATIENT Sheet is missing!";
       res.json({ error_code: 1, err_desc: err }).end(); 
       return;
    }
    var PatientIDs;
    var PatientArr = [];
    var UploadingSummary = [];
    var result = [];
    var sampleUnion = [];
    allSheetNames.forEach(function(sheet){
        var sheetObj = XLSX.utils.sheet_to_json(workbook.Sheets[sheet], {header:1});
        var arr = [];
        var header = sheetObj[0];
        if(sheet.split("-")[0] === "MOLECULAR"){
            var allSamples = header.splice(1, header.length);
            sheetObjData = sheetObj.splice(1, sheetObj.length);
            var dataType = sheet.split("-")[1];
            var allMarkers = sheetObjData.map(function(m){return m[0].trim()});
            UploadingSummary.push({ "sheet" : sheet,
                                    "samples" : allSamples,
                                    "markers" : allMarkers});
            var molecularCollectionName = projectID + '_data_molecular';
            var counter = 0; 
            console.time("Writing to MongoDB one record at a time");
            sheetObjData.forEach(function(record){
                var obj = {};
                obj.type = dataType;
                obj.marker = record[0];
                obj.data = record.splice(1, record.length);
                arr.push(obj);
            });
            db.collection(projectID+"_data_molecular").insertMany(arr, function(err, result){
                                    if (err) console.log(err);
                                });
            console.timeEnd("Writing to MongoDB one record at a time");
        } else { 
            sheetObjData = sheetObj.splice(1, sheetObjData.length);
            if(sheet === "PATIENT") {
                console.log("PATIENT sheet");
                Samples = _.uniq(sheetObjData.map(function(m){
                    return m[0];
                }));
                PatientIDs = _.uniq(sheetObjData.map(function(m){
                    return m[1];
                }));
                var enum_fields = [];
                var num_fields = [];
                var date_fields = [];
                var boolean_fields = [];
                var remaining_fields = [];
                header.forEach(function(h){
                    if(h.indexOf("-Date") > -1) {
                        date_fields.push(h.split("-")[0]);
                    } else if (h.indexOf("-String") > -1) {
                        enum_fields.push(h.split("-")[0]);
                    } else if (h.indexOf("-Number") > -1) {
                        num_fields.push(h.split("-")[0]);
                    } else if (h.indexOf("-Boolean") > -1) {
                        boolean_fields.push(h.split("-")[0]);
                    } else {
                        remaining_fields.push(h.split("-")[0]);
                    }
                });
                // Collect unique values of enums from the entire sheetObjData
                var metaObj = {};
                enum_fields.forEach(function(field){
                    metaObj[camelToDash(field)] = _.uniq(sheetObjData.map(function(record){
                                                            return record[header.indexOf(field +"-String")];}));                                        
                                                        });
    
                PatientArr = PatientIDs.reduce(function(arr_clinical, p){
                    var samples = [];
                    var enumObj = {};
                    var numObj = {};
                    var booleanObj = {};
                    var timeObj = {};
                    var Other = {};
                    sheetObjData.filter(function(record){
                        return record[1] === p;
                    }).forEach(function(m){
                       samples.push({id: m[0]});
                       enum_fields.forEach(function(field){
                        enumObj[camelToDash(field)] = m[header.indexOf(field+"-String")]; 
                       }); 
                       num_fields.forEach(function(field){
                        numObj[camelToDash(field)] = m[header.indexOf(field+"-Number")];
                       });
                       boolean_fields.forEach(function(field){
                        booleanObj[camelToDash(field)] = m[header.indexOf(field+"-Boolean")];
                       });
                       date_fields.forEach(function(field){
                        timeObj[camelToDash(field)] = m[header.indexOf(field+"-Date")];
                       });
                       remaining_fields.forEach(function(field){
                        Other[camelToDash(field)] = m[header.indexOf(field)];
                       });
                    });                               
                    arr_clinical.push({ "id" : p,
                                        "samples" : samples,
                                        "enums" : enumObj,
                                        "time": timeObj,
                                        "nums": numObj,
                                        "boolean": booleanObj,
                                        "metadata": metaObj,
                                        "events": [] });
                    return arr_clinical;
                    }, []);
                    UploadingSummary.push({"sheet" : sheet,
                                           "patients" : PatientIDs,
                                           "samples": Samples});
            } else if (sheet.split("-")[0] === "PATIENTEVENT"){
                console.log(sheet);
                var id = sheet.split("-")[1];
                var allPatients = _.uniq(sheetObjData.map(function(r){return r[0];}));
                UploadingSummary.push({"sheet" : sheet,
                                       "patients" : allPatients});
                sheetObjData.forEach(function(record){
                    var pos = _.findIndex(PatientArr, function(a){
                        return a.id === record[0];
                    })
                    var o = {};
                    o.id = id;
                    header.forEach(function(h){
                        o[h] = record[header.indexOf(h)];
                    });
                    if( pos > -1){
                        PatientArr[pos].events.push(o);
                    } else {
                        PatientArr.push({
                            "id": record[0],
                            "events":[o]
                        });
                    }
                });
            }
        }
    });
    db.collection(projectID+"_data_clinical").insertMany(PatientArr, function(err, result){
                                    if (err) console.log(err);
                                });
    
    /* Quality Control */
    var allSampleIDs = [];
    var allPatientIDs = [];
    var sampleMapping = [];
    
    asyncLoop(UploadingSummary, function(sum, next){ 
            if('markers' in sum){
                sum.geneSymbolValidation = checkHugoGeneSymbols(sum.markers);
                allSampleIDs = _.uniq(allSampleIDs.concat(sum.samples));
            } else if ('patients' in sum){
                allPatientIDs = _.uniq(allPatientIDs.concat(sum.patients));
            }
            next();
        } , function(err){
            if(err){
                console.log(err);
                res.status(404).send(err).end();
            } else {
                sampleMapping.push({'sample': allSampleIDs});
                UploadingSummary.filter(function(m){
                    return 'markers' in m;
                }).map(function(n){
                  n.positions = n.samples.map(function(d){
                              return allSampleIDs.indexOf(d);
                            });
                  sampleMapping.push(_.pick(n, ['sheet', 'samples', 'positions']));
                  return n;
                });
                var map = _.omit(UploadingSummary.filter(function(m){return m.sheet == 'PATIENT';})[0] ,['_id','sheet']);
                UploadingSummary.push(map);
                sampleMapping.push(map)
                console.log('*********************()****************');
                db.collection(projectID+"_uploadingSummary").insertMany(UploadingSummary, function(err, result){
                    if (err) console.log(err);
                });
                db.collection(projectID+"_data_samples").insertMany(sampleMapping, function(err, result){
                    if (err) console.log(err);
                });
            }
        });  
}

process.on('message', (filePath, HugoGenes, db) => {
    // db.once("open", function (callback) {
        writingXLSX2Mongo(filePath, HugoGenes, db);
        process.send("DONE from child");
    // });
});

