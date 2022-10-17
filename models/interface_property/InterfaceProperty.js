var mongoose = require('mongoose');
var InterfacePropertySchema = new mongoose.Schema({
    uuid: String,
    parent_interface_uuid: String,
    parent_entity: String,
    interface_entity_uuid: String,
    required: Boolean
});

mongoose.model('InterfaceProperty', InterfacePropertySchema);

module.exports = mongoose.model('InterfaceProperty');
