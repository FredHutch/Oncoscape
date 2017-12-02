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

// Middleware
var app = express();
app.use(function (req, res, next) { //allow cross origin requests
    res.setHeader("Access-Control-Allow-Methods", "POST, PUT, OPTIONS, DELETE, GET");
    //res.header("Access-Control-Allow-Origin", "http://localhost:"+process.env.NODE_PORT + "/api")
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

app.use('/api/upload', express.static(process.env.APP_ROOT + '/uploads'));

app.post('/api/upload/:id/:email', Permissions.jwtVerification, upload, function (req, res, next) {
    // upload(req, res, function (err) {
    console.log("Uploading by ID and Email");
    var projectID = req.params.id;
    var userEmail = req.params.email;

    // Security
    if (!req.isAuthenticated) {
        console.log('!@! NOT AUTH');
        res.status(404).send('Not Authenticated!');
    } else {
        console.log('FILE SECURITY>>>>>>>>>>>>>>>>>>>>>>>');
        var permitted = function(){
            if(req.permissions.length > 0){
                var role = req.permissions.find(v => v.ProjectID == projectID).Role;
                if (Role == 'admin' || Role == 'read-write'){
                    return true;
                } else {
                    return false;
                }
            } else {
                return false;
            }
        }

        if (!permitted) {
            res.status(404).send('The Current User does not have priviledge to upload file to this project. Please contact the Author of this Dataset.');
        } else {
            console.log('ABLE TO POST FILES');
            var mailOptions = {
                from: 'oncoscape.sttrcancer@gmail.com',
                to: userEmail,
                subject: 'Notification from Oncoscape Data Uploading App',
                text: 'Data are in database, ready to share.'
              };
            try {
                const writing2Mongo = 
                    fork(process.env.APP_ROOT + '/server/fileUpload.js',
                        { execArgv: ['--max-old-space-size=4000']});
                writing2Mongo.send({ filePath: req.file.path, 
                                     projectID: projectID
                                  });
                writing2Mongo.on('message', (collections) => {
                    console.log('XLS file upload complete; Updating Kong');
                    const kong_configure = fork(process.env.APP_ROOT + '/server/kong_configure.js');
                    kong_configure.send({
                        projectID: projectID,
                        collections: collections
                    })
                    kong_configure.on('message', () => {
                        console.log("Kong configuration complete")
                        res.end("Writing is done")
                        console.log("*********************")

                        })

                    transporter.sendMail(mailOptions, function(error, info){
                        if (error) {
                          console.log(error);
                        } else {
                          console.log('Email sent: ' + info.response);
                        }
                      });
                });
            } catch (err) {
                console.log(err);
                return;
            } 
            // });
            res.status(200).end();
        }    
    }
    // End of Security


    
});

//#endregion


// Start Listening
app.listen(process.env.NODE_PORT, function () {
    console.log("UP");
});
