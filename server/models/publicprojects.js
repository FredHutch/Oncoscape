var mongoose = require("mongoose");
var Schema = mongoose.Schema;

var openProjectSchema = new Schema({
    public: [String], 
},  {collection:'open_projects'});
module.exports = mongoose.model("Openprojects", openProjectSchema);

