var express = require('express');
var router = express.Router();
router.use(express.urlencoded({extended: true}));
router.use(express.json());
var InterfaceAction = require('./InterfaceAction');

// GET INTERFACE ACTIONS
router.post('/', function(req,res){
    InterfaceAction.find({parent_interface_uuid:{$in: req.body.interfaces}}, function (err, interfaceActions) {
        if (err) return res.status(500).send("There was a problem finding webhooks for the provided interface ID.");
        res.status(200).send(interfaceActions);
    });
})

module.exports = router;