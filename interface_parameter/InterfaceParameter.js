var mongoose = require('mongoose');
var InterfaceParameterSchema = new mongoose.Schema({
    uuid: String,
    parent_interface_uuid: String,
    parameter_type: String,
    type: String,
    name: String,
    description: String,
    example: String,
    required: Boolean
});

mongoose.model('InterfaceParameter', InterfaceParameterSchema);

module.exports = mongoose.model('InterfaceParameter');
