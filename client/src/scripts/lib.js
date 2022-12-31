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
                    var arrayFieldPath = schemaKeys[index] + "[0]";

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
        var arrayItem = false
        
        if(parentType == "array"){
            arrayItem = true
        } else {
            arrayItem = false
        }

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
                    arrayItemSchema: arrayItem
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
                    arrayItemSchema: arrayItem
                }
            }
            childNodes.push(childNode);
        } else if (values[index].items){
            if (values[index].items.properties){
                var propertyKeys = Object.keys(values[index].items.properties);
                var propertyValues = Object.values(values[index].items.properties);
                var arrayFieldPath = parentPath + '.' + key + '[0]';
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
                        arrayItemSchema: arrayItem

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
                        fieldPath: parentPath + '.' + key + "." + inlineLabel ,
                        description: values[index].items.description ? values[index].items.description : '',
                        required: values[index].items.required ? values[index].items.required : false,
                        enum: values[index].items.enum ? values[index].items.enum : null,
                        arrayItemSchema: arrayItem
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
                        fieldPath: parentPath + '.' + key + '[0]',
                        required: values[index].required ? values[index].required : false,
                        description: values[index].description ? values[index].description : '',
                        enum: values[index].enum ? values[index].enum : null,
                        arrayItemSchema: arrayItem
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
    
    if (schema && schema.header){
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

    if (schema && schema.path){

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

    if (schema && schema.header && schema.path){
        return  {
            header: headerTreeParent,
            path: pathTreeParent
        }
    } else if (schema && schema.header && !schema.path){
        return  {
            header: headerTreeParent,
            path: null
        }
    } else if (schema && schema.path && !schema.header){
        return {
            header: null,
            path: pathTreeParent
        }
    } else {
        return {
            header: null,
            path: null
        }
    }
}

const generateLiquidTemplateString = function (json, path, adaptions){
    const firstLevelKeys = Object.keys(json);
    const firstLevelValues = Object.values(json);
    var liquidTemplateString = "";
    for (var i = 0; i < firstLevelKeys.length; i++){
        var newStringComponent = processLiquidTemplateJsonProperties(firstLevelKeys[i], firstLevelValues[i], firstLevelKeys[i], false, adaptions) + ",";
        if (newStringComponent != undefined){
            liquidTemplateString += newStringComponent;
        }
    }
    var formattedLiquidTemplateString = '{'+liquidTemplateString.substring(0, liquidTemplateString.length - 1)+'}';
    console.log(formattedLiquidTemplateString)
    return formattedLiquidTemplateString;
}
//Need the full path for the array schema
//Need to replace the child array schema path with 'arrayItem'

const processLiquidTemplateJsonProperties = function (schemaKey, schemaValues, parentPath, isArraySchema, adaptions){
    var schemaType = typeof schemaValues;
    var isArr = Object.prototype.toString.call(schemaValues) == '[object Array]';

    //If the schema is an object, we need to prefix the properties with the outputKeys, values, and brackets.  We also need to recursively call this function to process the next level of properties
    if (schemaType == 'object' && !isArr){

        var schemaStringPrefix = JSON.stringify(schemaKey) + ":{";
        var schemaStringValue = "";
        var schemaStringSuffix = "}";

        var nextLevelKeys = Object.keys(schemaValues);
        var nextLevelValues = Object.values(schemaValues);
        for (var i = 0; i < nextLevelKeys.length; i++){
            schemaStringValue = processLiquidTemplateJsonProperties(nextLevelKeys[i], nextLevelValues[i], parentPath + '.' + nextLevelKeys[i], false, adaptions)
        }
        return schemaStringPrefix + schemaStringValue + schemaStringSuffix;

    } else if (schemaType == 'object' && isArr){

        var nextLevelKeys = Object.keys(schemaValues[0]);
        var nextLevelValues = Object.values(schemaValues[0]);
        var sampleTranslationForPathFormatting = []
        var parentPathVariable = parentPath + '[0]'
        for (i = 0; i < nextLevelKeys.length; i++){
            if (nextLevelValues[i].includes('}}') && nextLevelValues[i].includes(parentPathVariable)){
                sampleTranslationForPathFormatting.push(nextLevelValues[i])
            }
        }
        //Dotted path for Array path reference
        var dottedPathArray = sampleTranslationForPathFormatting[0].replace('[0]','').replace('{{','').replace('}}','').split('.')
        var removedDottedPathProperty = dottedPathArray.pop()
        var dottedPathString = dottedPathArray.join('.')
        
        //Dashed path for Array property variable
        var dashedPathArray = sampleTranslationForPathFormatting[0].replace('[0]','').replace('{{','').replace('}}','').split('.')
        var removedDashedPathProperty = dashedPathArray.pop();
        var fullDashedPathString = dashedPathArray.join('_')

        var schemaStringPrefix = JSON.stringify(schemaKey) + ":[{% for " + fullDashedPathString + " in " + dottedPathString + " %}{";
        var schemaStringValue = "";
        var schemaStringSuffix = "}{% endfor %}]";
        
        for (var i = 0; i < nextLevelKeys.length; i++){
            if(schemaStringValue.length == 0){
                schemaStringValue = processLiquidTemplateJsonProperties(nextLevelKeys[i], nextLevelValues[i], 'arrayItem', true, adaptions)
            } else{
                schemaStringValue = schemaStringValue + "," + processLiquidTemplateJsonProperties(nextLevelKeys[i], nextLevelValues[i], 'arrayItem', true, adaptions)
            }
            console.log(schemaStringValue)
        }   
        return schemaStringPrefix + schemaStringValue + schemaStringSuffix;
        
    } else { 
        var propertyType = "" 
        for (var i = 0; i < adaptions.length; i++){
            if (schemaValues == adaptions[i].formula.inputFormula){
                propertyType = adaptions[i].outputSchema.nodeData.type
            } 
        }

        if (propertyType == 'string') {
            if(isArraySchema){
                var schemaStringPrefix = JSON.stringify(schemaKey) + ":";
                var schemaStringValue = JSON.stringify(schemaValues);
                var splitFormulaArray = schemaStringValue.split('{{')
                var formattedSplitFormulaArray = [];
                for (var i = 0; i < splitFormulaArray.length; i++){
                    if (splitFormulaArray[i].includes('}}') && splitFormulaArray[i].includes('[0]')){
                        var dashedPath = splitFormulaArray[i].split('.')
                        var dottedPath = dashedPath.pop();
                        var fullDashedPath = dashedPath.join('_') + '.' + dottedPath
                        var formattedPath = fullDashedPath.replace('[0]','')
                        formattedSplitFormulaArray.push(formattedPath);
                    } else {
                        formattedSplitFormulaArray.push(splitFormulaArray[i]);
                    }
                }
    
                var formattedSchemaStringValue = formattedSplitFormulaArray.join('{{');
    
                return schemaStringPrefix + formattedSchemaStringValue;
    
            } else {
                var schemaStringPrefix = JSON.stringify(schemaKey) + ":";
                var schemaStringValue = JSON.stringify(schemaValues);
                
                return schemaStringPrefix + schemaStringValue;
            }
           
        } else if (propertyType == 'number' | propertyType == 'float' | propertyType == 'integer') {
            if(isArraySchema){
                var schemaStringPrefix = JSON.stringify(schemaKey) + ":";
                var schemaStringValue = schemaValues;
                var splitFormulaArray = schemaStringValue.split('{{')
                var formattedSplitFormulaArray = [];
                for (var i = 0; i < splitFormulaArray.length; i++){
                    if (splitFormulaArray[i].includes('}}') && splitFormulaArray[i].includes('[0]')){
                        var dashedPath = splitFormulaArray[i].split('.')
                        var dottedPath = dashedPath.pop();
                        var fullDashedPath = dashedPath.join('_') + '.' + dottedPath
                        var formattedPath = fullDashedPath.replace('[0]','')
                        formattedSplitFormulaArray.push(formattedPath);
                    } else {
                        formattedSplitFormulaArray.push(splitFormulaArray[i]);
                    }
                }
    
                var formattedSchemaStringValue = formattedSplitFormulaArray.join('{{');
    
                return schemaStringPrefix + formattedSchemaStringValue;
    
            } else{
                var schemaStringPrefix = JSON.stringify(schemaKey) + ":";
                var schemaStringValue = schemaValues;
                
                return schemaStringPrefix + schemaStringValue;
            }
            
    
        } else if (propertyType == 'boolean') {
            var schemaStringPrefix = JSON.stringify(schemaKey) + ":";
            var schemaStringValue = schemaValues;
            
            return schemaStringPrefix + schemaStringValue;
    
        } else {
            console.log("Property Type Not Handled: " + schemaType )
        }

    }
}



export {generateSchemaTree, generateSchemaList, generateParameterSchemaTree, generateLiquidTemplateString}