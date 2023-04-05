var express = require('express');
var router = express.Router();
router.use(express.urlencoded({extended: true}));
router.use(express.json());
const crypto = require('crypto');
const Workflow = require('../workflow/Workflow');
const Interface = require('../interface/Interface');
const Project = require('../project/Project');
const Job = require('../job/Job');
const {verifyUser} = require('../../authenticate.js');
const {runWorkflow} = require('../../lib.js');
const {triggerWorkflow} = require('../../workflowOrchestrator.js');
const {addBreeJob, bree} = require('../../bree.js');

// CREATE A WORKFLOW
router.post('/', function(req,res) {
    var workflowUUID = crypto.randomUUID();
    Workflow.create({
        uuid: workflowUUID,
        name: req.body.name,
        interfaces: req.body.interfaces,
        parent_project_uuid: req.body.parent_project_uuid,
        trigger: req.body.trigger,
        steps: req.body.steps,
        nodes: req.body.nodes,
        edges: req.body.edges,
        status: req.body.status,
        created_at: new Date().toISOString().replace(/T/, ' ').replace(/\..+/, ''),
        updated_at: new Date().toISOString().replace(/T/, ' ').replace(/\..+/, ''),
        created_by: req.body.created_by

    },
    function (err,workflow) {
        if(err) {
            return res.status(500).send(err);
        } else {
            Project.findOneAndUpdate({uuid: req.body.parent_project_uuid}, { $push: {workflows: workflowUUID}}, function (err,project){
                if(err) {
                    console.log(err)
                } else {
                    res.status(200).send(workflow);
                }
            })
        }
    });
});

router.post('/details', function(req,res) {
    Workflow.find({parent_project_uuid: req.body.parent_project_uuid}, function (err, workflows) {
        if (err) return res.status(500).send("There was a problem finding the project.");
        res.status(200).send(workflows);
    });
});

router.get('/', function(req,res) {
    Workflow.find({parent_project_uuid: req.body.parent_project_uuid}, function (err, workflows) {
        if (err) return res.status(500).send("There was a problem finding the project.");
        res.status(200).send(workflows);
    });
});

router.get('/:workflowId/details', function(req,res) {
    Workflow.find({uuid: req.params.workflowId}, function (err, workflow) {
        if (err) return res.status(500).send("There was a problem finding the project.");
        res.status(200).send(workflow);
    });
});

router.put('/:workflowId/map', function(req,res) {
    // Workflow.findOneAndUpdate({uuid: req.params.workflowId}, { $push: {'steps.0.adaptions': req.body}}, function (err,workflow){
    //     if (err) return res.status(500).send(err);
    //     res.status(200).send(workflow);
    // });

    Workflow.findOneAndUpdate({uuid: req.params.workflowId}, { $push: {'steps.0.adaptions': req.body}}, function (err,workflow){
        if (err) return res.status(500).send(err);
        res.status(200).send(workflow);
    });

});

router.delete('/:workflowId/map/:mapId', function(req,res) {
    Workflow.findOneAndUpdate({uuid: req.params.workflowId}, { $pull: {'steps.0.adaptions': {uuid: req.params.mapId}}}, function (err,workflow){
        if (err) return res.status(500).send(err);
        res.status(200).send(workflow);
    });
});

router.put('/:workflowId/map/:mapId', function(req,res) {
    Workflow.findOneAndUpdate({uuid: req.params.workflowId, 'steps.0.adaptions.uuid': req.params.mapId}, {'steps.0.adaptions.$.formula': req.body}, function (err,workflow){
        if (err) return res.status(500).send(err);
        res.status(200).send(workflow);
    });
});

router.put('/:workflowId/steps/0', function(req,res) {
    Workflow.findOneAndUpdate({uuid: req.params.workflowId}, 
        {
            'trigger.translation': req.body.fullFormula,
             'trigger.function': req.body.function, 
             'trigger.schema_tree': req.body.schemaTree, 
             'trigger.liquidTemplate': req.body.liquidTemplate
        }, function (err,workflow){
        if (err) return res.status(500).send(err);
        res.status(200).send(workflow);
    });
});


