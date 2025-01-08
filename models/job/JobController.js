var express = require('express');
var router = express.Router();
router.use(express.urlencoded({extended: true}));
router.use(express.json());
const crypto = require('crypto');
const Job = require('../job/Job');

router.post('/', function(req,res) {
    var jobUUID = crypto.randomUUID();
    Job.create({
        uuid: jobUUID,
        type: req.body.type,
        status: "PENDING",
        metadata: req.body.metadata,
        created_at: new Date().toISOString().replace(/T/, ' ').replace(/\..+/, ''),
        updated_at: new Date().toISOString().replace(/T/, ' ').replace(/\..+/, ''),
        created_by: req.body.created_by
    }, function (err,job) {
        if (err) return res.status(500).send("There was a problem creating the job.");
        res.status(200).send(job);
    });
    
})

router.get('/:jobId', function(req,res) {
    Job.findOne({uuid: req.params.jobId}, function (err, job) {
        if (err) return res.status(500).send("There was a problem finding the project.");
        res.status(200).send(job);
    });
})

router.put('/:jobId', function (req,res){
        Job.findOneAndUpdate({uuid: req.params.jobId}, {
            status: req.body.status,
            updated_at: new Date().toISOString().replace(/T/, ' ').replace(/\..+/, ''),
            metadata: req.body.metadata
        },
        function (err, job) {
        if (err) return res.status(500).send("There was a problem updating the job.");
        res.status(200).send(job);
    });
})


module.exports = router