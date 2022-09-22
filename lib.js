var Interface = require('./interface/Interface');
const InterfaceEntity = require('./interface_entity/InterfaceEntity');
const InterfaceProperty = require('./interface_property/InterfaceProperty');
const crypto = require('crypto');

function parseSwagger(swagger) {

    var schemaKeys = Object.keys(swagger.components.schemas);
    var schemaValues = Object.values(swagger.components.schemas);
    var interfaceUUID = crypto.randomUUID();

        Interface.create({
            uuid: interfaceUUID,
            name: swagger.info.title,
            description: swagger.info.description,
            version: swagger.info.version,
            created_at: new Date().toISOString().replace(/T/, ' ').replace(/\..+/, ''),
            updated_at: new Date().toISOString().replace(/T/, ' ').replace(/\..+/, ''),
            deleted_at: null,
            production_server: "",
            sandbox_server: ""
        },
            function(err,interface){
                if (err) {
                    console.log(err);
                    return; 
                }
                console.log("Interface Created with ID: " + interface._id);
                processSchema(schemaKeys, schemaValues, interface._id);
                return;
        });

};

function processSchema(schemaKeys, schemaValues, parent_interface_uuid) {

    for (var i = 0; i < schemaKeys.length; ++i) {
        
        var entityUUID = crypto.randomUUID();
        
        InterfaceEntity.create({
            uuid: entityUUID,
            parent_interface_uuid: parent_interface_uuid,
            name: schemaKeys[i],
            description: schemaValues[i].description,
            type: schemaValues[i].type
        },
            function(err,interfaceEntity){
                if (err) {
                    console.log(err);
                    return; 
                }
                console.log("Interface Entity Created with ID: " + interfaceEntity._id);
                   
        });
        
        if (schemaValues[i]["properties"] !== undefined) {
            processProperties(schemaValues[i]["properties"],entityUUID,parent_interface_uuid);
        } else {
            
        }
        
        
    }

    return
};

// 9-22-22: Have not figure out why propertyValues["properties"] is always undefined after processSchema is completed.

function processProperties(propertyValues, parent_object_uuid, parent_interface_uuid) {

    //console.log(Object.keys(propertyValues));
    var propertyNames = Object.keys(propertyValues);
    var propertyAttributes = Object.values(propertyValues);
    
    
    for (var i = 0; i < propertyNames.length; ++i) {
        var entityUUID = crypto.randomUUID();
        InterfaceEntity.create({
            uuid: entityUUID,
            parent_interface_uuid: parent_interface_uuid,
            name: propertyNames[i],
            description: propertyAttributes[i].description,
            type: propertyAttributes[i].type,
            //examples: propertyAttributes[i].example
        },
            function(err,interfaceEntity){
                if (err) {
                    console.log(err);
                    return; 
                }
                console.log("Interface Entity for Property Created "+ interfaceEntity._id);
                var propertyUUID = crypto.randomUUID();

                InterfaceProperty.create({
                    uuid: propertyUUID,
                    parent_interface_uuid: parent_interface_uuid,
                    interface_entity_uuid: entityUUID,
                    parent_entity: parent_object_uuid
                },
                    function(err,interfaceProperty){
                        if (err) {
                            console.log(err);
                        }
                        console.log("Interface Property Created with ID: " + interfaceProperty._id);
                        return "All schema and properties processed";
                });
        });
    
    }
    
    return;
};

function sleep(ms) {
    return new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
  }

module.exports = { parseSwagger };