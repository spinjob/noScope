var express = require('express');
var router = express.Router();
router.use(express.urlencoded({extended: true}));
router.use(express.json());
const crypto = require('crypto');
const Project = require('../project/Project');
const {verifyUser} = require('../../authenticate.js');
const Interface = require('../interface/Interface');
const Workflow = require('../workflow/Workflow');
const lib = require('../../lib.js')

// CREATE A PROJECT
router.post('/new', function(req,res) {
    
    var projectUUID = crypto.randomUUID();

    Project.create({
        uuid: projectUUID,
        name: req.body.name,
        interfaces: req.body.interfaces,
        created_at: new Date().toISOString().replace(/T/, ' ').replace(/\..+/, ''),
        updated_at: new Date().toISOString().replace(/T/, ' ').replace(/\..+/, ''),
        workflows: req.body.workflows,
        status: 'Scoping',
        owning_organization: req.body.organizationId,
        created_by: req.body.created_by
    },
    function (err,project) {
        if (err) return res.status(500).send("There was a problem adding the information to the database.");
        res.status(200).send(project);
    });
});

// GET A PROJECT
router.get('/:id/details', function(req,res) {

    Project.find({uuid: req.params.id}, function (err, project) {
        if (err) return res.status(500).send("There was a problem finding the project.");
        res.status(200).send(project);
    });
});

// FIND PROJECTS BY ORGANIZATION
router.get('/', (req,res) => {
    if (req.query.organization) {
        Project.find({owning_organization: req.query.organization}, function (err, projects) {
            if (err) return res.status(404).send("There was a problem finding the projects with the provided organization ID.");
            res.status(200).send(projects);
        })
    } else {
        res.status(400).send({message: "No organization ID provided."})
      }   
});

//GET PROJECTS
// router.get('/', function (req,res){
//     Project.find({}, function (err, projects) {
//                 if (err) return res.status(500).send("There was a problem finding the interfaces.");
//                 res.status(200).send(projects);
//     });
// })

/// GET PROJECT INTERFACES
router.post('/interfaces', function(req,res){
    Interface.find({uuid:{$in: req.body.interfaces}}, function (err, interfaces) {
        if (err) return res.status(500).send("There was a problem finding webhooks for the provided interface ID.");
        res.status(200).send(interfaces);
    });
});



//UPDATE A PROJECT
router.put('/:id', function (req,res){
    Project.findOneAndUpdate(
        {uuid: req.params.id}, 
        { 
            $addToSet: {
                workflows: req.body.uuid,
                interfaces: { $each: req.body.interfaces }
            }
        }, 
        function (err, project) {
            if (err) return res.status(500).send(err);
            res.status(200).send(project);
        }
    );
})

//UPDATE PROJECT CUSTOMER LIST
router.put('/:id/customers', function (req,res){

    Project.findOneAndUpdate({uuid: req.params.id}, {"customers": req.body.customers}, function (err, project) {
        if (err) return res.status(500).send("There was a problem updating the project.");
        res.status(200).send(project);
    });

})

router.put('/:id/configuration', function (req,res){
    Project.findOneAndUpdate({uuid: req.params.id}, {"configuration": req.body.configurations, "customer_configuration": req.body.customerConfigurations}, function (err, project) {
        if (err) return res.status(500).send("There was a problem updating the project.");
        res.status(200).send(project);
    });
})

router.put('/:id/status', function(req,res){
    Project.findOneAndUpdate({uuid: req.params.id}, {"status": req.body.status}, function (err, project) {
        if (err) return res.status(500).send("There was a problem updating the project.");
        res.status(200).send(project);
    });
})

router.put('/:id/authentication', function(req,res){
    Project.findOneAndUpdate({uuid: req.params.id}, {"authentication": req.body.authentication}, function (err, project) {
        if (err) return res.status(500).send("There was a problem updating the project.");
        res.status(200).send(project);
    });
})

router.post('/:id/embed', function(req,res){

    const getProject = () => {
        return new Promise((resolve, reject) => {
        Project.findOne({uuid: req.params.id}, function (err, project) {
            if (err) reject(err);
            else resolve(project)
        });
        })
    }

    const getWorkflows = () => {
        return new Promise((resolve, reject) => {
        Workflow.find({parent_project_uuid: req.params.id}, function (err, workflows) {
            if (err) reject(err);
            else resolve(workflows)
        });
        })
    }

    // Execute all asynchronous operations using Promise.all
    Promise.all([getProject(), getWorkflows()])
    .then(([project, workflows]) => {

        let filteredWorkflows = workflows.filter(workflow => workflow.status != 'Archived')
        let partnership = {
            details: project,
            workflows: filteredWorkflows,
            uuid: req.params.id,
        };

        lib.processPartnershipForVectorDb(partnership).then((results) => {

            if(results && results.status !== 'Error'){
                console.log(results)
                res.status(200).send(results)

                Project.findOneAndUpdate({uuid: req.params.id}, {"indexed": true}, {new: true}, function(err,interface) {
                    if(err) console.log(err)
                    else console.log("Interface updated successfully")
                });

            } else {
                console.log(results)
                res.status(500).send(results)
            }
                
        }).catch((err) => {
            console.log(err)
            res.status(500).send(err)
        })
    })
    .catch((error) => {
        console.error(error);
        res.status(500).send("An error occurred while generating the API spec.");
    });

})

router.post('/:id/query', function(req,res){
    const pinecone = new PineconeClient();
    const embeddings = req.body.embeddings;

    // Query Pinecone
    pinecone.init({
        environment: 'us-central1-gcp',
        apiKey: process.env.REACT_APP_PINECONE_API_KEY
    }).then(() => {
        console.log('Pinecone client initialized')
        
        const index = pinecone.Index('api-index')
        
        const queryRequest = {
            vector: embeddings,
            topK: 10,
            includeValues: false,
            includeMetadata: true,
            filter: {
                partnership_uuid: req.params.id,
            }
          }

        index.query({queryRequest}).then((response) => {
            console.log("Pinecone Query Response: ")
            console.log(response)
            res.status(200).send(response.matches)
        }).catch((err) => {
            console.log(err)
            res.status(500).send(err)
        })
        }).catch((err) => {
            console.log(err)
            res.status(500).send(err)
        })
        

});


module.exports = router;