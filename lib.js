const crypto = require('crypto');
const Interface = require('./models/interface/Interface');
const InterfaceEntity = require('./models/interface_entity/InterfaceEntity');
const InterfaceParameter = require('./models/interface_parameter/InterfaceParameter');
const InterfaceAction = require('./models/interface_action/InterfaceAction');
const InterfaceSecurityScheme = require('./models/interface_security_scheme/InterfaceSecurityScheme');
const Job = require('./models/job/Job');
const InterfaceWebhook = require('./models/interface_webhook/InterfaceWebhook');
const postmanToOpenApi = require('postman-to-openapi');
const yaml = require('js-yaml');

const {generateGraph} = require('./utils/generateGraph');
const {PineconeClient} = require('@pinecone-database/pinecone');
const {Configuration, OpenAIApi } = require("openai");

function processOpenApiV3(json, userId, owningOrganization, importingOrganzation, jobId) {

    var schemaKeys = [];
    var schemaValues = [];
    var pathKeys = [];
    var pathValues = [];
    var parameterKeys = []
    var parameterValues = []
    var securitySchemeKeys = []
    var securitySchemeValues = []
    var webhookKeys = [];
    var webhookValues = [];
    var errorArray = [];
    var nodes = null;
    var edges = null;

    if(json){
        nodes, edges = generateGraph(json) ? generateGraph(json) : null

        nodes = Buffer.from(JSON.stringify(nodes)).toString('base64')
        edges = Buffer.from(JSON.stringify(edges)).toString('base64')
    }

    if(json.components.schemas === undefined) {
        errorArray.push({
            message: "No schemas found in the OpenAPI document. Please ensure that the OpenAPI document has at least one schema defined.",
            errorCode: "NO_SCHEMAS",
            severity: "ERROR"
        })
    } else {
        schemaKeys = Object.keys(json.components.schemas);
        schemaValues = Object.values(json.components.schemas);
    }

    if(json.paths === undefined) {
        errorArray.push({
            message: "No paths found in the OpenAPI document. Please ensure that the OpenAPI document has at least one path action defined.",
            errorCode: "NO_PATHS",
            severity: "ERROR"
        })
    } else {
        pathKeys = Object.keys(json.paths);
        pathValues = Object.values(json.paths);
    }

    if(json.components.securitySchemes === undefined) {
        errorArray.push({
            message: "No security schemes found in the OpenAPI document.",
            errorCode: "NO_SECURITY_SCHEMES",
            severity: "WARNING"
        })
    } else {
        securitySchemeKeys = Object.keys(json.components.securitySchemes);
        securitySchemeValues = Object.values(json.components.securitySchemes);
    }

    if(json.components.parameters === undefined) {
        errorArray.push({
            message: "No parameters found in the OpenAPI document.",
            errorCode: "NO_PARAMETERS",
            severity: "WARNING"
        })
    } else {
        parameterKeys = Object.keys(json.components.parameters);
        parameterValues = Object.values(json.components.parameters);
    }
   
    if( json["x-webhooks"] === undefined) {
        errorArray.push({
            message: "No webhooks found in the OpenAPI document.",
            errorCode: "NO_WEBHOOKS",
            severity: "WARNING"
        })
    } else {
        webhookKeys = Object.keys(json["x-webhooks"]);
        webhookValues = Object.values(json["x-webhooks"])
    }

    var interfaceUUID = crypto.randomUUID();

    Job.findOneAndUpdate({uuid: jobId}, {status: "IN_PROGRESS", metadata: {
        interface: interfaceUUID,
        errors: errorArray,
        schema: {
            status: schemaKeys.length > 0 ? "IN_PROGRESS": "COMPLETED" ,
            count: schemaKeys.length,
            message:  schemaKeys.length > 0 ? "Generating schema..." : "No schemas found."
        },
        webhooks: {
            status: webhookKeys.length > 0 ? "IN_PROGRESS" : "COMPLETED",
            count: webhookKeys.length,
            message: webhookKeys.length > 0 ? "Generating webhooks...": "No webhooks found."
        },
        actions: {
            status: pathKeys.length > 0 ? "IN_PROGRESS" : "COMPLETED",
            count: pathKeys.length,
            message: pathKeys.length > 0 ? "Generating actions...": "No actions found."
        },
        parameters: {
            status: parameterKeys.length > 0 ? "IN_PROGRESS" : "COMPLETED",
            count: parameterKeys.length,
            message: parameterKeys.length > 0 ? "Generating parameters..." : "No parameters found."
        },
        securitySchemes: {
            status: securitySchemeKeys.length > 0 ? "IN_PROGRESS": "COMPLETED",
            count: securitySchemeKeys.length,
            message: securitySchemeKeys.length > 0 ? "Generating security schemes..." : "No security schemes found."
        }
    }}, function(err, job) {
        if(err) {
            console.log(err)
        } else {
            console.log("Job Updated")
        }
    })
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
            sandbox_server: "",
            owning_organization: owningOrganization,
            importing_organization: importingOrganzation,
            jobIds: [jobId],
            graph: edges
        },
            function(err,interface){
                if (err) {
                    console.log(err);
                    return; 
                }
                console.log("Interface Created with ID: " + interface.uuid);

                {
                    schemaKeys.length > 0 ? processSchema(schemaKeys, schemaValues, interfaceUUID, json.components.schemas, 3, jobId) : console.log("No schemas found.")
                }
                {
                    pathKeys.length > 0 ?  processPathActions(pathKeys,pathValues,interfaceUUID, json.components.schemas, json.components.parameters, 3, jobId) : console.log("No actions found.")
                }
                {
                    parameterKeys.length > 0 ? processParameters(parameterKeys,parameterValues,interfaceUUID, jobId) : console.log("No parameters found.")
                }
                {
                    securitySchemeKeys.length > 0 ? processSecuritySchemes(securitySchemeKeys,securitySchemeValues,interfaceUUID, jobId) : console.log("No security schemes found.")
                }

                {
                    webhookKeys.length > 0 ? processWebhooks(webhookKeys,webhookValues,interfaceUUID, json.components.schemas, jobId) : console.log("No webhooks found.")
                }
                return;
        });

}

function processOpenApiV2(json, userId, owningOrganization, importingOrganzation, jobId) {

    var schemaKeys = [];
    var schemaValues = [];
    var pathKeys = [];
    var pathValues = [];
    var securitySchemeKeys = [];
    var securitySchemeValues = [];
    var server = json.host;
    var errorArray = [];

    if(json.definitions === undefined) {
        errorArray.push({
            message: "No schemas found in the OpenAPI document. Please ensure that the OpenAPI document has at least one schema defined.",
            errorCode: "NO_SCHEMAS",
            severity: "ERROR"
        })
    } else {
        schemaKeys = Object.keys(json.definitions);
        schemaValues = Object.values(json.definitions);
    }

    if(json.paths === undefined) {
        errorArray.push({
            message: "No paths found in the OpenAPI document. Please ensure that the OpenAPI document has at least one path action defined.",
            errorCode: "NO_PATHS",
            severity: "ERROR"
        })
    } else {
        pathKeys = Object.keys(json.paths);
        pathValues = Object.values(json.paths);
    }


    if(json.securityDefinitions === undefined) {
        errorArray.push({
            message: "No security schemes found in the OpenAPI document.",
            errorCode: "NO_SECURITY_SCHEMES",
            severity: "WARNING"
        })
    } else {
        securitySchemeKeys = Object.keys(json.securityDefinitions);
        securitySchemeValues = Object.values(json.securityDefinitions);
    }

    var interfaceUUID = crypto.randomUUID();
    
    Job.findOneAndUpdate({uuid: jobId}, {status: "IN_PROGRESS", metadata: {
        interface: interfaceUUID,
        errors: errorArray,
        schema: {
            status: "IN_PROGRESS",
            count: schemaKeys.length,
            message: "Generating schema..."
        },
        webhooks: {
            status: "COMPLETED",
            count: 0 ,
            message: "No webhooks found"
        },
        actions: {
            status: "IN_PROGRESS",
            count: pathKeys.length,
            message: "Generating actions..."
        },
        parameters: {
            status: "IN_PROGRESS",
            count: 0,
            message: "Generating parameters..."
        },
        securitySchemes: {
            status: "IN_PROGRESS",
            count: securitySchemeKeys.length,
            message: "Generating security schemes..."
        }
    }}, function(err, job) {
        if(err) {
            console.log(err)
        } else {
            console.log("Job Updated")
        }
    })

    

    Interface.create({
        uuid: interfaceUUID,
        name: json.info.title,
        description: json.info.description, 
        version: json.info.version,
        created_by: userId,
        created_at: new Date().toISOString().replace(/T/, ' ').replace(/\..+/, ''),
        updated_at: new Date().toISOString().replace(/T/, ' ').replace(/\..+/, ''),
        deleted_at: null,
        production_server: server,
        sandbox_server: server,
        owning_organization: owningOrganization,
        importing_organization: importingOrganzation,
        jobIds: [jobId]
    },
        function(err,interface){
            if (err) {
                console.log(err);
                return; 
            }
            // console.log("Interface Created with ID: " + interface.uuid);
            processSchema(schemaKeys, schemaValues, interfaceUUID, json.definitions, 2, jobId);
            processOpenApiV2PathActions(pathKeys,pathValues,interfaceUUID, json.definitions, jobId);
            processOpenApiV2SecuritySchemes(securitySchemeKeys,securitySchemeValues,interfaceUUID, jobId)
            return;
    });

}

