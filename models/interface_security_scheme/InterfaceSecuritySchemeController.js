var express = require('express');
var router = express.Router();
router.use(express.urlencoded({extended: true}));
router.use(express.json());
var InterfaceSecurityScheme = require('./InterfaceSecurityScheme');
const crypto = require('crypto');

// GET INTERFACE SECURITY SCHEMES
router.post('/security', function(req,res){
    InterfaceSecurityScheme.find({parent_interface_uuid:{$in: req.body.interfaces}}, function (err, interfaceSecurityScheme) {
        if (err) return res.status(500).send("There was a problem finding security schemes for the provided interface IDs.");
        res.status(200).send(interfaceSecurityScheme);
    });
});

router.post('/:id/security', function(req,res){
    InterfaceSecurityScheme.create({
        uuid: crypto.randomUUID(),
        parent_interface_uuid: req.params.id,
        type: req.body.type,
        flows: req.body.flows,
        created_at: new Date().toISOString().replace(/T/, ' ').replace(/\..+/, ''),
        updated_at: new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '')
    }, function (err,interfaceSecurityScheme) {
        if (err) return res.status(500).send(err);
        res.status(200).send(interfaceSecurityScheme);
    });
});

router.put('/:id/security', function(req,res){
    InterfaceSecurityScheme.findOneAndUpdate({
        parent_interface_uuid: req.params.id,
        security_scheme_uuid: req.body.security_scheme_uuid
    }, {
        $set: {
            type: req.body.type,
            flows: req.body.flows,
            updated_at: new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '')
        }
    }, {new: true}, function(err,interfaceSecurityScheme) {
        if (err) return res.status(500).send(err);
        res.status(200).send(interfaceSecurityScheme);
    });
});


module.exports = router;