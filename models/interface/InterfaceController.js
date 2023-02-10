var express = require('express');
var router = express.Router();
router.use(express.urlencoded({extended: true}));
router.use(express.json());
var Interface = require('./Interface');
const lib = require('../../lib.js')
const crypto = require('crypto');
const User = require('../user/User');
const {verifyUser} = require('../../authenticate.js');

// IMPORT AN INTERFACE FROM SWAGGER
router.post('/upload', (req,res, next) => {
    console.log("UPLOADING INTERFACE")
      if(req.body.spec.openapi?.split('.')[0] == "2" || req.body.spec.swagger?.split('.')[0] == "2"){
        console.log("OPEN API 2.X")
        var info = lib.processOpenApiV2(req.body.spec, req.body.userId, req.body.organizationId);
        res.send({ success: true, info: info })

      } else if (req.body.spec.openapi?.split('.')[0] == "3" || req.body.spec.swagger?.split('.')[0] == "3"){
        console.log("OPEN API 3.X")
        var info = lib.processOpenApiV3(req.body.spec, req.body.userId, req.body.organizationId);
        res.send({ success: true, info: info })

      } else {
        console.log("NOT SWAGGER, TRYING POSTMAN")
        var info = lib.convertPostmanCollection(req.body.spec, req.body.userId, req.body.organizationId);
        res.send({ success: true, info: info })
      }
    
});


// CREATE AN INTERFACE
router.post('/', function(req,res) {
    Interface.create({
        name: req.body.name,
        description: req.body.description,
        version: req.body.version,

    },
    function (err,interface) {
        if (err) return res.status(500).send("There was a problem adding the information to the database.");
        res.status(200).send(interface);
    });
});



//GET ALL INTERFACES (NO USER AUTH)
router.get('/', (req,res) => {
    if (req.query.organization) {
      console.log("ORGANIZATION QUERY: " + req.query.organization)
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
    Interface.findById(req.params.id, function (err, interface) {
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