function processSchema(schemaKeys, schemaValues, parent_interface_uuid, schemaMap, version, jobId) {
    var errorArray = [];
    var schemaCount = 0;
    for (var i = 0; i < schemaKeys.length; ++i) {
        
        var entityUUID = crypto.randomUUID(); 
        schemaCount++;

        if (schemaValues[i].required && schemaValues[i].properties) {
            var propertyKeys = Object.keys(schemaValues[i].properties);
            var propertyValues = Object.values(schemaValues[i].properties);
            var properties = processSchemaProperties(propertyKeys,propertyValues, schemaKeys[i], schemaMap, false, version)
            schemaCount += properties.length;

            InterfaceEntity.create({
                uuid: entityUUID,
                parent_interface_uuid: parent_interface_uuid,
                name: schemaKeys[i],
                description: schemaValues[i].description,
                type: schemaValues[i].type,
                properties: properties
            },
                function(err,interfaceEntity){
                    if (err) {
                        console.log(err);
                        errorArray.push({
                            "schema": schemaKeys[i],
                            "error": err
                        })
                        return; 
                    }
                       
            });
        } else if(!schemaValues[i].required && schemaValues[i].properties) {
            var propertyKeys = Object.keys(schemaValues[i].properties);
            var propertyValues = Object.values(schemaValues[i].properties);
            var properties = processSchemaProperties(propertyKeys,propertyValues, schemaKeys[i], schemaMap, false, version)
            schemaCount += properties.length;

            InterfaceEntity.create({
                uuid: entityUUID,
                parent_interface_uuid: parent_interface_uuid,
                name: schemaKeys[i],
                description: schemaValues[i].description,
                type: schemaValues[i].type,
                properties: properties
            },
                function(err,interfaceEntity){
                    if (err) {
                        console.log(err);
                        errorArray.push({
                            "schema": schemaKeys[i],
                            "error": err
                        })
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
                        errorArray.push({
                            "schema": schemaKeys[i],
                            "error": err
                        })
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

    Job.findOneAndUpdate({uuid: jobId}, {
        'metadata.schema': {
               status: "COMPLETED",
               count: schemaKeys.length,
               message: "Schema processed successfully",
               errors: errorArray
           }
       }, function(err, job) {
           if(err) {
               console.log(err)
           } else {
               console.log("Job Updated")
           }
       })
    
    return true
}

function processArrayItemsReferences(items, schemaMap) {

    if(items === undefined) {
        return
    }
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
            });

        }
           
    
    }
    
    return;
}

function processPathActions(pathKeys, pathValues, parent_interface_uuid, schemaMap, parameterMap, version, jobId) {
    var errorArray = [];
    //iterate through paths
    for (var i = 0; i < pathKeys.length; ++i) {
        var path = pathKeys[i];
        var methods = Object.keys(pathValues[i]);
        var values = Object.values(pathValues[i]);

        //iterate through Path Actions (i.e. HTTP Methods)
        for (var j = 0; j < methods.length; ++j){

            var actionUUID = crypto.randomUUID();
            
            //Adapt the Path+Method (i.e. Action) Responses into an Array
            var responseKeys = values[j].responses ? Object.keys(values[j].responses) : [];
            var responseValues = values[j].responses ? Object.values(values[j].responses) : [];
            var responsesArray = [];
            var responseSchemaArray = [];

            for (var k = 0; k < responseKeys.length; ++k){
                if (responseValues[k].content !== undefined && responseValues[k].content["application/json"] !== undefined) {
                    var responseSchema = responseValues[k].content["application/json"].schema;
                    responseSchemaArray.push(responseSchema);
                    var response = {
                        "http_status_code": responseKeys[k],
                        "content_type": "json",
                        "schema": processRequestBodySchema("action",responseSchemaArray, parent_interface_uuid, schemaMap, "response")                    
                    }
                    responsesArray.push(response);
        
                } else if (responseValues[k].content !== undefined && responseValues[k].content["application/xml"] !== undefined) {
                    var responseSchema = responseValues[k].content["application/xml"].schema;
                    responseSchemaArray.push(responseSchema);
                    var response = {
                        "http_status_code": responseKeys[k],
                        "content_type": "xml",
                        "schema": processRequestBodySchema("action",responseSchemaArray, parent_interface_uuid, schemaMap, "response")                    
                    }

                    responsesArray.push(response);
                } else if(responseValues[k]['$ref']){
                    var responseSchema = responseValues[k];
                    responseSchemaArray.push(responseSchema);
                    var response = {
                        "http_status_code": responseKeys[k],
                        "content_type": "json",
                        "schema": processRequestBodySchema("action",responseSchemaArray, parent_interface_uuid, schemaMap, "response")                    
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
                            console.log()
                            console.log(err);
                            console.log(path + " both requestBody and parameters are undefined (ln 158)");
                            return; 
                        }
                        else {
                        }
                        
                });  


            } else if (values[j].requestBody == undefined && values[j].parameters !== undefined ) {
             // No Request Body but Parameters exist for the Action (i.e. GET request with an ID in the path or a documented Header parameter) 

                let parameterSchemas = processReferences(values[j].parameters).length > 0 ? processReferences(values[j].parameters): values[j].parameters;
                let parameters =  processRequestParameterSchema(parameterSchemas, parameterMap, schemaMap)

                InterfaceAction.create({
                    uuid: actionUUID,
                    parent_interface_uuid: parent_interface_uuid,
                    name: values[j].operationId,
                    path: path,
                    method: methods[j],
                    parameters: processReferences(values[j].parameters),
                    parameterSchema: parameters,
                    requestBody: null,
                    responses: responsesArray
                },
                    function(err,interfaceAction){
                        if (err) {
                            console.log(err);
                            console.log(path + " requestBody is undefined but parameters exist (ln 366)");
                            return; 
                        }
                        
                });  


            } else if (values[j].requestBody !== undefined && values[j].parameters !== undefined ) {
                // Request Body and Parameters exist for the Action (i.e. POST, PUT, PATCH)
                if (values[j].requestBody && values[j].requestBody.content && values[j].requestBody.content["application/json"] !== undefined) {
                    let parameterSchemas = processReferences(values[j].parameters).length > 0 ? processReferences(values[j].parameters): values[j].parameters;
                    let parameters =  processRequestParameterSchema(parameterSchemas, parameterMap, schemaMap)
    
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
                            parameterSchema: parameters,
                            requestBody: {
                                schema: processReferences(requestBodyArray),
                                type: "json",
                                required: values[j].requestBody.required
                            },
                            requestBody2: {
                                type: "json",
                                required: values[j].requestBody.required,
                                requiredSchema: processTopLevelRequiredProperties(requestBodyArray, schemaMap, 3),
                                schema: processRequestBodySchema("action",requestBodyArray, parent_interface_uuid, schemaMap)
                            },
                            responses: responsesArray
                        },
                            function(err,interfaceAction){
                                if (err) {
                                    console.log(err);
                                    console.log(path + " requestBody is undefined but parameters exist (ln 366)")
                                    return; 
                                }
                                //console.log(JSON.parse(JSON.stringify(interfaceAction)).requestBody2.schema)
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
                            parameterSchema: parameters,
                            requestBody: {
                                schema: processReferences(requestBodyArray),
                                type: "json",
                                required: values[j].requestBody.required
                            },
                            requestBody2: {
                                type: "json",
                                required: values[j].requestBody.required,
                                requiredSchema: processTopLevelRequiredProperties(requestBodyArray, schemaMap, 3),
                                schema: processRequestBodySchema("action",requestBodyArray, parent_interface_uuid, schemaMap)
                            },
                            responses: responsesArray
                        },
                            function(err,interfaceAction){
                                if (err) {
                                    console.log(err);
                                    console.log(path + " request body and parameters exist (ln 443)")
                                    return; 
                                }
                                // console.log(JSON.parse(JSON.stringify(interfaceAction)).requestBody2.schema)
                                //console.log("Interface Action Created with ID: " + interfaceAction._id);
                                
                        });  

                    } else {
                        ///Implement a function to validate new InterfaceEntity and add it as a Request Body Schema

                        const parameters = processRequestParameterSchema(processReferences(values[j].parameters), parameterMap, schemaMap)

                        InterfaceAction.create({
                            uuid: actionUUID,
                            parent_interface_uuid: parent_interface_uuid,
                            name: values[j].operationId,
                            path: path,
                            method: methods[j],
                            parameters: processReferences(values[j].parameters),
                            parameterSchema: parameters,
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

                } else if (values[j].requestBody && values[j].requestBody.content && values[j].requestBody.content["application/xml"] !== undefined) {

                    let parameterSchemas = processReferences(values[j].parameters).length > 0 ? processReferences(values[j].parameters): values[j].parameters;
                    let parameters =  processRequestParameterSchema(parameterSchemas, parameterMap, schemaMap)
    
                    var requestBodyKeys = Object.keys(values[j].requestBody.content["application/xml"].schema);
                    var requestBodyArray = [];
                    var requestBody = values[j].requestBody.content["application/xml"].schema;
                    

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
                            parameterSchema: parameters,
                            requestBody: {
                                schema: processReferences(requestBodyArray),
                                type: "xml",
                                required: values[j].requestBody.required
                            },
                            requestBody2: {
                                type: "xml",
                                required: values[j].requestBody.required,
                                requiredSchema: processTopLevelRequiredProperties(requestBodyArray, schemaMap, 3),
                                schema: processRequestBodySchema("action",requestBodyArray, parent_interface_uuid, schemaMap)
                            },
                            responses: responsesArray
                        },
                            function(err,interfaceAction){
                                if (err) {
                                    console.log(err);
                                    console.log(path + " requestBody is undefined but parameters exist (ln 366)")
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
                            parameterSchema: parameters,
                            requestBody: {
                                schema: processReferences(requestBodyArray),
                                type: "xml",
                                required: values[j].requestBody.required
                            },
                            requestBody2: {
                                type: "xml",
                                required: values[j].requestBody.required,
                                requiredSchema: processTopLevelRequiredProperties(requestBodyArray, schemaMap, 3),
                                schema: processRequestBodySchema("action",requestBodyArray, parent_interface_uuid, schemaMap)
                            },
                            responses: responsesArray
                        },
                            function(err,interfaceAction){
                                if (err) {
                                    console.log(err);
                                    console.log(path + " request body and parameters exist (ln 443)")
                                    return; 
                                }
                                // console.log(JSON.parse(JSON.stringify(interfaceAction)).requestBody2.schema)
                                //console.log("Interface Action Created with ID: " + interfaceAction._id);
                                
                        });  

                    } else {
                        ///Implement a function to validate new InterfaceEntity and add it as a Request Body Schema

                        const parameters = processRequestParameterSchema(processReferences(values[j].parameters), parameterMap, schemaMap)

                        InterfaceAction.create({
                            uuid: actionUUID,
                            parent_interface_uuid: parent_interface_uuid,
                            name: values[j].operationId,
                            path: path,
                            method: methods[j],
                            parameters: processReferences(values[j].parameters),
                            parameterSchema: parameters,
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
                } else if (values[j] && values[j].requestBody && values[j].requestBody.content && values[j].requestBody.content["application/x-www-form-urlencoded"] !== undefined) {
                    const parameters = processRequestParameterSchema(processReferences(values[j].parameters), parameterMap, schemaMap)
  
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
                                parameterSchema: parameters,
                                requestBody: {
                                    schema: processReferences(requestBodyArray),
                                    type: "form-urlencoded",
                                    required: values[j].requestBody.required
                                },
                                requestBody2: {
                                    type: "json",
                                    required: values[j].requestBody.required,
                                    requiredSchema: processTopLevelRequiredProperties(requestBodyArray, schemaMap, 3),
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
                                parameterSchema: parameters,
                                requestBody:   {
                                    schema: processReferences(requestBodyArray),
                                    type: "form-urlencoded",
                                    required: values[j].requestBody.required
                                },
                                requestBody2: {
                                    type: "json",
                                    required: values[j].requestBody.required,
                                    requiredSchema: processTopLevelRequiredProperties(requestBodyArray, schemaMap, 3),
                                    schema: processRequestBodySchema("action",requestBodyArray, parent_interface_uuid, schemaMap)
                                },
                                responses: responsesArray
                            },
                                function(err,interfaceAction){
                                    if (err) {
                                        console.log(err);
                                        console.log(path + "both requestBody (>1 schema + form-urlencoded) and parameters are present (ln 299)");
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
                                    parameterSchema: parameters,
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
                        }
                
                } else {
                    console.log("not application/json or application/x-www-form-urlencoded");
                }        
            }  else if (values[j].requestBody !== undefined && values[j].parameters == undefined ) {
                // Request Body and Parameters exist for the Action (i.e. POST, PUT, PATCH)
                if (values[j].requestBody.content["application/json"] !== undefined) {
                    var requestBodyKeys = Object.keys(values[j].requestBody.content["application/json"].schema);
                    var requestBodyArray = [];
                    var requestBody = values[j].requestBody.content["application/json"].schema;
                    
                   
                    if(requestBodyKeys.length > 1 && requestBodyKeys.includes("$ref") == true) {
                    
                        for (var h = 0; h < requestBodyKeys.length; ++h){
                            requestBodyArray.push(requestBody[h]);
                        }

                        processTopLevelRequiredProperties(requestBodyArray, schemaMap)

                        InterfaceAction.create({
                            uuid: actionUUID,
                            parent_interface_uuid: parent_interface_uuid,
                            name: values[j].operationId,
                            path: path,
                            parameters: null,
                            parameterSchema: null,
                            method: methods[j],
                            requestBody: {
                                schema: processReferences(requestBodyArray),
                                type: "json",
                                required: values[j].requestBody.required
                            },
                            requestBody2: {
                                type: "json",
                                required: values[j].requestBody.required,
                                requiredSchema: processTopLevelRequiredProperties(requestBodyArray, schemaMap, 3),
                                schema: processRequestBodySchema("action",requestBodyArray, parent_interface_uuid, schemaMap)
                            },
                            responses: responsesArray
                        },
                            function(err,interfaceAction){
                                if (err) {
                                    console.log(err);
                                    errorArray.push(
                                        {
                                            "path": path,
                                            "method": methods[j],
                                            "error": err
                                        }
                                    )
                                    return; 
                                }
                                
                        });  

                    } else if(requestBodyKeys.includes("$ref") == true) {
                        requestBodyArray.push(requestBody);

                        InterfaceAction.create({
                            uuid: actionUUID,
                            parent_interface_uuid: parent_interface_uuid,
                            name: values[j].operationId,
                            path: path,
                            parameters: null,
                            parameterSchema: null,
                            method: methods[j],
                            requestBody: {
                                schema: processReferences(requestBodyArray),
                                type: "json",
                                required: values[j].requestBody.required
                            },
                            requestBody2: {
                                type: "json",
                                required: values[j].requestBody.required,
                                requiredSchema: processTopLevelRequiredProperties(requestBodyArray, schemaMap, 3),
                                schema: processRequestBodySchema("action",requestBodyArray, parent_interface_uuid, schemaMap)
                            },
                            responses: responsesArray
                        },
                            function(err,interfaceAction){
                                if (err) {
                                    console.log(err);
                                    errorArray.push(
                                        {
                                            "path": path,
                                            "method": methods[j],
                                            "error": err
                                        }
                                    )
                                    console.log(path + " request body and parameters exist (ln 443)")
                                    return; 
                                }
                                // console.log(JSON.parse(JSON.stringify(interfaceAction)).requestBody2.schema)
                                //console.log("Interface Action Created with ID: " + interfaceAction._id);
                                
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
                                parameters: null,
                                parameterSchema: null,
                                parameterSchema: parameters,
                                requestBody: {
                                    schema: processReferences(requestBodyArray),
                                    type: "form-urlencoded",
                                    required: values[j].requestBody.required
                                },
                                requestBody2: {
                                    type: "form-urlencoded",
                                    required: values[j].requestBody.required,
                                    requiredSchema: processTopLevelRequiredProperties(requestBodyArray, schemaMap, 3),
                                    schema: processRequestBodySchema("action",requestBodyArray, parent_interface_uuid, schemaMap)
                                },
                                responses: responsesArray
                            },
                                function(err,interfaceAction){
                                    if (err) {
                                        console.log(err);
                                        errorArray.push(
                                            {
                                                "path": path,
                                                "method": methods[j],
                                                "error": err
                                            }
                                        )
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
                                parameters: null,
                                parameterSchema: null,
                                requestBody:   {
                                    schema: processReferences(requestBodyArray),
                                    type: "form-urlencoded",
                                    required: values[j].requestBody.required
                                },
                                requestBody2: {
                                    type: "json",
                                    required: values[j].requestBody.required,
                                    requiredSchema: processTopLevelRequiredProperties(requestBodyArray, schemaMap, 3),
                                    schema: processRequestBodySchema("action",requestBodyArray, parent_interface_uuid, schemaMap)
                                },
                                responses: responsesArray
                            },
                                function(err,interfaceAction){
                                    if (err) {
                                        console.log(err);
                                        errorArray.push(
                                            {
                                                "path": path,
                                                "method": methods[j],
                                                "error": err
                                            }
                                        )
                                        console.log(path + "both requestBody (>1 schema + form-urlencoded) and parameters are present (ln 299)");
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
                                    parameters: null,
                                    parameterSchema: null,
                                    requestBody: null,
                                    responses: responsesArray
                                },
                                    function(err,interfaceAction){
                                        if (err) {
                                            console.log(err);
                                            errorArray.push(
                                                {
                                                    "path": path,
                                                    "method": methods[j],
                                                    "error": err
                                                }
                                            )
                                            console.log(path + " requestBody is undefined but parameters are present (ln 166)");
                                            return; 
                                        }
                                        
                                });  
                        }
                
                } else {
                    console.log("not application/json or application/x-www-form-urlencoded");
                    errorArray.push({
                        path: path,
                        method: methods[j],
                        error: "requestBody is not application/json or application/x-www-form-urlencoded"
                    });
                }
               
            }


        }        
    }
        Job.findOneAndUpdate({uuid: jobId}, {
         'metadata.actions': {
                status: "COMPLETED",
                count: pathKeys.length,
                message: "Actions processed successfully",
                errors: errorArray
            }
        }, function(err, job) {
            if(err) {
                console.log(err)
            } else {
                console.log("Job Updated")
            }
        })
    
    return true;
}

function processParameters(parameterKeys, parameterValues,parent_interface_uuid, jobId){
    var parameterNames = Object.keys(parameterKeys);
    var parameterAttributes = Object.values(parameterValues);
    var errorArray = []
    for (var i = 0; i < parameterNames.length; ++i) {
        var parameterUUID = crypto.randomUUID();

        if (parameterAttributes[i].schema && !parameterAttributes[i].schema["$ref"]) {
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
                        errorArray.push({
                            "parameter": parameterKeys[i],
                            "error": err
                        })
                        return; 
                    }
                    //console.log("Interface Parameter Created "+ interfaceParameter._id);
            });
        } else if(parameterAttributes[i].schema){
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
            
                    if (err) {
                        console.log(err);
                        errorArray.push({
                            "parameter": parameterKeys[i],
                            "error": err
                        })

                        return; 
                    }
                    //console.log("Interface Parameter Created "+ interfaceParameter._id);
            });
        }
    }
    Job.findOneAndUpdate({uuid: jobId}, {
       'metadata.parameters' : {
                status: "COMPLETED",
                count: parameterKeys.length,
                message: "Parameters processed successfully",
                errors: errorArray
            }
    }, function(err, job) {
        if(err) {
            console.log(err)
        } else {
            console.log("Job Updated")
        }
    })
    
    return true  
}

