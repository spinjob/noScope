var express = require('express');
var router = express.Router();
router.use(express.urlencoded({extended: true}));
router.use(express.json());
var InterfaceProperty = require('./InterfaceProperty');
const lib = require('../lib');

module.exports = router;