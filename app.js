var express = require('express');
var app = express();
var db = require('./db');
var UserController = require('./user/UserController');
var InterfaceController = require('./interface/InterfaceController')
var InterfaceEntityController = require('./interface_entity/InterfaceEntityController');

app.use(express.json({limit: "200mb", extended: true}))
app.use(express.urlencoded({limit: "200mb", extended: true, parameterLimit: 50000}))
app.use('/interfaces', InterfaceController);
app.use('/interfaces', InterfaceEntityController);
app.use('/users', UserController);
module.exports = app;    