const crypto = require('crypto');
const Interface = require('./interface/Interface');
const InterfaceEntity = require('./interface_entity/InterfaceEntity');
const InterfaceProperty = require('./interface_property/InterfaceProperty');
const InterfaceParameter = require('./interface_parameter/InterfaceParameter');
const InterfaceAction = require('./interface_action/InterfaceAction');

function parseSwagger(swagger) {

    var schemaKeys = Object.keys(swagger.components.schemas);
    var schemaValues = Object.values(swagger.components.schemas);
    var pathKeys = Object.keys(swagger.paths);
    var pathValues = Object.values(swagger.paths);
    var parameterKeys = Object.keys(swagger.components.parameters);
    var parameterValues = Object.values(swagger.components.parameters);

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
                //console.log("Interface Created with ID: " + interface._id);
                processSchema(schemaKeys, schemaValues, interfaceUUID);
                processPathActions(pathKeys,pathValues,interfaceUUID);
                processParameters(parameterKeys,parameterValues,interfaceUUID);
               
                return;
        });

}

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
                //console.log("Interface Entity Created with ID: " + interfaceEntity._id);
                   
        });
        
        if (schemaValues[i]["properties"] !== undefined) {
            processProperties(schemaValues[i]["properties"],entityUUID,parent_interface_uuid);
        } else {
            
        }
        
        
    }

    return
}

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
                //console.log("Interface Entity for Property Created "+ interfaceEntity._id);
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
                        //console.log("Interface Property Created with ID: " + interfaceProperty._id);
                        return;
                });
        });
    
    }
    
    return;
}

function processPathActions(pathKeys, pathValues, parent_interface_uuid) {

    //iterate through paths
    for (var i = 0; i < pathKeys.length; ++i) {
        var path = pathKeys[i];
        var methods = Object.keys(pathValues[i]);
        var values = Object.values(pathValues[i]);

        //iterate through path methods
        for (var j = 0; j < methods.length; ++j){
            var actionUUID = crypto.randomUUID();
            //check if there's a request body documented.  If not, create the InterfaceAction without one; else, process schema references and create with Request Body schema
            if (values[j].requestBody == undefined && values[j].parameters == undefined ){
                
                // console.log(
                //     {
                //         "uuid": actionUUID,
                //         "parent_interface_uuid": parent_interface_uuid,
                //         "name": values[j].operationId,
                //         "path": path,
                //         "method": method[j],
                //         "parameters": processReferences(values[j].parameters),
                //         "requestBody": null
                //     }
                // );

                InterfaceAction.create({
                    uuid: actionUUID,
                    parent_interface_uuid: parent_interface_uuid,
                    name: values[j].operationId,
                    path: path,
                    method: methods[j],
                    parameters: null,
                    requestBody: null
                },
                    function(err,interfaceAction){
                        if (err) {
                            console.log(err);
                            console.log(path + " both requestBody and parameters are undefined (ln 158)");
                            return; 
                        }
                        //console.log("Interface Action Created with ID: " + interfaceAction._id);
                        
                });  


            } else if (values[j].requestBody == undefined && values[j].parameters !== undefined ) {
                // console.log(
                //     {
                //         "uuid": actionUUID,
                //         "parent_interface_uuid": parent_interface_uuid,
                //         "name": values[j].operationId,
                //         "path": path,
                //         "method": methods[j],
                //         "parameters": processReferences(values[j].parameters),
                //         "requestBody": null
                //     }
                // );

                InterfaceAction.create({
                    uuid: actionUUID,
                    parent_interface_uuid: parent_interface_uuid,
                    name: values[j].operationId,
                    path: path,
                    method: methods[j],
                    parameters: processReferences(values[j].parameters),
                    requestBody: null
                },
                    function(err,interfaceAction){
                        if (err) {
                            console.log(err);
                            console.log(path + " requestBody is undefined but parameters are present (ln 166)");
                            return; 
                        }
                        //console.log("Interface Action Created with ID: " + interfaceAction._id);
                        
                });  


            } else {
                 //application/json
                if (values[j].requestBody.content["application/json"] !== undefined) {

                    var requestBodyKeys = Object.keys(values[j].requestBody.content["application/json"].schema);
                    var requestBodyArray = [];
                    var requestBody = values[j].requestBody.content["application/json"].schema;

                    if(requestBodyKeys.length > 1 && requestBodyKeys.includes("$ref") == true) {
                    
                        for (var h = 0; h < requestBodyKeys.length; ++h){
                            requestBodyArray.push(requestBody[h]);
                        }

                        InterfaceAction.create({
                            uuid: actionUUID,
                            parent_interface_uuid: parent_interface_uuid,
                            name: values[j].operationId,
                            path: path,
                            method: methods[j],
                            parameters: processReferences(values[j].parameters),
                            requestBody: {
                                schema: processReferences(requestBodyArray),
                                type: "json",
                                required: values[j].requestBody.required
                            }
                        },
                            function(err,interfaceAction){
                                if (err) {
                                    console.log(err);
                                    console.log(path + " both requestBody (1 schema + JSON) and parameters are present (ln 200)");
                                    return; 
                                }
                                //console.log("Interface Action Created with ID: " + interfaceAction._id);
                                
                        });  

                    } else if(requestBodyKeys.includes("$ref") == true) {
                        requestBodyArray.push(requestBody);
                            
                        InterfaceAction.create({
                            uuid: actionUUID,
                            parent_interface_uuid: parent_interface_uuid,
                            name: values[j].operationId,
                            path: path,
                            method: methods[j],
                            parameters: processReferences(values[j].parameters),
                            requestBody: {
                                schema: processReferences(requestBodyArray),
                                type: "json",
                                required: values[j].requestBody.required
                            }
                        },
                            function(err,interfaceAction){
                                if (err) {
                                    console.log(err);
                                    console.log(path + "both requestBody (> 1 schema + JSON) and parameters are present (ln 235)");
                                    return; 
                                }
                                //console.log("Interface Action Created with ID: " + interfaceAction._id);
                                
                        });  

                } else {
                    ///Implement a function to validate new InterfaceEntity and add it as a Request Body Schema
                    InterfaceAction.create({
                        uuid: actionUUID,
                        parent_interface_uuid: parent_interface_uuid,
                        name: values[j].operationId,
                        path: path,
                        method: methods[j],
                        parameters: processReferences(values[j].parameters),
                        requestBody: null
                    },
                        function(err,interfaceAction){
                            if (err) {
                                console.log(err);
                                return; 
                            }
                            //console.log("Interface Action Created with ID: " + interfaceAction._id);
                            actionVariable = "";
                            
                    });  
                }

                } else if (values[j].requestBody.content["application/x-www-form-urlencoded"] !== undefined) {
                    var requestBodyKeys = Object.keys(values[j].requestBody.content["application/x-www-form-urlencoded"].schema);
                    var requestBodyArray = [];
                    var requestBody = values[j].requestBody.content["application/x-www-form-urlencoded"].schema;

                        if(requestBodyKeys.length > 1 && requestBodyKeys.includes("$ref") == true) {
                        
                            for (var h = 0; h < requestBodyKeys.length; ++h){
                                requestBodyArray.push(requestBody[h]);
                            }

                            InterfaceAction.create({
                                uuid: actionUUID,
                                parent_interface_uuid: parent_interface_uuid,
                                name: values[j].operationId,
                                path: path,
                                method: methods[j],
                                parameters: processReferences(values[j].parameters),
                                requestBody: {
                                    schema: processReferences(requestBodyArray),
                                    type: "form-urlencoded",
                                    required: values[j].requestBody.required
                                }
                            },
                                function(err,interfaceAction){
                                    if (err) {
                                        console.log(err);
                                        console.log(path + "both requestBody (1 schema + form-urlencoded) and parameters are present (ln 264)");
                                        return; 
                                    }
                                    //console.log("Interface Action Created with ID: " + interfaceAction._id);
                                    
                            });  

                        } else if (requestBodyKeys.includes("$ref") == true) {
                            requestBodyArray.push(requestBody);
                                
                            InterfaceAction.create({
                                uuid: actionUUID,
                                parent_interface_uuid: parent_interface_uuid,
                                name: values[j].operationId,
                                path: path,
                                method: methods[j],
                                parameters: processReferences(values[j].parameters),
                                requestBody:   {
                                    schema: processReferences(requestBodyArray),
                                    type: "form-urlencoded",
                                    required: values[j].requestBody.required
                                }
                            },
                                function(err,interfaceAction){
                                    if (err) {
                                        console.log(err);
                                        cconsole.log(path + "both requestBody (>1 schema + form-urlencoded) and parameters are present (ln 299)");
                                        return; 
                                    }
                                    //console.log("Interface Action Created with ID: " + interfaceAction._id);
                                    
                            });  

                 } else {
                    ///Implement a function to validate new InterfaceEntity and add it as a Request Body Schema
                        InterfaceAction.create({
                            uuid: actionUUID,
                            parent_interface_uuid: parent_interface_uuid,
                            name: values[j].operationId,
                            path: path,
                            method: methods[j],
                            parameters: processReferences(values[j].parameters),
                            requestBody: null
                        },
                            function(err,interfaceAction){
                                if (err) {
                                    console.log(err);
                                    console.log(path + " requestBody is undefined but parameters are present (ln 166)");
                                    return; 
                                }
                                console.log("Interface Action Created with ID: " + interfaceAction._id);
                                actionVariable = "";
                                
                        });  
                }
                
                } else {
                    console.log("not application/json or application/x-www-form-urlencoded");
                }
               
                }


        }        
    }

    return;
}