function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

function createCadenceString (cadence, days, time, timezone){
    var scheduledTime = new Date(time)
    
    if(cadence == 'Daily'){
        var hours = scheduledTime.getHours().toString().padStart(2, '0')
        var minutes = scheduledTime.getMinutes().toString().padStart(2, '0')
        var cadenceString = 'at ' + hours +':' + minutes + ' ' + timezone + ' every day'
        return cadenceString
    } else if(cadence == 'Weekly'){
        var daysString = ''
            days.forEach(day => {
                daysString += capitalizeFirstLetter(day) + ', '
            }
        )
        var timeString = scheduledTime.getHours() +':' + scheduledTime.getMinutes() + ' ' + timezone
        daysString = daysString.slice(0, -2)
        var cadenceString = 'at ' + timeString + ' every ' + daysString
        return cadenceString
    } 
    return null

}

router.put('/:workflowId/activate', function(req,res) {
    Workflow.findOneAndUpdate({uuid: req.params.workflowId}, {status: 'active'}, function (err,workflow){
        if(err) return res.status(500).send(err);
        if(workflow.trigger.type == 'scheduled'){
            var cadence = {
                cadence: workflow.trigger.cadence,
                days: workflow.trigger.days ? workflow.trigger.days : null,
                hours: workflow.trigger.time ? workflow.trigger.time : null,
            }

            var cadence = createCadenceString(workflow.trigger.cadence, workflow.trigger.days ? workflow.trigger.days : [], workflow.trigger.time, workflow.trigger.timezone)
            
            // Check if a breeJob already exists for this workflow.  If so, update the cadence if it's different.  If not, create a new breeJob.
            var breeJobs = bree.config.jobs.filter(job => job.name == `trigger-workflow-${workflow.parent_project_uuid}-${workflow.uuid}`)

            if(breeJobs.length > 0){
                //Remove existin breeJob and create a new one with the updated cadence
                removeBreeJob(workflow.parent_project_uuid, workflow.uuid).then(() => {
                   // Update the job cadence in the database
                   console.log('Bree Job UUID: ')
                   console.log(breeJobs[0].worker.workerData.jobUuid)
                    Job.findOneAndUpdate({uuid: breeJobs[0].worker.workerData.jobUuid}, {metadata: {cadence: cadence}, status: 'ACTIVE'}, {new: true}).then(job => {
                        //Re-add the breeJob with the updated cadence and the job UUID in the database
                        console.log(job)
                        addBreeJob(workflow.parent_project_uuid, workflow.uuid, cadence, job.uuid).then(() => {
                            res.status(200).send({message: 'Workflow schedule added.', job: job, schedule: cadence});
                        }).catch(err => {
                            res.status(500).send({message: 'There was a problem adding the updated schedule.', err: err});
                        })
                    }).catch(err => {
                        console.log(err)
                        res.status(404).send({message: 'There was a problem updating the workflow schedule.', err: err});
                    })
                }).catch(err => {
                    res.status(500).send({message: 'There was a problem updating the workflow schedule.', err: err});
                })
            }
            else {
                var jobUUID = crypto.randomUUID();
                // Add the breeJob with the updated cadence and the job UUID in the database
                addBreeJob(workflow.parent_project_uuid, workflow.uuid, cadence,jobUUID).then(() => {
                    Job.create({
                        uuid: jobUUID,
                        metadata: {
                            cadence: cadence,
                            project_uuid: workflow.parent_project_uuid,
                            workflow_uuid: workflow.uuid,
                            breeJob: `trigger-workflow-${workflow.parent_project_uuid}-${workflow.uuid}`
                        },
                        type: 'scheduled_workflow',
                        created_at: new Date().toISOString().replace(/T/, ' ').replace(/\..+/, ''),
                        updated_at: new Date().toISOString().replace(/T/, ' ').replace(/\..+/, ''),            
                        status: 'ACTIVE'
                    }, function (err, job) {
                        if (err) return res.status(500).send("There was a problem adding the information to the database.");
                        res.status(200).send({message: 'Workflow schedule added.', job: job, schedule: cadence});
                    });
                }).catch(err => {
                    res.status(500).send({message: 'There was a problem adding the workflow schedule.', err: err});
                }) 
            }
        }

        if(workflow.trigger.type == 'webhook'){
            res.status(200).send({message: 'Workflow activated.  Webhooks will now be processed as they are received.'});
        }
        
    });
});