function processSecuritySchemes(securitySchemeKeys,securitySchemeValues,parent_interface_uuid, jobId){
   
    //var securitySchemeAttributes = Object.values(securitySchemeValues);
    var errorArray = [];
    for (var i = 0; i < securitySchemeKeys.length; ++i) {
        
        var securitySchemeUUID = crypto.randomUUID();

        if (securitySchemeValues[i].flows) {

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
                            errorArray.push({
                                "securityScheme": securitySchemeKeys[i],
                                "error": err
                            })

                            return; 
                        }
                        console.log("Interface Security Scheme Created "+ interfaceSecurityScheme._id);
                });

        } else {

            InterfaceSecurityScheme.create({
                uuid: securitySchemeUUID,
                parent_interface_uuid: parent_interface_uuid,
                name: securitySchemeKeys[i],
                description: securitySchemeValues[i].description ? securitySchemeValues[i].description : null,
                type: securitySchemeValues[i].type,
                flows: []
            },
                function(err,interfaceSecurityScheme){
                    if (err) {
                        console.log(err);
                        errorArray.push({
                            "securityScheme": securitySchemeKeys[i],
                            "error": err
                        })
                        return; 
                    }
                    console.log("Interface Security Scheme Created "+ interfaceSecurityScheme._id);
            });


        }

    
    }
           
    Job.findOneAndUpdate({uuid: jobId}, {
        'metadata.securitySchemes': {
                status: "COMPLETED",
                count: securitySchemeKeys.length,
                message: "Security Scheme processed successfully",
                errors: errorArray
            }
        }, function(err, job) {
        if(err) {
            console.log(err)
        } else {
            console.log("Job Updated")
        }
    })
    
    
    return true;  
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
                    var nestedReference = null
                    if (parameters[i].properties.metadata !== undefined) {
                        var webhookPayload = parameters[i].properties.metadata.properties.payload
                      
                        nestedReference = Object.keys(webhookPayload)
                            .filter((key) => key.includes("$ref"))
                            .reduce((obj, key) => {
                                return Object.assign(obj, {
                                "property": webhookPayload[key]
                                });
                        }, {});
    
                    } else {
                        nestedReference = Object.keys(parameters[i].properties)
                            .filter((key) => key.includes("$ref"))
                            .reduce((obj, key) => {
                                return Object.assign(obj, {
                                "property": parameters[i].properties[key]
                                });
                        }, {});
                    }
                   
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

