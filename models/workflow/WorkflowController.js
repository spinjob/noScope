var express = require('express');
var router = express.Router();
router.use(express.urlencoded({extended: true}));
router.use(express.json());
const crypto = require('crypto');
const Workflow = require('../workflow/Workflow');
const {verifyUser} = require('../../authenticate.js');

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

router.get('/:workflowId', function(req,res) {
    Workflow.find({uuid: req.params.workflowId}, function (err, workflow) {
        if (err) return res.status(500).send("There was a problem finding the project.");
        res.status(200).send(workflow);
    });
});



module.exports = router;