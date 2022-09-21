var express = require('express');
var router = express.Router();
router.use(express.urlencoded({extended: true}));
router.use(express.json());
var Interface = require('./Interface');

// CREATE AN INTERFACE
router.post('/interfaces', function(req,res) {
    Interface.create({
        name: req.body.name,
        description: req.body.description,
        version: req.body.version
    },
    function (err,interface) {
        if (err) return res.status(500).send("There was a problem adding the information to the database.");
        res.status(200).send(interface);
    });
});

// GET ALL INTERFACES
router.get('/interfaces', function (req,res) {
    Interface.find({}, function (err, interfaces) {
        if (err) return res.status(500).send("There was a problem finding the interfaces.");
        res.status(200).send(interfaces);
    });
});

// GET AN INTERFACE
router.get('/interfaces/:id', function(req,res){
    Interface.findById(req.params.id, function (err, interface) {
        if (err) return res.status(500).send("There was a problem find the interface.");
        if (!user) return res.status(404).send("The interface you provided was not found.")
        res.status(200).send(interface);
    });
});

// DELETE AN INTERFACE FROM THE DATABASE
router.delete('/interfaces/:id', function(req,res){
    Interface.findByIdAndRemove(req.params.id, function(err,interface) {
        if (err) return req.status(500).send("There was a problem deleting your interface.");
        res.status(200).send("The interface " + interface.name+ " has been sucessfully deleted.")
    });
});

// UPDATE AN INTERFACE
router.put('/interfaces/:id', function(req,res){ 
    Interface.findByIdAndUpdate(req.params.id, req.body, {new: true}, function(err,interface) {
        if (err) return res.status(500).send("There was a problem updating the interface.");
        res.status(200).send(interface);
    });
});


module.exports = router;