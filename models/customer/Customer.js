var mongoose = require('mongoose');
var CustomerSchema = new mongoose.Schema({
    uuid: String,
    key: String,
    name: String,
    email: String,
    phone: String,
    notes: String,
    type: String,
    created_at: String,
    updated_at: String,
    deleted_at: String,
    created_by: String,
    configurations: Object,
    parent_organizations: Array
});

mongoose.model('Customer', CustomerSchema);

module.exports = mongoose.model('Customer');
