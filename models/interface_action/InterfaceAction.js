var mongoose = require('mongoose');

var InterfaceActionSchema = new mongoose.Schema({
    uuid: String,
    name: String,
    parent_interface_uuid: String,
    path: String,
    method: String,
    parameters: Array,
    requestBody: Object,
    requestBody2: Object,
    responses: Array
});

mongoose.model('InterfaceAction', InterfaceActionSchema);

module.exports = mongoose.model('InterfaceAction');
