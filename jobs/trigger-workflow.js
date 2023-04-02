const {Worker, workerData, parentPort} = require('node:worker_threads');
const axios = require('axios');
const crypto = require('crypto');
const Interface = require('../models/interface/Interface');
const Workflow = require('../models/workflow/Workflow');
const {triggerWorkflow} = require('../workflowOrchestrator');
const {returnWorkflow} = require('../lib');
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const url = process.env.MONGO_DB_CONNECTION_STRING

const isJson = (str) => {
    try {
        JSON.parse(str);
    } catch (e) {
        return false;
    }
    return true;
}


function triggerWorkflowJob() {
    console.log('triggering workflow')
    console.log("workflowId: " + workerData.workflowId)
    console.log("projectId: " + workerData.projectId)

    // Was having issues getting Mongoose to work with worker threads, so I'm using axios to make the request instead

    axios.get(process.env.PUBLIC_API_BASE_URL+ `/projects/${workerData.projectId}/workflows/${workerData.workflowId}/details`).then((response) => {
        var workflow = response.data[0]

        axios.post(process.env.PUBLIC_API_BASE_URL+ '/projects/interfaces', {interfaces: response.data[0].interfaces}).then((response) => {
            var traceUUID = crypto.randomUUID();

            triggerWorkflow(workflow, response.data, "sandbox", {}, traceUUID).then((response) => {
                console.log(response)
                if(parentPort) parentPort.postMessage('done');
            }).catch((error) => {
                console.log(error)
                process.exit(1)
            })
        }).catch((error) => { 
            console.log(error) 
            process.exit(1)

        } )
    }).catch((error) => {
        console.log(error)
        process.exit(1)
    })
}

triggerWorkflowJob()
