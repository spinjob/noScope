const Interface = require('../models/interface/Interface');
const InterfaceSecurityScheme = require('../models/interface_security_scheme/InterfaceSecurityScheme');
const Workflow = require('../models/workflow/Workflow');
const Project = require('../models/project/Project');

const formatAuthConfigString = (authConfig) => {
    let descriptions = ['The generate token request will require the following parameters sent as www-form-urlencoded data: '];
    for (let [authKey, value] of Object.entries(authConfig)) {
      let naturalDescription = '';
      
      if(authKey === 'client_id' || authKey === 'client_secret'){
         naturalDescription += `- Property Key: ${authKey}. Property Description: ${authKey} is a string value that will be manually configured. Test Value: ${value}`;
      } else if (authKey === 'tokenData') { 
        // do nothing
      } else {
         naturalDescription += `- Property Key: ${authKey}. Property Description: is a string with the value: ${value}`;
      }
      if(naturalDescription){
        descriptions.push(naturalDescription);
      }
    }
    return descriptions.join('\n');
}

const generateAPIStrings = async (apiIds, authenticationConfig) => {
    let apiPromptString = 'API Context and Instructions: There are two REST Application Programming Interfaces (APIs) whose supported authentication schemes, requests, and data models that will be referenced in the requirements for this application.  In this section we define two categories of API information (1) The base URLs for a production and or a sandbox server for each API. These can be used to build the full HTTP request paths. (2) The Authentication or Security Scheme supported by the API.  Each APIs authentication scheme needs to be adhered to when you develop the project, so implement the project accordingly. \n\n';

    let firstApiName = ''
    let secondApiName = ''
    let sandboxServer = ''
    await Promise.all(apiIds.map(async (apiId, index) => {
        const apiDetails = await Interface.findOne({uuid: apiId});
        if (apiDetails) {
            const apiName = apiDetails.name;
            const productionServer = apiDetails.production_server;
            sandboxServer = apiDetails.sandbox_server;

            if (index === 0) {
                apiPromptString += 'First API:\n';
                firstApiName = apiName
            } else {
                secondApiName = apiName
            }

            apiPromptString += `API Name: ${apiName}\n`;
            // apiPromptString += `Production Server: ${productionServer}\n`;
            apiPromptString += `Sandbox Server: ${sandboxServer}\n\n`;
            if (index === 0) {
                apiPromptString += 'Second API:\n';
            }
        }
    }));

    let apiAuthenticationString = 'The authentication schemes supported by each API are as follows: \n\n';

    await Promise.all(apiIds.map(async (apiId, index) => {
        const securitySchemes = await InterfaceSecurityScheme.find({ parent_interface_uuid: apiId });
        const apiAuth = authenticationConfig[apiId];
        console.log("API AUTH")
        console.log(apiAuth)
        const securityScheme = securitySchemes[0] ? securitySchemes[0] : null;
        if (securityScheme) {
            const securitySchemeType = securityScheme.type;
            const securitySchemeDescription = securityScheme.description ? securityScheme.description : null;
            const securitySchemeFlow = securityScheme.flows ? securityScheme.flows : null;

            if(index === 0){
                apiAuthenticationString += `API: ${firstApiName} Authentication:\n`;
            } else {
                apiAuthenticationString += `API: ${secondApiName} Authentication:\n`;
            }   
            apiAuthenticationString += `Security Scheme Type: ${securitySchemeType}\n`;

            // if (securitySchemeDescription && securitySchemeDescription.length > 0) {
            //     apiAuthenticationString += `Security Scheme Description: ${securitySchemeDescription}\n`;
            // }

            if (securitySchemeFlow && securitySchemeFlow.length > 0 && securitySchemeType === 'oauth2') {
                const flowType = securitySchemeFlow[0].type;
                const flowAuthorizationUrl = securitySchemeFlow[0].authorizationUrl ? securitySchemeFlow[0].authorizationUrl : 'N/A';
                const flowTokenUrl = securitySchemeFlow[0].tokenUrl ? sandboxServer + securitySchemeFlow[0].tokenUrl : 'N/A';
                const flowRefreshUrl = securitySchemeFlow[0].refreshUrl ? securitySchemeFlow[0].refreshUrl : 'N/A';

                apiAuthenticationString += `Security Scheme Flow Type: ${flowType}\n`;
                if (flowType === 'clientCredentials') {
                    if(flowAuthorizationUrl !== 'N/A'){
                        apiAuthenticationString += `Security Scheme Flow Authorization URL: ${flowAuthorizationUrl}\n`;
                    }
                    if(flowTokenUrl !== 'N/A'){
                        apiAuthenticationString += `Security Scheme Flow Token URL: ${flowTokenUrl}\n`;
                    }
                }
                if (flowType === 'authorizationCode') {
                    if(flowAuthorizationUrl !== 'N/A'){
                        apiAuthenticationString += `Security Scheme Flow Authorization URL: ${flowAuthorizationUrl}\n`;
                    }
                    if(flowTokenUrl !== 'N/A'){
                        apiAuthenticationString += `Security Scheme Flow Token URL: ${flowTokenUrl}\n`;
                    }
                    
                }

                if(flowRefreshUrl !== 'N/A'){
                    apiAuthenticationString += `Security Scheme Flow Refresh URL: ${flowRefreshUrl}\n`;
                }

                if(apiAuth){
                    apiAuthenticationString += `Token Generation Request Parameters: ${formatAuthConfigString(apiAuth)}\n`;

                }
                // if(flowScopes !== 'N/A'){
                //     apiAuthenticationString += `Security Scheme Flow Scopes & Scope Definitions: ${formatAuthScopesString(flowScopes)}\n`;
                // }
            }
        }

        apiAuthenticationString += '\n';

    }));

    return apiPromptString + apiAuthenticationString;
}

