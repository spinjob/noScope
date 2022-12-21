const axios = require('axios');
import {v4 as uuidv4} from 'uuid';

function generateSchemaTree(type, schema){
    const schemaTree = [];
    if(type == 'requestBody'){
        schema.array.forEach(element => {
            const parentIdentifier = uuid
            const parentObject = {

            }
        });


    }

}

module.exports = { generateSchemaTree};