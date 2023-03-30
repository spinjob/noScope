var express = require('express');
var router = express.Router();
router.use(express.urlencoded({extended: true}));
router.use(express.json());
const InterfaceWebhook = require('./InterfaceWebhook');
const crypto = require('crypto');

// FIND INTERFACE WEBHOOKS
router.post('/webhooks', function(req,res){
    InterfaceWebhook.find({parent_interface_uuid:{$in: req.body.interfaces}}, function (err, interfaceWebhooks) {
        if (err) return res.status(500).send("There was a problem finding webhooks for the provided interface ID.");
        res.status(200).send(interfaceWebhooks);
    });
});

// CREATE A WEBHOOK
router.post('/:id/webhooks/new', function(req,res) {
    var webhookUUID = crypto.randomUUID();
    InterfaceWebhook.create({
        uuid: webhookUUID,
        ...req.body
    },
    function (err,interfaceWebhook) {
        if (err) return res.status(500).send("There was a problem finding webhooks for the provided interface ID.");
        res.status(200).send(interfaceWebhook);
    });
});


module.exports = router;