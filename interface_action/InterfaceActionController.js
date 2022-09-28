var express = require('express');
var router = express.Router();
router.use(express.urlencoded({extended: true}));
router.use(express.json());
var InterfaceAction = require('./InterfaceAction');

// CREATE AN INTERFACE OBJECT
router.post('/', function(req,res) {
    InterfaceAction.create({
        uuid: req.body.uuid,
        parent_interface_uuid: req.body.parent_interface_uuid,
        path: req.body.path,
        parameters: req.body.parameters,
        environment: req.body.environment
    },
    function (err,interfaceAction) {
        if (err) return res.status(500).send("There was a problem adding the information to the database.");
        res.status(200).send(interfaceAction);
    });
});

// GET INTERFACE OBJECTS
router.get('/:id/objects', function(req,res){
    InterfaceAction.find({parent_interface_uuid:req.params.id}, function (err, interfaceAction) {
        if (err) return res.status(500).send("There was a problem finding paths for the provided interface ID.");
        if (!user) return res.status(404).send("The interface you provided was not found.")
        res.status(200).send(interfaceAction);
    });
});


module.exports = router;