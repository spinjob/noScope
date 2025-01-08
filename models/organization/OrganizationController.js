var express = require('express');
var router = express.Router();
router.use(express.urlencoded({extended: true}));
router.use(express.json());
const crypto = require('crypto');
var Organization = require('./Organization');
var Connection = require('../connection/Connection');
var axios = require('axios');
const https = require('https');

// CREATE ORGANIZATION
router.post('/', function(req,res) {
    
    Organization.create({
        uuid: req.body.uuid,
        name: req.body.name,
        created_at: new Date().toISOString().replace(/T/, ' ').replace(/\..+/, ''),
        updated_at: new Date().toISOString().replace(/T/, ' ').replace(/\..+/, ''),
        created_by: req.body.created_by
    },
    function (err,organization) {
        if (err) return res.status(500).send("There was a problem adding the information to the database.");
        res.status(200).send(organization);
    });

});

// GET ORGANIZATION
router.get('/:id', function(req,res) {

    Organization.findOne({uuid: req.params.id}, function (err, organization) {
        if (err) return res.status(500).send("There was a problem finding the project.");
        res.status(200).send(organization);
    });

});

//UPDATE ORGANIZATION
router.put('/:id', function (req,res){

    Organization.findOneAndUpdate({uuid: req.params.id}, {
        name: req.body.name,
        updated_at: new Date().toISOString().replace(/T/, ' ').replace(/\..+/, ''),
        configurations: req.body.configurations,
        interfaces: req.body.interfaces,
        partnerships: req.body.partnerships
    },
        function (err, organization) {
        if (err) return res.status(500).send("There was a problem updating the organization.");
        res.status(200).send(organization);
    });

})

// ORGANIZATION LINK TOKEN (MERGE API)
router.post('/:id/linkToken', function(req,res) {
    let apiKey = process.env.MERGE_API_KEY;
    
    let data = JSON.stringify({
        end_user_origin_id: req.params.id,
        end_user_organization_name: req.body.organizationName,
        end_user_email_address: req.body.email,
        categories: ['ticketing']
    })

    const options = {
        hostname: 'api.merge.dev',
        port: 443,
        path: '/api/integrations/create-link-token',
        method: 'POST',
        headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            Accept: 'application/json'
        }
    }

    const request = https.request(options, response => {
        let responseBody = '';
        response.on('data', (chunk) => {
            responseBody += chunk;
        });

        response.on('end', () => {
            console.log(responseBody);
            res.status(200).send(responseBody);
        }
    )})

    request.on('error', error => {
        console.error(error)
    });

    request.write(data);
    request.end();

})

router.post('/:id/accountToken', function(req,res) {
    let apiKey = process.env.MERGE_API_KEY;
    let publicToken = req.body.publicToken;
    let organizationId = req.params.id;

    const options = {
        hostname: 'api.merge.dev',
        port: 443,
        path: '/api/integrations/account-token/'+publicToken,
        method: 'GET',
        headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            Accept: 'application/json'
        }
    }

    const request = https.request(options, response => {
        let responseBody = '';
        response.on('data', (chunk) => {
            responseBody += chunk;
        });

        response.on('end', () => {
            Connection.findOneAndUpdate({account_token: JSON.parse(responseBody).account_token}, {
                updated_at: new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '')
            }).then((connection) => {
                if(connection) {
                    console.log("Connection updated successfully")
                } else {
                    Connection.create({
                        uuid: crypto.randomUUID(),
                        name: 'JIRA',
                        categories: ['ticketing'],
                        created_at: new Date().toISOString().replace(/T/, ' ').replace(/\..+/, ''),
                        updated_at: new Date().toISOString().replace(/T/, ' ').replace(/\..+/, ''),
                        deleted_at: null,
                        account_token: JSON.parse(responseBody).account_token,
                        service: 'JIRA',
                        organization: organizationId,
                        status: 'ACTIVE',
                    },
                    function (err,connection) {
                        if (err) return res.status(500).send("There was a problem adding the information to the database.");
                        res.status(200).send(connection);
                    });
                }
            }).catch((err) => {
                console.log(err)
            })


        }
    )})

    request.on('error', error => {
        console.error(error)
    });
    
    request.end();
})

module.exports = router;