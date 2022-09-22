var mongoose = require('mongoose');
var InterfaceEntitySchema = new mongoose.Schema({
    uuid: String,
    parent_interface_uuid: String,
    name: String,
    description: String,
    type: String,
    example: Array
});

mongoose.model('InterfaceEntity', InterfaceEntitySchema);

module.exports = mongoose.model('InterfaceEntity');
