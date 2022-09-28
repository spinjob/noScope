var mongoose = require('mongoose');

var SecuritySchemeFlowSchema = new mongoose.Schema({
    type: String,
    tokenUrl: String,
    authorizationUrl: String,
    scopes: Object,
    refreshUrl: String
});

mongoose.model('SecuritySchemeFlow', SecuritySchemeFlowSchema);

var InterfaceSecuritySchemeSchema = new mongoose.Schema({
    uuid: String,
    parent_interface_uuid: String,
    name: String,
    description: String,
    type: String,
    flows: Array
});
mongoose.model('InterfaceSecurityScheme', InterfaceSecuritySchemeSchema);

module.exports = mongoose.model('InterfaceSecurityScheme');