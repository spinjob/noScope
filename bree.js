const Bree = require('bree');
const path = require('path');

const bree = new Bree({
    jobs: [
        {
            name: 'trigger-workflow',
            path: path.join(__dirname, './jobs/trigger-workflow.js'),
            interval: 'every 10 seconds',
            worker: {
                workerData: {
                    projectId: 'test',
                    workflowId: 'test'
                }
            }
        }

    ]
});

async function addBreeJob(projectId, workflowId, cadence) {
    var newJob = {
        name: `trigger-workflow-${projectId}-${workflowId}`,
        path: path.join(__dirname, './jobs/trigger-workflow.js'),
        interval: cadence,
        worker: {
            workerData: {
                projectId: projectId,
                workflowId: workflowId
            }
        }
    }
    await bree.add(newJob).then(() => {
        console.log('added bree job')
        bree.start(`trigger-workflow-${projectId}-${workflowId}`)
    })
}

function removeBreeJob(projectId, workflowId) {
    bree.remove(`trigger-workflow-${projectId}-${workflowId}`)
}

function updateBreeJob(projectId, workflowId) {
    bree.update({
        name: `trigger-workflow-${projectId}-${workflowId}`,
        path: path.join(__dirname, './jobs/trigger-workflow.js'),
        interval: 'every 10 seconds',
        worker: {
            workerData: {
                projectId: projectId,
                workflowId: workflowId
            }
        }
    })

}

module.exports = {
    bree,
    addBreeJob,
    removeBreeJob,
    updateBreeJob
}