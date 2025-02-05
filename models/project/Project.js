var mongoose = require('mongoose');
var ProjectSchema = new mongoose.Schema({
    uuid: String,
    name: String,
    description: String,
    interfaces: [String],
    created_at: String,
    updated_at: String,
    deleted_at: String,
    created_by: String,
    workflows: [String],
    customers: Array,
    status: String,
    configuration: Object,
    customer_configuration: Object,
    authentication: Object,
    owning_organization: String,
    indexed: Boolean
});

mongoose.model('Project', ProjectSchema);

module.exports = mongoose.model('Project');
