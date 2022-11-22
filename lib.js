const crypto = require('crypto');
const Interface = require('./models/interface/Interface');
const InterfaceEntity = require('./models/interface_entity/InterfaceEntity');
const InterfaceProperty = require('./models/interface_property/InterfaceProperty');
const InterfaceParameter = require('./models/interface_parameter/InterfaceParameter');
const InterfaceAction = require('./models/interface_action/InterfaceAction');
const InterfaceSecurityScheme = require('./models/interface_security_scheme/InterfaceSecurityScheme');
const { castObject } = require('./models/interface/Interface');
const InterfaceWebhook = require('./models/interface_webhook/InterfaceWebhook');

function processOpenApiV3(json, userId) {

    var schemaKeys = Object.keys(json.components.schemas);
    var schemaValues = Object.values(json.components.schemas);
    var pathKeys = Object.keys(json.paths);
    var pathValues = Object.values(json.paths);
    var parameterKeys = Object.keys(json.components.parameters);
    var parameterValues = Object.values(json.components.parameters);
    var securitySchemeKeys = Object.keys(json.components.securitySchemes);
    var securitySchemeValues = Object.values(json.components.securitySchemes);
    var webhookKeys = Object.keys(json.webhooks)
    var webhookValues = Object.values(json.webhooks)

    var interfaceUUID = crypto.randomUUID();

        Interface.create({
            uuid: interfaceUUID,
            name: json.info.title,
            description: json.info.description,
            version: json.info.version,
            created_by: userId,
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
                console.log("Interface Created with ID: " + interface.uuid);
                processSchema(schemaKeys, schemaValues, interfaceUUID);
                processPathActions(pathKeys,pathValues,interfaceUUID);
                processParameters(parameterKeys,parameterValues,interfaceUUID);
                processSecuritySchemes(securitySchemeKeys,securitySchemeValues,interfaceUUID)
                processWebhooks(webhookKeys,webhookValues,interfaceUUID);
                return;
        });

}


function processSchema(schemaKeys, schemaValues, parent_interface_uuid) {

    for (var i = 0; i < schemaKeys.length; ++i) {
        
        var entityUUID = crypto.randomUUID();

        
        if (schemaValues[i].required && schemaValues[i].properties) {
            InterfaceEntity.create({
                uuid: entityUUID,
                parent_interface_uuid: parent_interface_uuid,
                name: schemaKeys[i],
                description: schemaValues[i].description,
                type: schemaValues[i].type,
                properties: processProperties(schemaValues[i].properties,schemaValues[i].required)
            },
                function(err,interfaceEntity){
                    if (err) {
                        console.log(err);
                        return; 
                    }
                       
            });
        } else if(!schemaValues[i].required && schemaValues[i].properties) {
            
            InterfaceEntity.create({
                uuid: entityUUID,
                parent_interface_uuid: parent_interface_uuid,
                name: schemaKeys[i],
                description: schemaValues[i].description,
                type: schemaValues[i].type,
                properties: processProperties(schemaValues[i].properties,[])
            },
                function(err,interfaceEntity){
                    if (err) {
                        console.log(err);
                        return; 
                    }
                    //console.log("Interface Entity Created with ID: " + interfaceEntity._id);
                       
            });
        } else {
            InterfaceEntity.create({
                uuid: entityUUID,
                parent_interface_uuid: parent_interface_uuid,
                name: schemaKeys[i],
                description: schemaValues[i].description,
                type: schemaValues[i].type,
                properties: schemaValues[i].properties
            },
                function(err,interfaceEntity){
                    if (err) {
                        console.log(err);
                        return; 
                    }
                    //console.log("Interface Entity Created with ID: " + interfaceEntity._id);
                       
            });
        }
       
        
        if (schemaValues[i]["properties"] !== undefined) {
            createPropertyEntities(schemaValues[i]["properties"],entityUUID,parent_interface_uuid);
        } else {
            
        }
        
        
    }

    return
}

function processProperties(properties, required){
    var propertiesMap = {}
    var propertyNames = Object.keys(properties);
    var propertyAttributes = Object.values(properties);

    for (var i = 0; i < propertyNames.length; ++i) {
        
        if (required.includes(propertyNames[i])) {
            propertyAttributes[i].required = true
            propertiesMap[propertyNames[i]]= propertyAttributes[i]
        } else {
            propertyAttributes[i].required = false
            propertiesMap[propertyNames[i]]= propertyAttributes[i]
        }

    }

    return propertiesMap

}


