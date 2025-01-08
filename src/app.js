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
const {bree, addBreeJob} = require('../bree');

const UserController = require('../models/user/UserController');
const InterfaceController = require('../models/interface/InterfaceController')
const InterfaceEntityController = require('../models/interface_entity/InterfaceEntityController');
const ProjectController = require('../models/project/ProjectController');
const InterfaceWebhookController = require('../models/interface_webhook/InterfaceWebhookController');
const InterfaceActionController = require('../models/interface_action/InterfaceActionController');
const WorkflowController = require('../models/workflow/WorkflowController');
const TransformerController = require('../models/transformer/TransformerController');
const InterfaceSecuritySchemeController = require('../models/interface_security_scheme/InterfaceSecuritySchemeController');
const InterfaceParameterController = require('../models/interface_parameter/InterfaceParameterController');
const WorkflowLogController = require('../models/workflow_log/WorkflowLogController');
const OrganizationController = require('../models/organization/OrganizationController');
const CustomerController = require('../models/customer/CustomerController');
const JobController = require('../models/job/JobController');
const CodeController = require('../models/code/CodeController');
const Job = require('../models/job/Job');
const ConnectionController = require('../models/connection/ConnectionController');

if (process.env.NODE_ENV !== "production") {
    // Load environment variables from .env file in non prod environments
    require("dotenv").config()
  }

app.use(express.json({limit: "200mb", extended: true}))
app.use(express.urlencoded({limit: "200mb", extended: true, parameterLimit: 50000}))
app.use(cookieParser(process.env.COOKIE_SECRET));
// app.use(express.static('client/build'));

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
app.use('/interfaces', InterfaceParameterController);
app.use('/projects', ProjectController);
app.use('/interfaces', InterfaceWebhookController);
app.use('/interfaces/actions', InterfaceActionController);
app.use('/projects/:id/workflows',WorkflowController);
app.use('/workflows', WorkflowLogController);
app.use('/interfaces', InterfaceSecuritySchemeController);
app.use('/transform', TransformerController);
app.use('/organizations', OrganizationController);
app.use('/customers', CustomerController);
app.use('/jobs', JobController);
app.use('/code', CodeController);
app.use('/connections', ConnectionController);

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

var breeJobs = bree.config.jobs ? bree.config.jobs : []
var processedDbJobs = []

Job.find({type: "scheduled_workflow", status: "ACTIVE"}).then(jobs => {
    console.log("Active Scheduled Jobs")
    console.log(jobs)
    console.log("Bree Jobs")
    console.log(breeJobs)
    if(jobs.length - 1 != breeJobs.length) {
        jobs.forEach(dbJob => {
            if(!processedDbJobs.includes(dbJob.uuid)) {
                processedDbJobs.push(dbJob.uuid)
                if(breeJobs.filter(breeJob => breeJob.name === `trigger-workflow-${dbJob.metadata.project_uuid}-${dbJob.metadata.workflow_uuid}`).length == 0) {
                    addBreeJob(dbJob.metadata.project_uuid, dbJob.metadata.workflow_uuid, dbJob.metadata.cadence, dbJob.uuid)
                }
            } else {
                console.log("Job already processed")
            }   
        })
    }
})

  
module.exports = app;   