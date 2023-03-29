const axios = require('axios');
const qs = require('qs');
const crypto = require('crypto');
const WorkflowLog = require('./models/workflow_log/WorkflowLog');
const Project = require('./models/project/Project');
const _ = require('lodash');

async function triggerWorkflow (workflow, apis, environment, inputJSON){
    const workflowActionNodes = workflow.nodes.filter((node) => node.type === 'action')
    const workflowMappings = workflow.definition.mappings
    const actionApi = apis.filter((api) => api.uuid === workflowActionNodes[0].data.selectedAction.parent_interface_uuid)[0]
    const productionServer = actionApi.production_server
    const partnership = await findProject(workflow.parent_project_uuid);
    const partnershipConfigurations = partnership?.configuration && Object.keys(partnership?.configuration).length > 0 ? partnership?.configuration : null
    const input = {
        0: inputJSON
    }

    // Retrieve Partnership Configurations and Authentication Credentials

        var logMessage = 'Workflow Triggered: ' + workflow.name + ' (' + workflow.uuid + ')' + ' with input: ' + JSON.stringify(inputJSON)
        var logLevel = 'info'
        var logWorkflowUUID = workflow.uuid
        logEvent(logMessage, logWorkflowUUID, 'trigger', logLevel)

        let promiseChain = Promise.resolve();

        workflowActionNodes.forEach((actionNode, index) => {
                var inputData = input[index]
                promiseChain = promiseChain.then(() => {
                    return new Promise((resolve, reject) => {
                            var action = actionNode.data.selectedAction
                            var method = actionNode.data.selectedAction.method
                            var path = productionServer + actionNode.data.selectedAction.path
                            const authenticationConfigurations = partnership?.authentication[actionApi.uuid] ? partnership.authentication[actionApi.uuid] : null
                            var actionMappings = workflowMappings[actionNode.id] ? workflowMappings[actionNode.id] : []
            
                            // Determine what request components need to be built
                            var headerParameters = action.parameterSchema?.header ? action.parameterSchema.header : null
                            var pathParameters = action.parameterSchema?.path ? action.parameterSchema.path : null
                            var requestBody = action.requestBody2?.schema ? action.requestBody2.schema : null
                            var contentType = action.requestBody?.type == 'json' ? 'application/json' : action.requestBody?.type == 'form-urlencoded' ? 'application/x-www-form-urlencoded' : null
                            var adaptedRequestBodyObject = {}

                            var adaptedHeaderObject = {
                                'Content-Type': contentType
                            }
                            var adaptedPathObject = {}
                    
                            // Adapt non-null components using any adaption formulas
                            if (requestBody){
                                
                                Object.values(actionMappings).forEach((mapping) => {
                                    if(mapping.output.in == 'body') {
                                        var adaptedObject = adaptProperty(mapping.input, mapping.output, input[index], partnershipConfigurations, authenticationConfigurations, partnership)
                                        _.merge(adaptedRequestBodyObject, adaptedObject)
                                    }
                                })  
                            }
                            if (headerParameters){
                            
                                Object.values(actionMappings).forEach((mapping) => {
                                    if(mapping.output.in == 'header') {
                                        var adaptedObject = adaptProperty(mapping.input, mapping.output, input[index],partnershipConfigurations, authenticationConfigurations, partnership)
                                        adaptedHeaderObject = {...adaptedHeaderObject, ...adaptedObject}
                                    }
                                })  
                            }
                            if (pathParameters){
                                    
                                    Object.values(actionMappings).forEach((mapping) => {
                                        if(mapping.output.in == 'path') {
                                            var adaptedObject = adaptProperty(mapping.input, mapping.output, input[index], partnershipConfigurations, authenticationConfigurations,partnership)
                                            adaptedPathObject = {...adaptedPathObject, ...adaptedObject}
                                        }
                                    }) 
                        
                                    // Add path parameters to the path, if they exist
                                    Object.keys(adaptedPathObject).forEach((key) => {
                                        path = path.replace(`{${key}}`, adaptedPathObject[key])
                                    })
                            }
            
                            Object.values(actionMappings).forEach((mapping) => {
                                if(mapping.output.path.includes('$variable.')){ 
                                    console.log("Mapped to Configuration")
                                    adaptProperty(mapping.input, mapping.output, input[index], partnershipConfigurations, authenticationConfigurations, partnership)
                                }
                            })

                            // Partnership Authentication Handling

                            if (authenticationConfigurations && authenticationConfigurations.tokenData?.token){
                                const { tokenData } = authenticationConfigurations
                                const { token, tokenType, expiresIn } = tokenData
                                const currentTime = new Date().getTime()
                                const tokenExpirationTime = currentTime + (expiresIn * 1000)
                                if (tokenExpirationTime < currentTime){
                                    console.log("Token Expired")
                                } else {
                                    adaptedHeaderObject['Authorization'] = `${tokenType} ${token}`;

                                }
                            }
            
                            var loggedRequestData = {
                                workflow: workflow.uuid,
                                actionName: action.name,
                                request: {
                                    method: method,
                                    path: path,
                                    headers: adaptedHeaderObject,
                                    body: contentType == 'json' ? adaptedRequestBodyObject : contentType == 'form-urlencoded' ? qs.stringify(adaptedRequestBodyObject) : {},
                                    contentType: contentType
                                }
                            }
                    
                            const requestParams = {
                                method,
                                url: path,
                                headers: adaptedHeaderObject,
                                body: adaptedRequestBodyObject,
                                contentType,
                            };

                           //Pre-Request Logging 
                           var logMessage = `Requesting ${requestParams.method} ${requestParams.url} with headers ${JSON.stringify(requestParams.headers)} and body ${JSON.stringify(requestParams.body)}`
                           var logLevel = 'info'
                           var logWorkflowUUID = workflow.uuid
                           var logActionName = action.name
                           logEvent(logMessage, logWorkflowUUID, logActionName, logLevel)
                    
                            // Make the request
                            makeRequest(requestParams.method, requestParams.url, requestParams.headers, requestParams.body, requestParams.contentType)
                                .then((response) => {
                                    loggedRequestData.response = {
                                        status: response.status,
                                        body: response.data,
                                    };
                                  
                                    if(response.level == 'error'){
                                        console.log("Request Error")
                                        var logMessage = `Received ${response.status} response from ${requestParams.method} ${requestParams.url} with body ${JSON.stringify(response.data)}`
                                        var logLevel = 'error'
                                        var logWorkflowUUID = workflow.uuid
                                        var logActionName = action.name
                                        logEvent(logMessage, logWorkflowUUID, logActionName, logLevel)
                                        resolve(loggedRequestData);
                                    } else {
                                        console.log("Request Success")
                                        var logMessage = `Received ${response.status} response from ${requestParams.method} ${requestParams.url} with body ${JSON.stringify(response.data)}`
                                        var logLevel = 'info'
                                        var logWorkflowUUID = workflow.uuid
                                        var logActionName = action.name
                                        logEvent(logMessage, logWorkflowUUID, logActionName, logLevel)
                                 
                                        resolve(response);
                                    } 
                                    console.log("Response Data")
                                    console.log(response.data)
                                    input[index+1] = response.data
                                    console.log("Input Data")
                                    console.log(input)
                                })
                                .catch((error) => {
                                    console.log("Request Error")
                                    console.log(error)
                                    loggedRequestData.response = {
                                    status: error.status,
                                    body: error,
                                    };
                                    var logMessage = `Received ${error.status} response from ${requestParams.method} ${requestParams.url} with body ${JSON.stringify(error)}`
                                    var logLevel = 'error'
                                    var logWorkflowUUID = workflow.uuid
                                    var logActionName = action.name
                                    logEvent(logMessage, logWorkflowUUID, logActionName, logLevel)
                                    reject(loggedRequestData);
                                   
                                });
                    });
                });
     
        })

}

