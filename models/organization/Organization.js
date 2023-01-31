var mongoose = require('mongoose');
var OrganizationSchema = new mongoose.Schema({
    uuid: String,
    name: String,
    created_at: String,
    updated_at: String,
    deleted_at: String,
    created_by: String,
    configurations: Object,
    interfaces: Array,
    partnerships: Array
});

mongoose.model('Organization', OrganizationSchema);

module.exports = mongoose.model('Organization');
