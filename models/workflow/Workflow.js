var mongoose = require('mongoose');

var AdaptionSchema = new mongoose.Schema({
    uuid: String,
    inputSchema: Object,
    outputSchema: Object,
    mappings: Array
});

var WorkflowWebhookTriggerSchema = new mongoose.Schema({
    uuid: String,
    name: String,
    parameters: Array,
    method: String,
    request_body: Object,
    responses: Array
});

var WorkflowTriggerSchema = new mongoose.Schema({
    uuid: String,
    sequence: Number,
    type: String,
    parent_workflow_uuid: String,
    parent_project_uuid: String,
    webhook: WorkflowWebhookTriggerSchema
});

var WorkflowStepRequestSchema = new mongoose.Schema({
    path: String,
    parameters: Array,
    method: String,
    parameters: Array,
    parent_interface_uuid: String,
    request_body: Array
});

var WorkflowStepSchema = new mongoose.Schema({
    uuid: String,
    sequence: Number,
    type: String,
    parent_workflow_uuid: String,
    parent_project_uuid: String,
    adaptions: [AdaptionSchema],
    request: WorkflowStepRequestSchema

});

var WorkflowSchema = new mongoose.Schema({
    uuid: String,
    name: String,
    interfaces: Array,
    parent_project: String,
    trigger: WorkflowTriggerSchema,
    steps: [WorkflowStepSchema],
    created_at: String,
    updated_at: String,
    deleted_at: String,
    created_by: String
});

mongoose.model('Workflow', WorkflowSchema);

module.exports = mongoose.model('Workflow');
