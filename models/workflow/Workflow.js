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
    request_body2: Object,
    responses: Array,
    schemaTree: Array,
    schemaList: Array
});

// var WorkflowTriggerSchema = new mongoose.Schema({
//     uuid: String,
//     sequence: Number,
//     type: String,
//     parent_workflow_uuid: String,
//     parent_project_uuid: String,
//     webhook: WorkflowWebhookTriggerSchema,
//     translation: String,
//     function: String,
//     liquidTemplate: String
// });

var WorkflowStepRequestSchema = new mongoose.Schema({
    path: String,
    parameters: Array,
    method: String,
    parameters: Array,
    parameterTree: Object,
    parent_interface_uuid: String,
    request_body: Object,
    request_body2: Object,
    schemaTree: Array,
    schemaList: Array

});

var WorkflowStepSchema = new mongoose.Schema({
    uuid: String,
    sequence: Number,
    type: String,
    parent_workflow_uuid: String,
    full_formula: String,
    function: String,
    adaptions: [AdaptionSchema],
    request: WorkflowStepRequestSchema

});

var ReactFlowNodeSchema = new mongoose.Schema({
    id: String,
    type: String,
    data: Object,
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
    extent: String,
    
});

var ReactFlowEdgeSchema = new mongoose.Schema({
    id: String,
    source: String,
    target: String,
    label: String,
    animated: Boolean,
    data: Object,
})

var MachineStepsSchema = new mongoose.Schema({
    uuid: String,
    api: String,
    actionName: String,
    requestInfo: {
        method: String,
        path: String,
        headers: Object,
        body: Object
    },
    successTransition: String,
    failureTransition: String,
    transforms: Array
})

var WorkflowSchema = new mongoose.Schema({
    uuid: String,
    name: String,
    flow: Object,
    interfaces: Array,
    parent_project_uuid: String,
    trigger: Object,
    steps: [MachineStepsSchema],
    status: String,
    nodes: [ReactFlowNodeSchema],
    edges: [ReactFlowEdgeSchema],
    definition: Object,
    created_at: String,
    updated_at: String,
    deleted_at: String,
    created_by: String

});

mongoose.model('Workflow', WorkflowSchema);

module.exports = mongoose.model('Workflow');
