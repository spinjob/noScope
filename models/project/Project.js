var mongoose = require('mongoose');
var ProjectSchema = new mongoose.Schema({
    uuid: String,
    name: String,
    description: String,
    interfaces: Array,
    created_at: String,
    updated_at: String,
    deleted_at: String,
    created_by: String,
    workflows: Array
});

mongoose.model('Project', ProjectSchema);

module.exports = mongoose.model('Project');
