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
    const jobName = `trigger-workflow-${projectId}-${workflowId}`
    if(bree.config.jobs.filter(job => job.name === jobName).length > 0) {

        console.log('There is a job for this workflow already. Stopping the job...')
        await bree.stop(`trigger-workflow-${projectId}-${workflowId}`).then(() =>{
            console.log('job stopped')
        }).catch((err) =>{
            console.log('error stopping job: ')
            console.log(err)
        })

        console.log('Removing the job')
        await bree.remove(jobName).then(() => {
            console.log('job removed')
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
            console.log('re-adding job')
            bree.add(newJob).then(() => {
                bree.start(`trigger-workflow-${projectId}-${workflowId}`)
            }) 
        })
    } else {
        console.log('job does not exist')

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
        await bree.add(newJob);

        try {
            await bree.start(`trigger-workflow-${projectId}-${workflowId}`);
        } catch {
            console.log('error starting bree job')
        }
    }

    console.log('bree jobs')
    console.log(bree.config.jobs)

}

module.exports = {
    bree,
    addBreeJob,
}