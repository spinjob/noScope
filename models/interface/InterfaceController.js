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
router.post('/upload', verifyUser, (req,res, next) => {

    const { signedCookies = {} } = req
    const { refreshToken } = signedCookies
    var userIdString = JSON.stringify(req.user._id).replace('"', '').replace('"', '');

    User.findById(req.user._id).then(
        user => {
          const tokenIndex = user.refreshToken.findIndex(
            item => item.refreshToken === refreshToken
          )
    
          if (tokenIndex !== -1) {
            user.refreshToken.id(user.refreshToken[tokenIndex]._id).remove()
          }
    
          user.save((err, user) => {
            if (err) {
              res.statusCode = 500
              res.send(err)
            } else {
              var info = lib.processOpenApiV3(req.body, userIdString);
              res.send({ success: true, info: info })
            }
          })
        },
        err => next(err)
      )
    
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

// GET MY INTERFACES
// router.get('/', verifyUser, (req,res, next) => {
//     const { signedCookies = {} } = req

//     Interface.find({created_by: req.user._id}, function (err, interfaces) {
//         if (err) return res.status(500).send("There was a problem finding the interfaces.");
//         res.status(200).send(interfaces);
//     });
// });

//GET ALL INTERFACES (NO USER AUTH)
router.get('/', (req,res) => {

    Interface.find({}, function (err, interfaces) {
        if (err) return res.status(500).send("There was a problem finding the interfaces.");
        res.status(200).send(interfaces);
    });
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
  Interface.findOneAndUpdate({uuid: req.params.id}, {"sandbox_server": req.body.sandboxServer, "production_server": req.body.productionServer}, {new: true}, function(err,interface) {
      if (err) return res.status(500).send("There was a problem updating the interface's servers.");
      res.status(200).send(interface);
  });
});



module.exports = router;