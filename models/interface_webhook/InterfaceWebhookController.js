var express = require('express');
var router = express.Router();
router.use(express.urlencoded({extended: true}));
router.use(express.json());
var InterfaceWebhook = require('./InterfaceWebhook');

// GET INTERFACE WEBHOOKS
router.post('/webhooks', function(req,res){
    InterfaceWebhook.find({parent_interface_uuid:{$in: req.body.interfaces}}, function (err, interfaceWebhooks) {
        if (err) return res.status(500).send("There was a problem finding webhooks for the provided interface ID.");
        res.status(200).send(interfaceWebhooks);
    });
});


module.exports = router;