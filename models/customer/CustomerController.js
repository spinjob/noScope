var express = require('express');
var router = express.Router();
router.use(express.urlencoded({extended: true}));
router.use(express.json());
const crypto = require('crypto');
var Customer = require('./Customer');

// CREATE CUSTOMERS
router.post('/', function(req,res) {
    
    Customer.create({
        uuid: req.body.uuid,
        name: req.body.name,
        email: req.body.email,
        key: req.body.key,
        notes: req.body.notes,
        configurations: req.body.configurations,
        parent_organizations: req.body.parent_organizations,
        created_at: new Date().toISOString().replace(/T/, ' ').replace(/\..+/, ''),
        updated_at: new Date().toISOString().replace(/T/, ' ').replace(/\..+/, ''),
        created_by: req.body.created_by
    },
    function (err,project) {
        if (err) return res.status(500).send("There was a problem adding the information to the database.");
        res.status(200).send(project);
    });
});

// GET ORGANIZATION CUSTOMERS
router.get('/', function(req,res) {
    Customer.find({parent_organizations: req.query.organization}, function (err, customers) {
        if (err) return res.status(500).send("There was a problem finding customers associated to the provided Organization UUID.");
        res.status(200).send(customers);
    });
});

// GET A CUSTOMER
router.get('/:id', function(req,res) {
    Customer.findOne({uuid: req.params.id}, function (err, customer) {
        if (err) return res.status(500).send("There was a problem finding a customer with the provided UUID.");
        res.status(200).send(customer);
    });
});

//UPDATE A CUSTOMER
router.put('/:id', function (req,res){

    Customer.findOneAndUpdate({uuid: req.params.id}, 
        { 
            updated_at: req.body.updated_at, 
            name: req.body.name,
            email: req.body.email,
            notes: req.body.notes,
            configurations: req.body.configurations,
            parent_organizations: req.body.parent_organizations
    
    }, function (err, customer) {
        if (err) return res.status(500).send("There was a problem updating the customer.");
        res.status(200).send(customer);
    });

})


module.exports = router;