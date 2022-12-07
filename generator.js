const crypto = require('crypto');
const Interface = require('./models/interface/Interface');
const InterfaceEntity = require('./models/interface_entity/InterfaceEntity');
const InterfaceProperty = require('./models/interface_property/InterfaceProperty');
const InterfaceParameter = require('./models/interface_parameter/InterfaceParameter');
const InterfaceAction = require('./models/interface_action/InterfaceAction');
const InterfaceSecurityScheme = require('./models/interface_security_scheme/InterfaceSecurityScheme');
const { castObject } = require('./models/interface/Interface');
const InterfaceWebhook = require('./models/interface_webhook/InterfaceWebhook');
const Liquid = require('liquid');
const engine = new Liquid.Engine()
const axios = require('axios');
const fs = require('fs');
import {v4 as uuidv4} from 'uuid';

//// Sandbox for writing functions that can generate a distinct Node.JS projct from a JSON object that represents a workflow built in NoScope.

function generateIntegrationProject(json) {

    console.log("Creating Integration Project Directory...");
    var integrationUUID = uuidv4();
    var integrationDirectoryPath = './x-integrations/'+integrationUUID
    generateIntegrationDirectory(integrationDirectoryPath);
    console.log("Integration Project Directory Created!");
 
    var keyTranslations = [
        {"order.orderExternalIdentifiers.id": "order.orderExternalIdentifiers.id"},
        {"order.orderExternalIdentifiers.source": "order.orderExternalIdentifiers.source"},
       { "order.orderTotal.deliveryFee": "order.orderTotal.deliveryFee"},
       { "order.orderTotal.tip": "order.orderTotal.tip"},
       { "order.orderTotal.subtotal": "order.orderTotal.subtotal"}
    ]

    const translateSchema = (inputJSON, translations) => {
        var exampleInputJSON = {
            "order": {
                "orderExternalIdentifiers": {
                    "id": "Spencer-1234",
                    "friendlyId": "Spencer J",
                    "source": "ubereats"
                },
                "orderTotal": {
                    "deliveryFee": 599,
                    "tip": 299,
                    "subtotal": 2099
                }
            }
        }
    
        var exampleTranslations = [
            {
                "order.orderExternalIdentifiers.id": {
                    "path": "id", 
                    "type": "value"
                }
            },

            {
                "order.orderExternalIdentifiers.id": {
                    "path": "totals.deliveryFee", 
                    "type": "formula", 
                    "formula": "divided_by: 100"
                }
            }
        ]

        var output = {}

        var exampleOutput = exampleTranslations.map(translation => {
            var path = Object.keys(translation)[0]
            var value = Object.values(translation)[0]
            stringToObj(path, value, output)
        })
    }
    
} 

const stringToObj = (path,value,obj) => {
    var parts = path.split("."), part;
    var last = parts.pop();
    while(part = parts.shift()) {
    if( typeof obj[part] != "object") obj[part] = {};
    obj = obj[part]; // update "pointer"
    }
  obj[last] = value;
}

function generateIntegrationDirectory(json) {
 
    console.log("Creating Integration Directory...");
    var integrationUUID = uuidv4();
    var integrationDirectoryPath = './x-integrations/'+integrationUUID

    fs.mkdir(integrationDirectoryPath+'/workflow/translations', {recursive: true}, (err) => {
        if (err) throw err;
    });

    fs.mkdir(integrationDirectoryPath+'/workflow/actions', {recursive: true}, (err) => {
        if (err) throw err;
    });

    fs.mkdir(integrationDirectoryPath+'/workflow/trigger', {recursive: true}, (err) => {
        if (err) throw err;
    });
    
    console.log("Integration Directory Created!");
    return integrationDirectoryPath;
}


export default { generateIntegrationProject };