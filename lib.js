const crypto = require('crypto');
const Interface = require('./models/interface/Interface');
const InterfaceEntity = require('./models/interface_entity/InterfaceEntity');
const InterfaceProperty = require('./models/interface_property/InterfaceProperty');
const InterfaceParameter = require('./models/interface_parameter/InterfaceParameter');
const InterfaceAction = require('./models/interface_action/InterfaceAction');
const InterfaceSecurityScheme = require('./models/interface_security_scheme/InterfaceSecurityScheme');
const WorkflowLog = require('./models/workflow_log/WorkflowLog');
const { castObject } = require('./models/interface/Interface');
const InterfaceWebhook = require('./models/interface_webhook/InterfaceWebhook');
const Liquid = require('liquid');
const engine = new Liquid.Engine()
const axios = require('axios');

function processOpenApiV3(json, userId) {

    var schemaKeys = Object.keys(json.components.schemas);
    var schemaValues = Object.values(json.components.schemas);
    var pathKeys = Object.keys(json.paths);
    var pathValues = Object.values(json.paths);
    var parameterKeys = Object.keys(json.components.parameters);
    var parameterValues = Object.values(json.components.parameters);
    var securitySchemeKeys = Object.keys(json.components.securitySchemes);
    var securitySchemeValues = Object.values(json.components.securitySchemes);
    var webhookKeys = Object.keys(json["x-webhooks"])
    var webhookValues = Object.values(json["x-webhooks"])

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
                processSchema(schemaKeys, schemaValues, interfaceUUID, json.components.schemas);
                processPathActions(pathKeys,pathValues,interfaceUUID, json.components.schemas);
                processParameters(parameterKeys,parameterValues,interfaceUUID);
                processSecuritySchemes(securitySchemeKeys,securitySchemeValues,interfaceUUID)
                processWebhooks(webhookKeys,webhookValues,interfaceUUID, json.components.schemas);
                return;
        });

}



