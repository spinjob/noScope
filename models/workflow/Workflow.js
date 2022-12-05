var mongoose = require('mongoose');

var AdaptionSchema = new mongoose.Schema({
    uuid: String,
    inputSchema: Object,
    outputSchema: Object,
    formula: Object
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
    webhook: WorkflowWebhookTriggerSchema,
    translation: String
});

var WorkflowStepRequestSchema = new mongoose.Schema({
    path: String,
    parameters: Array,
    method: String,
    parameters: Array,
    parent_interface_uuid: String,
    request_body: Object
});

var WorkflowStepSchema = new mongoose.Schema({
    uuid: String,
    sequence: Number,
    type: String,
    parent_workflow_uuid: String,
    full_formula: String,
    adaptions: [AdaptionSchema],
    request: WorkflowStepRequestSchema

});

var ReactFlowNodeSchema = new mongoose.Schema({
    id: String,
    type: String,
    data: {
        label: String
    },
    position: {
        x: Number,
        y: Number
    },
    style: {
        width: Number,
        height: Number
    },
    width: Number,
    height: Number,
    parentNode: String,
    draggable: Boolean,
    connectable: Boolean,
    extent: String
});

var ReactFlowEdgeSchema = new mongoose.Schema({
    id: String,
    source: String,
    target: String,
    label: String,
    animated: Boolean
})


var WorkflowSchema = new mongoose.Schema({
    uuid: String,
    name: String,
    interfaces: Array,
    parent_project_uuid: String,
    trigger: WorkflowTriggerSchema,
    steps: [WorkflowStepSchema],
    status: String,
    nodes: [ReactFlowNodeSchema],
    edges: [ReactFlowEdgeSchema],
    created_at: String,
    updated_at: String,
    deleted_at: String,
    created_by: String

});

mongoose.model('Workflow', WorkflowSchema);

module.exports = mongoose.model('Workflow');
