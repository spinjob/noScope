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

    if(bree.config.jobs.filter(job => job.name === `trigger-workflow-${projectId}-${workflowId}`).length > 0) {
        bree.stop(`trigger-workflow-${projectId}-${workflowId}`)
        await bree.remove(`trigger-workflow-${projectId}-${workflowId}`).then(() => {
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
            bree.add(newJob).then(() => {
                bree.start(`trigger-workflow-${projectId}-${workflowId}`)
            }) 
        })
    } else {
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
            bree.start(`trigger-workflow-${projectId}-${workflowId}`)

        })
    }

    console.log('bree jobs')
    console.log(bree.config.jobs)

}

module.exports = {
    bree,
    addBreeJob,
}