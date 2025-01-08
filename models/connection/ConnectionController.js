var express = require('express');
var router = express.Router();
router.use(express.urlencoded({extended: true}));
router.use(express.json());
const crypto = require('crypto');
var Connection = require('./Connection');
var https = require('https');

// CREATE CONNECTION
router.post('/', function(req,res) {
    let connectionUUID = crypto.randomUUID();
    Connection.create({
        uuid: connectionUUID,
        name: req.body.name,
        categories: req.body.categories,
        created_at: new Date().toISOString().replace(/T/, ' ').replace(/\..+/, ''),
        updated_at: new Date().toISOString().replace(/T/, ' ').replace(/\..+/, ''),
        deleted_at: null,
        account_token: req.body.account_token,
        service: req.body.service,
        organization: req.body.organization,
        status: req.body.status,
    },
    function (err,connection) {
        if (err) return res.status(500).send("There was a problem adding the information to the database.");
        res.status(200).send(connection);
    });
});

//GET CONNECTION BY ORGANIZATION ID
router.get('/', function (req,res){
    if (req.query.organization) {
        Connection.find({organization: req.query.organization}, function (err, connections) {
            if (err) return res.status(404).send("There was a problem finding the connections with the provided organization ID.");
            res.status(200).send(connections);
        })
    } else {
        res.status(400).send({message: "No organization ID provided."})
        }
});

router.put('/:id', function (req,res){
    if(req.body.configurations){
        Connection.findOneAndUpdate({uuid: req.params.id}, {
            updated_at: new Date().toISOString().replace(/T/, ' ').replace(/\..+/, ''),
            configurations: req.body.configurations
        },
        function (err, connection) {
            if (err) return res.status(500).send("There was a problem updating the connection.");
            res.status(200).send(connection);
        }
        );
    }
})

async function getTicketingConnectionCollections(publicToken){
    let apiKey = process.env.MERGE_API_KEY;
    let url = 'https://api.merge.dev/api/ticketing/v1/collections'
    let options = {
        headers: {
            Authorization: `Bearer ${apiKey}`,
            'X-Account-Token': publicToken,
            'Content-Type': 'application/json',
            Accept: 'application/json'
        }
    }
    return new Promise((resolve, reject) => {
        https.get(url, options, (res) => {
            let data = '';
            res.on('data', (chunk) => {
                data += chunk;
            });
            res.on('end', () => {
                resolve(JSON.parse(data));
            });
        }).on('error', (error) => {
            console.log(error);
            reject({
                error: error
            });
        });
    });
}

async function getTicketingConnectionTickets(publicToken, type){
    let apiKey = process.env.MERGE_API_KEY;
    let url = 'https://api.merge.dev/api/ticketing/v1/tickets?ticket_type=' + type;
    let options = {
        headers: {
            Authorization: `Bearer ${apiKey}`,
            'X-Account-Token': publicToken,
            'Content-Type': 'application/json',
            Accept: 'application/json'
        }
    }
    return new Promise((resolve, reject) => {
        https.get(url, options, (res) => {
            let data = '';
            res.on('data', (chunk) => {
                data += chunk;
            });
            res.on('end', () => {
                resolve(JSON.parse(data));
            });
        }).on('error', (error) => {
            console.log(error);
            reject({
                error: error
            });
        });
    });
}

// TICKETING ROUTES
router.get('/:id/ticketing/:publicToken/parent', async function (req,res){
    let publicToken = req.params.publicToken;
    let projectMapping = req.query.type;
    if(projectMapping === 'Project'){
        try {
            let collections = await getTicketingConnectionCollections(publicToken);
            res.status(200).send(collections);
        } catch (error) {
            res.status(500).send({ error: 'Error fetching collections' });
        }
    } else if (projectMapping === 'Epic'){
        try {
            let epics = await getTicketingConnectionTickets(publicToken, 'Epic');
            res.status(200).send(epics);
        } catch (error) {
            res.status(500).send({ error: 'Error fetching epics' });
        }
    } else if (projectMapping === 'Story'){
        try {
            let stories = await getTicketingConnectionTickets(publicToken, 'Story');
            res.status(200).send(stories);
        } catch (error) {
            res.status(500).send({ error: 'Error fetching stories' });
        }
    } else {
        res.status(400).send({message: "No valid type provided."})
    }
})

module.exports = router;