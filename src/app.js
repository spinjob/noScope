var express = require('express');
var app = express();
var db = require('../db');
const path = require('path');

var InterfaceController = require('../interface/InterfaceController')
var InterfaceEntityController = require('../interface_entity/InterfaceEntityController');

//All other GET requests not handled will return our React app
app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../client/build', 'index.html'));
});

app.use(express.json({limit: "200mb", extended: true}))
app.use(express.urlencoded({limit: "200mb", extended: true, parameterLimit: 50000}))
app.use('/interfaces', InterfaceController);
app.use('/interfaces', InterfaceEntityController);
app.use(express.static(path.resolve(__dirname, '../client/build')));


module.exports = app;   