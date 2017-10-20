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
var getProjects = function (token) {
    return new Promise((resolve, reject) => {
        jwt.verify(token, JWT_KEY)
        resolve(jwt.decode(token));
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

var getToken = function (db, userId) {
    console.log('test1', userId);

    return new Promise((resolve, reject) => {

        Permission.find({ 'User': userId }, function(req, res) {
            var permissions = res;
            var projectIDs = permissions.map(function (p) {
                    return mongoose.Types.ObjectId(p.Project);
                });
            Project.find({ '_id': { $in: projectIDs } }, function(req, res){
                var userProjectsJson = permissions.map(function (m) {
                                var proj = res.filter(function (p) {
                                    return p.Project = m.Project;
                                })[0];
                                console.log("***", proj);
                                console.log("***", m);
                                
                                console.log(_.extend(proj, m));
                                return _.extend(proj, m);
                            });
                var userProjectsString = JSON.stringify(userProjectsJson);
                var userProjectsJwt = jwt.sign(userProjectsString, JWT_KEY);
                resolve(userProjectsJwt);
                });
        });
        // query.exec(db, 'Accounts_Users', { 'Gmail': gmailAddress }).then(user => {
        //     var userId = user[0]._id;
            // query.exec(db, "permissions", { 'User': userId }).then(permissions => {
            //     console.log('test2', permissions);
            //     var projectIDs = permissions.map(function (p) {
            //         return mongoose.Types.ObjectId(p.Project);
            //     });
            //     query.exec(db, "projects", { '_id': { $in: projectIDs } }).then(projects => {
            //         console.log('test3', projects);
            //         var userProjectsJson = permissions.map(function (m) {
            //             var proj = projects.filter(function (p) {
            //                 return p.Project = m.Project;
            //             })[0];
            //             return _.extend(proj, m);
            //         });
            //         var userProjectsString = JSON.stringify(userProjectsJson);
            //         var userProjectsJwt = jwt.sign(userProjectsString, JWT_KEY);
            //         resolve(userProjectsJwt);
            //     })
            // });

        });
    // });

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
    getProjects: getProjects,
    getGoogleEmail: getGoogleEmail,
    getUserbyGmail: getUserbyGmail,
    hasPermission: hasPermission
}