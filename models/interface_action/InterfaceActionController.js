var express = require('express');
var router = express.Router();
router.use(express.urlencoded({extended: true}));
router.use(express.json());
var InterfaceAction = require('./InterfaceAction');
var uuidv4 = require('uuid/v4');

// GET INTERFACE ACTIONS
router.post('/', function(req,res){
    InterfaceAction.find({parent_interface_uuid:{$in: req.body.interfaces}}, function (err, interfaceActions) {
        if (err) return res.status(500).send("There was a problem finding webhooks for the provided interface ID.");
        res.status(200).send(interfaceActions);
    });
})

router.post('/new', function(req,res){
    var actionUUID = uuidv4();
    InterfaceAction.create({
        uuid: actionUUID,
        parent_interface_uuid: req.body.parent_interface_uuid,
        name: req.body.name,
        method: req.body.method,
        path: req.body.path,
        parameterSchema: req.body.parameterSchema ? req.body.parameterSchema : null,
        requestBody: req.body.requestBody ? req.body.requestBody : null,
        requestBody2: req.body.requestBody2 ? req.body.requestBody2 : null,
        responses: req.body.responses ? req.body.responses : null
    }).then(function(interfaceAction){
        res.status(200).send(interfaceAction);
    }).catch(function(err){
        res.status(500).send(err);
    })
})


module.exports = router;