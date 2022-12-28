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
                    icon: iconGenerator(schemaValues[index].type),
                    childNodes: childPropertyNodes,
                    isExpanded: true,
                    nodeData:{
                        fieldPath: "." + schemaKeys[index],
                        type: schemaValues[index].type,
                        description: schemaValues[index].description ? schemaValues[index].description : null                 
                    }
                }
                schemaTree.push(parentObject);
    
            } else if (schemaValues[index].items){
                if (schemaValues[index].items.properties){
                    
                    var propertyKeys = Object.keys(schemaValues[index].items.properties);
                    var propertyValues = Object.values(schemaValues[index].items.properties);
                    var arrayFieldPath = schemaKeys[index] + '[]';

                    var childPropertyNodes = processChildNodes(propertyKeys,propertyValues, arrayFieldPath, "array");
                    const parentObject = {
                         id: parentIdentifier,
                         label: schemaKeys[index],
                         icon: iconGenerator(schemaValues[index].type),
                        childNodes: childPropertyNodes,
                         nodeData:{
                             fieldPath: arrayFieldPath,
                             type: schemaValues[index].type,
                             description: schemaValues[index].description ? schemaValues[index].description : null,
                             required: schemaValues[index].required ? schemaValues[index].required : false                
                         }
                    }
                   schemaTree.push(parentObject);
                }
            
            } else {
                const parentObject = {
                    id: parentIdentifier,
                    label: schemaKeys[index],
                    icon: iconGenerator(schemaValues[index].type),
                    nodeData:{
                        fieldPath: "." + schemaKeys[index],
                        type: schemaValues[index].type,
                        enum: schemaValues[index].enum ? schemaValues[index].enum : null,
                        description: schemaValues[index].description ? schemaValues[index].description : null,
                        required: schemaValues[index].required ? schemaValues[index].required : false,
                        enum: schemaValues[index].enum ? schemaValues[index].enum : null,
                        
                    }
                }
                schemaTree.push(parentObject);
            }
           
        })
    }

    const schemaTreeParent = {
        id: uuidv4(),
        label: "body",
        icon: "dot",
        childNodes: schemaTree,
        isExpanded: true,
        nodeData:{
            fieldPath: "body",
            type: "body"
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

const processChildNodes = function (keys, values, parentPath, parentType) {

    const childNodes = [];

    keys.forEach((key, index) => {
        const propertyNodeId = uuidv4();
        if (!values[index].properties && !values[index].items){
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
        else if(values[index].properties){
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
                    enum: values[index].enum ? values[index].enum : null,
                }
            }
            childNodes.push(childNode);
        } else if (values[index].items){
            if (values[index].items.properties){
                var propertyKeys = Object.keys(values[index].items.properties);
                var propertyValues = Object.values(values[index].items.properties);
                var arrayFieldPath = parentPath + '.' + key + '[]';
                var childPropertyNodes = processChildNodes(propertyKeys,propertyValues, arrayFieldPath, "array");
                const childNode = {
                    id: propertyNodeId,
                    label: key,
                    icon: iconGenerator(values[index].type),
                    childNodes: childPropertyNodes,
                    isExpanded: true,
                    nodeData: {
                        type: values[index].type,
                        fieldPath: arrayFieldPath,
                        required: values[index].required ? values[index].required : false,
                        description: values[index].description ? values[index].description : '',
                        enum: values[index].enum ? values[index].enum : null,
                    }
                }
                childNodes.push(childNode);
            } else {
                var inlinePropertyUUID = uuidv4();
                var inlineLabel = values[index].items.schemaName ? values[index].items.schemaName : 'inlineSchema';
                const inlinePropertyNode = {
                    id: inlinePropertyUUID,
                    label: inlineLabel,
                    icon: iconGenerator(values[index].items.type),
                    nodeData: {
                        type: values[index].items.type,
                        fieldPath: parentPath + '.' + key + "[]." + inlineLabel ,
                        description: values[index].items.description ? values[index].items.description : '',
                        required: values[index].items.required ? values[index].items.required : false,
                        enum: values[index].items.enum ? values[index].items.enum : null
                    }
                }
                const childrenNodes = [];
                childrenNodes.push(inlinePropertyNode);

                const childNode = {
                    id: propertyNodeId,
                    label: key,
                    icon: iconGenerator(values[index].type),
                    childNodes: childrenNodes,
                    nodeData: {
                        type: values[index].type,
                        fieldPath: parentPath + '.' + key + '[]',
                        required: values[index].required ? values[index].required : false,
                        description: values[index].description ? values[index].description : '',
                        enum: values[index].enum ? values[index].enum : null,
                    }
                }
                childNodes.push(childNode);
            }
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

const generateParameterSchemaTree = function (schema){
    const headerNodes = [];
    const pathNodes = [];
    const parentNode = [];

    if (schema.header){
        var headerKeys = Object.keys(schema.header);
        var headerValues = Object.values(schema.header);
    
        for (var i = 0; i < headerKeys.length; i++){
            var headerNode = {
                id: uuidv4(),
                label: headerKeys[i],
                icon: iconGenerator(headerValues[i].schema.type),
                nodeData: {
                    type: headerValues[i].schema.type,
                    fieldPath: "header." + headerKeys[i],
                    required: headerValues[i].schema.required ? headerValues[i].schema.required : false,
                    description: headerValues[i].schema.description ? headerValues[i].schema.description : '',
                    enum: headerValues[i].schema.enum ? headerValues[i].schema.enum : null,
                }
            }
            headerNodes.push(headerNode);
        }
        
    }
    if (schema.path){

        var pathKeys = Object.keys(schema.path);
        var pathValues = Object.values(schema.path);
    
        for (var i = 0; i < pathKeys.length; i++){
            var pathNode = {
                id: uuidv4(),
                label: pathKeys[i],
                icon: iconGenerator(pathValues[i].schema.type),
                nodeData: {
                    type: pathValues[i].schema.type,
                    fieldPath: "path." + pathKeys[i],
                    required: pathValues[i].schema.required ? pathValues[i].schema.required : false,
                    description: pathValues[i].schema.description ? pathValues[i].schema.description : '',
                    enum: pathValues[i].schema.enum ? pathValues[i].schema.enum : null,
                }
            }
            pathNodes.push(pathNode);
        }
       

    }

    const pathTreeParent = {
        id: uuidv4(),
        label: "path",
        icon: "dot",
        childNodes: pathNodes,
        isExpanded: true,
        nodeData:{
            fieldPath: "path",
            type: "path"
        }
    }

    const headerTreeParent = {
        id: uuidv4(),
        label: "header",
        icon: "dot",
        childNodes: headerNodes,
        isExpanded: true,
        nodeData:{
            fieldPath: "header",
            type: "header"
        }
    }

    if (schema.header && schema.path){
        return  {
            header: headerTreeParent,
            path: pathTreeParent
        }
    } else if (schema.header && !schema.path){
        return  {
            header: headerTreeParent,
            path: null
        }
    } else if (schema.path && !schema.header){
        return {
            header: null,
            path: pathTreeParent
        }
    } 
}



export {generateSchemaTree, generateSchemaList, generateParameterSchemaTree}