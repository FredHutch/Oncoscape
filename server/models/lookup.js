var mongoose = require("mongoose");
var Schema = mongoose.Schema;


var lookupSchema = new Schema({
    dataset: String,
    Source: String,
    beta: Boolean,
    name: String,
    img: String,
    tools: Object,
    geneset: String
}, {collection:'lookup_oncoscape_datasources_v2'});
module.exports = mongoose.model("Lookup", lookupSchema);
