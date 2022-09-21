var express = require('express');
var app = express();
var db = require('./db');
var UserController = require('./user/UserController');
var InterfaceController = require('./interface/InterfaceController')
app.use('/interfaces', InterfaceController);
app.use('/users', UserController);
module.exports = app;    