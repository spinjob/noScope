const {Worker, workerData} = require('node:worker_threads');

function triggerWorkflow() {
    console.log('triggering workflow')
    console.log("workflowId: " + workerData.workflowId)
    console.log("projectId: " + workerData.projectId)
}

triggerWorkflow()