function processTopLevelRequiredProperties(schemas, schemaMap, version){
    var schemaArray = []
    var requiredSchemas = []

    for (var i = 0; i < schemas.length; ++i) {
        
        if(schemas[i] && schemas[i]["$ref"] !== undefined && version != 2){
            schemaArray.push(schemas[i]["$ref"].split("/")[3]);
        } else if (schemas[i] && schemas[i]["$ref"] !== undefined && version == 2) {
            schemaArray.push(schemas[i]["$ref"].split("/")[2]);
        } else {
            //skip
        }
    }

    schemaArray.map((schema) => {
        var schemaObject = schemaMap[schema]
        if (schemaObject.type == "object" && schemaObject.required !== undefined){
            requiredSchemas.push(...schemaObject.required)
        }
    })

    return requiredSchemas
}

function processRequestParameterSchema(schemas, parameterMap, schemaMap){

    var transitionalSchemaMap = {}
    var parameters = {
        "header": {},
        "path": {},
        "query": {}
    };

    let parameterObject = {}

    if(parameterMap){
        for (var i = 0; i < schemas.length; ++i) {
            var parameterMapCopy = JSON.parse(JSON.stringify(parameterMap));
            parameterObject = parameterMapCopy[schemas[i]]
            transitionalSchemaMap[schemas[i]] = parameterObject
        }
    } else {

       for (var i = 0; i < schemas.length; i++){
         parameterObject = schemas[i]
         transitionalSchemaMap[schemas[i].name] = schemas[i]
       }
    }
    var parameterSchemaKeys = Object.keys(transitionalSchemaMap);
    var parameterSchemaValues = Object.values(transitionalSchemaMap);

    for (var i = 0; i < parameterSchemaKeys.length; ++i) {
        var parameterName = parameterSchemaValues[i].name ? parameterSchemaValues[i].name : parameterSchemaKeys[i]

        if(parameterSchemaValues[i].schema["$ref"] !== undefined){
            parameterObject[parameterName] = parameterSchemaValues[i];
            var schemaMapCopy = JSON.parse(JSON.stringify(schemaMap));
            var reference = parameterSchemaValues[i].schema["$ref"].split("/")[3]
            parameterObject[parameterName].schema = schemaMapCopy[reference]
            parameterObject[parameterName].schemaRef = reference
            
        } else {
            // parameterObject[parameterName].schema = parameterSchemaValues[i].schema
            // parameterObject[parameterName] = parameterSchemaValues[i];
            // parameterObject[parameterName].schemaRef = 'inlineSchema'
            let inlineParameterObject = {}
            inlineParameterObject[parameterName] = parameterSchemaValues[i]
            inlineParameterObject[parameterName].schemaRef = 'inlineSchema'
            parameterObject = inlineParameterObject
        }

        if (parameterSchemaValues[i].in == "header"){
            Object.assign(parameters.header, parameterObject);
        } else if (parameterSchemaValues[i].in == "path"){
            Object.assign(parameters.path, parameterObject);
        } else if (parameterSchemaValues[i].in == "query"){
            Object.assign(parameters.query, parameterObject);
        }

    }

    return parameters;
}

function processRequestBodySchema(type, schemas, parent_interface_uuid, schemaMap, version){
    
    //We'll create two arrays to hold two types of schema we'll see at the top-level of a requestbody: a reference to a component.schema or an inline schema defined with a combination of references and inline properties.
    var schemaArray = []
    var inlineSchemaProperties = []

    //This will build our two input arrays for their respective for loops.
    for (var i = 0; i < schemas.length; ++i) {
        if(schemas[i] && schemas[i]["$ref"] !== undefined && version != 2){
            schemaArray.push(schemas[i]["$ref"].split("/")[3]);
        } else if (schemas[i] && schemas[i]["$ref"] !== undefined && version == 2) {
            schemaArray.push(schemas[i]["$ref"].split("/")[2]);
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
        
            //Let's process the properties for the schema.

            var schemaProperties = processSchemaProperties(propertyKeys, propertyValues, schemaKey, schemaMapCopy, true, version);
            inlineSchema = {...inlineSchema, ...schemaProperties}

        } else if (schemaValues.items && schemaValues.type == 'array'){
            //If the schema is an array, we'll need to process it differently.
                var propertyKeys = Object.keys(schemaValues.items.properties);
                var propertyValues = Object.values(schemaValues.items.properties);
                var schemaProperties = processSchemaProperties(propertyKeys, propertyValues, schemaKey, schemaMapCopy, true, version);
        } else {
            //If the schema doesn't have a properties object, we'll need to process it differently.
            schemaValues = Object.assign(schemaObject, schemaValues);
        }

        // Set the type of the top-level keys
        if (inlineSchema[schemaKey] && !inlineSchema[schemaKey].type) {
            inlineSchema[schemaKey].type = schemaValues.properties ? 'object' : 'array';
        }

    }

    //This for loop will not assume a reference and will build out the schema object from the inline properties.
    for (var i = 0; i < inlineSchemaProperties.length; ++i){
        if(inlineSchemaProperties[i] && inlineSchemaProperties[i].properties){
            var propertyKeys = Object.keys(inlineSchemaProperties[i].properties);
            var propertyValues = Object.values(inlineSchemaProperties[i].properties);
            var schemaProperties = processSchemaProperties(propertyKeys, propertyValues, null, schemaMap, true, version);
            var schemaPropertyKeys = Object.keys(schemaProperties);
            var schemaPropertyValues = Object.values(schemaProperties);

            // if the inline schema has properties defined already (i.e. if it has the same key as a refernced property already added to the inlineSchema) we'll ensure we are only adding properties and not overwriting
            for (var i = 0; i < schemaPropertyKeys.length; ++i){
                if(inlineSchema[schemaPropertyKeys[i]]){
                    inlineSchema[schemaPropertyKeys[i]].properties = {...inlineSchema[schemaPropertyKeys[i]].properties, ...schemaPropertyValues[i].properties}
                    if(!inlineSchema[schemaPropertyKeys[i]].type){
                        inlineSchema[schemaPropertyKeys[i]].type = 'object'
                    }
                } else {
                    inlineSchema = {...inlineSchema, ...schemaProperties}
                }
            }
        } else if(inlineSchemaProperties[i] && inlineSchemaProperties[i].items && inlineSchemaProperties[i].items.properties){
            var propertyKeys = Object.keys(inlineSchemaProperties[i].items.properties);
            var propertyValues = Object.values(inlineSchemaProperties[i].items.properties);
            var schemaProperties = processSchemaProperties(propertyKeys, propertyValues, null, schemaMap, true, version);
            var schemaPropertyKeys = Object.keys(schemaProperties);
            var schemaPropertyValues = Object.values(schemaProperties);

            // if the inline schema has properties defined already (i.e. if it has the same key as a refernced property already added to the inlineSchema) we'll ensure we are only adding properties and not overwriting
            for (var i = 0; i < schemaPropertyKeys.length; ++i){
                if(inlineSchema[schemaPropertyKeys[i]]){
                    inlineSchema[schemaPropertyKeys[i]].properties = {...inlineSchema[schemaPropertyKeys[i]].properties, ...schemaPropertyValues[i].properties}
                } else {
                    inlineSchema = {...inlineSchema, ...schemaProperties}
                }
            }

           
        }
    }

    let inlineSchemaKeys = Object.keys(inlineSchema);
    let inlineSchemaValues = Object.values(inlineSchema);

    for (var i = 0; i < inlineSchemaKeys.length; ++i){
        if(!inlineSchemaValues[i].type){
            if(inlineSchemaValues[i].properties){
                if(Object.keys(inlineSchemaValues[i].properties).length > 0){
                    inlineSchemaValues[i].type = 'object'
                }
            } else if (inlineSchemaValues[i].items){
                inlineSchemaValues[i].type = 'array'
            }
        }
    }

    return inlineSchema;

}

