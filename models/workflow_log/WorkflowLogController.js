var express = require('express');
var router = express.Router();
router.use(express.urlencoded({extended: true}));
router.use(express.json());
const crypto = require('crypto');
const WorkflowLog = require('../workflow_log/WorkflowLog');

router.get('/:workflowId/logs', function(req,res) {
    WorkflowLog.find({workflow_uuid: req.params.workflowId}, function (err, workflowLog) {
        if (err) return res.status(500).send("There was a problem finding the project.");
        res.status(200).send(workflowLog);
    });

})

module.exports = router