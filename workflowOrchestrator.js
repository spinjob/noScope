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
                                            if(mapping.input.parentContext.length > 0){
                                                if (mapping.input.parentContext[0].contextType == 'array'){
                                                    var adaptedValues = adaptProperty(mapping.input, mapping.output, input[index].data, partnershipConfigurations, authenticationConfigurations, partnership,actionMappings, logWorkflowUUID, action, traceUUID)
                                                    _.merge(adaptedRequestBodyObject, adaptedValues) 
                                                }
                                                if (mapping.input.parentContext[0].contextType == 'dictionary'){
                                                    var adaptedValues = adaptProperty(mapping.input, mapping.output, input[index].data, partnershipConfigurations, authenticationConfigurations, partnership,actionMappings,logWorkflowUUID, action, traceUUID)
                                                
                                                    _.merge(adaptedRequestBodyObject, adaptedValues) 
                                                    console.log("Dictionary adapted values:")
                                                    console.log(adaptedRequestBodyObject)
                                                }
                                            } 
                                            if(mapping.input.parentContext.length > 1) {

                                            }
                                        } else {
                                            var adaptedObject = adaptProperty(mapping.input, mapping.output, input[index].data, partnershipConfigurations, authenticationConfigurations, partnership,actionMappings,logWorkflowUUID, action, traceUUID)
                                            _.merge(adaptedRequestBodyObject, adaptedObject)    
                                        }
                                    }
                                })  
                            }
                            if (headerParameters){
                            
                                Object.values(actionMappings).forEach((mapping) => {
                                    if(mapping.output.in == 'header') {
                                        var adaptedObject = adaptProperty(mapping.input, mapping.output, input[index].data,partnershipConfigurations, authenticationConfigurations, partnership,logWorkflowUUID, action, traceUUID)
                                        adaptedHeaderObject = {...adaptedHeaderObject, ...adaptedObject}
                                    }
                                })  
                            }
                            if (pathParameters){
                                    
                                    Object.values(actionMappings).forEach((mapping) => {
                                        if(mapping.output.in == 'path') {
                                            var adaptedObject = adaptProperty(mapping.input, mapping.output, input[index].data, partnershipConfigurations, authenticationConfigurations,partnership,logWorkflowUUID, action, traceUUID)
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

function adaptProperty (mappingInputDefinition, mappingOutputDefinition, inputData, partnershipConfigurations, authenticationConfigurations, partnership, actionMappings, workflowId, action, traceUUID){
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

        if (mappingInputParentContext && mappingInputParentContext.length > 0) {
            console.log("Input Parent Context is greater than 0")
            console.log(mappingInputParentContext)
            if(inputData){
                var iteratedValues = []
                var inputContextPath = mappingInputDefinition.parentContext[0].path
                
                mappingInputParentContext.forEach((context, index) => {
                    var {values, nextPath} = handleInputIteration(context,inputData, inputContextPath, iteratedValues, true)
                    console.log("Values")
                    console.log(values)
                    console.log("Next Path")
                    console.log(nextPath)

                    if(index === mappingInputParentContext.length -1){
                        console.log("This is the last parent context to process.  We need to finish the mapping.")

                        var nextPathArray = nextPath.split('.')
                        var iteratedPropertyValues = []
                        if(values && Array.isArray(values) && values.length > 0 ){
                            values.filter(value => value !== undefined).forEach((value, index) => {
                                if(Array.isArray(value)){
                                    if(value.length > 0 && typeof value[0] !== 'object'){
                                            iteratedPropertyValues.push(value)
                                    } else {

                                            var propertyArray = handleNestedArrayReduction(value, mappingInputDefinition.key)
                                            console.log("Property Array")
                                            console.log(propertyArray)
                                            iteratedPropertyValues.push(propertyArray)
                                        }
                                    
                                } else if(typeof value === 'object') {
                                    iteratedPropertyValues.push(nextPathArray.reduce((obj, i) => obj[i], value))
                                } else {
                                    iteratedPropertyValues.push(value)
                                }
                            })
                            console.log("INPUT PARENT CONTEXT: Iterated Property Values")
                            console.log(iteratedPropertyValues)
                        } else {
                            iteratedPropertyValues = values
                        }
                        console.log("Iterated Property Values")
                        console.log(iteratedPropertyValues)

                        if(iteratedPropertyValues && iteratedPropertyValues.length > 0){
                            console.log("Iterated Property Formulas")
                            console.log(mappingInputDefinition.formulas)
                            if(mappingInputDefinition.formulas && mappingInputDefinition.formulas.length > 0){
                                var updatedIteratedValues = applyFormulaToNestedArray(iteratedPropertyValues, mappingInputDefinition.formulas, inputData)
                                if(updatedIteratedValues){
                                    iteratedPropertyValues = updatedIteratedValues
                                }
                            }
                        }
                    
                        iteratedValues = iteratedPropertyValues
                        inputContextPath = nextPath

                    } else {
                        iteratedValues = values
                        inputContextPath = nextPath
                    }

                    
                })
                console.log("We've handled the iteration.  Now we need to finish the mapping.")
                console.log(iteratedValues)


                if(mappingOutputDefinition.parentContext && mappingOutputDefinition.parentContext.length > 0){
                    //if the output property requires iterative parent construction (e.g. dictionary keys), we need to handle that here
                    console.log("Mapping Output Definition")
                    console.log(mappingOutputDefinition)
                   var outputContextPath = mappingOutputDefinition.path
                   //initiated with the first parentcontext path but will be updated for each context processed to include only the remaining properties.
                   var outputObject = {}
                   //initiated empty but will be returned populated from each iteration that's processed.
                   var output = null

                   //initiated with the input data but will be updated for each context processed to include only the remaining properties to be iterated over.

                    mappingOutputDefinition.parentContext.forEach((context, index) => {
                        var finalStep = index === mappingOutputDefinition.parentContext.length -1 ? true : false
                        var previousStepOutput =  handleOutputIteration(context, inputData, outputContextPath, actionMappings, output, iteratedValues, finalStep, mappingOutputDefinition)
                        output = previousStepOutput
                    })

                    console.log("Output Object")
                    console.log(output)
                    return output

                } else {
                    //create outputObject with
                }

            }

        } else {

            if (inputData) {
                try {
                    mappingInputValue = mappingInputPathArray.reduce((obj, i) => obj[i], inputData);
                } catch (error) {
                    console.log("Error accessing property:", error.message);

                    logEvent("Input data does not match the documented schema. Please check that the input data schema matches what the API or webhook is providing.", workflowId, action.name, "error", traceUUID)  
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

function handleNestedArrayReduction(array, propertyKey){
    var output = []
    var propertyObject = {}


    array.forEach((item, index) => {
        if(Array.isArray(item)){
            output.push(handleNestedArrayReduction(item, propertyKey))
        }
        else if (typeof item === 'object'){
           var propertyValue = item[propertyKey]
              //propertyObject[propertyKey] = propertyValue
            output.push(propertyValue)
        }
    })
    return output
            
}

  function setEmptyTerminalObjectsToProperties(obj1, obj2, indexedValues) {
    const keys = Object.keys(obj1);
    const emptyObjects = Object.values(obj1).reduce((acc, val) => ({...acc, ...val}), {});
    
    if(indexedValues == false){
        const firstObj2 = obj2[0];
        Object.keys(emptyObjects).forEach(emptyObjectKey => {
          emptyObjects[emptyObjectKey] = firstObj2;
        });
    } else {
        obj2.forEach((prop, index) => {
            const emptyObjectKey = Object.keys(emptyObjects)[index];
            emptyObjects[emptyObjectKey] = {
              ...emptyObjects[emptyObjectKey],
              ...prop
            };
          });
    }

    const output = {};
    keys.forEach(key => {
      output[key] = {};
      Object.keys(obj1[key]).forEach(emptyObjectKey => {
        output[key][emptyObjectKey] = emptyObjects[emptyObjectKey];
      });
    });
    return output;
  }

  function flattenArray(arr, key) {
    let result = [];
    console.log("Flattening Array")
    console.log(arr)
    for (let i = 0; i < arr.length; i++) {
      if (Array.isArray(arr[i]) && arr[i].every((x) => Array.isArray(x))) {
        console.log("Array is nested")
        console.log(arr[i])
        result = result.concat(flattenArray(arr[i], key));
      } else {
        if(arr[i][0] && key === typeof arr[i][0]){
            result.push(arr[i])
        } else {

            var arrayItems = []
            if(arr[i] && Array.isArray(arr[i]) && arr[i].length > 0){
                arr[i].forEach((item, index) => {
                    const obj = {};
                    console.log("key")
                    console.log(key)
                    console.log("item")
                    console.log(item)
                    obj[key] = item;
                    arrayItems.push(obj)
                })
                console.log("Array Items")
                console.log(arrayItems)
                result.push(arrayItems);
            }
            
        }
      }
    }
    console.log("Results In Flatten Array")
    console.log(result)

    return result;
  }

  function applyFormulaToNestedArray(nestedArray, formulas, inputData) {
    if (!Array.isArray(nestedArray)) {
      // if the input is not an array, return it as is
      return nestedArray;
    }
    
    // create a new array to hold the updated values
    const updatedArray = [];
    
    for (let i = 0; i < nestedArray.length; i++) {
      const item = nestedArray[i];
      
      if (Array.isArray(item)) {
        // if the item is an array, recursively apply the formula to it
        const updatedItem = applyFormulaToNestedArray(item, formulas, inputData);
        updatedArray.push(updatedItem);
      } else {
        // if the item is not an array, apply the formula to it and add to the updated array
        const updatedItem = applyFormulas(formulas, item, null, null, inputData)
        updatedArray.push(updatedItem);
      }
    }
    
    return updatedArray;
  }
  

function handleOutputIteration (context, inputData, parentPath,  mappings, previousStepOutput, iteratedValues, finalStep, mappingOutputDefinition){

    // console.log("HANDLE OUTPUT ITERATION")
    // console.log("Context")
    // console.log(context)
    // console.log("Input Data")
    // console.log(inputData)
    // console.log("Parent Path")
    // console.log(parentPath)
    // console.log("Previous Step Output")
    // console.log(previousStepOutput)
    // console.log("Iterated Values")
    // console.log(iteratedValues)

    var input = inputData
    var outputPathArray = parentPath.includes('.') ? parentPath.split('.') : [parentPath]


    if(context.contextType == 'dictionary'){
        //If the context is a dictionary, we need to iterate over the keys and create a new object for each key
        var parentContextKey = context.parentContextKey
        var parentContextIndex = outputPathArray.indexOf(parentContextKey)
        var parentContextArray = outputPathArray.slice(0, parentContextIndex + 1)
        var parentContextObjectWithoutKeys = _.set({}, parentContextArray.join('.'), {})

        // GENERATE DICTIONARY KEYS
            var dictionaryKeyMapping = Object.values(mappings).filter(mapping => mapping.output.key == context.dictionaryKey) ? Object.values(mappings).filter(mapping => mapping.output.key == context.dictionaryKey)[0] : null

            var dictionaryKeys = []

            if(dictionaryKeyMapping && dictionaryKeyMapping.input.parentContext && dictionaryKeyMapping.input.parentContext.length > 0){
                var iteratedKeyValues = []
                var inputContextPath = dictionaryKeyMapping.input.parentContext[0].path
                dictionaryKeyMapping.input.parentContext.forEach((keyParentContext, index) => {
                    var {values, nextPath} = handleInputIteration(keyParentContext, input, inputContextPath, iteratedKeyValues)
                    iteratedKeyValues = values
                    inputContextPath = nextPath
                })

                // We should have a non-iterative property for each key mapping now (object, string, number, etc.).  We need to create a new object for each key and then map the values for each key.
                if(inputContextPath.split('.').length > 1){
                    // If the input context path is nested, we need to iterate over the values and create a new object for each value.
                    inputContextPath.split('.').forEach((path, index) => {
                        
                        iteratedKeyValues.forEach((value, index) => {
                            var temp = {}
                            temp[path] = index === inputContextPath.length -1 ? value : {};
                            temp = temp[path];
                            dictionaryKeys.push(temp)
                        });
                    })
                } else if (inputContextPath.split('.').length == 1){
                    iteratedKeyValues.forEach((value, index) => {
                        if(typeof value != 'object') {
                            dictionaryKeys.push(value)
                        } else {
                            dictionaryKeys.push(value[inputContextPath]);
                        }
                    })
                }
            }

            if(dictionaryKeyMapping.input.formulas && dictionaryKeyMapping.input.formulas.length > 0){
                var adaptedDictionaryKeys = applyFormulaToNestedArray(dictionaryKeys, dictionaryKeyMapping.input.formulas, inputData)
                dictionaryKeys = adaptedDictionaryKeys
            }

            // GENERATE DICTIONARY OBJECTS
            var keyPathIndex = parentContextIndex + 1
            var keyPathArray = outputPathArray.slice(0, keyPathIndex)
            var keyedObject = {}

            /// If this is the final step, we will set the keyed objects to the values created from the input mapping.
            if (finalStep){
                if(mappingOutputDefinition.key == context.dictionaryKey){
                    console.log("Final Step, the dictionaryKeyMapping")
                    dictionaryKeys.forEach((key, index) => {
                        keyedObject[key] = {}
                    })

                } else {
                    console.log("Final Step, not the dictionaryKeyMapping")
                    dictionaryKeys.forEach((key, index) => {

                        var dictionaryKeyIndex = outputPathArray.indexOf(context.dictionaryKey)
                        var postKeyPathArray = outputPathArray.slice(dictionaryKeyIndex + 1)

                        var keyIndex = index
                        
                        keyedObject[key] = {}

                        let result = {}
                        let temp = result

                        // Iterate over the postKeyPathArray and create a new object for each path that isn't the last property in the array.  This handles any nesting.
                        postKeyPathArray.forEach((path, index) => {
        
                            console.log(postKeyPathArray)
                            if(index === postKeyPathArray.length -1){
                                temp[path] = iteratedValues[keyIndex]
                            } else {
                                temp[path] = {}
                                temp = temp[path];
                            }
                        })

                        keyedObject[key] = result
                                          
                    })
    
                }
              
            } else {
                dictionaryKeys.forEach((key, index) => {
                    keyedObject[key] = {}
                })
            }

            console.log("Keyed Object")
            console.log(keyedObject)
            console.log("Parent Context Object Without Keys")
            console.log(parentContextObjectWithoutKeys)
            console.log("Key Path Array")
            console.log(keyPathArray)

            let parentDictionary = parentContextObjectWithoutKeys

            keyPathArray.forEach((key, index) => {
                parentDictionary[key] = index === keyPathArray.length -1 ? keyedObject : {};
            })
            console.log("Parent Dictionary")
            console.log(parentDictionary)

            if(previousStepOutput){
                var contextPathArray = mappingOutputDefinition.path.split('.')
                var currentContextIndex = mappingOutputDefinition.parentContext.indexOf(context)
                console.log("CURRENT CONTEXT INDEX")
                console.log(currentContextIndex)
    
                var previousContext = mappingOutputDefinition.parentContext[currentContextIndex - 1]
                console.log("PREVIOUS PARENT CONTEXT")
                console.log(previousContext)
    
                var currentContextPathIndex = contextPathArray.indexOf(context.parentContextKey)
                var previousContextPathIndex = contextPathArray.indexOf(previousContext.parentContextKey)
    
                // Get the path to the current context from the previous context
                var intraParentContextPath = contextPathArray.slice(previousContextPathIndex, currentContextPathIndex).filter(path => path != previousContext.parentContextKey)
            }

            return parentDictionary

    } else if (context.contextType == 'array'){
        if (previousStepOutput){

            var contextPathArray = mappingOutputDefinition.path.split('.')
            var currentContextIndex = mappingOutputDefinition.parentContext.indexOf(context)
            console.log("CURRENT CONTEXT INDEX")
            console.log(currentContextIndex)

            var previousContext = mappingOutputDefinition.parentContext[currentContextIndex - 1]
            console.log("PREVIOUS PARENT CONTEXT")
            console.log(previousContext)

            var currentContextPathIndex = contextPathArray.indexOf(context.parentContextKey)
            var previousContextPathIndex = contextPathArray.indexOf(previousContext.parentContextKey)

            // Get the path to the current context from the previous context
            var intraParentContextPath = contextPathArray.slice(previousContextPathIndex, currentContextPathIndex).filter(path => path != previousContext.parentContextKey)

            // If the previous context is a dictionary, we need to remove the dictionary key and the parentContextKey (i.e. the dictionary property key) from the path
            if(previousContext.contextType == 'dictionary'){
                intraParentContextPath = intraParentContextPath.filter(path => path != previousContext.dictionaryKey)
            }

            var parentContextIndex = contextPathArray.indexOf(context.parentContextKey)
            var parentContextPathArray = contextPathArray.slice(parentContextIndex)

            // We'll combine the parent context path array with the intra parent context path to get the full path from the previous parent context to the current parent context
            intraParentContextPath.push(...parentContextPathArray)
            var updatedOutput = {}
            var propArray = []
            var isInlineProperty = false

            console.log("ARRAY PARENT CONTEXT PATH")
            console.log(parentContextPathArray)

            console.log("INTRA PARENT CONTEXT  PATH")
            console.log(intraParentContextPath)

            if(finalStep){
                console.log("FINAL STEP ln 743")

                parentContextPathArray.forEach((path, index) => {
                    if(path == context.parentContextKey){
                        var outputArray = []
                        if(iteratedValues.length > 0 && Array.isArray(iteratedValues[0])){
                            console.log("ARRAY OF ARRAYS")
                            flattenArray(iteratedValues, mappingOutputDefinition.key).forEach((value, index) => {
                                var propertyObject = {}
                              
                                //If there are objects between the last parent context and the final context, we need to nest the property accordingly.
                                if(intraParentContextPath.length > 0){
                                    console.log("NESTED PROPERTY")
                                    console.log(intraParentContextPath)
                                    let result = {}
                                    let temp = result

                                    for(let i = 0; i < intraParentContextPath.length; i++){

                                        if(intraParentContextPath[i] == context.parentContextKey){
                                            console.log("Parent Array")
                                            console.log(intraParentContextPath[i])
                                            console.log(value)
                                            if(Array.isArray(value)){
                                                temp[intraParentContextPath[i]] = value

                                            }else {
                                                temp[intraParentContextPath[i]] ? temp[intraParentContextPath[i]] = [...temp[intraParentContextPath[i]], ...value] : temp[intraParentContextPath[i]] = [value] 
                                            }
                                           temp = temp[intraParentContextPath[i]]
                                          
                                        } else if(i == intraParentContextPath.length -1){
                                            console.log("LAST")
                                            console.log(intraParentContextPath[i])
                                                       
                                        } else {
                                            console.log("OTHER")
                                            console.log(intraParentContextPath[i])
                                            temp[intraParentContextPath[i]] = {}
                                            temp = temp[intraParentContextPath[i]]
                                        }
                                    }
                                    console.log("RESULT")
                                    console.log(result)
                                    propArray.push(result)
                                } else {
                                    console.log("NO INTRA PARENT CONTEXT PATH")
                                    console.log(value)
                                    
                                    propertyObject = {...propertyObject, ...value}
                                    propArray.push(propertyObject)
                                }
                                
                            })

                        } else {
                            console.log("ARRAY OF OBJECTS OR PROPERTIES")
                            console.log(iteratedValues)
                            iteratedValues.forEach((value, index) => {
                                if(typeof value == mappingOutputDefinition.key ){

                                    isInlineProperty = true
                                    var propertyObject = {}
                                    var temp = propertyObject
                                    //If there are objects between the last parent context and the final context, we need to nest the property accordingly.
                                    if(intraParentContextPath.length > 0){
                                        console.log("NESTED PROPERTY")
                                        console.log(intraParentContextPath)

                                        intraParentContextPath.forEach((path, index) => {
                                           if(path == context.parentContextKey){
                                               temp[path] = [value]
                                           } else if (index == intraParentContextPath.length -1){
                                              //skipping because we've set the value above.
                                           } else {
                                                  temp[path] = {}
                                                  temp = temp[path]
                                           }
                                        })

                                        propArray.push(propertyObject)
                                    } else {
                                        propertyObject[context.parentContextKey] = [value]
                                        propArray.push(propertyObject)
                                    }
                                } else {
                                    var propertyObject = {}
                                    var temp = propertyObject
                                    //If there are objects between the last parent context and the final context, we need to nest the property accordingly.
                                    if(intraParentContextPath.length > 0){
                                        console.log("NESTED PROPERTY")
                                        console.log(intraParentContextPath)

                                        intraParentContextPath.forEach((path, index) => {
                                            console.log("PATH")
                                            console.log(path)
                                            temp[path] = index === intraParentContextPath.length -1 ? value : {};
                                            console.log("TEMP")
                                            console.log(temp)
                                            temp = propertyObject[path]
                                            console.log("Property Object")
                                            console.log(propertyObject)
                                        })

                                        propArray.push(propertyObject)
                                    } else {
                                        propertyObject[mappingOutputDefinition.key] = value
                                        propArray.push(propertyObject)
                                }
                                
                            }
                            })
                        }
                        updatedOutput[path] = propArray

                     } else if(path != context.parentContextKey && index !== parentContextPathArray.length -1) {
                         updatedOutput[path] = {}
                     } else if(index === parentContextPathArray.length -1 && path != context.parentContextKey){
                         
                     }
                     
                     if(previousContext && previousContext.contextType == "array" && path == context.parentContextKey){
                        var pathFromPreviousArrayContextToCurrentContext = contextPathArray.slice(previousContextPathIndex, currentContextIndex+2)
                        if(pathFromPreviousArrayContextToCurrentContext && pathFromPreviousArrayContextToCurrentContext.length == 2 && propArray && propArray.length > 0){
                            console.log("Back to Back Arrays. Need to nest the array in the previous array.")
                            console.log(propArray)
                            if(!Array.isArray(propArray[0])){
                                console.log("Prop Array is not a nested array - meaning the parentContext array key can be used as the key for the nested array.")
                                var nestedArrayObject = {}
                                nestedArrayObject[previousContext.parentContextKey] = propArray
                                propArray = [nestedArrayObject]
                            } else {
                                //If the propArray is a nested array, then there will be iteration to handle here
                            }
                        }
                     }

                     console.log("PROP ARRAY IN FINAL STEP")
                     console.log(propArray)
                 })

                    
            } else {
                console.log("NOT FINAL STEP")
                parentContextPathArray.forEach((path, index) => {
                    if(path == context.parentContextKey){
                          updatedOutput[path] = []
                     } else if(path != context.parentContextKey && index !== parentContextPathArray.length -1) {
                         updatedOutput[path] = {}
                     } else if(index === parentContextPathArray.length -1){
                         console.log("LAST INDEX")
                     }
                 })
                 console.log("UPDATED OUTPUT")
                    console.log(updatedOutput)

            }

            if(isInlineProperty && propArray.length == 1 && Array.isArray(propArray[0]) == false){
                // If the final context is an inline property, and the propArray only contains a single nonArray property...this means the input property is not indexed and all empty output properties should be set to the same value.
                var updatedParent = setEmptyTerminalObjectsToProperties(previousStepOutput, propArray, false)
                return updatedParent
            } else {
                var updatedParent = setEmptyTerminalObjectsToProperties(previousStepOutput, propArray, true)
                return updatedParent
            }
            
            
        } else {
            // If there is no previous step output, we need to create a new object with the parent context key and an empty array.
            var contextPathArray = context.path.split('.')
            var parentContextIndex = contextPathArray.indexOf(context.parentContextKey)
            var parentContextPathArray = contextPathArray.slice(parentContextIndex)
            var updatedOutput = {}
            var propArray = []

            console.log("ARRAY PARENT CONTEXT PATH")
            console.log(parentContextPathArray)

            if(finalStep){
                console.log("FINAL STEP ln 859")

                parentContextPathArray.forEach((path, index) => {
                    if(path == context.parentContextKey){
                        iteratedValues.forEach((value, index) => {
                            var propertyObject = {}
                            propertyObject[mappingOutputDefinition.key] = value
                            propArray.push(propertyObject)
                            console.log("PROPERTY OBJECT")
                            console.log(propertyObject)
                        })  

                        updatedOutput[path] = propArray

                     } else if(path != context.parentContextKey && index !== parentContextPathArray.length -1) {
                         updatedOutput[path] = {}
                         console.log("PROPERTY OBJECT")
                        console.log(updatedOutput)
                     } else if(index === parentContextPathArray.length -1 && path != context.parentContextKey){
                         console.log("LAST INDEX")
                     } else {
                            console.log("ELSE")
                            console.log(path)
                     }
                     console.log("PROP ARRAY IN FINAL STEP")
                    console.log(propArray)
                 })

                    
            } else {
                console.log("NOT FINAL STEP")
                parentContextPathArray.forEach((path, index) => {
                    if(path == context.parentContextKey){
                          updatedOutput[path] = []
                     } else if(path != context.parentContextKey && index !== parentContextPathArray.length -1 && mappingInputDefinition.parentContext.filter((context) => context.parentContextKey == path).length == 0) {
                         updatedOutput[path] = {}
                     } else if (path != context.parentContextKey && index !== parentContextPathArray.length -1 && mappingInputDefinition.parentContext.filter((context) => context.parentContextKey == path).length > 1) {
                            if(mappingInputDefinition.parentContext.filter((context) => context.parentContextKey == path)[0].contextType == 'dictionary'){
                                updatedOutput[path] = {}
                            }
                     } else if(index === parentContextPathArray.length -1){
                         console.log("LAST INDEX")
                     }
                 })
            }
            console.log("PROP ARRAY")
                    console.log(propArray)
                    console.log("UPDATED OUTPUT")
                    console.log(updatedOutput)

            return updatedOutput
        }
    }
}


function handleInputIteration( context, inputData, parentPath, valuesArray, isDictionaryKey){
    //The goal of this function is to iterate over the input data and return an array of adapted properties that will be merged into the output object.
    var input = inputData
    var inputPathArray = parentPath.split('.')

    if(valuesArray.length > 0){
       input = valuesArray
    } 

    console.log("INPUT")
    console.log(input)

    if(context.contextType == 'dictionary'){
        var parentContextIndex = inputPathArray.indexOf(context.parentContextKey)

        var parentContextPath = inputPathArray.slice(0, parentContextIndex+1)
        var childContextPathWithoutKeyPlaceholder = inputPathArray.slice(parentContextIndex+1).filter(path => path.includes("{{") == false && path.includes("}}") == false)

        if(valuesArray.length > 0){
            var parentContext = []
            input.forEach((item, index) => {
                parentContext.push(parentContextPath.reduce((obj, i) => obj[i], item))
            })

            return {parentContext, childContextPathWithoutKeyPlaceholder}
            
        } else {
            parentContext = parentContextPath.reduce((obj, i) => obj[i], input)
            var dictionaryValues = Object.values(parentContext)
            return {values: dictionaryValues, nextPath: childContextPathWithoutKeyPlaceholder.join('.')}
        }


    } else if (context.contextType == 'array'){
        console.log("Input Array Parent Context")
        console.log(context)
        console.log("VALUES ARRAY")
        console.log(valuesArray)
        var parentContextIndex = inputPathArray.indexOf(context.parentContextKey)
        var parentContextPath = inputPathArray.slice(0, parentContextIndex + 1)
        var childContextPathArray = inputPathArray.slice(parentContextIndex + 1)
        console.log("PARENT CONTEXT PATH")
        console.log(parentContextPath)
        console.log("CHILD CONTEXT PATH")
        console.log(childContextPathArray)


        if(valuesArray.length > 0){
            var arrayValues = []
            console.log("INPUT ARRAY ln 932")
            console.log(input)

            // Check if the values array is an array of arrays, this would indicate that there was a previous parent context array that's a direct parent.  We'll want to flatten the array in this case.
            input.filter((item => item !== undefined)).forEach((item, index) => {

                if(Array.isArray(item)){
                    console.log("Values Array is an array of arrays")
                    console.log(item)
                    var updatedArray = []
                    item.forEach((subItem, index) => {
                        var parentContext = parentContextPath.reduce((obj, i) => obj[i], subItem)
                        updatedArray.push(parentContext)
                    })
                    arrayValues.push(updatedArray)
                } else {
                    console.log("ITEM ln 1029")
                    console.log(item)
                    try {
                        var parentContext = parentContextPath.reduce((obj, i) => obj[i], item)
                        arrayValues.push(parentContext)
                    } catch (error) {
                        console.log("ERROR")
                        console.log(error)
                    }
                    if(parentContext) {
                        console.log("PARENT CONTEXT")
                        console.log(parentContext)
                    }
                }
              
            })
            return {values: arrayValues, nextPath: childContextPathArray.join('.')}
            
        } else {
            try {
                var parentContext = parentContextPath.reduce((obj, i) => obj[i], input)
                var arrayValues = parentContext
                return {values: arrayValues, nextPath: childContextPathArray.join('.')}
            } catch (error) {
                console.log("ERROR")
                console.log(error)
                return {values: [], nextPath: childContextPathArray.join('.')}
            }
            
            
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