function processSchemaProperties(propertyKeys, propertyValues, parentSchema, schemaMap, debug, version, parentPath){

    var schemaProperties = {};
    
    //example propertyKeys: [deliveryStatus, estimatedDeliveryTime]
    //example propertyValues: [{ '$ref': '#/components/schemas/DeliveryStatus' }, {type: 'string',nullable: true,description: 'The expected delivery time.',format: 'date-time',example: '2007-12-03T10:15:30+01:00'}]  
        for (var i = 0; i < propertyKeys.length; ++i){
                var propertyKey = propertyKeys[i];
                var propertyValue = propertyValues[i];

                //Check for infinite loop and return an empty object if one is detected.
                // REMOVED FOR NOW -- || parentPath?.includes(propertyKey)
                if(parentSchema == propertyKey || parentSchema == "ItemModifier" || parentSchema == "ModifierItem"  || propertyKey == "sourceExternalIdentifiers" || propertyKey == "childCategories"){
                    console.log("Infinite Loop Detected: " + parentSchema + " and " + propertyKey + " reference loop.")
                    console.log("Parent Path")
                    console.log(parentPath)
                    return {};
                }
                // console.log("Property Key: " + propertyKey)
                // console.log("Property Value: ")
                // console.log(JSON.parse(JSON.stringify(propertyValue)))
                //Check if the property is a reference to another schema.
                if (propertyValue['$ref']){
                    // console.log("Reference Detected: " + propertyKey)
                    // console.log(propertyValue['$ref'])
                    var propertyObject = {};
                    var propertyReference = propertyValue['$ref'].split("/")[3];
                    var propertySchemaMap = JSON.parse(JSON.stringify(schemaMap));
                    var propertySchemaMapValues = propertySchemaMap[propertyReference];
                    
                    // console.log("Property Schema for: " + propertyKey)
                    // console.log(propertySchemaMapValues)

                    propertyObject[propertyKey] = {...propertyObject[propertyKey], ...propertySchemaMapValues};
                    if(propertySchemaMapValues && propertySchemaMapValues.properties){
                        var nestedPropertyKeys = Object.keys(propertySchemaMapValues.properties);
                        var nestedPropertyValues = Object.values(propertySchemaMapValues.properties);
                        var propertyProperties = processSchemaProperties(nestedPropertyKeys, nestedPropertyValues, propertyReference, schemaMap, false, version, parentPath + "." + propertyKey);
                        propertyObject[propertyKey].properties = {...propertyObject[propertyKey].properties, ...propertyProperties}

                        //schemaProperties = Object.assign(schemaProperties, propertyObject);
                        schemaProperties = {...schemaProperties, ...propertyObject}
                    } else if(propertySchemaMapValues && propertySchemaMapValues['allOf']){
                        var allOfSchema = processRequestBodySchema("webhook", propertySchemaMapValues['allOf'], null, schemaMap,  version)
                        propertyObject[propertyKey].properties = allOfSchema
                        schemaProperties = {...schemaProperties, ...propertyObject}
                    } else {
                        //schemaProperties = Object.assign(schemaProperties, propertyObject);
                        schemaProperties = {...schemaProperties, ...propertyObject}
                    }
                   
                } else if (propertyValue['allOf']){

                    if(propertyValue['allOf'].length == 1) {
                        var propertyObject = {};
                        console.log("allOf Detected: " + propertyKey)
                        console.log(propertyValue['allOf'])
                        var allOfSchema = processRequestBodySchema("webhook", propertyValue['allOf'], null, schemaMap,  version)
                        if(propertyValue['allOf'].length == 1) {
                            if(propertyValue['allOf'][0]['$ref']){
                                var propertyReference = propertyValue['allOf'][0]['$ref'].split("/")[3];
                                var propertySchemaMap = JSON.parse(JSON.stringify(schemaMap));
                                var propertySchemaMapValues = propertySchemaMap[propertyReference];
                                propertyObject[propertyKey] = {...propertyObject[propertyKey], ...propertySchemaMapValues};
                            } else {
                                propertyObject[propertyKey] = {...propertyObject[propertyKey], ...propertyValue['allOf'][0]};
                            }
                        }
                        propertyObject[propertyKey].properties = allOfSchema

                        schemaProperties = {...schemaProperties, ...propertyObject}
                    }

                }
                  else if (propertyValue.type == 'object' && propertyValue.properties && Object.keys(propertyValue.properties).length > 0){
                    // console.log("Object Detected: " + propertyKey)
                    // console.log("Property Key: " + propertyKey)
                    // console.log("Property Value: ")
                    // console.log(JSON.parse(JSON.stringify(propertyValue)))

                    var propertyObject = {};
                    var propertyKeys = Object.keys(propertyValue.properties);
                    var propertyValues = Object.values(propertyValue.properties);
                    var propertyProperties = processSchemaProperties(propertyKeys, propertyValues, propertyKey, schemaMap, false, version, parentPath + "." + propertyKey);
                    propertyObject[propertyKey] = {...propertyObject[propertyKey], ...propertyValue};
                    propertyObject[propertyKey].properties = {...propertyObject[propertyKey].properties, ...propertyProperties}; 
                    //schemaProperties = Object.assign(schemaProperties, propertyObject);
                    schemaProperties = {...schemaProperties, ...propertyObject}
                    // console.log("Schema Properties: ")
                    // console.log(JSON.parse(JSON.stringify(schemaProperties)))

                } else if (propertyValue.type == 'object' && propertyValue.additionalProperties) {
                    //object for the map
                    var propertyObject = {};
                    
                    //object for the key value pairs
                    var mapPropertyObject = {}

                    //Add curly brackets to indicate the key is a variable and can be set during the mapping process.
                    var mapPropertyKey = "{{" + propertyValue.additionalProperties["x-additionalPropertiesName"] + "}}";

                    //If the values for the map are a reference, process the reference 
                    if(propertyValue.additionalProperties['$ref']){
                       
                        var propertyReference = propertyValue.additionalProperties['$ref'].split("/")[3];
                        var propertySchemaMap = JSON.parse(JSON.stringify(schemaMap));
                        var mapPropertyValueSchema = propertySchemaMap[propertyReference]
                        mapPropertyObject[mapPropertyKey] = mapPropertyValueSchema;

                        //With the schema reference details, we can now process the schema properties if they exist.
                        if(mapPropertyValueSchema && mapPropertyValueSchema.properties){
                            var nestedPropertyKeys = Object.keys(propertySchemaMap[propertyReference].properties);
                            var nestedPropertyValues = Object.values(propertySchemaMap[propertyReference].properties);
                            var mappedPropertyValueNestedProperties = processSchemaProperties(nestedPropertyKeys, nestedPropertyValues, propertyReference, schemaMap, false, version, parentPath + "." + propertyKey);
                            mapPropertyObject[mapPropertyKey].properties = {...mapPropertyObject[mapPropertyKey].properties, ...mappedPropertyValueNestedProperties}
                        }

                        propertyObject[propertyKey] = {...propertyObject[propertyKey], ...propertyValue};
                        propertyObject[propertyKey].properties = {...propertyObject[propertyKey].properties, ...mapPropertyObject};
                        schemaProperties = {...schemaProperties, ...propertyObject}

                    } else {
                        console.log("Map Detected with no schema defined inline: " + propertyKey)
                    }
                } else if (propertyValue.type == 'array'){

                    // console.log("Array Detected: " + propertyKey)

                    var propertyObject = {};
                    propertyObject[propertyKey] = {...propertyObject[propertyKey], ...propertyValue};

                    if(propertyValue.items && propertyValue.items['$ref']){
                        // console.log("Array Detected with Item Schema Reference: " + propertyKey)
                        // console.log("Property Key: " + propertyKey)
                        // console.log("Property Value: ")
                        // console.log(JSON.parse(JSON.stringify(propertyValue)))
                        var propertyReference = ""
                        if(version == 2){
                            propertyReference = propertyValue.items['$ref'].split("/")[2];
                        } else {
                            propertyReference = propertyValue.items['$ref'].split("/")[3];
                        }
                        var propertySchemaMap = JSON.parse(JSON.stringify(schemaMap));
                        var propertySchemaMapValues = propertySchemaMap[propertyReference];
                        
                        if(propertySchemaMapValues.properties){

                            var itemArraySchemaProperties = JSON.parse(JSON.stringify(propertySchemaMapValues.properties));
                            var itemArraySchemaPropertyKeys = Object.keys(itemArraySchemaProperties);
                            var itemArraySchemaPropertyValues = Object.values(itemArraySchemaProperties);
                            var itemArraySchemaPropertyMap = processSchemaProperties(itemArraySchemaPropertyKeys, itemArraySchemaPropertyValues, propertyReference, propertySchemaMap, false, version, parentPath + "." + propertyKey);
                            
                            var itemsSchemaObject = {
                                    "type": propertySchemaMapValues.type ? propertySchemaMapValues.type : null,
                                    "properties": itemArraySchemaPropertyMap,
                                    "required": propertySchemaMapValues.required ? propertySchemaMapValues.required : [],
                                    "schemaName": propertyReference
                            }
                            propertyObject[propertyKey].items = itemsSchemaObject;
                            schemaProperties = Object.assign(schemaProperties, propertyObject);

                        } else {
                            var itemsSchemaObject = propertySchemaMapValues
                            propertyObject[propertyKey].items = itemsSchemaObject;
                            //schemaProperties = Object.assign(schemaProperties, propertyObject);
                            schemaProperties = {...schemaProperties, ...propertyObject}
                        }
                      
                    } else if(propertyValue.items && !propertyValue.items['$ref']){
                        var itemsSchemaObject = {
                            "type": propertyValue.items.type ? propertyValue.items.type : null,
                            schemaName: 'inlineSchema'
                        }

                        if(propertyValue.items.properties){
                            var nestedPropertyKeys = Object.keys(propertyValue.items.properties);
                            var nestedPropertyValues = Object.values(propertyValue.items.properties);
                            var mappedPropertyValueNestedProperties = processSchemaProperties(nestedPropertyKeys, nestedPropertyValues, propertyKey, schemaMap, false, version, parentPath + "." + propertyKey);
                            itemsSchemaObject.properties = mappedPropertyValueNestedProperties;
                        }

                        propertyObject[propertyKey].items = itemsSchemaObject;
                        //schemaProperties = Object.assign(schemaProperties, propertyObject);
                        schemaProperties = {...schemaProperties, ...propertyObject}
                    } 
                } else {
                    var propertyObject = {};
                    propertyObject[propertyKey] = {...propertyObject[propertyKey], ...propertyValue};
                    //schemaProperties = Object.assign(schemaProperties, propertyObject);
                    schemaProperties = {...schemaProperties, ...propertyObject}
                }
    }
    
        return schemaProperties;

}