function processSchema(schemaKeys, schemaValues, parent_interface_uuid, schemaMap) {

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
            createPropertyEntities(schemaValues[i]["properties"],entityUUID,parent_interface_uuid, schemaMap);
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

function processArrayItemsReferences(items, schemaMap) {
 var itemsKey = Object.keys(items);
 var itemsValue = Object.values(items);
 var schemaObject = {}

    if (itemsKey[0] === "$ref") {
        var refArray = itemsValue[0].split("/")
        var refSchema = refArray[refArray.length-1]
        schemaObject[refSchema] = schemaMap[refSchema]
        return schemaObject
    } else {
        schemaObject["inlineSchema"] = items
        return schemaObject
    }
}

function createPropertyEntities(propertyValues, parent_object_uuid, parent_interface_uuid, schemaMap) {

    //console.log(Object.keys(propertyValues));
    var propertyNames = Object.keys(propertyValues);
    var propertyAttributes = Object.values(propertyValues);

    for (var i = 0; i < propertyNames.length; ++i) {
        var entityUUID = crypto.randomUUID();
        
        if (propertyAttributes[i].type === "array") {
            InterfaceEntity.create({
                uuid: entityUUID,
                parent_interface_uuid: parent_interface_uuid,
                name: propertyNames[i],
                description: propertyAttributes[i].description,
                type: propertyAttributes[i].type,
                items: processArrayItemsReferences(propertyAttributes[i].items, schemaMap)
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
        } else {
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
           
    
    }
    
    return;
}

function processPathActions(pathKeys, pathValues, parent_interface_uuid, schemaMap) {

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
              
           // Handle cases where Request Body and/or Parameters are undefined
            if (values[j].requestBody == undefined && values[j].parameters == undefined ){
                // No Request Body or Parameters for the Action (i.e. GET request without ID in path)
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
                        
                });  


            } else if (values[j].requestBody == undefined && values[j].parameters !== undefined ) {
             // No Request Body but Parameters exist for the Action (i.e. GET request with an ID in the path or a documented Header parameter)    
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
                        
                });  


            } else {
                // Request Body and Parameters exist for the Action (i.e. POST, PUT, PATCH)
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
                            requestBody2: {
                                type: "json",
                                required: values[j].requestBody.required,
                                schema: processRequestBodySchema("action",requestBodyArray, parent_interface_uuid, schemaMap)
                            },
                            responses: responsesArray
                        },
                            function(err,interfaceAction){
                                if (err) {
                                    console.log(err);
                                    console.log(path + " both requestBody (1 schema + JSON) and parameters are present (ln 200)");
                                    return; 
                                }
                                //  console.log(JSON.parse(JSON.stringify(interfaceAction)).requestBody2.schema)
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
                            requestBody2: {
                                type: "json",
                                required: values[j].requestBody.required,
                                schema: processRequestBodySchema("action",requestBodyArray, parent_interface_uuid, schemaMap)
                            },
                            responses: responsesArray
                        },
                            function(err,interfaceAction){
                                if (err) {
                                    console.log(err);
                                    console.log(path + "both requestBody (> 1 schema + JSON) and parameters are present (ln 235)");
                                    return; 
                                }
                                // console.log(JSON.parse(JSON.stringify(interfaceAction)).requestBody2.schema)
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
                            // console.log(JSON.parse(JSON.stringify(interfaceAction)).requestBody2.schema)
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
                                requestBody2: {
                                    type: "json",
                                    required: values[j].requestBody.required,
                                    schema: processRequestBodySchema("action",requestBodyArray, parent_interface_uuid, schemaMap)
                                },
                                responses: responsesArray
                            },
                                function(err,interfaceAction){
                                    if (err) {
                                        console.log(err);
                                        console.log(path + "both requestBody (1 schema + form-urlencoded) and parameters are present (ln 264)");
                                        return; 
                                    }
                                    // console.log(JSON.parse(JSON.stringify(interfaceAction)).requestBody2.schema)
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
                                requestBody2: {
                                    type: "json",
                                    required: values[j].requestBody.required,
                                    schema: processRequestBodySchema("action",requestBodyArray, parent_interface_uuid, schemaMap)
                                },
                                responses: responsesArray
                            },
                                function(err,interfaceAction){
                                    if (err) {
                                        console.log(err);
                                        cconsole.log(path + "both requestBody (>1 schema + form-urlencoded) and parameters are present (ln 299)");
                                        return; 
                                    }
                                //    console.log(JSON.parse(JSON.stringify(interfaceAction)).requestBody2.schema)
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

        if (!parameterAttributes[i].schema["$ref"]) {
            InterfaceParameter.create({
                uuid: parameterUUID,
                parent_interface_uuid: parent_interface_uuid,
                parameter_type: parameterAttributes[i].in,
                type: parameterAttributes[i].schema.type,
                name: parameterAttributes[i].name,
                description: parameterAttributes[i].schema.description,
                example: parameterAttributes[i].schema.example,
                parameter_name: parameterKeys[i],
                required: parameterAttributes[i].required
            },
                function(err,interfaceParameter){
                    if (err) {
                        console.log(err);
                        return; 
                    }
                    //console.log("Interface Parameter Created "+ interfaceParameter._id);
            });
        } else {
            InterfaceParameter.create({
                uuid: parameterUUID,
                parent_interface_uuid: parent_interface_uuid,
                parameter_type: parameterAttributes[i].in,
                type: parameterAttributes[i].schema.type,
                name: parameterAttributes[i].name,
                description: parameterAttributes[i].schema.description,
                example: parameterAttributes[i].schema.example,
                required: parameterAttributes[i].required,
                parameter_name: parameterKeys[i],
                schemaReference: processReferences([parameterAttributes[i].schema])[0]
            },
                function(err,interfaceParameter){
                    console.log(interfaceParameter)
                    if (err) {
                        console.log(err);
                        return; 
                    }
                    //console.log("Interface Parameter Created "+ interfaceParameter._id);
            });
        }
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

function processRequestBodySchema(type, schemas, parent_interface_uuid, schemaMap){
   
    //We'll create two arrays to hold two types of schema we'll see at the top-level of a requestbody: a reference to a component.schema or an inline schema defined with a combination of references and inline properties.
    var schemaArray = []
    var inlineSchemaProperties = []

    //This will build our two input arrays for their respective for loops.
    for (var i = 0; i < schemas.length; ++i) {
        if(schemas[i]["$ref"] !== undefined){
            schemaArray.push(schemas[i]["$ref"].split("/")[3]);
        } else {
            inlineSchemaProperties.push(schemas[i])
        }
    }

    //This is the object we'll use to build the schema for the requestBody.  We'll be using Object.assign to ensure any properties that are affected by both for loops are not updated and not overwritten.
    var inlineSchema = {}

    //This for loop will start from a reference and build out the schema object.
    for (var i = 0; i < schemaArray.length; ++i){
        var schemaObject = {};
        //Let's first make a deep copy of the schema map so we can modify it without affecting the original.
        var schemaMapCopy = JSON.parse(JSON.stringify(schemaMap));

        //Next, we need to look up the properties for the parent schema key provided in the array.
        var schemaKey = schemaArray[i];

        //Let's also make a deepcopy of the schema object so we can modify it without affecting the original.
        var schemaValues = JSON.parse(JSON.stringify(schemaMapCopy[schemaKey]));
        
        //Confirm that the schema has a properties object.
        if (schemaValues.properties) {
            var propertyKeys = Object.keys(schemaValues.properties);
            var propertyValues = Object.values(schemaValues.properties);
            console.log("Schema with Properties")
            // console.log(schemaKey)
            // console.log(propertyKeys)
            // console.log(propertyValues)
            var schemaProperties = processSchemaProperties(propertyKeys, propertyValues, schemaKey, schemaMapCopy);
            // schemaObject = {
            //     "schemaName": schemaKey,
            //     "type": schemaValues.type,
            //     "properties": schemaProperties,
            //     "required": schemaValues.required ? schemaValues.required : []
            // }

            inlineSchema = Object.assign(inlineSchema, schemaProperties);
            console.log("Inline Schema")
            console.log(inlineSchema)

        } else if (schemaValues.items && schemaValues.type == 'array'){
                console.log("Top Level Array Schema")
        } else {
            //If the schema doesn't have a properties object, we'll need to process it differently.
            schemaValues = Object.assign(schemaObject, schemaValues);
        }

    }

    //This for loop will not assume a reference and will build out the schema object from the inline properties.
    for (var i = 0; i < inlineSchemaProperties.length; ++i){
        console.log("Top Level Inline Schema Properties being Processed")

        if(inlineSchemaProperties[i].properties){
            var propertyKeys = Object.keys(inlineSchemaProperties[i].properties);
            var propertyValues = Object.values(inlineSchemaProperties[i].properties);
            var schemaProperties = processSchemaProperties(propertyKeys, propertyValues, null, schemaMap);
            
            console.log("Schema Properties")
            console.log(schemaProperties)
            inlineSchema = Object.assign(inlineSchema, schemaProperties);
            console.log("Inline Schema")
            console.log(inlineSchema)
        }
    }

    console.log("Inline Schema Processed")
    console.log(JSON.parse(JSON.stringify(inlineSchema)))
    return inlineSchema;

}

function processSchemaProperties(propertyKeys, propertyValues, parentSchema, schemaMap, debug){

    var schemaProperties = {};
    //example propertyKeys: [deliveryStatus, estimatedDeliveryTime]
    //example propertyValues: [{ '$ref': '#/components/schemas/DeliveryStatus' }, {type: 'string',nullable: true,description: 'The expected delivery time.',format: 'date-time',example: '2007-12-03T10:15:30+01:00'}]  
    console.log("Processing Schema Propertie for: " + parentSchema)
    console.log(propertyKeys)

        for (var i = 0; i < propertyKeys.length; ++i){
            console.log("Processing Property: " + propertyKeys[i])
            console.log(propertyValues[i])

                var propertyKey = propertyKeys[i];
                var propertyValue = propertyValues[i];

                //Check for infinite loop and return an empty object if one is detected.
                if(parentSchema == propertyKey || parentSchema == "ItemModifier" || parentSchema == "ModifierItem"  || propertyKey == "sourceExternalIdentifiers"){
                    console.log("Infinite Loop Detected: " + parentSchema + " and " + propertyKey + " reference loop.")
                    return {};
                }
                //Check if the property is a reference to another schema.
                if (propertyValue['$ref']){
                    var propertyObject = {};
                    var propertyReference = propertyValue['$ref'].split("/")[3];
                    var propertySchemaMap = JSON.parse(JSON.stringify(schemaMap));
                    var propertySchemaMapValues = propertySchemaMap[propertyReference];
                    propertyObject[propertyKey] = propertySchemaMapValues;

                    if(propertySchemaMapValues.properties){
                        var nestedPropertyKeys = Object.keys(propertySchemaMapValues.properties);
                        var nestedPropertyValues = Object.values(propertySchemaMapValues.properties);
                        var propertyProperties = processSchemaProperties(nestedPropertyKeys, nestedPropertyValues, propertyReference, schemaMap);
                        propertyObject[propertyKey].properties = propertyProperties;
                        schemaProperties = Object.assign(schemaProperties, propertyObject);
                    } else {
                        schemaProperties = Object.assign(schemaProperties, propertyObject);
                    }
                   
                } else if (propertyValue.type == 'object' && propertyValue.properties){
                    // console.log("Object Detected: " + propertyKey)
                    // console.log("Property Key: " + propertyKey)
                    // console.log("Property Value: ")
                    // console.log(JSON.parse(JSON.stringify(propertyValue)))

                    var propertyObject = {};
                    var propertyKeys = Object.keys(propertyValue.properties);
                    var propertyValues = Object.values(propertyValue.properties);
                    var propertyProperties = processSchemaProperties(propertyKeys, propertyValues, propertyKey, schemaMap);
                    propertyObject[propertyKey] = propertyValue;
                    propertyObject[propertyKey].properties = propertyProperties; 
                    schemaProperties = Object.assign(schemaProperties, propertyObject);
                    // console.log("Schema Properties: ")
                    // console.log(JSON.parse(JSON.stringify(schemaProperties)))

                } else if (propertyValue.type == 'array'){

                    var propertyObject = {};
                    propertyObject[propertyKey] = propertyValue;

                    if(propertyValue.items && propertyValue.items['$ref']){
                        // console.log("Array Detected with Item Schema Reference: " + propertyKey)
                        // console.log("Property Key: " + propertyKey)
                        // console.log("Property Value: ")
                        // console.log(JSON.parse(JSON.stringify(propertyValue)))

                        var propertyReference = propertyValue.items['$ref'].split("/")[3];
                        var propertySchemaMap = JSON.parse(JSON.stringify(schemaMap));
                        var propertySchemaMapValues = propertySchemaMap[propertyReference];
                        // console.log("Property Map Match: ")
                        // console.log(JSON.parse(JSON.stringify(propertySchemaMapValues)))
                        
                        if(propertySchemaMapValues.properties){
                            // console.log("Item Array Schema Properties Detected: ")
                            var itemArraySchemaProperties = JSON.parse(JSON.stringify(propertySchemaMapValues.properties));
                            var itemArraySchemaPropertyKeys = Object.keys(itemArraySchemaProperties);
                            var itemArraySchemaPropertyValues = Object.values(itemArraySchemaProperties);

                            // console.log("Item Array Schema Property Keys: ")
                            // console.log(itemArraySchemaPropertyKeys)
                            // console.log("Item Array Schema Property Values: ")
                            // console.log(itemArraySchemaPropertyValues)

                            var itemArraySchemaPropertyMap = processSchemaProperties(itemArraySchemaPropertyKeys, itemArraySchemaPropertyValues, propertyReference, propertySchemaMap, true);
                            
                            var itemsSchemaObject = {
                                    "type": propertySchemaMapValues.type ? propertySchemaMapValues.type : null,
                                    "properties": itemArraySchemaPropertyMap,
                                    "required": propertySchemaMapValues.required ? propertySchemaMapValues.required : [],
                                    "schemaName": propertyReference
                            }
                            propertyObject[propertyKey].items = itemsSchemaObject;
                            schemaProperties = Object.assign(schemaProperties, propertyObject);
                            // console.log("Array Property Processed:")
                            // console.log(JSON.parse(JSON.stringify(schemaProperties)))

                        } else {
                            var itemsSchemaObject = propertySchemaMapValues
                            propertyObject[propertyKey].items = itemsSchemaObject;
                            schemaProperties = Object.assign(schemaProperties, propertyObject);
                        }
                      
                    } else if(propertyValue.items && !propertyValue.items['$ref']){
                        var itemsSchemaObject = {
                            "type": propertyValue.items.type ? propertyValue.items.type : null,
                            schemaName: 'inlineSchema'
                        }
                        propertyObject[propertyKey].items = itemsSchemaObject;
                        schemaProperties = Object.assign(schemaProperties, propertyObject);
                    } 
                }  else {
                    var propertyObject = {};
                    propertyObject[propertyKey] = propertyValue;
                    schemaProperties = Object.assign(schemaProperties, propertyObject);
                }
    }
        console.log("Schema Properties Processed: ")
        console.log(JSON.parse(JSON.stringify(schemaProperties)))
        return schemaProperties;

}

function processWebhooks(webhookKeys,webhookValues,parent_interface_uuid, schemaMap){
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
                            requestBody2: {
                                type: "json",
                                schema: processRequestBodySchema("webhook",allOfSchemas, parent_interface_uuid, schemaMap),
                                validationType: "all_of"
                            },
                            responses: responsesArray
                        },
                            function(err,interfaceWebhook){
                                if (err) {
                                    console.log(err);
                                    return; 
                                }
                            // console.log("Interface Webhook Created With Responses"+ interfaceWebhook._id);
                            // console.log(interfaceWebhook);
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
                        requestBody2: {
                            type: "json",
                            schema: processRequestBodySchema("webhook",allOfSchemas, parent_interface_uuid, schemaMap),
                            validationType: "all_of"
                        },
                        responses: []
                    },
                        function(err,interfaceWebhook){
                            if (err) {
                                console.log(err);
                                return; 
                            }
                            // console.log("Interface Webhook Created Without Responses"+ interfaceWebhook._id);
                            // console.log(interfaceWebhook)
                    });
            }

        } else {}

        

    }
    
}