function processParameters(parameterKeys, parameterValues,parent_interface_uuid){
    var parameterAttributes = Object.values(parameterValues);

    for (var i = 0; i < parameterNames.length; ++i) {
        var parameterUUID = crypto.randomUUID();

        InterfaceParameter.create({
            uuid: parameterUUID,
            parent_interface_uuid: parent_interface_uuid,
            parameter_type: parameterAttributes[i].in,
            type: parameterAttributes[i].schema.type,
            name: parameterKeys[i],
            description: parameterAttributes[i].schema.description,
            example: parameterAttributes[i].schema.example,
            required: parameterAttributes[i].required,
        },
            function(err,interfaceParameter){
                if (err) {
                    console.log(err);
                    return; 
                }
                console.log("Interface Parameter Created "+ interfaceParameter._id);
        });
    
    }
    
    return;  
}


function processReferences(parameters){

    var references = [];
    var properties = [];

    if (parameters == undefined) {
        return [];
    } else if (parameters[0] == undefined) {
        return [];
    } else {

        for (var i = 0; i < parameters.length; ++i){

            var reference = Object.keys(parameters[i])
                .filter((key) => key.includes("$ref"))
                .reduce((obj, key) => {
                    return Object.assign(obj, {
                    "property": parameters[i][key]
                    });
            }, {});
    
            if (Object.keys(reference).length > 0) {
                reference = reference.property.split("/")[3]
                references.push(reference);
            } else {
                properties.push(parameters[i]);
            }
            
        }
    if (references == undefined){
        return [];
    }
        return references
    }



}

function sleep(ms) {
    return new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
}

module.exports = { parseSwagger };