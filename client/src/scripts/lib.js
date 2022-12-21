const { v4: uuidv4 } = require('uuid');

const generateSchemaTree = function (type, schema){
    const schemaTree = [];

    if(type == 'requestBody'){
        const schemaKeys = Object.keys(schema);
        const schemaValues = Object.values(schema);
        schemaKeys.forEach((key, index) => {

            const parentIdentifier = uuidv4();
            if(schemaValues[index].properties){
                var propertyKeys = Object.keys(schemaValues[index].properties);
                var propertyValues = Object.values(schemaValues[index].properties);
                var childPropertyNodes = processChildNodes(propertyKeys,propertyValues, schemaKeys[index]);

                const parentObject = {
                    id: parentIdentifier,
                    label: schemaKeys[index],
                    icon: 'cube',
                    childNodes: childPropertyNodes,
                    isExpanded: true,
                    nodeData:{
                        fieldPath: schemaKeys[index],
                        type: schemaValues[index].type,
                        description: schemaValues[index].description ? schemaValues[index].description : null                 
                    }
                }
                schemaTree.push(parentObject);
    
            } else if (schemaValues[index].items){
               //Handle Array Items
            } else {
                const parentObject = {
                    id: parentIdentifier,
                    label: schemaKeys[index],
                    icon: iconGenerator(schemaValues[index].type),
                    nodeData:{
                        fieldPath: schemaKeys[index],
                        type: schemaValues[index].type,
                        enum: schemaValues[index].enum ? schemaValues[index].enum : null,
                        description: schemaValues[index].description ? schemaValues[index].description : null
                        
                    }
                }
                schemaTree.push(parentObject);
            }
           
        })
    }

    const schemaTreeParent = {
        id: uuidv4(),
        label: "root",
        icon: "dot",
        childNodes: schemaTree,
        isExpanded: true,
        nodeData:{
            fieldPath: "root",
            type: "root"
        }
    }
    return schemaTreeParent

}

const iconGenerator = function (type) {
        switch (type) {
            case "string":
                return "citation"
            case "integer":
                return "numerical"
            case "number":
                return "numerical" 
            case "float":
                return "floating-point"                   
            case "boolean":
                return "segmented-control"
            case "array":
                return "array"
            case "object":
                return "cube"
            default: 
                return "symbol-circle"
    }
}


const processChildNodes = function (keys, values, parentPath) {

    const childNodes = [];
    const keyArray = [];

    keys.forEach((key, index) => {
        const propertyNodeId = uuidv4();
        if (!values[index].properties){
            const childNode = {
                id: propertyNodeId,
                label: key,
                icon: iconGenerator(values[index].type),
                nodeData: {
                    type: values[index].type,
                    fieldPath: parentPath + '.' + key,
                    required: values[index].required ? values[index].required : false,
                    description: values[index].description ? values[index].description : '',
                    enum: values[index].enum ? values[index].enum : null,
                }
            }
            childNodes.push(childNode);
        }
        else {
            var propertyKeys = Object.keys(values[index].properties);
            var propertyValues = Object.values(values[index].properties);
            var childPropertyNodes = processChildNodes(propertyKeys,propertyValues, parentPath + '.' + key);
            const childNode = {
                id: propertyNodeId,
                label: key,
                icon: iconGenerator(values[index].type),
                childNodes: childPropertyNodes,
                isExpanded: true,
                nodeData: {
                    type: values[index].type,
                    fieldPath: parentPath + '.' + key,
                    required: values[index].required ? values[index].required : false,
                    description: values[index].description ? values[index].description : '',
                }
            }
            childNodes.push(childNode);
        }
    })

    return childNodes;
}



const generateSchemaList = function (schema){
    const schemaList = [];
    const schemaKeys = Object.keys(schema);
    const schemaValues = Object.values(schema);
    schemaKeys.forEach((key, index) => {
        if(schemaValues[index].properties){
            var propertyKeys = Object.keys(schemaValues[index].properties);
            var propertyValues = Object.values(schemaValues[index].properties);
            var propertyList = processPropertyPathArray(propertyKeys,propertyValues, schemaKeys[index])
            schemaList.push(...propertyList);
            
        } else if(schemaValues[index].type != 'object') {
            var schema = {
                fieldPath: schemaKeys[index],
                type: schemaValues[index].type
            }
            schemaList.push(schema);
        }
       
    })

    return schemaList
}

const processPropertyPathArray = function (keys, values, parentPath) {
    const propertyList = [];
    keys.forEach((key, index) => {
        if (!values[index].properties && values[index].type != 'object'){
            var schema = {
                fieldPath: parentPath + '.' + key,
                type: values[index].type
            }
            propertyList.push(schema);
        }
        else if (values[index].properties && values[index].type == 'object'){
            var propertyKeys = Object.keys(values[index].properties);
            var propertyValues = Object.values(values[index].properties);
            var propertyPaths = processPropertyPathArray(propertyKeys,propertyValues, parentPath + '.' + key)
            propertyList.push(...propertyPaths);
        } else {
            console.log(values[index])
        }
    })
    return propertyList
}


export {generateSchemaTree, generateSchemaList}