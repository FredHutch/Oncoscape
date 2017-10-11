const express = require('express');
const { fork } = require('child_process');
const cors = require('cors');
const mongoose = require('mongoose');
const nodemailer = require('nodemailer');
var multer = require('multer');
var bodyParser = require('body-parser');
const routes = require('./app.routes.js');

// Middleware
var app = express();
app.use(bodyParser.urlencoded({ limit: '400mb', extended: true }));
app.use(cors({ origin: ['http://localhost:4200', 'http://localhost:8080', 'http://localhost:8080'] }));
app.use(function (req, res, next) { //allow cross origin requests
    res.setHeader("Access-Control-Allow-Methods", "POST, PUT, OPTIONS, DELETE, GET");
    res.header("Access-Control-Allow-Origin", "http://localhost:" + process.env.NODE_PORT + "/");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
    res.header("Access-Control-Allow-Credentials", true);
    next();
});

// Routes
db.getConnection().then( db => {
    console.log("OK READY");
    routes.init(app);
});



var transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'jennylouzhang@gmail.com',
        pass: process.env.GMAIL_PASSWORD
    }
});

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

// -------------------------------- //
// ----- Data Upload Functions ---- //
// -------------------------------- // 
app.use('/api/upload', express.static(process.env.APP_ROOT + '/uploads'));
app.post('/api/upload/:id/:email', function (req, res) {
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
    upload(req, res, function (err) {
        console.log("This section is triggered");
        if (err) {
            console.log(err);
            return;
        } else {
            const writing2Mongo = fork(process.env.APP_ROOT + '/server/fileUpload.js',
                { execArgv: ['--max-old-space-size=1000'] });
            writing2Mongo.send({
                filePath: res.req.file.path,
                projectID: projectID
            });
            writing2Mongo.on('message', () => {
                res.end('Writing is done');
                console.log("*********************!!!!!!!********************");
                transporter.sendMail(mailOptions, function (error, info) {
                    if (error) {
                        console.log(error);
                    } else {
                        console.log('Email sent: ' + info.response);
                    }
                });
            });
        }
    });
    res.status(200).end();
});



// Start Listening
//process.env.NODE_PORT
app.listen(11000, function () {
    console.log("UP");
});
