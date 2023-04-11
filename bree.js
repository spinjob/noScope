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
    console.log('adding bree job')
    
    console.log("Bree Job Name: ")
    console.log("trigger-workflow-"+projectId+"-"+workflowId)
    console.log("Bree Job Cadence: ")
    console.log(cadence)
    console.log("bree jobs before adding")
    console.log(bree.config.jobs)

    if(bree.config.jobs.filter(job => job.name === `trigger-workflow-${projectId}-${workflowId}`).length > 0) {
        console.log('job already exists')
        console.log('stopping job')
        bree.stop(`trigger-workflow-${projectId}-${workflowId}`)
        console.log('removing job')
        await bree.remove(`trigger-workflow-${projectId}-${workflowId}`).then(() => {
            console.log('removed bree job')
            console.log('bree jobs after removing')
            console.log(bree.config.jobs)
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
                console.log('added bree job')
                console.log(cadence)
                bree.start(`trigger-workflow-${projectId}-${workflowId}`)
            }) 
        })
    } else {
        console.log('job does not exist')
        console.log('bree jobs before adding')
        console.log(bree.config.jobs)
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
            console.log('bree jobs after adding')
            console.log(bree.config.jobs)
        })
    }


}

module.exports = {
    bree,
    addBreeJob,
}