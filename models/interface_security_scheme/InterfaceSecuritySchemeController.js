var express = require('express');
var router = express.Router();
router.use(express.urlencoded({extended: true}));
router.use(express.json());
var InterfaceSecurityScheme = require('./InterfaceSecurityScheme');

// GET INTERFACE SECURITY SCHEMES
router.post('/security', function(req,res){
    InterfaceSecurityScheme.find({parent_interface_uuid:{$in: req.body.interfaces}}, function (err, interfaceSecurityScheme) {
        if (err) return res.status(500).send("There was a problem finding security schemes for the provided interface IDs.");
        res.status(200).send(interfaceSecurityScheme);
    });
});


module.exports = router;