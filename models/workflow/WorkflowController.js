var express = require('express');
var router = express.Router();
router.use(express.urlencoded({extended: true}));
router.use(express.json());
const crypto = require('crypto');
const Workflow = require('../workflow/Workflow');
const Interface = require('../interface/Interface');
const {verifyUser} = require('../../authenticate.js');
const {runWorkflow} = require('../../lib.js');

// CREATE A WORKFLOW
router.post('/', function(req,res) {
    
    Workflow.create({
        uuid: req.body.uuid,
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
        if (err) return res.status(500).send(err);
        res.status(200).send(workflow);
    });
});

router.post('/details', function(req,res) {
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
    Workflow.findOneAndUpdate({uuid: req.params.workflowId}, {'trigger.translation': req.body.fullFormula, 'trigger.function': req.body.function, 'trigger.schema_tree': req.body.schemaTree, 'trigger.liquidTemplate': req.body.liquidTemplate}, function (err,workflow){
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

router.post('/:workflowId/trigger', function(req,res) {
    Workflow.findOne({uuid: req.params.workflowId}, function(err,workflow){
        if (err) {
            return res.status(500).send(err);
        } else {
            res.status(200).send(workflow);
            console.log(workflow);
            var actionInterfaceUuid = workflow.steps[0].request.parent_interface_uuid
            
            Interface.findOne({uuid: actionInterfaceUuid}, function(err,interface){
                if (err) return res.status(500).send(err);
                var actionInterface = interface;
                runWorkflow(workflow, actionInterface, "sandbox", req.body);
            })

        }

    });
});



module.exports = router;