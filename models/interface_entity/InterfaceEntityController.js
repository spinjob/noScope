var express = require('express');
var router = express.Router();
router.use(express.urlencoded({extended: true}));
router.use(express.json());
var InterfaceEntity = require('./InterfaceEntity');

// CREATE AN INTERFACE OBJECT
router.post('/', function(req,res) {
    InterfaceEntity.create({
        parent_interface_uuid: req.body.parent_interface_uuid,
        name: req.body.name,
        description: req.body.description,
        type: req.body.type,
        children_entities: req.body.children_entities,
        items: req.body.items
    },
    function (err,interface) {
        if (err) return res.status(500).send("There was a problem adding the information to the database.");
        res.status(200).send(interface);
    });
});

// GET INTERFACE OBJECTS
router.get('/:id/objects', function(req,res){
    InterfaceEntity.find({parent_interface_uuid:req.params.id}, function (err, interfaceEntity) {
        if (err) return res.status(500).send("There was a problem finding objects for the provided interface ID.");
        //if (!user) return res.status(404).send("The interface you provided was not found.")
        res.status(200).send(interfaceEntity);
    });
});


module.exports = router;