function processWebhooks(webhookKeys,webhookValues,parent_interface_uuid, schemaMap, jobId){
    var errorArray = [];

    for (var i = 0; i < webhookKeys.length; ++i){

        var webhookUUID = crypto.randomUUID();
        
        var thisWebhookKey = webhookKeys[i];
        var thisWebhookValues = webhookValues[i]["post"];
    
        // Check if the value we're processing is actually a webhook and not a boolean or other property.
        if(typeof thisWebhookValues == "object"){
            //Check if the webhook has a requestBody schema in json defined.
            if (thisWebhookValues.requestBody.content["application/json"].schema !== undefined) {

                // Check if allOf is set in the schema body.  Set the schema accordingly. 
                var schema = thisWebhookValues.requestBody.content["application/json"].schema["allOf"] ? thisWebhookValues.requestBody.content["application/json"].schema["allOf"] : [thisWebhookValues.requestBody.content["application/json"].schema]
                console.log("Webhook Schema")
                console.log(schema)
                var webhookSchemas = processReferences(schema);
    
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
                                    schema: processRequestBodySchema("webhook",schema, parent_interface_uuid, schemaMap),
                                    validationType: "all_of"
                                },
                                responses: responsesArray
                            },
                                function(err,interfaceWebhook){
                                    if (err) {
                                        console.log(err);
                                        errorArray.push({
                                            "webhook": thisWebhookValues.operationId,
                                            "error": err
                                        });
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
                                schema: processRequestBodySchema("webhook",schema, parent_interface_uuid, schemaMap),
                                validationType: "all_of"
                            },
                            responses: []
                        },
                            function(err,interfaceWebhook){
                                if (err) {
                                    console.log(err);
                                    errorArray.push({
                                        "webhook": thisWebhookValues.operationId,
                                        "error": err
                                    });
                                    return; 
                                }
                                // console.log("Interface Webhook Created Without Responses"+ interfaceWebhook._id);
                                // console.log(interfaceWebhook)
                        });
                }
    
            } else {

            }
        }

        
        Job.findOneAndUpdate({uuid: jobId}, {
            'metadata.webhooks':{
                status: "COMPLETED",
                count: webhookKeys.length,
                message: "Webhooks processed successfully",
                errors: errorArray
            }
        }, function(err, job) {
            if(err) {
                console.log(err)
            } else {
                console.log("Job Updated")
            }
        })

    }
    
    return true
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

function processOpenApiV2PathActions(pathKeys, pathValues, parent_interface_uuid, schemaMap, jobId) {
    //iterate through paths
    var errorArray = [];
    var parameterArray = [];
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

            var actionParameters = values[j].parameters ? values[j].parameters.filter(function (parameter) {
                return parameter.in == "header" || parameter.in == "path";
            }) : [];

            var actionRequestBody = values[j].parameters ? values[j].parameters.filter(function (parameter) {
                
                return parameter.in == "body";
            }) : [];

            for (var k = 0; k < responseKeys.length; ++k){
                if (responseValues[k].schema !== undefined) {
                    var responseSchema = responseValues[k].schema;
                    responseSchemaArray.push(responseSchema)
                    var response = {
                        "http_status_code": responseKeys[k],
                        "content_type": "json",
                        "schema": processRequestBodySchema("action", responseSchemaArray, parent_interface_uuid, schemaMap, 2)
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
           // Request Body schema is defined in the parameters array.

            if (actionRequestBody.length == 0 && actionParameters.length == 0) {

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
                            errorArray.push({
                                "action": values[j].operationId,
                                "error": err
                            })
                            console.log(err);
                            console.log(path + " both requestBody and parameters are undefined (ln 158)");
                            return; 
                        }
                        else {
                            console.log(interfaceAction)
                        }
                        
                });  


            } else if (actionRequestBody.length == 0 && actionParameters.length > 0) {

                var parameters = processOpenApiV2RequestParameterSchema(actionParameters, schemaMap);
                parameterArray.push(parameters);
             // No Request Body but Parameters exist for the Action (i.e. GET request with an ID in the path or a documented Header parameter) 
                
                InterfaceAction.create({
                    uuid: actionUUID,
                    parent_interface_uuid: parent_interface_uuid,
                    name: values[j].operationId,
                    path: path,
                    method: methods[j],
                    parameterSchema: parameters,
                    requestBody: null,
                    responses: responsesArray
                },
                    function(err,interfaceAction){
                        if (err) {
                            console.log(err);
                            errorArray.push({
                                "action": values[j].operationId,
                                "error": err
                            })
                            console.log(path + " requestBody is undefined but parameters exist (ln 366)");
                            return; 
                        } else {
                            console.log(interfaceAction)
                        }
                        
                });  
            } else if (actionRequestBody.length > 0 && actionParameters.length > 0 ) {

                // Request Body and Parameters exist for the Action (i.e. POST, PUT, PATCH)
                    var parameters = processOpenApiV2RequestParameterSchema(actionParameters, schemaMap);
                    parameterArray.push(parameters);
    
                    for (l = 0; l < actionRequestBody.length; ++l) {
                    
                        var requestBodyKeys = Object.keys(actionRequestBody[l].schema);
                        var requestBody = actionRequestBody[l].schema;
                        var requestBodyArray = [];
                    
                        if(requestBodyKeys.includes("$ref") == true) {
                            if(requestBodyKeys.length == 1) {
                                requestBodyArray.push(requestBody);
                            } else {
                                for (var m = 0; m < requestBodyKeys.length; ++m){
                                    requestBodyArray.push(requestBody[m]);
                                }
                            }

                            InterfaceAction.create({
                                uuid: actionUUID,
                                parent_interface_uuid: parent_interface_uuid,
                                name: values[j].operationId,
                                path: path,
                                method: methods[j],
                                parameterSchema: parameters,
                                requestBody2: {
                                    type: "json",
                                    required: actionRequestBody[l].required,
                                    requiredSchemas: processTopLevelRequiredProperties(requestBodyArray, schemaMap, 2),
                                    schema: processRequestBodySchema("action",requestBodyArray, parent_interface_uuid, schemaMap, 2)
                                },
                                responses: responsesArray
                            },
                                function(err,interfaceAction){
                                    if (err) {
                                        console.log(err);
                                        errorArray.push({
                                            "action": values[j].operationId,
                                            "error": err
                                        })
                                        console.log(path + " requestBody is undefined but parameters exist (ln 366)")
                                        return; 
                                    } else {
                                        console.log(interfaceAction)
                                    }
                                    //  console.log(JSON.parse(JSON.stringify(interfaceAction)).requestBody2.schema)
                                    //console.log("Interface Action Created with ID: " + interfaceAction._id);
                                    
                            });  

                        } else{
                            console.log('OpenAPIV2 Request Body Schema is not a reference:')
                            errorArray.push({
                                "action": values[j].operationId,
                                "error": "OpenAPIV2 Request Body Schema is not a reference"
                            })
                            console.log(actionRequestBody[i])
                        }

                    } 

            }  else if (actionRequestBody.length > 0 && actionParameters.length == 0 ) {
                // Request Body and Parameters exist for the Action (i.e. POST, PUT, PATCH)
               
                for (n = 0; n < actionRequestBody.length; n++) {
                    var requestBodyKeys = Object.keys(actionRequestBody[n].schema);
                    var requestBody = actionRequestBody[n].schema;
                    var requestBodyArray = [];
                
                    if(requestBodyKeys.includes("$ref") == true) {
                        for (var o = 0; o < requestBodyKeys.length; ++o){
                            requestBodyArray.push(requestBody[o]);
                        }
                        InterfaceAction.create({
                            uuid: actionUUID,
                            parent_interface_uuid: parent_interface_uuid,
                            name: values[j].operationId,
                            path: path,
                            method: methods[j],
                            parameterSchema: null,
                            requestBody2: {
                                type: "json",
                                required: actionRequestBody[n].required,
                                requiredSchemas: processTopLevelRequiredProperties(requestBodyArray, schemaMap, 2),
                                schema: processRequestBodySchema("action",requestBodyArray, parent_interface_uuid, schemaMap, 2)
                            },
                            responses: responsesArray
                        },
                            function(err,interfaceAction){
                                if (err) {
                                    console.log(err);
                                    errorArray.push({
                                        "action": values[j].operationId,
                                        "error": err
                                    })
                                    console.log(path + " requestBody is undefined but parameters exist (ln 366)")
                                    return; 
                                } else {
                                    console.log(interfaceAction)
                                }
                                //  console.log(JSON.parse(JSON.stringify(interfaceAction)).requestBody2.schema)
                                //console.log("Interface Action Created with ID: " + interfaceAction._id);
                                
                        });  

                    } else{
                        console.log('OpenAPIV2 Request Body Schema is not a reference:')
                        console.log(actionRequestBody[i])
                        errorArray.push({
                            "action": values[j].operationId,
                            "error": "OpenAPIV2 Request Body Schema is not a reference"
                        })
                    }

                } 
               
            }


        }        
    }
    Job.findOneAndUpdate({uuid: jobId}, {
        'metadata.actions': {
                status: "COMPLETED",
                count: pathKeys.length,
                message: "Actions processed successfully",
                errors: errorArray
            },
        'metadata.parameters':{
            status: "COMPLETED",
            count: parameterArray.length,
            message: "Parameters processed successfully",
            errors: errorArray
        }
    }, function(err, job) {
        if(err) {
            console.log(err)
        } else {
            console.log("Job Updated")
        }
    })

    return;
}

