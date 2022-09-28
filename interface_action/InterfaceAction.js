var mongoose = require('mongoose');

var RequestBodySchema = new mongoose.Schema({
    type: String,
    schema: Array,
    required: Boolean
});

mongoose.model('RequestBody', RequestBodySchema);

var InterfaceActionSchema = new mongoose.Schema({
    uuid: String,
    name: String,
    parent_interface_uuid: String,
    path: String,
    method: String,
    parameters: Array,
    requestBody: RequestBodySchema
});

mongoose.model('InterfaceAction', InterfaceActionSchema);

module.exports = mongoose.model('InterfaceAction');
