var express = require('express');
var router = express.Router();
router.use(express.urlencoded({extended: true}));
router.use(express.json());
const crypto = require('crypto');
const Project = require('../project/Project');

// CREATE A PROJECT
router.post('/new', function(req,res) {
    
    Project.create({
        uuid: req.body.uuid,
        name: req.body.name,
        interfaces: req.body.interfaces,
        created_at: new Date().toISOString().replace(/T/, ' ').replace(/\..+/, ''),
        updated_at: new Date().toISOString().replace(/T/, ' ').replace(/\..+/, ''),
        created_by: req.body.created_by
    },
    function (err,project) {
        if (err) return res.status(500).send("There was a problem adding the information to the database.");
        res.status(200).send(project);
    });
});

// GET A PROJECT
router.get('/:id/details', function(req,res) {

    Project.find({uuid: req.params.id}, function (err, project) {
        if (err) return res.status(500).send("There was a problem finding the project.");
        res.status(200).send(project);
    });
});


module.exports = router;