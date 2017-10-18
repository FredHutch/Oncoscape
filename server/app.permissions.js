const mongoose = require('mongoose');
const query = require('./app.query.js');
const jwt = require('jsonwebtoken');
const _ = require("underscore");
const JWT_KEY = 'asdfadfasdfasdf';

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

var getToken = function (db, gmailAddress) {
    return new Promise((resolve, reject) => {
        query.exec(db, 'Accounts_Users', { 'Gmail': gmailAddress }).then(user => {
            var userId = user[0]._id;
            query.exec(db, "Accounts_Permissions", { 'User': userId }).then(permissions => {
                var projectIDs = permissions.map(function (p) {
                    return mongoose.Types.ObjectId(p.Project);
                });
                query.exec(db, "Accounts_Projects", { '_id': { $in: projectIDs } }).then(projects => {
                    var userProjectsJson = permissions.map(function (m) {
                        var proj = projects.filter(function (p) {
                            return p.Project = m.Project;
                        })[0];
                        return _.extend(proj, m);
                    });
                    var userProjectsString = JSON.stringify(userProjectsJson);
                    var userProjectsJwt = jwt.sign(userProjectsString, JWT_KEY);
                    resolve(userProjectsJwt);
                })
            });

        });
    });

}

module.exports = {
    ePermission: ePermission,
    getToken: getToken,
    getProjects: getProjects,
    getGoogleEmail: getGoogleEmail,
    hasPermission: hasPermission
}