var express = require('express');
var router = express.Router();
router.use(express.urlencoded({extended: true}));
router.use(express.json());
const crypto = require('crypto');
const Workflow = require('../workflow/Workflow');
const Interface = require('../interface/Interface');
const Project = require('../project/Project');
const {verifyUser} = require('../../authenticate.js');
const {runWorkflow} = require('../../lib.js');
const {triggerWorkflow} = require('../../workflowOrchestrator.js');
const {addBreeJob} = require('../../bree.js');

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

router.post('/:workflowId/activate', function(req,res) {
    Workflow.findOneAndUpdate({uuid: req.params.workflowId}, {status: 'active'}, function (err,workflow){
        if(err) return res.status(500).send(err);
        if(workflow.trigger.type == 'scheduled'){
            var cadence = {
                cadence: workflow.trigger.cadence,
                days: workflow.trigger.days ? workflow.trigger.days : null,
                hours: workflow.trigger.time ? workflow.trigger.time : null,
            }
            var testCadence = 'every 10 seconds'
            addBreeJob(workflow.parent_project_uuid, workflow.uuid,testCadence)
        }
        res.status(200).send(workflow);
    });
});

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