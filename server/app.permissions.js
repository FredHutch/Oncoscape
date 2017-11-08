const mongoose = require('mongoose');
const query = require('./app.query.js');
const jwt = require('jsonwebtoken');
const _ = require("underscore");
const JWT_KEY = 'asdfadfasdfasdf';
var User = require("./models/user");
var Project = require("./models/project");
var File = require("./models/file");
var IRB = require("./models/irb");
var Permission = require("./models/permission");

const publicProjects = ["accounts", "gbm", "acc", "blca", "brain", "brca", "cesc", "chol", "coad", "coadread", "dlbc", "esca", "hg19", "hnsc", "kich", "kirc", "kirp", "laml", "lgg", "lihc", "lookup", "luad", "lung", "lusc", "meso", "ov", "paad", "pancan12", "pancan", "pcpg", "phenotype", "prad", "read", "sarc", "skcm", "stad", "tcganatgengbm", "tgct", "thca", "thym", "ucec", "ucs", "uvm"];

const ePermission = { 'ADMIN': 1, 'WRITE': 2, 'READ': 4 };

var hasPermission = function (projectsJson, collection, permission) {

    return new Promise((resolve, reject) => {

        var validProjects = projectsJson
            .map(function (project) { return project._id.toLowerCase().trim() })
            .concat(publicCollections);

        // If Only Read Permission + Public Projects
        if (permission === EPermissions.READ) validProjects.concat(publicProjects);

        // Convert Collection To Project Name
        var projectName = collection.split("_")[0].toLowerCase().trim();

        // Has Permission
        var isOk = (validProjects.indexOf(projectName) !== -1);

        resolve(isOk);

    });
}

var jwtVerification = function (req, res, next) {
    if (req && req.headers.hasOwnProperty("authorization")) {
        try {
            var userID = req.headers.authorization.replace('Bearer ', '');
            getUserID(userID).then(res => {
                req.userID = res;
                req.isAuthenticated = true;
                console.log('passed jwtVerification');
                next();
            });
        } catch (e) {
            req.isAuthenticated = false;
            res.send(e);
        }
    }
};

var getUserID = function (token) {
    return new Promise((resolve, reject) => {
        jwt.verify(token, JWT_KEY, function(err, token){
            if(err){
                console.log(err);
                reject(err);
            }else{
                resolve(token);
            }
        });
    })
}

var getGoogleEmail = function (googleAccessToken) {
    return new Promise((resolve, reject) => {
        request({ url: 'https://www.googleapis.com/oauth2/v3/userinfo', qs: { access_token: googleAccessToken }, method: 'POST', json: true }, (err, response, body) => {
            var gmailAddress = body.email;
            resolve(gmailAddress);
        });
    });
}

var getToken = function (db, gmail) {
    return new Promise((resolve, reject) => {
        User.findOne({'Gmail': gmail}, function (req, res){
            var userId = res._id;
            var userJwt = jwt.sign(JSON.stringify(userId), JWT_KEY);
            resolve(userJwt);
            // Permission.find({ 'User': userId }, function(req, res) {
            //     var permissions = res;
            //     var projectIDs = permissions.map(function (p) {
            //             return mongoose.Types.ObjectId(p.Project);
            //         });
            //     Project.find({ '_id': { $in: projectIDs } }, function(req, res){
            //         var userProjectsJson = permissions.map(function (m) {
            //                         var proj = res.filter(function (p) {
            //                             return p.Project = m.Project;
            //                         })[0];
            //                         var result = {};
            //                         result['Permission'] = m;
            //                         result['Project'] = proj;
            //                         return result;
            //                     });
            //         var userProjectsString = JSON.stringify(userProjectsJson);
            //         var userProjectsJwt = jwt.sign(userProjectsString, JWT_KEY);
            //         resolve(userProjectsJwt);
            //      });
            // });
        });
    });
}

var getUserbyGmail = function (gmailAddress) {
    return new Promise((resolve, reject) => {
        query.exec(db, 'Accounts_Users', { 'Gmail': gmailAddress }).then(user => {
            if(user[0] == null) {
                resolve(null);
            } else {
                resolve(user[0]);
            }
        });
    });
}

module.exports = {
    ePermission: ePermission,
    getToken: getToken,
    getUserID: getUserID,
    getGoogleEmail: getGoogleEmail,
    getUserbyGmail: getUserbyGmail,
    hasPermission: hasPermission,
    jwtVerification: jwtVerification
}