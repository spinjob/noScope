var express = require('express');
var router = express.Router();
router.use(express.urlencoded({extended: true}));
router.use(express.json());
var Interface = require('./Interface');
var InterfaceAction = require('../interface_action/InterfaceAction');
var InterfaceWebhook = require('../interface_webhook/InterfaceWebhook');
var InterfaceSecurityScheme = require('../interface_security_scheme/InterfaceSecurityScheme');
var InterfaceParameter = require('../interface_parameter/InterfaceParameter');
var InterfaceEntity = require('../interface_entity/InterfaceEntity');

const lib = require('../../lib.js')
const crypto = require('crypto');
const User = require('../user/User');
const Job = require('../job/Job');
const {verifyUser} = require('../../authenticate.js');
const mailchimp = require('@mailchimp/mailchimp_marketing');
const {PineconeClient} = require('@pinecone-database/pinecone');

// IMPORT AN INTERFACE FROM SWAGGER
router.post('/upload', (req,res, next) => {
    
      var jobUUID = crypto.randomUUID();

      if(req.body.userId.includes('temp-')){
        // example temp-spencer.johnson10@gmail.com-012cbb2f-7778-4462-875a-b97b72e37479
        var landingPageEmail = req.body.userId.split('-')[1]

        mailchimp.setConfig({
            apiKey: process.env.MAILCHIMP_API_KEY,
            server: process.env.MAILCHIMP_SERVER_PREFIX,
            })
        
        const run = async () => {
            try {
                const response = await mailchimp.lists.addListMember('8c7771172f', {
                email_address: landingPageEmail,
                status: "subscribed",
                });
        
            } catch (error) {
                console.error("An error occurred:", error.message);
                // handle the error gracefully here, such as logging it or displaying a user-friendly error message
            }
            };
            
            run();
      }

      Job.create({
        uuid: jobUUID,
        type: "API_IMPORT",
        status: "PENDING",
        created_at: new Date().toISOString().replace(/T/, ' ').replace(/\..+/, ''),
        updated_at: new Date().toISOString().replace(/T/, ' ').replace(/\..+/, ''),
        created_by: req.body.userId,
        metadata: {
            schema: {
                status: "PENDING",
                count: 0,
                message: "No schema has been generated yet."
            },
            webhooks: {
                status: "PENDING",
                count: 0,
                message: "No webhooks have been generated yet."
            },
            actions: {
                status: "PENDING",
                count: 0,
                message: "No actions have been generated yet."
            },
            parameters: {
                status: "PENDING",
                count: 0,
                message: "No parameters have been generated yet."
            },
            securitySchemes: {
                status: "PENDING",
                count: 0,
                message: "No security schemes have been generated yet."
            }
        }

      },
      function (err,job) {
            if(err) {
                console.log(err)
                res.status(500).send(err)
            } else {
                if(req.body.spec.openapi?.split('.')[0] == "2" || req.body.spec.swagger?.split('.')[0] == "2"){
                    console.log("OPEN API 2.X")
                    lib.processOpenApiV2(req.body.spec, req.body.userId, req.body.owning_organization, req.body.importing_organization, jobUUID);
                    
                  } else if (req.body.spec.openapi?.split('.')[0] == "3" || req.body.spec.swagger?.split('.')[0] == "3"){
                    console.log("OPEN API 3.X")
                    
                    lib.processOpenApiV3(req.body.spec, req.body.userId, req.body.owning_organization, req.body.importing_organization, jobUUID)
            
                  } else {
                    console.log("NOT OPENAPI OR SWAGGER, TRYING POSTMAN")
                    lib.convertPostmanCollection(req.body.spec, req.body.userId, req.body.owning_organization, req.body.importing_organization, jobUUID);
                  }
                res.status(200).send(job)
            } 
      });
});


// CREATE AN INTERFACE
router.post('/', function(req,res) {
    Interface.create({
        uuid: crypto.randomUUID(),
        name: req.body.name,
        description: req.body.description,
        version: req.body.version,
        owning_organization: req.body.owning_organization,
        importing_organization: req.body.importing_organization,
        indexed: false
    },
    function (err,interface) {
        if (err) return res.status(500).send("There was a problem adding the information to the database.");
        res.status(200).send(interface);
    });
});

//FIND INTERFACES
router.get('/', (req,res) => {
    if (req.query.organization) {
        Interface.find({importing_organization: req.query.organization}, function (err, interfaces) {
            if (err) return res.status(404).send("There was a problem finding the interfaces with the provided organization ID.");
            res.status(200).send(interfaces);
        })
    } else if (req.query.job){
        Interface.findOne({ jobIds: { $in: [req.params.jobId] } }, function (err, interface) {
            if (err) return res.status(500).send("There was a problem finding the interface.");
            if (!interface) return res.status(404).send("No interface found with the provided jobId.");
            res.status(200).send(interface);
        });
    } else {
        res.status(400).send({message: "No parameters provided."})
    } 
   
});

