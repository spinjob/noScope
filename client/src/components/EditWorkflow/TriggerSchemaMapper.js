import React , {Component,useCallback, useContext, useEffect, useState } from 'react'
import '@blueprintjs/core/lib/css/blueprint.css';
import { useParams, useLocation } from "react-router-dom";
import { Tree, Classes as Popover2Classes, ContextMenu, Tooltip2, H1, H2, H3, H4, H5 } from "@blueprintjs/core";
import { Select2 } from "@blueprintjs/select";
import { IconNames } from "@blueprintjs/icons";
import axios from "axios";
import '@blueprintjs/core/lib/css/blueprint.css';
import _ from "lodash";
import Loader from '../Loader';
import { hasTypescriptData } from '@blueprintjs/docs-theme/lib/esm/common/context';
import {v4 as uuidv4} from 'uuid';

function TriggerSchemaMapper ({mappings, schemaTree, selectTriggerNode, storeTriggerSchema, storeSchemaTree}) {

    let { id, workflowId } = useParams();
    const location = useLocation();

    const [interfaces, setInterfaces] = useState(location.state.interfaces)
    const [interfaceSchemas, setInterfaceSchemas] = useState([])
    const [haveFetchInterfaceSchemas, setHaveFetchInterfaceSchemas] = useState(false)
    const [triggerRequestSchemas, setTriggerRequestSchemas] = useState(schemaTree)
    const [triggerResponseSchemas, setTriggerResponseSchemas] = useState([])
    const [actionRequestSchemas, setActionRequestSchemas] = useState([])
    const [workflow, setWorkflow] = useState(location.state.workflow)
    const [selected, setSelected] = useState(0)
    const requiredProperties = [];
    const webhook = workflow.trigger.webhook
    const fullPropertiesArray = [];
    const handleNodeExpand = useCallback((node) => {
        node.isExpanded = true
        setTriggerRequestSchemas(_.cloneDeep(triggerRequestSchemas));
    })

    const handleNodeCollapse = useCallback((node) => {
        node.isExpanded = false
        setTriggerRequestSchemas(_.cloneDeep(triggerRequestSchemas));

    })

    const handleTriggerNodeSelect = useCallback((node) => {
        //console.log(node)
        if (node.icon && node.icon === "cube") {} 
        else {
            if (selected == 0) {
                if (node.isSelected) {
                    node.isSelected = false
                    setSelected(0)
                    selectTriggerNode(node, false)
                } else {
                    node.isSelected = true
                    console.log(node)
                    setSelected(1)
                    selectTriggerNode(node, true)
                }
            } else {
                if (node.isSelected) {
                    node.isSelected = false
                    selectTriggerNode(node, false)
                    setSelected(0)
                } else {
                }
    
            }
         }
        setTriggerRequestSchemas(_.cloneDeep(triggerRequestSchemas));

    })

    // const processWebhookSchema = useCallback(() => {
    //     if (!webhook) {
    //         console.log("No Webhook")
    //     } else {

    //         if (!webhook.request_body && !webhook.responses){
    //            // console.log("No Webhook Schema")
    //             return []
    //         } else if (!webhook.request_body && webhook.responses) {
    //            // console.log("No Webhook Request Schema")
               
    //         } else if (!webhook.responses && webhook.request_body) {
    //             //console.log("No Webhook Response Schema")

    //         } else if (webhook.request_body && webhook.responses) {
    //             //console.log("Webhook Request and Response Schema")
    //             if (webhook.request_body.schema) {
    //                 const treeArray = [];

    //                 webhook.request_body.schema.forEach((schema) => {
    //                     if (interfaceSchemas.length == 0 && haveFetchInterfaceSchemas == false) {
    //                         console.log()
    //                         // fetchInterfaceSchemas();
    //                     } else {
    //                         interfaceSchemas[0].forEach((interfaceSchema) => {
    //                             if (schema === interfaceSchema.name) {
    //                                 const parentId = uuidv4();
    //                                 if (interfaceSchema.properties) {
    //                                     var propertyKeys = Object.keys(interfaceSchema.properties);
    //                                     var propertyValues = Object.values(interfaceSchema.properties);
    //                                     var properties = processProperties(propertyKeys, propertyValues, lowercaseFirstLetter(interfaceSchema.name))
    
    //                                     const parentObject = {
    //                                         id: parentId,
    //                                         label: lowercaseFirstLetter(interfaceSchema.name),
    //                                         icon: 'cube',
    //                                         childNodes: properties,
    //                                         isExpanded: true,
    //                                         nodeData: {
    //                                             fieldPath: lowercaseFirstLetter(interfaceSchema.name),
    //                                             schema: interfaceSchema
    //                                         }
    //                                     }
    //                                     treeArray.push(parentObject)
    //                                 } else {
    
    //                                     const parentObject = {
    //                                         id: parentId,
    //                                         label: lowercaseFirstLetter(interfaceSchema.name),
    //                                         icon: 'cube'
    //                                     }
    //                                     treeArray.push(parentObject)
    //                                 }
                                    
    //                             }
    //                             else {}
    //                         })
    //                     }


    //                 })
    //                 setTriggerRequestSchemas(treeArray)
    //                 // storeSchemaTree("trigger", treeArray)

    //             }
                
    //         }
    //     }
       

    // })
    // const processProperties = useCallback((propertyKeys, propertyValues, parentInterfacePath) => {

    //     const propertiesArray = [];
    //     const keyArray = [];

    //     for (var i = 0; i < propertyKeys.length; ++i) {
    //         const propertyID = uuidv4();
    //         //console.log(propertyKeys[i] + " " + parentInterface)
            
    //         if (!propertyValues[i]["$ref"] && !propertyValues[i].additionalProperties && !propertyValues[i].items) {

    //             if (propertyValues[i].required === true) {
    //                 //Required Trigger Property Node
                    
    //                 const propertyObject = {
    //                     id: propertyID,
    //                     label:propertyKeys[i]  ,
    //                     icon: iconGenerator(propertyValues[i].type, propertyValues[i].required),
    //                     disabled: processNodeStatus(parentInterfacePath + "." + propertyKeys[i]),
    //                     nodeData: {
    //                         type: propertyValues[i].type,
    //                         description: propertyValues[i].description,
    //                         uuid: propertyValues[i].uuid,
    //                         parentInterface: propertyValues[i].parent_interface_uuid,
    //                         fieldPath: lowercaseFirstLetter(parentInterfacePath) + "." + lowercaseFirstLetter(propertyKeys[i]),
    //                         required: propertyValues[i].required
    //                     }   
    //                 }
    //                 propertiesArray.push(propertyObject)
    //                 fullPropertiesArray.push(propertyObject)
    //                 requiredProperties.push(propertyObject)
    //             } else {
    //                 //Optional Trigger Property Node
    //                 const propertyObject = {
    //                     id: propertyID,
    //                     label: propertyKeys[i],
    //                     disabled: processNodeStatus(parentInterfacePath + "." + propertyKeys[i]),
    //                     icon: iconGenerator(propertyValues[i].type, propertyValues[i].required),
    //                     nodeData: {
    //                         type: propertyValues[i].type,
    //                         description: propertyValues[i].description,
    //                         uuid: propertyValues[i].uuid,
    //                         parentInterface: propertyValues[i].parent_interface_uuid,
    //                         fieldPath: lowercaseFirstLetter(parentInterfacePath) + "." + lowercaseFirstLetter(propertyKeys[i]),
    //                         required: propertyValues[i].required
    //                     }   
    //                 }
    //                 propertiesArray.push(propertyObject)
    //                 fullPropertiesArray.push(propertyObject)

    //             }
    //         } else if (propertyValues[i]["$ref"]){ 
    //             const ref = propertyValues[i]["$ref"]
    //             const referenceArray = ref.split("/")
    //             var schema = referenceArray[3]
    //             if (keyArray.includes(schema)) {
    //                 //duplicate schema skipped
    //             } else if (interfaceSchemas[0].length > 0) {
    //                 keyArray.push(schema)
    //                 interfaceSchemas[0].forEach((interfaceSchema) => {
    //                     if (schema === interfaceSchema.name) {
    //                         const parentId = uuidv4();
    
    //                         if (interfaceSchema.properties) {
    
    //                             var propertyKeys = Object.keys(interfaceSchema.properties);
    //                             var propertyValues = Object.values(interfaceSchema.properties);
    //                             var propertyPath = lowercaseFirstLetter(parentInterfacePath) + "." + lowercaseFirstLetter(interfaceSchema.name)
                                
    //                             const parentObject = {
    //                                 id: parentId,
    //                                 label: lowercaseFirstLetter(interfaceSchema.name),
    //                                 icon: 'cube',
    //                                 isExpanded: true,
    //                                 childNodes: processProperties(propertyKeys, propertyValues, propertyPath),
    //                                 nodeData: {
    //                                     schema: interfaceSchema
    //                                 }
    //                             }
    //                             propertiesArray.push(parentObject)
    
    //                         } else {
    //                             const parentObject = {
    //                                 id: parentId,
    //                                 label: lowercaseFirstLetter(interfaceSchema.name),
    //                                 icon: 'cube',
    //                                 isExpanded: true,
    //                                 nodedata: {
    //                                     schema: interfaceSchema
    //                                 }
    //                             }
    //                             propertiesArray.push(parentObject)
    
    //                         }
    
    //             }
    //             else {}
                
    //         })
                    
    //             }
    
    //         } else if (propertyValues[i]["additionalProperties"]) {
    //             const additionalProperties = {
    //                 [propertyValues[i].additionalProperties["x-additionalPropertiesName"]]: {
    //                     "$ref": propertyValues[i].additionalProperties["$ref"]
    //                 }
    //             }

    //             const parentId = uuidv4();
    //             const additionalPropertyKeys = Object.keys(additionalProperties);
    //             const additionalPropertyValues = Object.values(additionalProperties);
    //             const propertyPath = lowercaseFirstLetter(parentInterfacePath) + "." + lowercaseFirstLetter(propertyKeys[i])
    //             const parentObject = {
    //                 id: parentId,
    //                 label: lowercaseFirstLetter(propertyKeys[i]),
    //                 icon: 'cube',
    //                 isExpanded: true,
    //                 childNodes: processProperties(additionalPropertyKeys, additionalPropertyValues,propertyPath),
    //                 nodeData: {
    //                     description: propertyValues[i].description,
    //                     type: propertyValues[i].type,
    //                     uuid: propertyValues[i].uuid,
    //                     fieldPath: propertyPath
    //                 }
    //             }
                
    //             propertiesArray.push(parentObject)
            
    //         } else if (propertyValues[i]["items"]) {
    //          //Processing Array Properties
    //          // First check is if the items property is a reference to another schema
    //          // If it is, we need to find the schema and process it's properties
    //          // If it is not, we need to process the items property as an "inline" schema...which will be named as such.

    //             if (propertyValues[i]["items"]["$ref"]) {
    //                 const arrayItemSchema = propertyValues[i].items
    //                 const parentId = uuidv4();
    //                 const itemsKey = Object.keys(arrayItemSchema);
    //                 const itemsValue = Object.values(arrayItemSchema);
    //                 var refArray = itemsValue[0].split("/")
    //                 var refSchema = refArray[refArray.length-1]
    //                 const propertyPath = lowercaseFirstLetter(parentInterfacePath) + "." + (propertyKeys[i])
    //                 const arrayItems = []
                   
    //                 interfaceSchemas[0].forEach((interfaceSchema) => {
    //                     var properties = []

    //                     if (refSchema === interfaceSchema.name) {
    //                         if (!interfaceSchema.properties) {
    //                             const arrayItem = {
    //                                 id: parentId,
    //                                 description: interfaceSchema.description,
    //                                 label: lowercaseFirstLetter(interfaceSchema.name),
    //                                 icon: iconGenerator(interfaceSchema.type),
    //                                 childNodes: properties,
    //                                 isExpanded: true,
    //                                 nodeData: {
    //                                     type: interfaceSchema.type,
    //                                     uuid: propertyValues[i].uuid,
    //                                     fieldPath: propertyPath
    //                                 }
    //                             }
    //                             arrayItems.push(arrayItem)
    //                         } else if (interfaceSchema.name == "ItemModifier") {
    //                             const arrayItem = {
    //                                 id: parentId,
    //                                 description: interfaceSchema.description,
    //                                 label: lowercaseFirstLetter(interfaceSchema.name),
    //                                 icon: iconGenerator(interfaceSchema.type),
    //                                 isExpanded: true,
    //                                 nodeData: {
    //                                     type: interfaceSchema.type,
    //                                    // uuid: propertyValues[i].uuid,
    //                                     fieldPath: propertyPath
    //                                 }
    //                             }
    //                             arrayItems.push(arrayItem)

    //                         } else {
    //                             var propertyKeys = Object.keys(interfaceSchema.properties);
    //                             var propertyValues = Object.values(interfaceSchema.properties);
    //                             const arrayItem = {
    //                                 id: parentId,
    //                                 description: interfaceSchema.description,
    //                                 label: lowercaseFirstLetter(interfaceSchema.name),
    //                                 icon: iconGenerator(interfaceSchema.type),
    //                                 childNodes: processProperties(propertyKeys, propertyValues, lowercaseFirstLetter(interfaceSchema.name)),
    //                                 isExpanded: true,
    //                                 nodeData: {
    //                                     type: interfaceSchema.type,
    //                                     fieldPath: propertyPath
    //                                 }
    //                             }
    //                             arrayItems.push(arrayItem)
    //                         }
                        
                            
    //                     }
    //                     else {}
    //                 })

    //                     const parentObject = {
    //                         id: parentId,
    //                         label: lowercaseFirstLetter(propertyKeys[i]),
    //                         icon: iconGenerator(propertyValues[i].type),
    //                         isExpanded: true,
    //                         childNodes: arrayItems,
    //                         nodeData: {
    //                             description: propertyValues[i].description,
    //                             type: propertyValues[i].type,
    //                             uuid: propertyValues[i].uuid,
    //                             fieldPath: propertyPath,
    //                             items: arrayItems
    //                         }
    //                     }
    //                     propertiesArray.push(parentObject)
              
                   

    //             } else if (propertyValues[i]["items"]["properties"]) {
    //                 const arrayItemSchema = propertyValues[i].items.properties
    //                 const parentId = uuidv4();
    //                 const propertyPath = parentInterfacePath + "." + propertyKeys[i]
    //                 const parentObject = {
    //                     id: parentId,
    //                     label: lowercaseFirstLetter(propertyKeys[i]),
    //                     icon: iconGenerator(propertyValues[i].type),
    //                     isExpanded: true,
    //                     nodeData: {
    //                         description: propertyValues[i].description,
    //                         type: propertyValues[i].type,
    //                         uuid: propertyValues[i].uuid,
    //                         fieldPath: propertyPath,
    //                         items: propertyValues[i].items
    //                     }
    //                 }
    //                 propertiesArray.push(parentObject)

    //             } else {
    //                 const parentId = uuidv4();
    //                 const propertyPath = parentInterfacePath + "." + propertyKeys[i]
    //                 const childNode = {
    //                     id: uuidv4(),
    //                     label: "inlineSchema",
    //                     icon: iconGenerator(propertyValues[i].items.type),
    //                     nodeData: {
    //                         description: propertyValues[i].items.description,
    //                         type: propertyValues[i].items.type,
    //                         uuid: propertyValues[i].uuid,
    //                         fieldPath: propertyPath
    //                     }
    //                 }
    //                 const childNodes = [childNode]
    //                 const parentObject = {
    //                     id: parentId,
    //                     label: lowercaseFirstLetter(propertyKeys[i]),
    //                     icon: iconGenerator(propertyValues[i].type),
    //                     isExpanded: true,
    //                     childNodes: childNodes,
    //                     nodeData: {
    //                         description: propertyValues[i].description,
    //                         type: propertyValues[i].type,
    //                         uuid: propertyValues[i].uuid,
    //                         fieldPath: propertyPath,
    //                         items: propertyValues[i].items
    //                     }
    //                 }
    //                 propertiesArray.push(parentObject)
    //             }
                
    //         }

    //     }
    //     storeTriggerSchema(fullPropertiesArray)
    //     return propertiesArray
    // })

    const processNodeStatus = useCallback((nodeLabel) => {
        var isDisabled = false
        var mappedOutputSchema = []
        if (mappings) {
            mappings.forEach((mapping) => {
                mappedOutputSchema.push(mapping.inputSchema.nodeData.fieldPath)
            })
    
            if (mappedOutputSchema.includes(nodeLabel)) {
                isDisabled = true
            } else {
                isDisabled = false
            }
            return isDisabled
        }
        
     })

    const iconGenerator = (type) => {
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


function lowercaseFirstLetter(string) {
    return string.charAt(0).toLowerCase() + string.slice(1);
  }

   
const fetchInterfaceSchemas = useCallback(() => {

    interfaces.forEach(element => {
        axios.get(process.env.REACT_APP_API_ENDPOINT + "/interfaces/" + element + "/objects")
        .then(response => {
            setInterfaceSchemas([...interfaceSchemas, response.data])
            return(response.data)
        })
        .catch(error => {
            console.log(error);
            return error
        })
    });

})


    const fetchWorkflow = useCallback(() => {

        axios.get(process.env.REACT_APP_API_ENDPOINT + "/projects/" + id + "/workflows/" + workflowId + "/details")
        .then(response => {
            setWorkflow(response.data[0])
            return(response.data)
        })
        .catch(error => {
            console.log(error);
            return error
        })

    })

    useEffect(() => {
        if (interfaceSchemas.length === 0 && interfaces.length > 0) {
          fetchInterfaceSchemas();
        } 
      }, [])   
      
      useEffect(() => {
        if (!workflow) {
            fetchWorkflow();
            console.log("fetching workflow")
        } else {
            //console.log(workflow)
        }
      }, [])  


    //   useEffect(() => {
    //     if (triggerRequestSchemas.length == 0) {
    //         processWebhookSchema()
    //     } else {
    //        //console.log(actionRequestSchemas)
    //     }
    //   }, [triggerRequestSchemas, processWebhookSchema])  



return !workflow ? (
        <Loader />
    )
    : workflow.steps.length == 0 ? (
        <Loader />
    )
    : interfaceSchemas.length == 0 ? (
        <Loader />
    )
    :(
        <div class="TriggerSchemaMapper">
            <div style={{paddingBottom: 20}}>
                <H3>Webhook Schema</H3>
                <H4>{workflow.trigger.webhook.name}</H4>
            </div>
            <Tree
                contents={schemaTree}
                className={Popover2Classes.ELEVATION_0}
                onNodeClick={handleTriggerNodeSelect}
                onNodeCollapse={handleNodeCollapse}
                onNodeExpand={handleNodeExpand}
                style={{ width: 600 }}
            />
        </div>
 ) 

}
  
TriggerSchemaMapper.defaultProps = {
    params: {
    }
  };


export default TriggerSchemaMapper;