router.put('/:workflowId/deactivate', function(req,res) {
    Workflow.findOneAndUpdate({uuid: req.params.workflowId}, {status: 'INACTIVE'}, function (err,workflow){
        if(err) return res.status(500).send(err);
        if(workflow.trigger.type == 'scheduled'){
            removeBreeJob(workflow.parent_project_uuid, workflow.uuid).then(() => {
                Job.findOneAndUpdate({metadata: {breeJob: `trigger-workflow-${workflow.parent_project_uuid}-${workflow.uuid}`}}, {status: 'INACTIVE'}, {new: true}).then(job => {
                    res.status(200).send({message: 'Workflow schedule removed.', job: job});
                }).catch(err => {
                    res.status(500).send({message: 'There was a problem removing the workflow schedule.', err: err});
                })
            }).catch(err => {
                res.status(500).send({message: 'There was a problem removing the workflow schedule.', err: err});
            })
        }
    });
});


async function removeBreeJob (projectUuid, workflowUuid){
    console.log("Removing breeJob")
    console.log(`trigger-workflow-${projectUuid}-${workflowUuid}`)
    var breeJob = bree.config.jobs.find(job => job.name == `trigger-workflow-${projectUuid}-${workflowUuid}`)
    await bree.remove(breeJob.name).then(() => {
        console.log("breeJob removed")
        return true
    }
    ).catch(err => {
        console.log(err)
        return err
    }
    )
}

router.put('/:workflowId', function(req,res) {
    Workflow.findOneAndUpdate({uuid: req.params.workflowId},{ 
        name: req.body.name,
        nodes: req.body.nodes,
        edges: req.body.edges,
        updated_at: new Date().toISOString().replace(/T/, ' ').replace(/\..+/, ''),
        trigger: req.body.trigger,
        definition: req.body.definition,
        status: req.body.status,
    }, {new: true, upsert: true}, function(err,workflow){
        if (err) return res.status(500).send(err);
        res.status(200).send(workflow);
    });
});

router.put('/:workflowId/steps/1', function(req,res) {
    Workflow.findOneAndUpdate({uuid: req.params.workflowId}, {'steps.0.schemaTree': req.body.schemaTree}, function (err,workflow){
        if (err) return res.status(500).send(err);
        res.status(200).send(workflow);
    });
});

const isJson = (str) => {
    try {
        JSON.parse(str);
    } catch (e) {
        return false;
    }
    return true;
}


router.post('/:workflowId/trigger', function(req,res) {
    Workflow.findOne({uuid: req.params.workflowId}, function(err,workflow){
        if (err) {
            return res.status(500).send(err);
        } else {
            Interface.find({
                $or: [
                    {uuid: {$in: workflow.interfaces}}
                ]
            }, function(err,apis){
                var traceUUID = crypto.randomUUID();
                if (err) return res.status(500).send(err);

                if (!isJson(JSON.stringify(req.body))){
                  return res.status(400).send({
                        status: 'failure',
                        message: 'Invalid JSON',
                        traceId: traceUUID
                    })
                } else {
                    triggerWorkflow(workflow, apis, "sandbox", req.body, traceUUID)
                   return res.status(200).send({
                        status: 'success',
                        message: 'Triggered workflow',
                        traceId: traceUUID
                    })
                }

            });

        }

    });
});



module.exports = router;