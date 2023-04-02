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

async function addBreeJob(projectId, workflowId, cadence, jobUuid) {
    var newJob = {
        name: `trigger-workflow-${projectId}-${workflowId}`,
        path: path.join(__dirname, './jobs/trigger-workflow.js'),
        interval: cadence,
        worker: {
            workerData: {
                projectId: projectId,
                workflowId: workflowId,
                jobUuid: jobUuid
            }
        }
    }
    await bree.add(newJob).then(() => {
        console.log('added bree job')
        console.log(cadence)
        bree.start(`trigger-workflow-${projectId}-${workflowId}`)
    })
}

module.exports = {
    bree,
    addBreeJob,
}