function processOpenApiV2RequestParameterSchema(schemas,schemaMap){

    var parameters = {
        "header": {},
        "path": {}
    };

    for (var i=0; i < schemas.length; ++i){
        if(schemas[i].schema){
            if(schemas[i].schema["$ref"] !== undefined){
                var schemaMapCopy = JSON.parse(JSON.stringify(schemaMap));
                var parameterSchema = schemaMapCopy[schemas[i].schema["$ref"].split("/")[2]]
                parameters[schemas[i].in][schemas[i].name] = schemas[i];
                parameters[schemas[i].in][schemas[i].name].schema = parameterSchema;

            } else{
                parameters[schemas[i].in][schemas[i].name] = schemas[i];
            }
        }
        else {
            parameters[schemas[i].in][schemas[i].name] = schemas[i];
            parameters[schemas[i].in][schemas[i].name].schema = {type: schemas[i].type, format: schemas[i].format ? schemas[i].format : null, description: schemas[i].description ? schemas[i].description : null};
        }
    }

    return parameters;
}

function processOpenApiV2SecuritySchemes(securitySchemeKeys,securitySchemeValues,parent_interface_uuid, jobId){
    var errorArray = [];
    for (var i = 0; i < securitySchemeKeys.length; ++i) {
        
        var securitySchemeUUID = crypto.randomUUID();

        if (securitySchemeValues[i].flow) {

                var flowsArray = [];
               
                var flow = {
                    "type": securitySchemeValues[i].type,
                    "tokenUrl": securitySchemeValues[i].tokenUrl,
                    "scopes": securitySchemeValues[i].scopes,
                }

                flowsArray.push(flow);
        
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
                            errorArray.push({
                                "securityScheme": securitySchemeKeys[i],
                                "error": err
                            })
                            return; 
                        }
                        console.log("Interface Security Scheme Created "+ interfaceSecurityScheme._id);
                });

        } else {

            InterfaceSecurityScheme.create({
                uuid: securitySchemeUUID,
                parent_interface_uuid: parent_interface_uuid,
                name: securitySchemeKeys[i],
                description: securitySchemeValues[i].description ? securitySchemeValues[i].description : null,
                type: securitySchemeValues[i].type,
                flows: []
            },
                function(err,interfaceSecurityScheme){
                    if (err) {
                        console.log(err);
                        errorArray.push({
                            "securityScheme": securitySchemeKeys[i],
                            "error": err
                        })
                        return; 
                    }
                    console.log("Interface Security Scheme Created "+ interfaceSecurityScheme._id);
            });


        }
       

    
    }
    Job.findOneAndUpdate({uuid: jobId}, {
        'metadata.securitySchemes': {
                status: "COMPLETED",
                count: securitySchemeKeys.length,
                message: "Security Schemes processed successfully"
            },
            errors: errorArray
    }, function(err, job) {
        if(err) {
            console.log(err)
        } else {
            console.log("Job Updated")
        }
    })
    return;  
}

function convertPostmanCollection(collection, userId){
    var json = JSON.stringify(collection);
   postmanToOpenApi(json, null, {defaultTag: 'General'} )
    .then(result => {
        var parsedYaml = yaml.load(result);
        console.log(parsedYaml)
        var parsedJson = JSON.parse(JSON.stringify(yaml.load(result),null,2));
        if(parsedJson.openapi == "3.0.0"){
            processOpenApiV3(parsedYaml, userId);
        }
    }).catch(err => {
        console.log(err);
    });
}

// HELPER FUNCTIONS FOR RAG USE CASES (Assistants for Workflow, API, and Partnerships)
async function upsertVectors(vectors) {
    const pinecone = new PineconeClient();
    const MAX_BATCH_SIZE = 100;
  
    console.log("Upserting vectors");
    console.log(vectors);
  
    try {
      await pinecone.init({
        environment: 'us-central1-gcp',
        apiKey: process.env.REACT_APP_PINECONE_API_KEY
      });
      console.log('Pinecone client initialized');
  
      const index = pinecone.Index('api-index');
  
      // Split vectors into batches
      for (let i = 0; i < vectors.length; i += MAX_BATCH_SIZE) {
        const batch = vectors.slice(i, i + MAX_BATCH_SIZE);
        const upsertRequest = {
          vectors: batch
        };
    
        const response = await index.upsert({ upsertRequest });
        console.log(response);
      }
    
      return {
        status: "Success",
        message: "Vectors upserted successfully"
      };
    } catch (error) {
      console.log(error);
      return {
        status: "Error",
        message: error
      };
    }
}

function processWorkflow(workflow){

    var apis = workflow.nodes[0].data.apis;
    

    let processedWorkflow = {};
    processedWorkflow.name = workflow.name;
    processedWorkflow.status = workflow.status;
    processedWorkflow.created_at = workflow.created_at;
    processedWorkflow.updated_at = workflow.updated_at;
    processedWorkflow.uuid = workflow.uuid;
    processedWorkflow.workflow_trigger = workflow.trigger.type == 'webhook' && workflow.trigger.selectedWebhook ? {
        type: workflow.trigger.type,
        webhook_name: workflow.trigger.selectedWebhook.name,
        webhook_description: workflow.trigger.selectedWebhook.description,
        webhook_apis: apis.filter(api => api.uuid == workflow.trigger.selectedWebhook.parent_interface_uuid)[0] ? apis.filter(api => api.uuid == workflow.trigger.selectedWebhook.parent_interface_uuid)[0].name : null,
        webhook_schema: workflow.trigger.selectedWebhook.requestBody2 ? workflow.trigger.selectedWebhook.requestBody2 : null,
    } : {
        type: workflow.trigger.type,
        execution_cadence: workflow.trigger.cadence,
        execution_time: workflow.time,
        execution_timezone: workflow.timezone,
        execution_days: workflow.type == 'Weekly' ? workflow.days : 'Every Day',
    };

    let workflow_steps = {} 
    
    workflow.nodes.filter(node => node.type != 'trigger').map((node, index) => {
        workflow_steps[index] = {
            http_request_name: node.data.selectedAction?.name,
            http_request_method: node.data.selectedAction?.method,
            http_request_path: node.data.selectedAction?.path,
            http_request_parent_api_name: apis.filter(api => api.uuid == node.data.selectedAction?.parent_interface_uuid)[0] ? apis.filter(api => api.uuid == node.data.selectedAction?.parent_interface_uuid)[0].name : null,
            http_request_parameters: node.data.selectedAction?.parameterSchema ? node.data.selectedAction?.parameterSchema : null,
            http_request_requestBody: node.data.selectedAction?.requestBody2 ? node.data.selectedAction?.requestBody2 : null,
            http_request_responses: node.data.selectedAction?.responses ? node.data.selectedAction?.responses : null,
        }
    })

    processedWorkflow.workflow_steps = workflow_steps;

    return processedWorkflow;
}

