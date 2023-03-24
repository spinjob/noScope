const axios = require('axios');
const crypto = require('crypto');
const WorkflowLog = require('./models/workflow_log/WorkflowLog');

function triggerWorkflow (workflow, apis, environment, inputJSON){
    var workflowActionNodes = workflow.nodes.filter((node) => node.type === 'action')
    var workflowMappings = workflow.definition.mappings
    var actionApi = apis.filter((api) => api.uuid === workflowActionNodes[0].data.selectedAction.parent_interface_uuid)[0]
    var productionServer = actionApi.production_server
    var sandboxServer = actionApi.sandbox_server
    console.log(productionServer)
    console.log(sandboxServer)
    console.log(apis)

    workflowActionNodes.forEach((actionNode, index) => {
        var action = actionNode.data.selectedAction
        var method = actionNode.data.selectedAction.method
        var path = actionNode.data.selectedAction.path
        var actionMappings = workflowMappings[actionNode.id]
    
        // Determine what request components need to be built
        var headerParameters = action.parameterSchema?.header ? action.parameterSchema.header : null
        var pathParameters = action.parameterSchema?.path ? action.parameterSchema.path : null
        var requestBody = action.requestBody2?.schema ? action.requestBody2.schema : null
        var adaptedRequestBodyObject = {}
        var adaptedHeaderObject = {}
        var adaptedPathObject = {}

        // Adapt non-null components using any formulas
        if (requestBody){
            
            Object.values(actionMappings).forEach((mapping) => {
                if(mapping.output.in == 'body') {
                    var adaptedObject = adaptProperty(mapping.input, mapping.output, inputJSON)
                    adaptedRequestBodyObject = {...adaptedRequestBodyObject, ...adaptedObject}
                }
            })  
        }
        if (headerParameters){
           
            Object.values(actionMappings).forEach((mapping) => {
                if(mapping.output.in == 'header') {
                    var adaptedObject = adaptProperty(mapping.input, mapping.output, inputJSON)
                    adaptedHeaderObject = {...adaptedHeaderObject, ...adaptedObject}
                }
            })  
        }
        if (pathParameters){
            
            Object.values(actionMappings).forEach((mapping) => {
                if(mapping.output.in == 'path') {
                    var adaptedObject = adaptProperty(mapping.input, mapping.output, inputJSON)
                    adaptedPathObject = {...adaptedPathObject, ...adaptedObject}
                }
            }) 

            // Add path parameters to the path, if they exist
            Object.keys(adaptedPathObject).forEach((key) => {
                path = productionServer + path.replace(`{${key}}`, adaptedPathObject[key])
            })
        }

        // Execute the action
       executeWorkflowRequest(adaptedHeaderObject,path,method, adaptedRequestBodyObject)

    })
}



function adaptProperty (mappingInputDefinition, mappingOutputDefinition, inputData){
    var formulas = mappingInputDefinition.formulas

    // Check if the input value is a configured value. If so, set the output value to the configured value.
    if (mappingInputDefinition.actionId == 'configuration' || mappingInputDefinition.path.includes('$variable.')){

    } else {
        // If the input value is not a configured value, it must be a mapped value. Get the mapped value.
        // Get the value of the mapped input property
        var mappingInputPathArray = mappingInputDefinition.path.includes('.') ? mappingInputDefinition.path.split('.') : [mappingInputDefinition.path]
        var mappingInputValue = mappingInputPathArray.reduce((obj, i) => obj[i], inputData) 
        console.log(mappingInputValue)
        
        if(formulas.length > 0){
            //Apply formulas to the input value, if they exist
        }

        // Set the value of the mapped output property
        var mappingOutputPathArray = mappingOutputDefinition.path.includes('.') ? mappingOutputDefinition.path.split('.') : [mappingOutputDefinition.path]
        var outputObject = {}
        mappingOutputPathArray.forEach((path, index) => {
            if (index === mappingOutputPathArray.length - 1){
                outputObject[path] = mappingInputValue
            } else {
                outputObject[path] = {}
            }
        })

        var mappingInputType = mappingInputDefinition.type
        var mappingOutputType = mappingOutputDefinition.type
        
        return outputObject

        // if (mappingInputType === 'string') {
        //     if (mappingOutputType === 'string'){
        //         inputData[mappingOutput] = mappingInput
        //     } else if (mappingOutputType === 'number'){
        //         inputData[mappingOutput] = Number(mappingInput)
        //     } else if (mappingOutputType === 'boolean'){
        //         inputData[mappingOutput] = Boolean(mappingInput)
        //     } else if (mappingOutputType === 'object'){
        //         inputData[mappingOutput] = JSON.parse(mappingInput)
        //     }
        // } else if (mappingInputType === 'number') {
        //     if (mappingOutputType === 'string'){
        //         inputData[mappingOutput] = String(mappingInput)
        //     } else if (mappingOutputType === 'number'){
        //         inputData[mappingOutput] = mappingInput
        //     } else if (mappingOutputType === 'boolean'){
        //         inputData[mappingOutput] = Boolean(mappingInput)
        //     } else if (mappingOutputType === 'object'){
        //         inputData[mappingOutput] = JSON.parse(mappingInput)
        //     }
        // } else if (mappingInputType === 'boolean') {
        //     if (mappingOutputType === 'string'){
        //         inputData[mappingOutput] = String(mappingInput)
        //     } else if (mappingOutputType === 'number'){
        //         inputData[mappingOutput] = Number(mappingInput)
        //     } else if (mappingOutputType === 'boolean'){
        //         inputData[mappingOutput] = mappingInput
        //     } else if (mappingOutputType === 'object'){
        //         inputData[mappingOutput] = JSON.parse(mappingInput)
        //     }
        // } else if (mappingInputType === 'object') {
        //     if (mappingOutputType === 'string'){
        //         inputData[mappingOutput] = JSON.stringify(mappingInput)
        //     } else if (mappingOutputType === 'number'){
        //         inputData[mappingOutput] = Number(mappingInput)
        //     } else if (mappingOutputType === 'boolean'){
        //         inputData[mappingOutput] = Boolean(mappingInput)
        //     } else if (mappingOutputType === 'object'){
        //         inputData[mappingOutput] = mappingInput
        //     }
        // }
    }

}

function executeWorkflowRequest(headers, url, method, body){
   console.log(headers)
    console.log(url)
    console.log(method)
    console.log(body)

    axios({
        method: method,
        url: url,
        data: body,
        headers: headers
    }).then((response) => {
        console.log(response.data)
        return (response.data)
    }).catch((error) => {
        console.log(error)
        return(error)
    })
}


function logEvent (result, workflowUuid) {

    var log = {
        uuid: crypto.randomUUID(),
        workflow_uuid: workflowUuid,
        timestamp: new Date().toISOString().replace(/T/, ' ').replace(/\..+/, ''),
        result: result
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