const generateWorkflowTriggerString = async (trigger) => {
    if (trigger.type === 'webhook') {
        return ` Workflow Trigger Instructions: The workflow will be triggered by a webhook called ${trigger.selectedWebhook.name} from API (${trigger.selectedWebhook.parent_interface_uuid}).  The webhook will be configured to send a POST request to a configured URL.  Use a placeholder for the webhook URL.\n\n`
    } else if (trigger.type === 'scheduled') {
        if(trigger.cadence === 'Weekly'){

            const dayString = trigger.days.join(', ')
            const timeString = trigger.time
            const timezoneString = trigger.timezone

            return ` Workflow Trigger Instructions: The workflow will be triggered by a scheduled event.  The schedule will be configured to run weekly on these days (${dayString}), at this time (${timeString}), and in this timezone (${timezoneString}).\n\n`

        } else if (trigger.cadence === 'Daily'){
            const timeString = trigger.time
            const timezoneString = trigger.timezone
            return ` Workflow Trigger Instructions: The workflow will be triggered by a scheduled event.  The schedule will be configured to run daily at this time (${timeString}), and in this timezone (${timezoneString}).\n\n`
        }
    }
}

function compressMappingData(mappings) {
    // List of properties to remove
    const propertiesToRemove = [
      'id', 'stepIndex', 'maxLength', 'minLength', 'description',
      'example', 'key', 'actionId', 'required', 'targetNode'
    ];
  
    // Recursive function to remove properties from an object
    function removeProps(obj) {
      for (const prop in obj) {
        if (prop === 'formulas' && Array.isArray(obj[prop]) && obj[prop].length === 0) {
            delete obj[prop];
        } else if (propertiesToRemove.includes(prop)) {
          delete obj[prop];
        } else if (typeof obj[prop] === 'object') {
          removeProps(obj[prop]);
        } 
      }
    }
  
    // Iterate through the objects in the dict
    for (const key in mappings) {
        removeProps(mappings[key]);
      }

    return mappings;
  }

