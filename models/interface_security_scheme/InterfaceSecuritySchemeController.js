var express = require('express');
var axios = require('axios');
var qs = require('qs');
var router = express.Router();
router.use(express.urlencoded({extended: true}));
router.use(express.json());
var InterfaceSecurityScheme = require('./InterfaceSecurityScheme');
var Interface = require('../interface/Interface');
var Project = require('../project/Project');
const crypto = require('crypto');

// GET INTERFACE SECURITY SCHEMES
router.post('/security', function(req,res){
    InterfaceSecurityScheme.find({parent_interface_uuid:{$in: req.body.interfaces}}, function (err, interfaceSecurityScheme) {
        if (err) return res.status(500).send("There was a problem finding security schemes for the provided interface IDs.");
        res.status(200).send(interfaceSecurityScheme);
    });
});

router.post('/:id/security', function(req,res){
    InterfaceSecurityScheme.create({
        uuid: crypto.randomUUID(),
        parent_interface_uuid: req.params.id,
        type: req.body.type,
        flows: req.body.flows,
        created_at: new Date().toISOString().replace(/T/, ' ').replace(/\..+/, ''),
        updated_at: new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '')
    }, function (err,interfaceSecurityScheme) {
        if (err) return res.status(500).send(err);
        res.status(200).send(interfaceSecurityScheme);
    });
});
router.post('/:id/authenticate/:schemeId', function(req,res){

    var environment = req.body.environment
    //Retrieve Project authentication credentials for the Security Schema we are authenticating through
    Project.findOne({uuid: req.body.partnershipId}, function (err, project) {
        if (err) return res.status(500).send("There was a problem finding the project.");
        if (!project) return res.status(404).send("No project found.");
        var securitySchemeCredentials = project.authentication[req.params.id]

        //Retrieve the Security Scheme we are authenticating through
        InterfaceSecurityScheme.findOne({uuid: req.params.schemeId}, function (err, interfaceSecurityScheme) {
            if (err) return res.status(500).send("There was a problem finding the security scheme.");
            if (!interfaceSecurityScheme) return res.status(404).send("No security scheme found.");
            
            Interface.findOne({uuid: req.params.id}, function (err, interface) {
                if (err) return res.status(500).send("There was a problem finding the interface.");
                if (!interface) return res.status(404).send("No interface found.");

                var productionBaseUrl = interface.production_server
                var sandboxBaseUrl = interface.sandbox_server
            
                //If the security scheme is of type "oauth2" and the flow is "clientCredentials", we should assume there is a clientID, clientSecret, scopes, and a token URL in the Partnership API settings.
                if(interfaceSecurityScheme.type == "oauth2"){
                    if(interfaceSecurityScheme.flows.filter(flow => flow.type == "clientCredentials").length > 0){
                        //We should now authenticate with the token URL using the clientID, clientSecret, and scopes
                        //We should then store the access token in the project authentication credentials
                        //We should then return the access token

                        var tokenUrl = interfaceSecurityScheme.flows.filter(flow => flow.type == "clientCredentials")[0].tokenUrl
                        var clientID = securitySchemeCredentials.client_id
                        var clientSecret = securitySchemeCredentials.client_secret
                        var scope = securitySchemeCredentials.scope
                        var url = environment == "Production" ? productionBaseUrl + tokenUrl : sandboxBaseUrl + tokenUrl
                        axios.post(url, qs.stringify({
                            grant_type: "client_credentials",
                            client_id: clientID,
                            client_secret: clientSecret,
                            scope: scope
                        }), {
                            headers: {
                                'Content-Type': 'application/x-www-form-urlencoded',
                                'Accept-Encoding': 'identity',
                                'Accept': 'application/json'
                            }
                        }
                        ).then(function (response) {
                            // handle success
                            console.log(response)
                            var accessToken = response.data.access_token
                            var formattedResponse = {
                                credentialType: interfaceSecurityScheme.type,
                                credentialFlowType: interfaceSecurityScheme.flows[0] ? interfaceSecurityScheme.flows[0].type : null,
                                tokenData: {
                                    token: accessToken,
                                    expiresIn: response.data.expires_in,
                                    tokenType: response.data.token_type,
                                }
                            }
                            project.authentication[req.params.id] = {
                                client_id: clientID,
                                client_secret: clientSecret,
                                scope: scope,
                                grant_type: "client_credentials",
                                tokenData: {
                                    token: accessToken,
                                    expiresIn: response.data.expires_in,
                                    tokenType: response.data.token_type,
                                }
                            }
                            
                            Project.findOneAndUpdate({uuid: req.body.partnershipId}, {
                                $set: {
                                    authentication: project.authentication,
                                    updated_at: new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '')
                                }
                            }, {new: true}, function(err,project) {
                            });
                            
                            res.status(200).send(formattedResponse)
                        })
                        .catch(function (error) {
                            console.log(error)
                            res.status(500).send(error)
                        });
                    
                    }
                }
            });

        });
    });

});

router.put('/:id/security', function(req,res){
    InterfaceSecurityScheme.findOneAndUpdate({
        parent_interface_uuid: req.params.id,
        security_scheme_uuid: req.body.security_scheme_uuid
    }, {
        $set: {
            type: req.body.type,
            flows: req.body.flows,
            updated_at: new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '')
        }
    }, {new: true}, function(err,interfaceSecurityScheme) {
        if (err) return res.status(500).send(err);
        res.status(200).send(interfaceSecurityScheme);
    });
});




module.exports = router;