// GET AN INTERFACE
router.get('/:id', function(req,res){
    Interface.findOne({uuid: req.params.id}, function (err, interface) {
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

router.put('/:id/documentation', function(req,res){
    Interface.findOneAndUpdate({uuid: req.params.id}, {"documentation": req.body.documentation}, {new: true}, function(err,interface) {
        if (err) return res.status(500).send("There was a problem updating the interface's documentation.");
        res.status(200).send(interface);
    });
});


// UPDATE AN INTERFACE'S SERVERS
router.put('/:id/servers', function(req,res){ 
  Interface.findOneAndUpdate({uuid: req.params.id}, {"sandbox_server": req.body.sandboxServer, "production_server": req.body.productionServer,"credentials":req.body.credentials}, {new: true}, function(err,interface) {
      if (err) return res.status(500).send("There was a problem updating the interface's servers.");
      res.status(200).send(interface);
  });
});

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
                api_uuid: req.params.id,
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

            // const queryGroup = (metadataType) => {
            //     const queryRequest = {
            //         vector: embeddings,
            //         topK: 10,
            //         includeValues: false,
            //         includeMetadata: true,
            //         filter: {
            //             api_uuid: req.params.id,
            //             metadata_type: metadataType
            //         }
            //     }
            //     return new Promise((resolve, reject) => {
            //         index.query({queryRequest}).then((response) => {
            //             console.log(response)
            //             resolve(response)
            //         }).catch((err) => {
            //             console.log(err)
            //             reject(err)
            //         })
            //     })
            // }

            // Promise.all([queryGroup('http_action'), queryGroup('api_webhook'), queryGroup('api_authentication', queryGroup('additional_documentation'), queryGroup('base_urls'))]).then((values) => {
                
            //     const passingMatches = []
            //     const similarityThreshold = process.env.PINECONE_QUERY_SIMILARITY_THRESHOLD ? process.env.PINECONE_QUERY_SIMILARITY_THRESHOLD : 0.70

            //     values.forEach((value) => {
            //         value.matches.forEach((match) => {
            //             if (match.score >= similarityThreshold) {
            //                 passingMatches.push(match)
            //             }
            //         })
            //     })
            //     res.status(200).send(passingMatches)


            // }).catch((err) => {
            //     console.log(err)
            //     res.status(500).send(err)
            // })
            
        }).catch((err) => {
            console.log(err)
            res.status(500).send(err)
        })
        

});

router.post('/:id/embed', function(req,res){
    
    // Promise-based function to get API Actions
    const getActions = () => {
        return new Promise((resolve, reject) => {
        InterfaceAction.find({ parent_interface_uuid: req.params.id }, function (err, interfaceActions) {
            if (err) reject(err);
            else resolve(interfaceActions);
        });
        });
    };
  

    // Promise-based function to get API Webhooks
    const getWebhooks = () => {
        return new Promise((resolve, reject) => {
        InterfaceWebhook.find({ parent_interface_uuid: req.params.id }, function (err, interfaceWebhooks) {
            if (err) reject(err);
            else resolve(interfaceWebhooks);
        });
        });
    };

    // Promise-based function to get API Security Schemes
    const getSecuritySchemes = () => {
        return new Promise((resolve, reject) => {
        InterfaceSecurityScheme.find({ parent_interface_uuid: req.params.id }, function (err, interfaceSecuritySchemes) {
            if (err) reject(err);
            else resolve(interfaceSecuritySchemes);
        });
        });
    };

    const getInterfaceEntities = () => {
        return new Promise((resolve, reject) => {
        InterfaceEntity.find({ parent_interface_uuid: req.params.id }, function (err, interfaceEntities) {
            if (err) reject(err);
            else resolve(interfaceEntities);
        });
        });
    };

    const getInterfaceParameters = () => {
        return new Promise((resolve, reject) => {
        InterfaceParameter.find({ parent_interface_uuid: req.params.id }, function (err, interfaceParameters) {
            if (err) reject(err);
            else resolve(interfaceParameters);
        });
        });
    };

    const getInterface = () => {
        return new Promise((resolve, reject) => {
        Interface.findOne({ uuid: req.params.id }, function (err, interface) {
            if (err) reject(err);
            console.log("Interface: ")
            console.log(interface)
            if(interface) resolve(interface);
            else resolve({});
        });
        });
    };
    
    // Execute all asynchronous operations using Promise.all
    Promise.all([getActions(), getWebhooks(), getSecuritySchemes(), getInterface(), getInterfaceEntities(), getInterfaceParameters()])
    .then(([interfaceActions, interfaceWebhooks, interfaceSecuritySchemes, interface, interfaceEntities, interfaceParameters]) => {
        let actions = interfaceActions;
        let webhooks = interfaceWebhooks;
        let securitySchemes = interfaceSecuritySchemes;
        let documentation = interface.documentation ? interface.documentation : {};
        let entities = interfaceEntities;
        let parameters = interfaceParameters;


        Object.keys(documentation).map((documentationGroupKey) =>{
            let documentationString = documentationGroupKey + ' Context: ' + documentation[documentationGroupKey].text.replace(/\n/g, '')
            documentation[documentationGroupKey] = documentationString
        })

        let api_spec = {
            actions: actions,
            webhooks: webhooks,
            security: securitySchemes,
            documentation: documentation,
            entities: entities,
            parameters: parameters,
            base_urls: {
                sandbox: interface.sandbox_server,
                production: interface.production_server
            },
            uuid: req.params.id,
        };

        lib.processApiForVectorDb(api_spec).then((results) => {

            if(results && results.status !== 'Error'){
                console.log(results)
                res.status(200).send(results)

                Interface.findOneAndUpdate({uuid: req.params.id}, {"indexed": true}, {new: true}, function(err,interface) {
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

module.exports = router;