function createPropertyEntities(propertyValues, parent_object_uuid, parent_interface_uuid) {

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
            type: propertyAttributes[i].type
        },
            function(err,interfaceEntity){
                if (err) {
                    console.log(err);
                    return; 
                }
                var propertyPath = "properties."+ interfaceEntity.name+ ".uuid";

                InterfaceEntity.findOneAndUpdate({uuid: parent_object_uuid},
                    {$set: {[propertyPath]: interfaceEntity.uuid}}, 
                    
                    function(err, interfaceEntity) {
                        if (err) {
                            console.log(err);
                            return; 
                        } else {
                        }
                        
                        return;
                    }
                )


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

        //iterate through Path Actions (i.e. HTTP Methods)
        for (var j = 0; j < methods.length; ++j){

            var actionUUID = crypto.randomUUID();
            
            //Adapt the Path+Method (i.e. Action) Responses into an Array
            var responseKeys = Object.keys(values[j].responses);
            var responseValues = Object.values(values[j].responses);
            var responsesArray = [];
            var responseSchemaArray = [];

            for (var k = 0; k < responseKeys.length; ++k){
                if (responseValues[k].content !== undefined) {
                
                    var response = {
                        "http_status_code": responseKeys[k],
                        "content_type": "json",
                        "schema": processReferences([responseValues[k].content["application/json"].schema])
                    }

                    responsesArray.push(response);
        
                } else {
                       
                        var response = {
                            "http_status_code": responseKeys[k],
                            "content_type": "json",
                            "schema": []
                        }
                        responsesArray.push(response);
        
                }
                
             }
              
           // check if there's a request body documented.  If not, create the InterfaceAction without one; else, process schema references and create with Request Body schema
            if (values[j].requestBody == undefined && values[j].parameters == undefined ){

                InterfaceAction.create({
                    uuid: actionUUID,
                    parent_interface_uuid: parent_interface_uuid,
                    name: values[j].operationId,
                    path: path,
                    method: methods[j],
                    parameters: null,
                    requestBody: null,
                    responses: responsesArray
                },
                    function(err,interfaceAction){
                        if (err) {
                            console.log(err);
                            console.log(path + " both requestBody and parameters are undefined (ln 158)");
                            return; 
                        }
                        else {
                        }
                        //console.log("Interface Action Created with ID: " + interfaceAction._id);
                        
                });  


            } else if (values[j].requestBody == undefined && values[j].parameters !== undefined ) {
   
                InterfaceAction.create({
                    uuid: actionUUID,
                    parent_interface_uuid: parent_interface_uuid,
                    name: values[j].operationId,
                    path: path,
                    method: methods[j],
                    parameters: processReferences(values[j].parameters),
                    requestBody: null,
                    responses: responsesArray
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
                            },
                            responses: responsesArray
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
                            },
                            responses: responsesArray
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
                        requestBody: null,
                        responses: responsesArray
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
                                },
                                responses: responsesArray
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
                                },
                                responses: responsesArray
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
                            requestBody: null,
                            responses: responsesArray
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
    var parameterNames = Object.keys(parameterKeys);
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
                //console.log("Interface Parameter Created "+ interfaceParameter._id);
        });
    
    }
    
    return;  
}

