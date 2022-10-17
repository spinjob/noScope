var mongoose = require('mongoose');

var InterfaceWebhookSchema = new mongoose.Schema({
    uuid: String,
    name: String,
    description: String,
    parent_interface_uuid: String,
    method: String,
    parameters: Array,
    requestBody: Object,
    responses: Array
});

mongoose.model('InterfaceWebhook', InterfaceWebhookSchema);

module.exports = mongoose.model('InterfaceWebhook');
