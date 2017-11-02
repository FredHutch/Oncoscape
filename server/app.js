const { fork } = require('child_process');
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const nodemailer = require('nodemailer');
var multer = require('multer');
var bodyParser = require('body-parser');
const routes = require('./app.routes.js');
var File = require("./models/file");
db = require('./app.db.js');
var Permission = require("./models/permission");
const HugoGenes = require('./HugoGenes.json');

// Middleware
var app = express();
app.use(function (req, res, next) { //allow cross origin requests
    res.setHeader("Access-Control-Allow-Methods", "POST, PUT, OPTIONS, DELETE, GET");
    // res.header("Access-Control-Allow-Origin", "http://localhost:" + process.env.NODE_PORT + "/api");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
    res.header("Access-Control-Allow-Credentials", true);
    next();
});
app.use(cors({ origin: ['http://localhost:4200', 'http://localhost:8080'] }));
app.use(bodyParser.urlencoded({
    limit: '400mb',
    extended: true
}));
app.use(bodyParser.json({limit: '400mb'}));

// Routes
db.getConnection().then( db => {
    console.log("OK READY!");
    routes.init(app);
});

//#region Notify User with email when the file is uploaded and parsed into DB

var transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'oncoscape.sttrcancer@gmail.com',
        pass: process.env.GMAIL_PASSWORD
    }
});

//#endregion

//#region Uploaded File storage on the server

var storage = multer.diskStorage({
    destination: function (req, file, cb) {
        // cb(null, '/home/sttrweb/Oncoscape/uploads')
        cb(null, process.env.APP_ROOT + '/uploads')
    },
    filename: function (req, file, cb) {
        var newFileName = file.fieldname + '-' + Date.now() + '.xlsx';
        cb(null, newFileName);
    }
});
var upload = multer({
    storage: storage,
    preservePath: true
}).single('file');
//#endregion

//#region Data Upload Functions 
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

app.use('/api/upload', express.static(process.env.APP_ROOT + '/uploads'));
// app.use('/api/upload', express.static('/home/sttrweb/Oncoscape/uploads'));
app.post('/api/upload/:id/:email', Permissions.jwtVerification, upload, function (req, res, next) {
    // upload(req, res, function (err) {
    console.log("This section is triggered");
    var projectID = req.params.id;
    var userEmail = req.params.email;
    var mailOptions = {
        from: 'jennylouzhang@gmail.com',
        to: userEmail,
        subject: 'Notification from Oncoscape Data Uploading App',
        text: 'Data are in database, ready to share.'
      };
    var molecularColleciton = mongoose.model(projectID + "_data_molecular", File.schema);
    var sampleMapCollection = mongoose.model(projectID + "_data_samples", File.schema);
    var clinicalColleciton = mongoose.model(projectID + "_data_clinical", File.schema);
    var uploadingSummaryCollection = mongoose.model(projectID + "_uploadingSummary", File.schema);
    try {
        const writing2Mongo = fork(process.env.APP_ROOT + '/server/fileUpload.js',
        // const writing2Mongo = fork('/home/sttrweb/Oncoscape/server/fileUpload.js', 
        { execArgv: ['--max-old-space-size=4000']});
        writing2Mongo.send({ filePath: req.file.path, 
                             projectID: projectID
                          });
        writing2Mongo.on('message', () => {
            res.end('Writing is done');
            console.log("*******************!!!!!!********************");
            transporter.sendMail(mailOptions, function(error, info){
                if (error) {
                  console.log(error);
                } else {
                  console.log('Email sent: ' + info.response);
                }
              });
        });

        //#region Cluster Mode 
        // if (cluster.isMaster) {
        //     console.log("am I here?1");
        //     var projectID = req.params.id;
        //     var userEmail = req.params.email;
        //     var mailOptions = {
        //         from: 'oncoscape.sttrcancer@gmail.com',
        //         to: userEmail,
        //         subject: 'Notification from Oncoscape Data Uploading App',
        //         text: 'Data are in database, ready to share.'
        //       };
        //     var molecularColleciton = mongoose.model(projectID + "_data_molecular", File.schema);
        //     var sampleMapCollection = mongoose.model(projectID + "_data_samples", File.schema);
        //     var clinicalColleciton = mongoose.model(projectID + "_data_clinical", File.schema);
        //     var uploadingSummaryCollection = mongoose.model(projectID + "_uploadingSummary", File.schema);
            
        //     const worker = cluster.fork();
        //     // const worker = fork(process.env.APP_ROOT + '/server/fileUpload.js',
        //     // const worker = fork('/home/sttrweb/Oncoscape/server/fileUpload.js', 
        //     // { execArgv: ['--max-old-space-size=4000']});
        //     worker.send({ filePath: req.file.path, 
        //                   projectID: projectID
        //                 });
        //     console.log('we are here 1......');
        //     worker.on('message', () => {
        //         res.end('Writing is done');
        //         console.log("*******************!!!!!!********************");
        //         transporter.sendMail(mailOptions, function(error, info){
        //             if (error) {
        //                 console.log(error);
        //             } else {
        //                 console.log('Email sent: ' + info.response);
        //             }
        //             });
        //     });
        // } else {
        //     console.log("am I here? 2");
        //     process.on('message', (filePath, HugoGenes) => {
        //         // db.once("open", function (callback) {
        //             console.log('in WORKER CODE BLOCK, filePath: ', filePath);
        //             writingXLSX2Mongo(filePath, HugoGenes);
        //             process.send("DONE from child");
        //         // });
        //     });
        // }
        //#endregion
    } catch (err) {
        console.log(err);
        return;
    } 
    // });
    res.status(200).end();
});

//#endregion


// Start Listening
app.listen(process.env.NODE_PORT, function () {
    console.log("UP");
});
