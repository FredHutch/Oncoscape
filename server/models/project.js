var mongoose = require("mongoose");
var Schema = mongoose.Schema;
var File = require("../models/file");
var IRB = require("../models/irb");
var Permission = require("../models/permission");
var status = ["uploaded", "upload started", "failed"];
var projectSchema = new Schema({
    Name: String,
    Description: String,
    Annotations: [{key: String, value: String}], 
    Private: Boolean,
    PHI: Boolean,
    Source: String,
    DataCompliance:  {HumanStudy: String, Protocol: String, ProtocolNumber: String},
    File: {filename: String, size: Number, timestamp: Date},
    Date: {type: Date, default: Date.now},
    // Author: {type: String}
    Author: {type: Schema.ObjectId, ref: 'User', required: true}
},  {collection:'Accounts_Projects'});
module.exports = mongoose.model("Project", projectSchema);

