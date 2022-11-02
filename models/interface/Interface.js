var mongoose = require('mongoose');
var InterfaceSchema = new mongoose.Schema({
    uuid: String,
    name: String,
    description: String,
    type: String,
    version: String,
    created_at: String,
    updated_at: String,
    deleted_at: String,
    production_server: String,
    sandbox_server: String,
    created_by: String,
    actions: Array
});

mongoose.model('Interface', InterfaceSchema);

module.exports = mongoose.model('Interface');
