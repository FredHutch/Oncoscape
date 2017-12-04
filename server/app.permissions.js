const mongoose = require('mongoose');
db = require('./app.db.js');
Query = require('./app.query.js');
const jwt = require('jsonwebtoken');
const _ = require("underscore");
const JWT_KEY = 'asdfadfasdfasdf';
var User = require("./models/user");
var Project = require("./models/project");
var File = require("./models/file");
var IRB = require("./models/irb");
var Permission = require("./models/permission");
// var publicProjects = ["accounts", "gbm", "acc", "blca", "brain", "brca", "cesc", "chol", "coad", "coadread", "dlbc", "esca", "hg19", "hnsc", "kich", "kirc", "kirp", "laml", "lgg", "lihc", "lookup", "luad", "lung", "lusc", "meso", "ov", "paad", "pancan12", "pancan", "pcpg", "phenotype", "prad", "read", "sarc", "skcm", "stad", "tcganatgengbm", "tgct", "thca", "thym", "ucec", "ucs", "uvm"];
var publicProjects = [];
var jwtVerification = function (req, res, next) {
    if (req && req.headers.hasOwnProperty("authorization")) {
        try {
            var userID = req.headers.authorization.replace('Bearer ', '');
            getUserID(userID).then(rs1 => {
                req.userID = rs1;
                req.isAuthenticated = true;
                Permission.find({'User': mongoose.Types.ObjectId(JSON.parse(rs1))}, function(req1, res1){
                    req.permissions = res1;
                    db.getConnection().then(db => {
                        Query.exec(db, 'open_projects', {}).then(publicProjects => {
                            req.permittedCollections = publicProjects[0]['public'].concat(res1.map(m => String(m.Project)));
                                Permission.find({'Project': {$in: res1.map(m => m.Project)}}, function(req2, res2){
                                    req.relatedPermissions = res2;
                                    console.log('passed jwtVerification');
                                    next();
                                });
                            });
                        });
                    });
            });
        } catch (e) {
            req.isAuthenticated = false;
            res.send(e);
        }
    } else {
        // Public access
        req.isAuthenticated = false;
        db.getConnection().then(db => {
            Query.exec(db, 'open_projects', {}).then(publicProjects => {
                req.permittedCollections = publicProjects[0]['public'];
                next();
            });
        });
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
        });
    });
}

module.exports = {
    getToken: getToken,
    getUserID: getUserID,
    getGoogleEmail: getGoogleEmail,
    jwtVerification: jwtVerification
}