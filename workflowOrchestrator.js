const axios = require('axios');
const qs = require('qs');
const crypto = require('crypto');
const WorkflowLog = require('./models/workflow_log/WorkflowLog');
const Project = require('./models/project/Project');
const _ = require('lodash');
const {parentPort} = require('node:worker_threads');
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const url = process.env.MONGO_DB_CONNECTION_STRING

mongoose.connect(url, {
    useNewUrlParser: true, 
    useUnifiedTopology: true
}).then((db) => {
})
.catch((err) => {
    console.log(err)
});


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
                                        if(mapping.input.parentContext){
                                            if(mapping.input.parentContext.length == 1){
                                                if (mapping.input.parentContext[0].contextType == 'array'){
                                                    var adaptedValues = adaptProperty(mapping.input, mapping.output, input[index].data, partnershipConfigurations, authenticationConfigurations, partnership,actionMappings)
                                                    _.merge(adaptedRequestBodyObject, adaptedValues) 
                                                }
                                                if (mapping.input.parentContext[0].contextType == 'dictionary'){
                                                    var adaptedValues = adaptProperty(mapping.input, mapping.output, input[index].data, partnershipConfigurations, authenticationConfigurations, partnership,actionMappings)
                                                   
                                                    _.merge(adaptedRequestBodyObject, adaptedValues) 
                                                    console.log("Dictionary adapted values:")
                                                    console.log(adaptedRequestBodyObject)
                                                }
                                            } 
                                            if(mapping.input.parentContext.length > 1) {

                                            }
                                        } else {
                                            var adaptedObject = adaptProperty(mapping.input, mapping.output, input[index].data, partnershipConfigurations, authenticationConfigurations, partnership,actionMappings)
                                            _.merge(adaptedRequestBodyObject, adaptedObject)    
                                        }
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
                                        var logMessage = `Failed Request: Received ${response.status} response from ${requestParams.method} ${requestParams.url} with body ${JSON.stringify(response.data)}`
                                        var logLevel = 'error'
                                        var logWorkflowUUID = workflow.uuid
                                        var logActionName = action.name
                                        logEvent(logMessage, logWorkflowUUID, logActionName, logLevel, traceUUID)
                                        input[index+1] = {result: 'failure', data: response.data}
                                        resolve(loggedRequestData);
                                    } else {
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
            })
        })
        return promiseChain
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
        // console.log("Success! Response Data")
        // console.log(response.data)
        var successResponse = {
            status: response.status,
            data: response.data,
            level: 'info'
        }
        return successResponse
    }).catch((error) => {
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

    function adaptProperty (mappingInputDefinition, mappingOutputDefinition, inputData, partnershipConfigurations, authenticationConfigurations, partnership, actionMappings){
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
            
            // Get the parent context of the input property, if it exists (i.e. if the input property has a parent that's an array or dictionary) - we'll need to handle
            var mappingInputParentContext = mappingInputDefinition.parentContext ? mappingInputDefinition.parentContext : null
    
            if (mappingInputParentContext && mappingInputParentContext.length == 1) {

                var contextType = mappingInputParentContext[0].contextType
                var parentContextKey = mappingInputParentContext[0].parentContextKey
                var parentContextArray = []
                var childContextArray = []
                var parentIndex = mappingInputPathArray.indexOf(parentContextKey)

                mappingInputPathArray.forEach((path, index) => {
                    if (index <= parentIndex){
                        parentContextArray.push(path)
                    } else {
                        childContextArray.push(path)
                    }
                })

                if(inputData){
                    if(contextType == 'array'){
                        var inputParentArray = parentContextArray.reduce((obj, i) => obj[i], inputData)
                        var adaptedArray = []

                    // Iterate through the array, applying the formula(s) to the input value and returning an array of the output values
                    inputParentArray.forEach((arrayItem, index) => {
                            var inputArrayItemValue = childContextArray.reduce((obj, i) => obj[i], arrayItem)
                            if(formulas.length > 0){
                                //Apply formulas to the input value, if they exist
                                inputArrayItemValue = applyFormulas(formulas, inputArrayItemValue, mappingOutputDefinition.type, mappingInputDefinition, inputData)
                            }
                            console.log("Input Array Item Value")
                            console.log(inputArrayItemValue)
                            var outputArrayItem = {}
                            outputArrayItem[mappingOutputDefinition.key] = inputArrayItemValue
                            
                            adaptedArray.push(outputArrayItem)

                        })

                        var outputObject = {}
                        var mappingOutputPathArray = mappingOutputDefinition.path.includes('.') ? mappingOutputDefinition.path.split('.') : [mappingOutputDefinition.path]

                        if(mappingOutputDefinition.parentContext && mappingOutputDefinition.parentContext.length > 0 && mappingOutputDefinition.parentContext[0].contextType == 'array'){

                            var parentContextKey = mappingOutputDefinition.parentContext[0].parentContextKey
                            var parentContextArray = []
                            var childContextArray = []
                            var parentIndex = mappingOutputPathArray.indexOf(parentContextKey)
                            mappingOutputPathArray.forEach((path, index) => {
                                if (index <= parentIndex){
                                    parentContextArray.push(path)
                                } else {
                                    childContextArray.push(path)
                                }
                            })
                            var outputObject = {}
                            parentContextArray.forEach((path, index) => {
                                if (path != parentContextKey){
                                    outputObject[path] = {}
                                } else {
                                    outputObject[path] = adaptedArray
                                }
                            })

                            return outputObject
                        } else {
                            outputObject[mappingOutputPathArray[0]] = adaptedArray
                            console.log("Output Object")
                            console.log(outputObject)
                            return outputObject
                        }
                            
                    } 
                    if (contextType == 'dictionary' && mappingOutputDefinition.key != mappingOutputDefinition.parentContext[0].dictionaryKey){

                        //if the mapping is not the dictionary key, we need to ensurde we can still determine what the dictionary key value is for each item in the dictionary
                        var inputParentDictionary = parentContextArray.reduce((obj, i) => obj[i], inputData)

                        // Array to hold the dictionary key values if the output property is within a dictionary
                        var keyArray = []
                        var filteredChildContextArray = childContextArray.filter(path => path != mappingInputDefinition.parentContext[0].dictionaryKey)
                        var outputObject = {}
                        var dictionaryValues = []

                        //OUTPUT DICTIONARY CASE: what if the output property is within a dictionary? We will need to map the output dictionary key property to set any dictionary key values.
                        if(mappingOutputDefinition.parentContext && mappingOutputDefinition.parentContext.length > 0 && mappingOutputDefinition.parentContext[0].contextType == 'dictionary'){

                            var outputDictionaryKey = mappingOutputDefinition.parentContext[0].dictionaryKey
                            var dictionaryKeyMapping = Object.values(actionMappings).find(mapping => mapping.output.key == outputDictionaryKey)
                            
                            // Get the instructions for mapping the output dictionary key
    
                            if(!dictionaryKeyMapping){
                                throw new Error("The output dictionary key mapping could not be found")
                            }
                            
                            // If the mapped input property for the output dictionary key is within a dictionary or array itself, we'll need to handle that
                            if(dictionaryKeyMapping.input.parentContext && dictionaryKeyMapping.input.parentContext.length == 1){
                                
                                    var contextType = dictionaryKeyMapping.input.parentContext[0].contextType
                                    var parentContextKey = dictionaryKeyMapping.input.parentContext[0].parentContextKey
                                    var keyMappingInputPathArray = dictionaryKeyMapping.input.path.includes('.') ? dictionaryKeyMapping.input.path.split('.') : [dictionaryKeyMapping.input.path]
                                    var keyParentContextArray = []
                                    var keyChildContextArray = []
                                    var keyParentIndex = keyMappingInputPathArray.indexOf(parentContextKey)

                                    keyMappingInputPathArray.forEach((path, index) => {
                                        if (index <= keyParentIndex){
                                            keyParentContextArray.push(path)
                                        } else {
                                            keyChildContextArray.push(path)
                                        }
                                    })

                                    if(contextType == 'dictionary'){
                                        // Find the parent dictionary of the input property
                                            var keyInputParentDictionary = keyParentContextArray.reduce((obj, i) => obj[i], inputData)
                                            var adaptedKeyDictionary = {}

                                            //Filter out the dictionary key property from the child context array, as we will not know what the dictionary key value is.  We'll iterate over keys.
                                            var filteredKeyChildContextArray = keyChildContextArray.filter(path => path != dictionaryKeyMapping.input.parentContext[0].dictionaryKey)
                        
                                        // Iterate through the input dictionary, applying the formula(s) to the mapped input property's value
                                            Object.keys(keyInputParentDictionary).forEach((dictionaryKey, index) => {
                                                var inputDictionaryItemValue = filteredKeyChildContextArray.reduce((obj, i) => obj[i], keyInputParentDictionary[dictionaryKey])
                                                keyArray.push(inputDictionaryItemValue)
                                            })
                                    }
                            }
                            
                        } 

                        //INPUT DICTIONARY CASE
                        // For this case, we want to skip any of the input or output keys, as we will handle both of those separately
                        if(mappingInputDefinition.key != mappingInputDefinition.parentContext[0].dictionaryKey ){
                            

                            console.log("Input Parent Dictionary")
                            console.log(inputParentDictionary)

                            Object.keys(inputParentDictionary).forEach((dictionaryKey, index) => {
                                var inputPropertyValue = filteredChildContextArray.reduce((obj, i) => obj[i], inputParentDictionary[dictionaryKey])
                            
                                console.log("Dictionary Key")
                                console.log(dictionaryKey)
                                console.log("Input Property Value")
                                console.log(inputPropertyValue)

                                console.log("Mapping Output Definition")
                                console.log(mappingOutputDefinition.key)

                                console.log("Mapping Output Parent Context Key")
                                console.log(mappingOutputDefinition.parentContext[0].dictionaryKey)

                                var outputDictionaryItem = {}
                            
                                outputDictionaryItem[mappingOutputDefinition.key] = inputPropertyValue
                                console.log("Output Dictionary Item")
                                console.log(outputDictionaryItem)

                                dictionaryValues.push(outputDictionaryItem)

                                console.log("Dictionary Values")
                                console.log(dictionaryValues)

                                if(formulas.length > 0){
                                    //Apply formulas to the input value, if they exist
                                    inputPropertyValue = applyFormulas(formulas, inputPropertyValue, mappingOutputDefinition, mappingInputDefinition, inputData)
                                }
                        
                                

                            })

                            keyArray.forEach((key, index) => {
                                if(!outputObject[key]){
                                    console.log("Output Object Key does not exist")
                                outputObject[key] = dictionaryValues[index]
                                } else {
                                    console.log("Output Object Key exists")
                                    outputObject[key] = {...outputObject[key], ...dictionaryValues[index]}
                                }
                            })


                        } else {
                            
                        }
                        
                        var parentObject = {}

                        parentContextArray.forEach((path, index) => {
                            if(path == parentContextKey){
                                parentObject[path] = outputObject
                            } else {
                                parentObject[path] = {}
                            }
                        })
                        
                        //Key Array is the array of adapted dictionary key values
                        console.log("Key Array")
                        console.log(keyArray)
                        
                        //Output Object is the full dictionary that will be set to the parent key (i.e. parentContextKey)
                        console.log("Output Object")
                        console.log(outputObject)
                        return parentObject
                    } 
                }
            } else if (mappingInputParentContext && mappingInputParentContext.length > 1) {

                if(inputData){
                
                }
            } else {

                if (inputData) {
                    try {
                    mappingInputValue = mappingInputPathArray.reduce((obj, i) => obj[i], inputData);
                    } catch (error) {
                    console.log("Error accessing property:", error.message);
                    }
                }
        
                if(formulas.length > 0){
                    //Apply formulas to the input value, if they exist
                    mappingInputValue = applyFormulas(formulas, mappingInputValue, mappingOutputDefinition, mappingInputDefinition, inputData)
                }
        
                // Set the value of the mapped output property
                var mappingOutputPathArray = mappingOutputDefinition.path.includes('.') ? mappingOutputDefinition.path.split('.') : [mappingOutputDefinition.path]
                var outputObject = {}
        
                _.set(outputObject, mappingOutputDefinition.path, mappingInputValue, mappingOutputDefinition.type)
        
                return outputObject
            }

        }

    }

    function applyFormulas(formulas, inputValue, outputDefinition, inputDefinition, inputData){
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
                            outputValue = outputValue * multiplicationValue
                        } catch (error) {
                        console.log("Error accessing property:", error.message);
                        }
                    }
                }

                if (typeof multiplicationInputs == 'number' || typeof multiplicationInputs == 'float' || typeof multiplicationInputs == 'integer') {
                    // If the input is a number, it's a literal number that needs to be added to the input value
                    var multiplicationValue = multiplicationInputs
                    outputValue = outputValue * multiplicationValue
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
