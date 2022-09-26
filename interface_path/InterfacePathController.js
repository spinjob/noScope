var express = require('express');
var router = express.Router();
router.use(express.urlencoded({extended: true}));
router.use(express.json());
var InterfacePath = require('./InterfacePath');
const lib = require('../lib');

// CREATE AN INTERFACE OBJECT
router.post('/', function(req,res) {
    InterfacePath.create({
        uuid: req.body.uuid,
        parent_interface_uuid: req.body.parent_interface_uuid,
        path: req.body.path,
        parameters: req.body.parameters,
        environment: req.body.environment
    },
    function (err,interfacePath) {
        if (err) return res.status(500).send("There was a problem adding the information to the database.");
        res.status(200).send(interfacePath);
    });
});

// GET INTERFACE OBJECTS
router.get('/:id/objects', function(req,res){
    InterfacePath.find({parent_interface_uuid:req.params.id}, function (err, interfacePath) {
        if (err) return res.status(500).send("There was a problem finding paths for the provided interface ID.");
        if (!user) return res.status(404).send("The interface you provided was not found.")
        res.status(200).send(interfacePath);
    });
});


module.exports = router;