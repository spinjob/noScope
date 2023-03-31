const axios = require('axios');
const qs = require('qs');
const crypto = require('crypto');
const WorkflowLog = require('./models/workflow_log/WorkflowLog');
const Project = require('./models/project/Project');
const _ = require('lodash');

async function triggerWorkflow (workflow, apis, environment, inputJSON, traceUUID){
    const workflowActionNodes = workflow.nodes.filter((node) => node.type === 'action')
    const workflowMappings = workflow.definition.mappings
    const actionApi = apis.filter((api) => api.uuid === workflowActionNodes[0].data.selectedAction.parent_interface_uuid)[0]
    const productionServer = actionApi.production_server
    const partnership = await findProject(workflow.parent_project_uuid);
    const partnershipConfigurations = partnership?.configuration && Object.keys(partnership?.configuration).length > 0 ? partnership?.configuration : null
    const input = {
        0: {result: 'success', data: inputJSON}
    }

    // Retrieve Partnership Configurations and Authentication Credentials

        var logMessage = 'Workflow Triggered: ' + workflow.name + ' (' + workflow.uuid + ')' + ' with input: ' + JSON.stringify(inputJSON)
        var logLevel = 'info'
        var logWorkflowUUID = workflow.uuid
        logEvent(logMessage, logWorkflowUUID, 'trigger', logLevel, traceUUID)

        let promiseChain = Promise.resolve();

        workflowActionNodes.forEach((actionNode, index) => {
                promiseChain = promiseChain.then(() => {
                    return new Promise((resolve, reject) => {
                            if(input[index].result == 'failure'){
                                // If the previous action failed, check for a failure action. If it exists, execute it. If not, end the workflow.
                                resolve({result: 'failure', data: {
                                    status: 'failure',
                                    message: 'Previous action failed.',
                                }});

                            } else {
                            
                                var action = actionNode.data.selectedAction
                                var method = actionNode.data.selectedAction.method
                                var path = productionServer + actionNode.data.selectedAction.path
                                const authenticationConfigurations = partnership && partnership?.authentication && partnership?.authentication[actionApi.uuid] ? partnership.authentication[actionApi.uuid] : null

                                if(!authenticationConfigurations){
                                    var logMessage = 'No authentication configurations found for ' + actionApi.name + ' (' + actionApi.uuid + ')'
                                    var logLevel = 'error'
                                    var logWorkflowUUID = workflow.uuid
                                    logEvent(logMessage, logWorkflowUUID, 'trigger', logLevel, traceUUID)
                                    input[index+1] = {result: 'failure', data: {
                                        status: 'failure',
                                        message: 'No authentication configurations found for ' + actionApi.name + ' (' + actionApi.uuid + ').',
                                    }}
                                    resolve({result: 'failure', data: {
                                        status: 'failure',
                                        message: 'No authentication configurations found for ' + actionApi.name + ' (' + actionApi.uuid + ').',
                                    }});
                                }

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
                                            var adaptedObject = adaptProperty(mapping.input, mapping.output, input[index].data, partnershipConfigurations, authenticationConfigurations, partnership)
                                            _.merge(adaptedRequestBodyObject, adaptedObject)
                                        }
                                    })  
                                }
                                if (headerParameters){
                                
                                    Object.values(actionMappings).forEach((mapping) => {
                                        if(mapping.output.in == 'header') {
                                            var adaptedObject = adaptProperty(mapping.input, mapping.output, input[index].data,partnershipConfigurations, authenticationConfigurations, partnership)
                                            adaptedHeaderObject = {...adaptedHeaderObject, ...adaptedObject}
                                        }
                                    })  
                                }
                                if (pathParameters){
                                        
                                        Object.values(actionMappings).forEach((mapping) => {
                                            if(mapping.output.in == 'path') {
                                                var adaptedObject = adaptProperty(mapping.input, mapping.output, input[index].data, partnershipConfigurations, authenticationConfigurations,partnership)
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
                                logEvent(logMessage, logWorkflowUUID, logActionName, logLevel, traceUUID)
                            
                                // Make the request
                                makeRequest(requestParams.method, requestParams.url, requestParams.headers, requestParams.body, requestParams.contentType)
                                    .then((response) => {
                                        loggedRequestData.response = {
                                            status: response.status,
                                            body: response.data,
                                        };
                                    
                                        if(response.level == 'error'){
                                            console.log("Request Error")
                                            var logMessage = `Failed Request: Received ${response.status} response from ${requestParams.method} ${requestParams.url} with body ${JSON.stringify(response.data)}`
                                            var logLevel = 'error'
                                            var logWorkflowUUID = workflow.uuid
                                            var logActionName = action.name
                                            logEvent(logMessage, logWorkflowUUID, logActionName, logLevel, traceUUID)
                                            input[index+1] = {result: 'failure', data: response.data}
                                            resolve(loggedRequestData);
                                        } else {
                                            console.log("Request Success")
                                            var logMessage = `Successful Request: Received ${response.status} response from ${requestParams.method} ${requestParams.url} with body ${JSON.stringify(response.data)}`
                                            var logLevel = 'info'
                                            var logWorkflowUUID = workflow.uuid
                                            var logActionName = action.name
                                            logEvent(logMessage, logWorkflowUUID, logActionName, logLevel, traceUUID)
                                            input[index+1] = {result: 'success', data: response.data}
                                            resolve(response);
                                        } 

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
                                        logEvent(logMessage, logWorkflowUUID, logActionName, logLevel, traceUUID)
                                        input[index+1] = {result: 'failure', data: error}
                                        reject(loggedRequestData);
                                    
                                    });
                            }
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
            var partnershipKeys = partnershipConfigurations ? Object.keys(partnershipConfigurations) : []
            var partnershipValues = partnershipConfigurations ?  Object.values(partnershipConfigurations) : []
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

        var mappingInputValue = null;

        if (inputData) {
          try {
            mappingInputValue = mappingInputPathArray.reduce((obj, i) => obj[i], inputData);
          } catch (error) {
            console.log("Error accessing property:", error.message);
          }
        }

        if(formulas.length > 0){
            //Apply formulas to the input value, if they exist
           mappingInputValue = applyFormulas(formulas, mappingInputValue, mappingOutputDefinition.type, inputData)
        }

        // Set the value of the mapped output property
        var mappingOutputPathArray = mappingOutputDefinition.path.includes('.') ? mappingOutputDefinition.path.split('.') : [mappingOutputDefinition.path]
        var outputObject = {}

        _.set(outputObject, mappingOutputDefinition.path, mappingInputValue, mappingOutputDefinition.type)

        return outputObject
    }

}

function applyFormulas(formulas, inputValue, outputType, inputData){
    // Formulas is an array of objects. Each object has a formula that has a type that corresponds to the function type and any inputs into that function designated by the user
    // InputValue is the value of the mapped property that is being transformed into the output value
    // OutputType is the data type the output needs to be in
    // InputData is the entire input object (i.e. the entire response or webhook payload) that will be used when multiple properties are being used in a formula.

    // Initiate the output to equal the input (i.e. one-to-one mapping).  Each formula will modify the input in the order they are listed in the array.

    var outputValue = inputValue

    formulas.forEach((formula, index) => {

        //IfThen Formulas
        if(formula.formula == 'ifthen' && Object.keys(formula.inputs).length > 0){
            var ifThenInputs = formula.inputs['ifThen'][0]

            var ifCondition = ifThenInputs['if']
            var thenLogic = ifThenInputs['then']
            var elseLogic = ifThenInputs['else']

            var conditionResult = []

            if(ifCondition.condition == 'equals'){
                var conditionValue = ifCondition.value
                if(ifCondition.or && ifCondition.or.length > 0){
                    ifCondition.or.forEach((orObject, index) => {
                        var orCondition = orObject.condition
                        var orValue = orObject.value
                        if (orCondition == 'equals'){                            
                            conditionResult.push(inputValue == conditionValue || inputValue == orValue)
                        }
                        if (orCondition == 'notEquals'){
                            conditionResult.push(inputValue == conditionValue || inputValue != orValue)
                        }
                    })
                } else {

                    conditionResult.push(inputValue == conditionValue)
                }
            }

            if(ifCondition.condition == 'notEquals'){
                var conditionValue = ifCondition.value
                if(ifCondition.or && ifCondition.or.length > 0){
                    ifCondition.or.forEach((orObject, index) => {
                        var orCondition = orObject.condition
                        var orValue = orObject.value
                        if (orCondition == 'equals'){
                            conditionResult.push(inputValue != conditionValue || inputValue == orValue)
                        }
                        if (orCondition == 'notEquals'){
                            conditionResult.push(inputValue != conditionValue || inputValue != orValue)
                        }
                    })
                } else {
                    conditionResult.push(inputValue != conditionValue)
                }
            }

            if(ifCondition.condition == 'greaterThan'){
                var conditionValue = ifCondition.value
                if(ifCondition.or && ifCondition.or.length > 0){
                    ifCondition.or.forEach((orObject, index) => {
                        var orCondition = orObject.condition
                        var orValue = orObject.value
                        if (orCondition == 'greaterThan'){
                            conditionResult.push(inputValue > conditionValue || inputValue > orValue)
                        }
                        if (orCondition == 'lessThan'){
                            conditionResult.push(inputValue > conditionValue || inputValue < orValue)
                        }
                    })
                } else {
                    conditionResult.push(inputValue > conditionValue)
                }
            }

            if(ifCondition.condition == 'lessThan'){
                var conditionValue = ifCondition.value
                if(ifCondition.or && ifCondition.or.length > 0){
                    ifCondition.or.forEach((orObject, index) => {
                        var orCondition = orObject.condition
                        var orValue = orObject.value
                        if (orCondition == 'greaterThan'){
                            conditionResult.push(inputValue < conditionValue || inputValue > orValue)
                        }
                        if (orCondition == 'lessThan'){
                            conditionResult.push(inputValue < conditionValue || inputValue < orValue)
                        }
                    })
                } else {
                    conditionResult.push(inputValue < conditionValue)
                }
            }

            if(ifCondition.condition == 'greaterThanEquals'){
                var conditionValue = ifCondition.value
                if(ifCondition.or && ifCondition.or.length > 0){
                    ifCondition.or.forEach((orObject, index) => {
                        var orCondition = orObject.condition
                        var orValue = orObject.value
                        if (orCondition == 'greaterThanEquals'){
                            conditionResult.push(inputValue >= conditionValue || inputValue >= orValue)
                        }
                        if (orCondition == 'lessThanEquals'){
                            conditionResult.push(inputValue >= conditionValue || inputValue <= orValue)
                        }
                    })
                } else {
                    conditionResult.push(inputValue >= conditionValue)
                }
            }

            if(ifCondition.condition == 'lessThanEquals'){
                var conditionValue = ifCondition.value
                if(ifCondition.or && ifCondition.or.length > 0){
                    ifCondition.or.forEach((orObject, index) => {
                        var orCondition = orObject.condition
                        var orValue = orObject.value
                        if (orCondition == 'greaterThanEquals'){
                            conditionResult.push(inputValue <= conditionValue || inputValue >= orValue)
                        }
                        if (orCondition == 'lessThanEquals'){
                            conditionResult.push(inputValue <= conditionValue || inputValue <= orValue)
                        }
                    })
                } else {
                    conditionResult.push(inputValue <= conditionValue)
                }
            }

            var isElseResult = conditionResult.every((result) => {
                return result == false
            })

            if(isElseResult == true){
                outputValue = elseLogic.value
            } else {
                outputValue = thenLogic.value
            }
        }    

        //String Formulas
        if(formula.formula == 'prepend' && Object.keys(formula.inputs).length > 0){
            var prependInput = formula.inputs['prepend']
            outputValue = prependInput + inputValue
        }
        if(formula.formula == 'append' && Object.keys(formula.inputs).length > 0){
            var appendInput = formula.inputs['append']
            outputValue = inputValue + appendInput
        }
        if(formula.formula == 'replace' && Object.keys(formula.inputs).length > 0){
           var replaceInputs = formula.inputs['replace']
           var toReplace = replaceInputs['toReplace']
           var replaceWith = replaceInputs['replaceWith']
           outputValue = outputValue.replace(toReplace, replaceWith)
        }
        if(formula.formula == 'substring' && Object.keys(formula.inputs).length > 0){
            var substringInputs = formula.inputs['substring']
            var start = substringInputs['startingIndex']
            var end = substringInputs['endingIndex']

            if (start == 'input.length'){
                start = inputValue.length
            }
            outputValue = outputValue.substring(start, end)

        }

        if(formula.formula == 'lowercase'){
            outputValue = outputValue.toLowerCase()
        }

        if(formula.formula == 'uppercase'){
            outputValue = outputValue.toUpperCase()
        }

        if(formula.formula == 'capitalize'){
            outputValue = outputValue.charAt(0).toUpperCase() + outputValue.slice(1)
        }

        if(formula.formula == 'trim'){
            outputValue = outputValue.trim()
        }


        //Numerical Formulas
        if(formula.formula == 'addition' && Object.keys(formula.inputs).length > 0){
            var additionInputs = formula.inputs['addition']
            if (typeof additionInputs === 'string') {
                // If the input is a string, it's a reference to another input property whose value needs to be added to the input value
                
                if (inputData) {
                    try {
                        console.log("Input Data: Adding a Property's Value")
                        console.log(inputData)
                        var addendInputPathArray = additionInputs.includes('.') ? additionInputs.split('.') : [additionInputs]
                        console.log(addendInputPathArray)
                        var addend = addendInputPathArray.reduce((obj, i) => obj[i], inputData);
                        outputValue = outputValue + addend
                    } catch (error) {
                      console.log("Error accessing property:", error.message);
                    }
                  }
            }

            if (typeof additionInputs == 'number' || typeof additionInputs == 'float' || typeof additionInputs == 'integer') {
                // If the input is a number, it's a literal number that needs to be added to the input value
                var addend = additionInputs
                outputValue = outputValue + addend
            }
        }

        if(formula.formula == 'subtraction' && Object.keys(formula.inputs).length > 0){
            var subtractionInputs = formula.inputs['subtraction']
            if (typeof subtractionInputs === 'string') {
                // If the input is a string, it's a reference to another input property whose value needs to be added to the input value
                
                if (inputData) {
                    try {
                        console.log("Input Data: Subtracting a Property's Value")
                        console.log(inputData)
                        var inputPathArray = subtractionInputs.includes('.') ? subtractionInputs.split('.') : [subtractionInputs]
                        console.log(inputPathArray)
                        var subtractionValue = inputPathArray.reduce((obj, i) => obj[i], inputData);
                        outputValue = outputValue + subtractionValue
                    } catch (error) {
                      console.log("Error accessing property:", error.message);
                    }
                  }
            }

            if (typeof subtractionInputs == 'number' || typeof subtractionInputs == 'float' || typeof subtractionInputs == 'integer') {
                // If the input is a number, it's a literal number that needs to be added to the input value
                var subtractionValue = subtractionInputs
                outputValue = outputValue + subtractionValue
            }
        }

        if(formula.formula == 'multiplication' && Object.keys(formula.inputs).length > 0){
            var multiplicationInputs = formula.inputs['multiplication']
            if (typeof multiplicationInputs === 'string') {
                // If the input is a string, it's a reference to another input property whose value needs to be added to the input value
                
                if (inputData) {
                    try {
                        console.log("Input Data: Multiplying a Property's Value")
                        console.log(inputData)
                        var inputPathArray = multiplicationInputs.includes('.') ? multiplicationInputs.split('.') : [multiplicationInputs]
                        console.log(inputPathArray)
                        var multiplicationValue = inputPathArray.reduce((obj, i) => obj[i], inputData);
                        outputValue = outputValue + multiplicationValue
                    } catch (error) {
                      console.log("Error accessing property:", error.message);
                    }
                  }
            }

            if (typeof multiplicationInputs == 'number' || typeof multiplicationInputs == 'float' || typeof multiplicationInputs == 'integer') {
                // If the input is a number, it's a literal number that needs to be added to the input value
                var multiplicationValue = multiplicationInputs
                outputValue = outputValue + multiplicationValue
            }
        }

        if(formula.formula == 'division' && Object.keys(formula.inputs).length > 0){
            var divisionInputs = formula.inputs['division']
            if (typeof divisionInputs === 'string') {
                // If the input is a string, it's a reference to another input property whose value needs to be added to the input value
                
                if (inputData) {
                    try {
                        console.log("Input Data: Dividing a Property's Value")
                        console.log(inputData)
                        var inputPathArray = divisionInputs.includes('.') ? divisionInputs.split('.') : [divisionInputs]
                        console.log(inputPathArray)
                        var divisionValue = inputPathArray.reduce((obj, i) => obj[i], inputData);
                        outputValue = outputValue + divisionValue
                    } catch (error) {
                      console.log("Error accessing property:", error.message);
                    }
                  }
            }

            if (typeof divisionInputs == 'number' || typeof divisionInputs == 'float' || typeof divisionInputs == 'integer') {
                // If the input is a number, it's a literal number that needs to be added to the input value
                var divisionValue = divisionInputs
                outputValue = outputValue + divisionValue
            }
        }
    })

    return outputValue

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

function logEvent (message, workflowUuid, actionName, level, traceUUID) {

    var log = {
        uuid: crypto.randomUUID(),
        workflowId: workflowUuid,
        action: actionName,
        level:level,
        created_at: new Date().toISOString().replace(/T/, ' ').replace(/\..+/, ''),
        message: message,
        traceId: traceUUID
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