const generateWorkflowStepString = async (steps, mappings) => {
    let stepIntroString = 'Workflow Steps Instructions: The following series of steps will contain a combination of text and JSON to describe each HTTP request.  The text will describe the details of the HTTP request (the API that supports the request, the HTTP method, and the path to append to the server base URL for the API. '
    let mappingInstructionsString = ' \n\n The Data Mapping JSON will provide you detailed instructions on how to map and adapt a value coming from a configuration, webhook request body, or previous HTTP requests response body. The keys of the object represent either the key of a header/path/query parameter OR a dot-notation representation of a property in a request body. The Data Mapping JSON is provided to describe how you find input data, what formulas to apply to the input value, and what property of the output the value should be set for.  Do not write code assuming the JSON will be provided.  Here are descriptions of the Data Mapping JSONs primary properties \n\n (MAPPING JSON PROPERTY: .input): The source of the value to use for the output property.  It will include an "in" property that will tell you where in the previous step to look for it; if it is "body" and the sourceNode is "trigger", then you will find the source value in the body of the webhook trigger.  If "in" is "body" and the sourceNode is an "action" then you will find the value in the response body of the previous steps HTTP request.  The "sourcePath" of the "input" is a dot-notation representation of where the property is located in an object like a webhook or response body. \n\n (MAPPING JSON PROPERTY .input.formulas) This array contains objects that each describe a function to apply to the input value to create the output value. The functions described should be applied in the order they appearin the array. If no "formulas" property exists or its empty for an input that means you should assume the value of the input is set to the output property without changing it.  \n\n (MAPPING JSON PROPERTY: .output) The details of the parameter or property that will contain the value from the input in the current steps HTTP request. The "output.in" value will tell you if the property is a header parameter, path parameter, query parameter, or a propert in the request body.  If "in" === "body, then "outputPath" will describe a dot-notation representation of where the property is in the request body object.\n\n'
    let stepsString = ''
    steps.map((step, index) => {
        const stepId = step.id
        const stepNumber = index + 1
        const action = step.data.selectedAction
        const actionApi = `API (identifier:${action.parent_interface_uuid})`
        const actionDataMappings = mappings[stepId]
        
        stepsString += `Step ${stepNumber}: ${actionApi} ${action.name}\n`
        stepsString += `Step ${stepNumber} Data Mapping JSON:\n`
        stepsString += JSON.stringify(actionDataMappings, null, 2)

    })

    return stepIntroString + mappingInstructionsString + stepsString

}

const generateWorkflowStrings = async (workflow) => {
    
    let workflowPromptString = 'Workflow Context and Instructions: The integration workflow will be defined by a "workflow trigger" and series of sequential "workflow steps." A workflow trigger is the definition of the condition required to run the application.  Each step will be an HTTP request to one of the two involved APIs. \n\n'
    let trigger = workflow.trigger
    let steps = workflow.nodes.filter((node) => node.type === 'action')
    let mappings = compressMappingData(workflow.definition.mappings)

    const triggerString = await generateWorkflowTriggerString(trigger)
    const stepsString = await generateWorkflowStepString(steps, mappings)

    return workflowPromptString + triggerString + stepsString

}

const constructWorkflowPrompt = async (workflowId, language, additionalInstructions) => {
    let workflow = await Workflow.findOne({uuid: workflowId})
    let partnership = await Project.findOne({uuid: workflow.parent_project_uuid})
    
    const prePromptInstructions = `Objective: Implement a ${language} application that integrates two APIs according to the specified API-specific security schemes and workflow requirements.  The code should completely implement the following files: main.py, an authentication client, a workflow.py file (that implements workflow steps), and a data_mapper.py (implements the logic defined by each data mapping JSON.) The workflow you implement should be triggered on the receipt of a webhook or on a scheduled cadence (depending on the defined workflow trigger in the prompt).`
    const postPromptInstructions = `Additional Instructions to Guide Implementation : ${additionalInstructions}`
    const apiInformationPrompt = await generateAPIStrings(workflow.interfaces, partnership.authentication);
    const workflowInformationPrompt = await generateWorkflowStrings(workflow);

    if(additionalInstructions && additionalInstructions.length > 0){
        return prePromptInstructions + '\n\n' + postPromptInstructions + '\n\n'  + apiInformationPrompt + '\n\n' + workflowInformationPrompt
    } else {
        return prePromptInstructions + '\n\n' + apiInformationPrompt + '\n\n' + workflowInformationPrompt
    }

}

module.exports = { constructWorkflowPrompt }