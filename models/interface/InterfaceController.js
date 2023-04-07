var express = require('express');
var router = express.Router();
router.use(express.urlencoded({extended: true}));
router.use(express.json());
var Interface = require('./Interface');
const lib = require('../../lib.js')
const crypto = require('crypto');
const User = require('../user/User');
const Job = require('../job/Job');
const {verifyUser} = require('../../authenticate.js');
const mailchimp = require('@mailchimp/mailchimp_marketing');

// IMPORT AN INTERFACE FROM SWAGGER
router.post('/upload', (req,res, next) => {
    
      var jobUUID = crypto.randomUUID();

      if(req.body.userId.includes('temp-')){
        // example temp-spencer.johnson10@gmail.com-012cbb2f-7778-4462-875a-b97b72e37479
        var landingPageEmail = req.body.userId.split('-')[1]

        mailchimp.setConfig({
            apiKey: process.env.MAILCHIMP_API_KEY,
            server: process.env.MAILCHIMP_SERVER_PREFIX,
            })
        
        const run = async () => {
            try {
                const response = await mailchimp.lists.addListMember('8c7771172f', {
                email_address: landingPageEmail,
                status: "subscribed",
                });
        
            } catch (error) {
                console.error("An error occurred:", error.message);
                // handle the error gracefully here, such as logging it or displaying a user-friendly error message
            }
            };
            
            run();
      }

      Job.create({
        uuid: jobUUID,
        type: "API_IMPORT",
        status: "PENDING",
        created_at: new Date().toISOString().replace(/T/, ' ').replace(/\..+/, ''),
        updated_at: new Date().toISOString().replace(/T/, ' ').replace(/\..+/, ''),
        created_by: req.body.userId,
        metadata: {
            schema: {
                status: "PENDING",
                count: 0,
                message: "No schema has been generated yet."
            },
            webhooks: {
                status: "PENDING",
                count: 0,
                message: "No webhooks have been generated yet."
            },
            actions: {
                status: "PENDING",
                count: 0,
                message: "No actions have been generated yet."
            },
            parameters: {
                status: "PENDING",
                count: 0,
                message: "No parameters have been generated yet."
            },
            securitySchemes: {
                status: "PENDING",
                count: 0,
                message: "No security schemes have been generated yet."
            }
        }

      },
      function (err,job) {
            if(err) {
                console.log(err)
                res.status(500).send(err)
            } else {
                if(req.body.spec.openapi?.split('.')[0] == "2" || req.body.spec.swagger?.split('.')[0] == "2"){
                    console.log("OPEN API 2.X")
                    lib.processOpenApiV2(req.body.spec, req.body.userId, req.body.organizationId,jobUUID);
                    
                  } else if (req.body.spec.openapi?.split('.')[0] == "3" || req.body.spec.swagger?.split('.')[0] == "3"){
                    console.log("OPEN API 3.X")
                    lib.processOpenApiV3(req.body.spec, req.body.userId, req.body.organizationId, jobUUID)
            
                  } else {
                    console.log("NOT OPENAPI OR SWAGGER, TRYING POSTMAN")
                    lib.convertPostmanCollection(req.body.spec, req.body.userId, req.body.organizationId, jobUUID);
                  }
                res.status(200).send(job)
            } 
      });
});


// CREATE AN INTERFACE
router.post('/', function(req,res) {
    Interface.create({
        name: req.body.name,
        description: req.body.description,
        version: req.body.version,
        owning_organization: req.body.organizationId
    },
    function (err,interface) {
        if (err) return res.status(500).send("There was a problem adding the information to the database.");
        res.status(200).send(interface);
    });
});



//GET ALL INTERFACES (NO USER AUTH)
router.get('/', (req,res) => {
    if (req.query.organization) {
        Interface.find({owning_organization: req.query.organization}, function (err, interfaces) {
            if (err) return res.status(404).send("There was a problem finding the interfaces with the provided organization ID.");
            res.status(200).send(interfaces);
        })
    } else {
        res.status(400).send({message: "No organization ID provided."})
      }   
});

// GET AN INTERFACE
router.get('/:id', function(req,res){
    Interface.findOne({uuid: req.params.id}, function (err, interface) {
        if (err) return res.status(500).send("There was a problem find the interface.");
        res.status(200).send(interface);
    });
});

// DELETE AN INTERFACE FROM THE DATABASE
router.delete('/:id', function(req,res){
    Interface.findByIdAndRemove(req.params.id, function(err,interface) {
        if (err) return req.status(500).send("There was a problem deleting your interface.");
        res.status(200).send("The interface " + interface.name+ " has been sucessfully deleted.")
    });
});

// UPDATE AN INTERFACE
router.put('/:id', function(req,res){ 
    Interface.findByIdAndUpdate(req.params.id, req.body, {new: true}, function(err,interface) {
        if (err) return res.status(500).send("There was a problem updating the interface.");
        res.status(200).send(interface);
    });
});

// UPDATE AN INTERFACE'S SERVERS
router.put('/:id/servers', function(req,res){ 
  Interface.findOneAndUpdate({uuid: req.params.id}, {"sandbox_server": req.body.sandboxServer, "production_server": req.body.productionServer,"credentials":req.body.credentials}, {new: true}, function(err,interface) {
      if (err) return res.status(500).send("There was a problem updating the interface's servers.");
      res.status(200).send(interface);
  });
});



module.exports = router;