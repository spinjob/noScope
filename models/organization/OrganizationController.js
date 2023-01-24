var express = require('express');
var router = express.Router();
router.use(express.urlencoded({extended: true}));
router.use(express.json());
const crypto = require('crypto');
var Organization = require('./Organization');

// CREATE ORGANIZATION
router.post('/', function(req,res) {
    
    Organization.create({
        uuid: req.body.uuid,
        name: req.body.name,
        created_at: new Date().toISOString().replace(/T/, ' ').replace(/\..+/, ''),
        updated_at: new Date().toISOString().replace(/T/, ' ').replace(/\..+/, ''),
        created_by: req.body.created_by
    },
    function (err,organization) {
        if (err) return res.status(500).send("There was a problem adding the information to the database.");
        res.status(200).send(organization);
    });

});

// GET ORGANIZATION
router.get('/:id', function(req,res) {

    Organization.findOne({uuid: req.params.id}, function (err, organization) {
        if (err) return res.status(500).send("There was a problem finding the project.");
        res.status(200).send(organization);
    });

});

//UPDATE ORGANIZATION
router.put('/:id', function (req,res){

    Organization.findOneAndUpdate({uuid: req.params.id}, {
        name: req.body.name,
        updated_at: new Date().toISOString().replace(/T/, ' ').replace(/\..+/, ''),
        configurations: req.body.configurations,
        interfaces: req.body.interfaces,
        partnerships: req.body.partnerships
    },
        function (err, organization) {
        if (err) return res.status(500).send("There was a problem updating the organization.");
        res.status(200).send(organization);
    });

})


module.exports = router;