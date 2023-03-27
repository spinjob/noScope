var mongoose = require('mongoose');

var WorflowLogSchema = new mongoose.Schema({
    uuid: String,
    created_at: String,
    message: String,
    level: String,
    workflowId: String,
    action: String,
    traceId: String
});

mongoose.model('WorkflowLog', WorflowLogSchema);

module.exports = mongoose.model('WorkflowLog');
