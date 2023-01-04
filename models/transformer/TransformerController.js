var express = require('express');
var router = express.Router();
const {Liquid} = require('liquidjs');
const engine = new Liquid();
router.use(express.urlencoded({extended: true}));
router.use(express.json());

//Example Callback URL for a Webhook Trigger
router.post('/', (req,res) => {
    //Get Action Liquid Template
    //add :actionId to the URL
    var actionId = req.params.actionId;
    var stringTemplate =     ` {
        "order":
         {
           "orderExternalIdentifiers": {
                "id": "{{order.orderExternalIdentifiers.id}}",
                "friendlyId": "{{order.orderExternalIdentifiers.id}}",
                "source": "{{order.orderExternalIdentifiers.source}}"
           },
        "items": [
             {%- for item in order.items %}
                {
                  "id": "{{item.id}}",
                  "skuPrice": {{item.skuPrice | times: 100}},
                  "note": "{{item.note}}"
                }
                {% unless forloop.last %},{% endunless -%}
             {% endfor %}
           ]
           
        }
      }`

    engine.parseAndRender(stringTemplate, req.body).then((result) => {
        res.status(200).send(result);
    }).catch((err) => {
        console.log(err);
        res.status(500).send(err);
    })
});

module.exports = router;