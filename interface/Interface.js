var mongoose = require('mongoose');
var InterfaceSchema = new mongoose.Schema({
    name: String,
    description: String,
    version: String
});

mongoose.model('Interface', InterfaceSchema);

module.exports = mongoose.model('Interface');