async function processPartnershipForVectorDb(partnership){

    let partnership_uuid = partnership.uuid;
    let openAiConfiguration = new Configuration({
        apiKey: process.env.REACT_APP_OPENAPI_API_KEY
    })
    const openai = new OpenAIApi(openAiConfiguration);

    // Chunk the details and each workflow into smaller pieces
    async function chunkAndEmbedPartnership() {
        let vectors = [];

        async function processChunk(text, metadataType, uuid, chunkLabel) {
            if (text.length > 8191) {
                for (let i = 0; i < text.length; i += 8191) {
                    let chunk = text.slice(i, i + 8191);
                    let vectorObject = await generateEmbeddings(chunk, metadataType, chunkLabel+"_"+i);
                    vectors.push(vectorObject);
                }
            } else {
                let vectorObject = await generateEmbeddings(text, metadataType, chunkLabel);
                vectors.push(vectorObject);
            }
        }

        // Process the partnership details
        let partnershipDetails = {
            "name": partnership.name,
            "status": partnership.status,
            "configurations": partnership.configuration,
            "created_at": partnership.created_at
        }

        let partnershipDetailsPromise = processChunk(JSON.stringify(partnershipDetails), "partnership_details", partnership_uuid, partnership_uuid);
       
        // Process the workflows
        let workflowPromises = partnership.workflows ? partnership.workflows.map(async (workflow) => {
            let processedWorkflow = processWorkflow(workflow);
            let workflowPromise = processChunk(JSON.stringify(processedWorkflow), "partnership_workflow", workflow.uuid, "partnership_"+partnership_uuid + "_workflow_" + workflow.uuid);
            await workflowPromise;
        }) : []
  
        await Promise.all([partnershipDetailsPromise, ...workflowPromises]);

        return vectors;
    }

    // Generate embeddings for the chunks
    async function generateEmbeddings(chunk, metadataType, uuid) {
        
        let vectorObject;
      
        try {
          let response = await openai.createEmbedding({
            model: 'text-embedding-ada-002',
            input: chunk
          });
          
          let vectors = response.data.data[0].embedding;
      
          vectorObject = {
            id: uuid,
            values: vectors,
            metadata: {
              partnership_uuid: partnership_uuid,
              metadata_type: metadataType,
              text: chunk
            }
          };
      
        //   console.log(vectorObject);
        } catch (error) {
          console.log(error.response.data.error);
      
          vectorObject = {
            id: uuid,
            values: [],
            metadata: {
            partnership_uuid: partnership_uuid,
              metadata_type: metadataType,
              text: chunk
            }
          };
        }
      
        return vectorObject;
    }
      
    return new Promise((resolve, reject) => {
        chunkAndEmbedPartnership()
          .then((vectors) => {
            // console.log("Vectors: " + vectors.length);
            upsertVectors(vectors)
              .then((result) => {
                // console.log("Result");
                // console.log(result);
                resolve(result);
              })
              .catch((err) => {
                console.log(err);
                reject({
                  status: "Error",
                  message: err
                });
              });
          })
          .catch((err) => {
            console.log(err);
            reject({
              status: "Error",
              message: err
            });
          });
    });

}

async function processApiForVectorDb(apiSpec) {

    let api_uuid = apiSpec.uuid;
    let openAiConfiguration = new Configuration({
        apiKey: process.env.REACT_APP_OPENAPI_API_KEY
    })
    const openai = new OpenAIApi(openAiConfiguration);
 
    // Chunk the spec into smaller pieces
    async function chunkAndEmbedSpec() {
        let vectors = [];
      
        async function processChunk(text, metadataType, uuid, chunkLabel) {
          if (text.length > 8191) {
            for (let i = 0; i < text.length; i += 8191) {
              let chunk = text.slice(i, i + 8191);
              let vectorObject = await generateEmbeddings(chunk, metadataType, uuid+"_"+i);
              vectors.push(vectorObject);
            }
          } else {
            let vectorObject = await generateEmbeddings(text, metadataType, uuid);
            vectors.push(vectorObject);
          }
        }
      
        let actions = apiSpec.actions || {};
        let security = apiSpec.security || {};
        let webhooks = apiSpec.webhooks || {};
        let documentation = apiSpec.documentation || {};
        let base_urls = apiSpec.base_urls || {};
        let entities = apiSpec.entities || {};
        let parameters = apiSpec.parameters || {};
      
        let actionPromises = Object.values(actions).map((action) => {
            console.log(action.name)
            let actionSummary = "The " +action.name+ " request is made by using the " + action.method + " method on this endpoint " + action.path +"." 
            let parameterSchemaSummary =  action.parameterSchema ? " This request supports header and/or path parameters as described in this JSON object: " + JSON.stringify(action.parameterSchema) : " This request has no header or path parameters documented."  
            let requestBodySchemaSummary = action.requestBody2 ? " This request also supports a request body described by this JSON object: " + JSON.stringify(action.requestBody2) : " This request does not have documented support for a request body."
            let responsesSummary = action.responses ? " This request supports the following responses: " + JSON.stringify(action.responses) : " This request does not have documented details for the expected responses."
            
            let text = action.name + ": " + actionSummary + parameterSchemaSummary + requestBodySchemaSummary + responsesSummary;
            return processChunk(text, "http_action", action.uuid);
        });
      
        let securityPromises = Object.values(security).map((sec) => {
          let text = "API-SECURITY:  " + JSON.stringify(sec);
          return processChunk(text, "api_authentication", sec.uuid);
        });
      
        let webhookPromises = Object.values(webhooks).map((webhook) => {

            let webhookSummary = "The " + webhook.name + " will provide the following information when triggered: " + JSON.stringify(webhook.requestBody2) + "."
            let webhookDescription = webhook.description ? " This webhook has the following description: " + webhook.description : ""
            let text = webhook.name + ": " + webhookSummary + webhookDescription;
            return processChunk(text, "api_webhook", webhook.uuid);
        });
    
        let documentationPromises = Object.keys(documentation).map((docKey) =>{
            let doc = documentation[docKey];
            let text = docKey +" DOCUMENTATION:  " + JSON.stringify(doc);
            return processChunk(text, "additional_documentation", docKey+"_"+api_uuid);
        })

        let baseUrlPromises = Object.keys(base_urls).map((baseUrlKey) =>{
            let baseUrl = base_urls[baseUrlKey];
            let text = "The base URL to use for API requests in the " + baseUrlKey + " environment is"  + JSON.stringify(baseUrl);
            return processChunk(text, "base_url", baseUrlKey+"_"+api_uuid);
        })

        // let schemaPromises = Object.values(entities).map((schema) => {
        //     let schemaSummary = 'This schema is called ' + schema.name + ' and is a type of ' + schema.type + '.'
        //     let schemaDescription = schema.description ? ' This schema is described as: ' + schema.description : ''
        //     let schemaProperties = schema.properties ? ' This schema has properties that are described by the following JSON object: ' + JSON.stringify(schema.properties) : ''
        //     let schemaExamples = schema.examples ? ' Here are examples of this schema: ' + JSON.stringify(schema.examples) : ''
        //     let schemaItems = schema.items ? ' This schema is an array that has items with a schema described by the following JSON object: ' + JSON.stringify(schema.items) : ''

        //     let text = "DATA-SCHEMA (NOT AN ACTION): " + schemaSummary + schemaDescription + schemaProperties + schemaItems + schemaExamples;

        //     return processChunk(text, "api_schema", schema.uuid);
        //   });

        // let parameterPromises = Object.values(parameters).map((parameter) => {
        //     let text = "API-PARAMETER:  " + JSON.stringify(parameter);
        //     return processChunk(text, "api_parameter", parameter.uuid);
        // });
      
        await Promise.all([
          ...actionPromises,
          ...securityPromises,
          ...webhookPromises,
          ...documentationPromises,
          ...baseUrlPromises,
        //   ...schemaPromises,
        //   ...parameterPromises
        ]);
      
        return vectors;
      }
    // Generate embeddings for each chunk
    async function generateEmbeddings(chunk, metadataType, uuid) {
        
        let vectorObject;
      
        try {
          let response = await openai.createEmbedding({
            model: 'text-embedding-ada-002',
            input: chunk
          });
          
          let vectors = response.data.data[0].embedding;
      
          vectorObject = {
            id: uuid,
            values: vectors,
            metadata: {
              api_uuid: api_uuid,
              metadata_type: metadataType,
              text: chunk
            }
          };
      
        //   console.log(vectorObject);
        } catch (error) {
          console.log(error.response.data.error);
      
          vectorObject = {
            id: uuid,
            values: [],
            metadata: {
              api_uuid: api_uuid,
              metadata_type: metadataType,
              text: chunk
            }
          };
        }
      
        return vectorObject;
      }
      
    return new Promise((resolve, reject) => {
        chunkAndEmbedSpec()
          .then((vectors) => {
            // console.log("Vectors: " + vectors.length);
            upsertVectors(vectors)
              .then((result) => {
                // console.log("Result");
                // console.log(result);
                resolve(result);
              })
              .catch((err) => {
                console.log(err);
                reject({
                  status: "Error",
                  message: err
                });
              });
          })
          .catch((err) => {
            console.log(err);
            reject({
              status: "Error",
              message: err
            });
          });
    });
   
}

module.exports = { processOpenApiV3, processOpenApiV2, retrieveInterfaces, convertPostmanCollection, processApiForVectorDb, processPartnershipForVectorDb};