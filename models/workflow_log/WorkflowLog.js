var mongoose = require('mongoose');

var WorflowLogSchema = new mongoose.Schema({
    uuid: String,
    created_at: String,
    message: String,
    level: String,
    workflow_uuid: String
});

mongoose.model('WorkflowLog', WorflowLogSchema);

module.exports = mongoose.model('WorkflowLog');
