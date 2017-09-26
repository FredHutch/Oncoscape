var mongoose = require("mongoose");
var Schema = mongoose.Schema;

var categories = ['clinical', 'molecular', 'metadata'];
var datatypes = ['diagnosis', 'drug', 'treatment', 'mut', 'RNASeq', 'cnv', 'protein'];

var fileSchema = new Schema({
    Name: String,
    Category: { type: String, enum: categories }, 
    DataType: { type: String, enum: datatypes },
    FileType: { type: String },
    Project: String,
    Data: Object,
    Size: Number,
    Date: {type: Date, default: Date.now}
}, {collection:'Accounts_Files'});
module.exports = mongoose.model("File", fileSchema);