function makeRequest(method, url, headers, body, contentType) {
    // Set the default Content-Type header to 'application/json'
    headers['Content-Type'] = contentType || 'application/json';
    headers['Accept-Encoding'] = 'identity'
    headers['Accept'] = 'application/json'

    // Set the request body based on the content type
    const data = contentType === 'application/x-www-form-urlencoded' ? qs.stringify(body) : body;
  
    // Return a Promise that resolves to the HTTP response
    return axios({
      method,
      url,
      headers,
      data,
    }).then((response) => {
        console.log("Success! Response Data")
        console.log(response.data)
        var successResponse = {
            status: response.status,
            data: response.data,
            level: 'info'
        }
        return successResponse
    }).catch((error) => {
        console.log("Error! Response Data")
        console.log(error.response)
        var errorResponse = {
            level: 'error',
            status: error.response.status,
            data: error.response.data
        }
        return errorResponse

        }
    );
  }

async function findProject(uuid) {
    try {
      return await Project.findOne({ uuid }).exec();
    } catch (error) {
      throw new Error(`Error finding project with ID ${uuid}: ${error.message}`);
    }
  }

function adaptProperty (mappingInputDefinition, mappingOutputDefinition, inputData, partnershipConfigurations, authenticationConfigurations, partnership){
    var formulas = mappingInputDefinition.formulas

    // Check if the input value is a configured value. If so, set the output value to the configured value.
    if (mappingInputDefinition.actionId == 'configuration' || mappingInputDefinition.path.includes('$variable.') || mappingInputDefinition.path.includes('$credential.')){
        
        if(mappingInputDefinition.path.includes('$variable.')){
            var mappingInputPath = mappingInputDefinition.key
            var partnershipKeys = Object.keys(partnershipConfigurations)
            var partnershipValues = Object.values(partnershipConfigurations)
            var isPartnershipConfig = partnershipKeys.includes(mappingInputPath)
            var mappingInputValue = isPartnershipConfig ? partnershipValues[partnershipKeys.indexOf(mappingInputPath)].value : mappingInputDefinition.value

            var outputObject = {}
            var mappingOutputPathArray = mappingOutputDefinition.path.includes('.') ? mappingOutputDefinition.path.split('.') : [mappingOutputDefinition.path]
            mappingOutputPathArray.forEach((path, index) => {
                if (index === mappingOutputPathArray.length - 1){
                    outputObject[path] = mappingInputValue
                } else {
                    outputObject[path] = {}
                }
            })
    
            return outputObject

        } else if(mappingInputDefinition.path.includes('$credential.')){
            var mappingInputPath = mappingInputDefinition.key
            var authenticationKeys = Object.keys(authenticationConfigurations)
            var authenticationValues = Object.values(authenticationConfigurations)
            var mappingInputValue = authenticationValues[authenticationKeys.indexOf(mappingInputPath)]

            var outputObject = {}
            var mappingOutputPathArray = mappingOutputDefinition.path.includes('.') ? mappingOutputDefinition.path.split('.') : [mappingOutputDefinition.path]
            mappingOutputPathArray.forEach((path, index) => {
                if (index === mappingOutputPathArray.length - 1){
                    outputObject[path] = mappingInputValue
                } else {
                    outputObject[path] = {}
                }
            })
    
            return outputObject
        }
        
      
    } else if (mappingOutputDefinition.in == 'configuration' || mappingOutputDefinition.path.includes('$variable.') || mappingOutputDefinition.path.includes('$credential.')) {
        var mappingInputPathArray = mappingInputDefinition.path.includes('.') ? mappingInputDefinition.path.split('.') : [mappingInputDefinition.path]
        var mappingInputValue = mappingInputPathArray.reduce((obj, i) => obj[i], inputData)
        setPartnershipConfiguration(mappingOutputDefinition.key, mappingInputValue, partnership.uuid)

    } else {
        // If the input value is not a configured value, it must be a mapped value. Get the mapped value.
        // Get the value of the mapped input property
        var mappingInputPathArray = mappingInputDefinition.path.includes('.') ? mappingInputDefinition.path.split('.') : [mappingInputDefinition.path]
       
        var mappingInputValue = inputData ? mappingInputPathArray.reduce((obj, i) => obj[i], inputData) : null
       
        if(formulas.length > 0){
            //Apply formulas to the input value, if they exist
        }

        // Set the value of the mapped output property
        var mappingOutputPathArray = mappingOutputDefinition.path.includes('.') ? mappingOutputDefinition.path.split('.') : [mappingOutputDefinition.path]
        var outputObject = {}

        _.set(outputObject, mappingOutputDefinition.path, mappingInputValue)
        // for (var i = 0; i < mappingOutputPathArray.length; i++){
        //     outputObject = outputObject[mappingOutputPathArray[i]] = {};
        // }
        // outputObject[mappingOutputPathArray[mappingOutputPathArray.length - 1]] = mappingInputValue

        return outputObject
    }

}

function setPartnershipConfiguration(key, value, partnershipUuid){
    var configurationObject = {
        value: value,
        type: typeof value
    }

    Project.findOneAndUpdate({uuid: partnershipUuid}, {$set: {[`configuration.${key}`]: configurationObject}}, {new: true}, (err, project) => {
        if (err) {
            console.log(err)
        } else {
            console.log(project.configuration[key])
        }
    })
}

function logEvent (message, workflowUuid, actionName, level) {

    var log = {
        uuid: crypto.randomUUID(),
        workflowId: workflowUuid,
        action: actionName,
        level:level,
        created_at: new Date().toISOString().replace(/T/, ' ').replace(/\..+/, ''),
        message: message
    }

    WorkflowLog.create(log, (err, log) => {
        if (err) {
            console.log(err)
        } else {
            console.log("Workflow log created")
        }
    })
}

module.exports = { triggerWorkflow }