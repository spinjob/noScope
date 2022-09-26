var mongoose = require('mongoose');

var RequestBodySchema = new mongoose.Schema({
    type: String,
    schema: Array,
    required: Boolean
});

mongoose.model('RequestBody', RequestBodySchema);


var InterfacePathSchema = new mongoose.Schema({
    uuid: String,
    name: String,
    parent_interface_uuid: String,
    path: String,
    method: String,
    parameters: Array,
    requestBody: RequestBodySchema
});


mongoose.model('InterfacePath', InterfacePathSchema);

module.exports = mongoose.model('InterfacePath');
