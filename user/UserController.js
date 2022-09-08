var express = require('express');
var router = express.Router();
router.use(express.urlencoded({extended: true}));
router.use(express.json());
var User = require('./User');

// CREATE A USER
router.post('/', function(req,res) {
    User.create({
        name: req.body.name,
        email: req.body.email,
        password: req.body.password
    },
    function (err,user) {
        if (err) return res.status(500).send("There was a problem adding the information to the database.");
        res.status(200).send(user);
    });
});

// GET ALL USERS
router.get('/', function (req,res) {
    User.find({}, function (err, users) {
        if (err) return res.status(500).send("There was a problem finding the users.");
        res.status(200).send(users);
    });
});

// GET A USER
router.get('/:id', function(req,res){
    User.findById(req.params.id, function (err, user) {
        if (err) return res.status(500).send("There was a problem find the user.");
        if (!user) return res.status(404).send("The user you provided was not found.")
        res.status(200).send(user);
    });
});

// DELETE A USER FROM THE DATABASE
router.delete('/:id', function(req,res){
    User.findByIdAndRemove(req.params.id, function(err,user) {
        if (err) return req.status(500).send("There was a problem deleting your user.");
        res.status(200).send("The user " + user.name+ " has been sucessfully deleted.")
    });
});

// UPDATE A USER
router.put('/:id', function(req,res){ 
    User.findByIdAndUpdate(req.params.id, req.body, {new: true}, function(err,user) {
        if (err) return res.status(500).send("There was a problem updating the user.");
        res.status(200).send(user);
    });
});


module.exports = router;