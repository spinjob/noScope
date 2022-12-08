var express = require('express');
var router = express.Router();
router.use(express.urlencoded({extended: true}));
router.use(express.json());
var InterfaceParameter = require('./InterfaceParameter');

// GET INTERFACE PARAMETERS
router.get('/:id/parameters', function(req,res){
    InterfaceParameter.find({parent_interface_uuid:req.params.id}, function (err, interfaceParameter) {
        if (err) return res.status(500).send("There was a problem finding parameters for the provided interface ID.");
        //if (!user) return res.status(404).send("The interface you provided was not found.")
        res.status(200).send(interfaceParameter);
    });
});

module.exports = router;