var express = require('express');
var router = express.Router();
router.use(express.urlencoded({extended: true}));
router.use(express.json());

module.exports = router;