function runWorkflow(workflow, actionInterface, environment, inputJSON){
    
    const traceUUID = crypto.randomUUID();

    //Check the workflow's status
    if (workflow.status == "needs_mapping") {
        return {
            error: "Action requires further work.  All required fields for the request are not mapped."
        }
    } else if (workflow.status == "disabled") {
        return {
            error: "Workflow has been disabled."
        }
    } else if (workflow.status === "active") {
        //Continue

        const header = JSON.parse(workflow.trigger.translation).header ? JSON.parse(workflow.trigger.translation).header : {}
        const stringifiedHeaderTemplate = JSON.stringify(header)
        const path = JSON.parse(workflow.trigger.translation).path ? JSON.parse(workflow.trigger.translation).path : {}
        const stringifiedPathTemplate = JSON.stringify(path)
        const requestBodyTemplate = JSON.parse(workflow.trigger.translation)
        delete requestBodyTemplate["header"]
        delete requestBodyTemplate["path"]
        const stringifiedTemplate = JSON.stringify(requestBodyTemplate)
        const nextStep = workflow.steps[0]
        const nextStepSandboxUrl = actionInterface.sandbox_server + nextStep.request.path
        const nextStepProductionUrl = actionInterface.production_server + nextStep.request.path

        console.log(header)
        console.log(path)
        console.log(requestBodyTemplate)
        if (nextStep.type === 'httpRequest') {
            if (environment == "sandbox") {
                //Apply Trigger's Liquid Template to Input JSON
                //TO DO: Create Workflow in MongoDB with a 'running' status
                //TO DO: Update Workflow in MongoDB with a 'completed' or 'failed' status 
                console.log(stringifiedTemplate)
                engine.parseAndRender(stringifiedTemplate, inputJSON).then((result) => {
                    WorkflowLog.create({
                        uuid: crypto.randomUUID(),
                        created_at: new Date().toISOString().replace(/T/, ' ').replace(/\..+/, ''),
                        message: response.data,
                        level: "info",
                        workflow_uuid: workflow.uuid,
                        traceUUID: traceUUID
                    },
                        function(err,workflowLog){
                            if (err) {
                                console.log(err);
                                return;
                            }
                    })
                        const requestBody = JSON.parse(result)
                    
                    //    if Header Translation exists, apply it to the input JSON

                        // if (header.length > 0 && path == {}) {
                        //     engine.parseAndRender(stringifiedHeaderTemplate, inputJSON).then((result) => {
                        //         const translatedHeader = JSON.parse(result)
                        //         if (nextStep.request.method === 'post') {
                        //             axios.post(nextStepUrl, requestBody,{headers: translatedHeader}).then((response) => {
                        //                 console.log(response.data)
                        //                 WorkflowLog.create({
                        //                     uuid: crypto.randomUUID(),
                        //                     created_at: new Date().toISOString().replace(/T/, ' ').replace(/\..+/, ''),
                        //                     message: response.data,
                        //                     level: "info",
                        //                     workflow_uuid: workflow.uuid
                        //                 },
                        //                     function(err,workflowLog){
                        //                         if (err) {
                        //                             console.log(err);
                        //                             return;
                        //                         }
                        //                     }
                        //                 )
                        //             }).catch((error) => {
                        //                 console.log(error)
                        //                 WorkflowLog.create({
                        //                     uuid: crypto.randomUUID(),
                        //                     created_at: new Date().toISOString().replace(/T/, ' ').replace(/\..+/, ''),
                        //                     message: error,
                        //                     level: "error",
                        //                     workflow_uuid: workflow.uuid,
                        //                     traceUUID: traceUUID
                        //                 },
                        //                     function(err,workflowLog){
                        //                         if (err) {
                        //                             console.log(err);
                        //                             return;
                        //                         }
                        //                     })
                        //             })
                            
                        //         } 
                            
                        //     }).catch((err) => {
                        //         console.log(err);
                        //     })
                            
                        // } else if (header.length > 0 && path.length > 0) {
                        //     engine.parseAndRender(stringifiedHeaderTemplate, inputJSON).then((result) => {
                        //         const translatedHeader = JSON.parse(result)
                        //         engine.parseAndRender(stringifiedPathTemplate, inputJSON).then((result) => {
                        //             if (nextStep.request.method === 'post') {
                        //                 axios.post(nextStepUrl + result, requestBody,{headers: translatedHeader}).then((response) => {
                        //                     console.log(response.data)
                        //                     WorkflowLog.create({
                        //                         uuid: crypto.randomUUID(),
                        //                         created_at: new Date().toISOString().replace(/T/, ' ').replace(/\..+/, ''),
                        //                         message: response.data,
                        //                         level: "info",
                        //                         workflow_uuid: workflow.uuid
                        //                     },
                        //                         function(err,workflowLog){
                        //                             if (err) {
                        //                                 console.log(err);
                        //                                 return;
                        //                             }
                        //                         })
                        //                 }).catch((error) => {
                        //                     console.log(error)
                        //                     WorkflowLog.create({
                        //                         uuid: crypto.randomUUID(),
                        //                         created_at: new Date().toISOString().replace(/T/, ' ').replace(/\..+/, ''),
                        //                         message: error,
                        //                         level: "error",
                        //                         workflow_uuid: workflow.uuid,
                        //                         traceUUID: traceUUID
                        //                     },
                        //                         function(err,workflowLog){
                        //                             if (err) {
                        //                                 console.log(err);
                        //                                 return;
                        //                             }
                        //                         })
                        //                 })
                        //             }
                        //         })
                        //     }).catch((err) => {
                        //         console.log(err);
                        //     })

                        // } else if (path.length > 0 && header == {}) {
                        //     engine.parseAndRender(stringifiedPathTemplate, inputJSON).then((result) => {
    
                        //         if (nextStep.request.method === 'post') {
                                
                        //             axios.post(nextStepUrl + result, requestBody).then((response) => {
                        //                 console.log(response.data)
                        //                 WorkflowLog.create({
                        //                     uuid: crypto.randomUUID(),
                        //                     created_at: new Date().toISOString().replace(/T/, ' ').replace(/\..+/, ''),
                        //                     message: response.data,
                        //                     level: "info",
                        //                     workflow_uuid: workflow.uuid
                        //                 },
                        //                     function(err,workflowLog){
                        //                         if (err) {
                        //                             console.log(err);
                        //                             return;
                        //                         }
                        //                     })
                        //             }).catch((error) => {
                        //                 console.log(error)
                        //                 WorkflowLog.create({
                        //                     uuid: crypto.randomUUID(),
                        //                     created_at: new Date().toISOString().replace(/T/, ' ').replace(/\..+/, ''),
                        //                     message: error,
                        //                     level: "error",
                        //                     workflow_uuid: workflow.uuid,
                        //                     traceUUID: traceUUID
                        //                 },
                        //                     function(err,workflowLog){
                        //                         if (err) {
                        //                             console.log(err);
                        //                             return;
                        //                         }
                        //                     })
                        //             })
                            
                        //         } 
                            
                        //     }).catch((err) => {
                        //         console.log(err);
                        //     })

                        // }
                    })

            }
       
        }
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

module.exports = { processOpenApiV3, retrieveInterfaces, runWorkflow };