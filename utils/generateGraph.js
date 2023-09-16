const graphlib = require('graphlib');
const Graph = graphlib.Graph;

// Function to add schemas, inline properties, and parameters to graph
function addElementsToGraph(ApiSpec, graph, schemaName, schemaData, visited = new Set()) {
    
    if (visited.has(schemaName)) {
        return;
    }
    visited.add(schemaName);

    if (schemaData.properties) {
        for (const [prop, propData] of Object.entries(schemaData.properties)) {
            let nestedSchemaName = null;
            let isArray = false;
            
            if (propData['$ref']) {
                nestedSchemaName = propData['$ref'].split('/').pop();
            } else if (propData.type === 'array' && propData.items['$ref']) {
                nestedSchemaName = propData.items['$ref'].split('/').pop();
                isArray = true;

                // TO DO: Currently, there is no edge between the array property and it's item schema.
                // Right now the item schema and the schema that's a parent to the array property are connected.
                const arrayPropertyNodeName = `${schemaName}.${prop}`;
                graph.setNode(arrayPropertyNodeName, { type: 'array_property', dataType: 'array', itemSchema: nestedSchemaName, isArray: true });
                graph.setEdge(schemaName, arrayPropertyNodeName);
            }   

            if (nestedSchemaName) {
                if (ApiSpec.components.schemas[nestedSchemaName]) {
                    graph.setNode(nestedSchemaName, { type: 'schema', dataType: propData.type, key: prop });
                    graph.setEdge(schemaName, nestedSchemaName);
                    addElementsToGraph(graph, nestedSchemaName, ApiSpec.components.schemas[nestedSchemaName], visited);
                } else {
                    console.log(`Schema ${nestedSchemaName} does not exist in ApiSpec.components.schemas`);
                }         
            } else {
                const virtualNodeName = prop == 'type' ?  `${schemaName}.${"_type"}` : `${schemaName}.${prop}`;
                graph.setNode(virtualNodeName, { type: 'inline_property', dataType: propData.type, isArray });
                graph.setEdge(schemaName, virtualNodeName);
            }
        }
    } 
}


function generateGraph(ApiSpec){
    // Initialize Graph
    const G = new Graph({ directed: true });

    // Add schemas to the graph
    for (const [schemaName, schemaData] of Object.entries(ApiSpec.components.schemas)) { 
        console.log(`Adding schema: ${schemaName}`);  // Add logging here
        G.setNode(schemaName, { type: 'schema', dataType: schemaData.type ? schemaData.type : 'object' });
        addElementsToGraph(ApiSpec, G, schemaName, schemaData, );
    }

    // Add paths and their parameters to the graph
    for (const [path, methods] of Object.entries(ApiSpec.paths)) {
        for (const method of Object.keys(methods)) {
            const uniquePathMethod = `${method.toUpperCase()}:${path}`;
            console.log(`Adding path: ${uniquePathMethod}`);  // And here

            G.setNode(uniquePathMethod, { type: 'path' });

            const details = methods[method];
            
            // Handle parameters
            if (details.parameters) {
                for (const param of details.parameters) {
                    const paramData = param.name ? param : ApiSpec.components.parameters[param['$ref'].split('/').pop()];
                    const paramName = paramData.name;
                    const paramLocation = paramData.in;
                    const paramNodeName = `${uniquePathMethod}.${paramLocation}.${paramName}`;
                    G.setNode(paramNodeName, { type: 'parameter', location: paramLocation });
                    G.setEdge(uniquePathMethod, paramNodeName);
                }
            }
            
            // Handle request bodies
            if (details.requestBody && details.requestBody.content) {
                for (const contentType of Object.keys(details.requestBody.content)) {
                    const contentDetails = details.requestBody.content[contentType];
                    if (contentDetails.schema['$ref']) {
                        const schemaName = contentDetails.schema['$ref'].split('/').pop();
                        G.setEdge(uniquePathMethod, schemaName, { subtype: 'request' });
                    }
                }
            }

            // Handle responses
            if (details.responses) {
                for (const [responseCode, responseDetails] of Object.entries(details.responses)) {
                    let actualResponseDetails = responseDetails;
                    if (responseDetails['$ref']) {
                        actualResponseDetails = ApiSpec.components.responses[responseDetails['$ref'].split('/').pop()];
                    }
                    if (actualResponseDetails.content) {
                        for (const contentType of Object.keys(actualResponseDetails.content)) {
                            const contentDetails = actualResponseDetails.content[contentType];
                            if (contentDetails.schema['$ref']) {
                                const schemaName = contentDetails.schema['$ref'].split('/').pop();
                                const responseNode = `${uniquePathMethod}:${responseCode}`;
                                G.setNode(responseNode, { type: 'response', responseCode });
                                G.setEdge(uniquePathMethod, responseNode, { subtype: 'response' });
                                G.setEdge(responseNode, schemaName);
                            }
                        }
                    }
                }
            }
        }
    }

    return {nodes: G._nodes, edges: G._edgeObjs}
}


module.exports = { generateGraph }