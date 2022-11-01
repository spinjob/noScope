const express = require('express');
const app = express();
const db = require('../db');
const path = require('path');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const passport = require('passport');
require('../strategies/JwtStrategy');
require('../strategies/LocalStrategy');
require('../authenticate.js');

const UserController = require('../models/user/UserController');
const InterfaceController = require('../models/interface/InterfaceController')
const InterfaceEntityController = require('../models/interface_entity/InterfaceEntityController');
const ProjectController = require('../models/project/ProjectController');
const InterfaceWebhookController = require('../models/interface_webhook/InterfaceWebhookController');
const InterfaceActionController = require('../models/interface_action/InterfaceActionController');

if (process.env.NODE_ENV !== "production") {
    // Load environment variables from .env file in non prod environments
    require("dotenv").config()
  }

app.use(express.json({limit: "200mb", extended: true}))
app.use(express.urlencoded({limit: "200mb", extended: true, parameterLimit: 50000}))
app.use(cookieParser(process.env.COOKIE_SECRET));
app.use(express.static('client/build'));

const whitelist = process.env.WHITELISTED_DOMAINS 
? process.env.WHITELISTED_DOMAINS.split(',')
: []

const corsOptions = {
    origin: function (origin, callback) {
        if (!origin || whitelist.indexOf(origin) !== -1) {
            callback(null, true)
        } else {
            callback(new Error('Not allowed by CORS'))
        }
    },
    credentials: true
}

app.use(cors(corsOptions));
app.use(passport.initialize());
app.use('/users', UserController);
app.use('/interfaces', InterfaceController);
app.use('/interfaces', InterfaceEntityController);
app.use('/projects', ProjectController);
app.use('/interfaces', InterfaceWebhookController);
app.use('/interfaces/actions', InterfaceActionController);

//All other GET requests not handled will return our React app
app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../client/build', 'index.html'));
});

if (process.env.NODE_ENV === 'production') {
	app.use(express.static('client/build'));
}

app.get('*', (request, response) => {
	response.sendFile(path.join(__dirname, 'client/build', 'index.html'));
});

module.exports = app;   