function processSecuritySchemes(securitySchemeKeys,securitySchemeValues,parent_interface_uuid){
   
    //var securitySchemeAttributes = Object.values(securitySchemeValues);

    for (var i = 0; i < securitySchemeKeys.length; ++i) {
        var securitySchemeUUID = crypto.randomUUID();

        var flowKeys = Object.keys(securitySchemeValues[i].flows);
        var flowValues = Object.values(securitySchemeValues[i].flows);
        var flowsArray = [];
    
        for (var j = 0; j < flowKeys.length; ++j){
    
            var flow = {
                "type": flowKeys[j],
                "tokenUrl": flowValues[j].tokenUrl,
                "scopes": flowValues[j].scopes,
            }

            flowsArray.push(flow);
        }

        InterfaceSecurityScheme.create({
            uuid: securitySchemeUUID,
            parent_interface_uuid: parent_interface_uuid,
            name: securitySchemeKeys[i],
            description: securitySchemeValues[i].description,
            type: securitySchemeValues[i].type,
            flows: flowsArray
        },
            function(err,interfaceSecurityScheme){
                if (err) {
                    console.log(err);
                    return; 
                }
                console.log("Interface Security Scheme Created "+ interfaceSecurityScheme._id);
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

            //Apply a filter to each parameter in the array to split the top-level references out to format them.
            var reference = Object.keys(parameters[i])
                .filter((key) => key.includes("$ref"))
                .reduce((obj, key) => {
                    return Object.assign(obj, {
                    "property": parameters[i][key]
                    });
            }, {});
            
            if (Object.keys(reference).length > 0) {
            //If this parameter is a reference (i.e. it wasn't filtered out), format it and add it to the references array.
                reference = reference.property.split("/")[3];
                references.push(reference);

            } else {
            //if this parameter isn't a top-level reference, we'll reach this statement. 
            if(parameters[i].type !== undefined && parameters[i].type == "object"){
                //check if this schema is an object
                    var propertiesArray = [];
                    var webhookPayload = parameters[i].properties.metadata.properties.payload
                      
                    var nestedReference = Object.keys(webhookPayload)
                        .filter((key) => key.includes("$ref"))
                        .reduce((obj, key) => {
                            return Object.assign(obj, {
                            "property": webhookPayload[key]
                            });
                    }, {});

                     if (Object.keys(nestedReference).length > 0) {
                        //If this parameter is a reference (i.e. it wasn't filtered out), format it and add it to the references array.
                            nestedReference = nestedReference.property.split("/")[3]
                            references.push(nestedReference);
                    } else {
                        //Process Object Schema
                    }

                } 
            
            }
        }
    }

    if (references == undefined){
        return [];
    }
    
    return references
}

function processWebhooks(webhookKeys,webhookValues,parent_interface_uuid){

    for (var i = 0; i < webhookKeys.length; ++i){

        var webhookUUID = crypto.randomUUID();
        
        var thisWebhookKey = webhookKeys[i];
        var thisWebhookValues = webhookValues[i]["post"];
    
        // allOf Schema Handling

        if (thisWebhookValues.requestBody.content["application/json"].schema["allOf"] !== undefined) {
            var allOfSchemas = thisWebhookValues.requestBody.content["application/json"].schema["allOf"];
            var webhookSchemas = processReferences(allOfSchemas);

            if (thisWebhookValues.responses !== undefined) {

                    //Adapt the Path+Method (i.e. Action) Responses into an Array
                    var responseKeys = Object.keys(thisWebhookValues.responses);
                    var responseValues = Object.values(thisWebhookValues.responses);
                    var responsesArray = [];
                    
                    for (var j = 0; j < responseKeys.length; ++j){

                        var response = {
                                "http_status_code": responseKeys[j],
                                "content_type": "json",
                                "schema": processReferences(responseValues)
                            };

                            responsesArray.push(response); 
                
                     }
                        
                        InterfaceWebhook.create({
                            uuid: webhookUUID,
                            parent_interface_uuid: parent_interface_uuid,
                            name: thisWebhookValues.operationId,
                            description: thisWebhookValues.summary,
                            method: "post",
                            requestBody: {
                                type: "json",
                                schema: webhookSchemas,
                                validationType: "allOf"
                            },
                            responses: responsesArray
                        },
                            function(err,interfaceWebhook){
                                if (err) {
                                    console.log(err);
                                    return; 
                                }
                            //console.log("Interface Webhook Created With Responses"+ interfaceWebhook._id);
                        });
                    

            } else {

                    InterfaceWebhook.create({
                        uuid: webhookUUID,
                        parent_interface_uuid: parent_interface_uuid,
                        name: thisWebhookValues.operationId,
                        description: thisWebhookValues.summary,
                        method: "post",
                        requestBody: {
                            type: "json",
                            schema: webhookSchemas,
                            validationType: "all_of"
                        },
                        responses: []
                    },
                        function(err,interfaceWebhook){
                            if (err) {
                                console.log(err);
                                return; 
                            }
                            console.log("Interface Webhook Created Without Responses"+ interfaceWebhook._id);
                    });
            }

        } else {}

        

    }
    
}

function retrieveInterfaces(userId){

    Interface.find({created_by: userId}, function(err, interfaces) {
        if (err) {
            console.log(err);
            return;
        }
        return interfaces;
    });

}

module.exports = { processOpenApiV3, retrieveInterfaces };