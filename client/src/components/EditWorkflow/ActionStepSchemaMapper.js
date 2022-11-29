import React , {Component,useCallback, useContext, useEffect, useState } from 'react'
import '@blueprintjs/core/lib/css/blueprint.css';
import { useParams, useLocation } from "react-router-dom";
import { Tree, Classes as Popover2Classes, Icon, ContextMenu, Tooltip2, H1, H2, H3, H4, H5, } from "@blueprintjs/core";
import { Select2 } from "@blueprintjs/select";
import { IconNames } from "@blueprintjs/icons";
import axios from "axios";
import _ from "lodash";
import Loader from '../Loader';
import { hasTypescriptData } from '@blueprintjs/docs-theme/lib/esm/common/context';
import {v4 as uuidv4} from 'uuid';

function ActionStepSchemaMapper ({mappings, selectActionNode, updateRequiredSchema}) {

    let { id, workflowId } = useParams();
    const location = useLocation();

    const [interfaces, setInterfaces] = useState(location.state.interfaces)
    const [interfaceSchemas, setInterfaceSchemas] = useState([])
    const [actionRequestSchemas, setActionRequestSchemas] = useState([])
    const [workflow, setWorkflow] = useState(location.state.workflow)
    const [actionResponseSchemas, setActionResponseSchemas] = useState([])
    const [selected, setSelected] = useState(0)
    const requiredProperties = [];

    const handleNodeExpand = useCallback((node) => {
        node.isExpanded = true
        setActionRequestSchemas(_.cloneDeep(actionRequestSchemas));
    
    })

   function lowercaseFirstLetter(string) {
    return string.charAt(0).toLowerCase() + string.slice(1);
  }
  

    const handleNodeCollapse = useCallback((node) => {
        node.isExpanded = false
        setActionRequestSchemas(_.cloneDeep(actionRequestSchemas));

    })

    const handleActionNodeSelect = useCallback((node) => {
        if (node.icon && node.icon === "cube") {} 
        else {
            if (selected == 0) {
                if (node.isSelected) {
                    node.isSelected = false
                    setSelected(0)
                    selectActionNode(node, false)
                } else {
                    node.isSelected = true
                    setSelected(1)
                    selectActionNode(node, true)
                }
            } else {
                if (node.isSelected) {
                    node.isSelected = false
                    setSelected(0)
                    selectActionNode(node, false)
                } else {
                }
    
            }
         }
        setActionRequestSchemas(_.cloneDeep(actionRequestSchemas));

    })
    

    const processNodeStatus = useCallback((nodeLabel) => {
       var isDisabled = false
       var mappedOutputSchema = []
        mappings.forEach((mapping) => {
            mappedOutputSchema.push(mapping.outputSchema.nodeData.fieldPath)
        })

        if (mappedOutputSchema.includes(nodeLabel)) {
            isDisabled = true
        } else {
            isDisabled = false
        }
        return isDisabled
    })

    const processActionSchema = useCallback(() => {
        let firstStep = workflow.steps[0]
        if (!firstStep) {
            console.log("No first step")
        } else {
            if(firstStep.request.method === "get") {
                console.log("GET method")

            } else if (firstStep.request.method == "post"||"put") {
                //console.log("POST or PUT method")

                if (firstStep.request.request_body.schema.length > 0) {
                        const treeArray = [];
                        firstStep.request.request_body.schema.forEach((requestSchema) => {
                            interfaceSchemas.forEach((interfaceSchema) => {
                                interfaceSchema.forEach((schema) => {
                                    if (requestSchema === schema.name) {
                                        //console.log("Match Found" + schema.name)
                                        const parentId = uuidv4();
                                        if (schema.properties) {
                                            var propertyKeys = Object.keys(schema.properties);
                                            var propertyValues = Object.values(schema.properties);
                                            var parentSchema = schema.name
                                            var properties = processProperties(propertyKeys, propertyValues, parentSchema)
        
                                            const parentObject = {
                                                id: parentId,
                                                label: lowercaseFirstLetter(schema.name),
                                                icon: 'cube',
                                                childNodes: properties,
                                                isExpanded: true,
                                                nodeData: {
                                                        type: schema.type,
                                                        description: schema.description,
                                                        uuid: schema.uuid,
                                                        parentInterface: schema.parent_interface_uuid,
                                                }
                                            }
        
                                            treeArray.push(parentObject)
                                        } else {
        
                                            const parentObject = {
                                                id: parentId,
                                                label: lowercaseFirstLetter(schema.name),
                                                icon: 'cube',
                                                nodeData: {
                                                        type: schema.type,
                                                        description: schema.description,
                                                        uuid: schema.uuid,
                                                        parentInterface: schema.parent_interface_uuid
                                                }
                                            }
                                            treeArray.push(parentObject)
                                        }
                                        
                                    }
                                    else {}
                                })

                            })
                        }
                    )
                    setActionRequestSchemas(treeArray)

                }

            } 
        }

    })

    const processProperties = useCallback((propertyKeys, propertyValues, parentSchema) => {

        const propertiesArray = [];
        const keyArray = [];

        for (var i = 0; i < propertyKeys.length; ++i) {
            const propertyID = uuidv4();
            if (!propertyValues[i]["$ref"] && !propertyValues[i].additionalProperties && !propertyValues[i].items) {
                if (propertyValues[i].required === true) {
                    //Required Action Property Node
                    
                    const propertyObject = {
                        id: propertyID,
                        label:propertyKeys[i]  ,
                        icon: iconGenerator(propertyValues[i].type, propertyValues[i].required),
                        disabled: processNodeStatus(parentSchema + "." + propertyKeys[i]),
                        nodeData: {
                            type: propertyValues[i].type,
                            description: propertyValues[i].description,
                            uuid: propertyValues[i].uuid,
                            parentInterface: propertyValues[i].parent_interface_uuid,
                            fieldPath: lowercaseFirstLetter(parentSchema) + "." + lowercaseFirstLetter(propertyKeys[i]),
                            required: propertyValues[i].required
                        }   
                    }
                    propertiesArray.push(propertyObject)
                    requiredProperties.push(propertyObject)
                } else {
                    //Optional Action Property Node
                    const propertyObject = {
                        id: propertyID,
                        label: propertyKeys[i],
                        disabled: processNodeStatus(parentSchema + "." + propertyKeys[i]),
                        icon: iconGenerator(propertyValues[i].type, propertyValues[i].required),
                        nodeData: {
                            type: propertyValues[i].type,
                            description: propertyValues[i].description,
                            uuid: propertyValues[i].uuid,
                            parentInterface: propertyValues[i].parent_interface_uuid,
                            fieldPath: lowercaseFirstLetter(parentSchema) + "." + lowercaseFirstLetter(propertyKeys[i]),
                            required: propertyValues[i].required
                        }   
                    }
                    propertiesArray.push(propertyObject)

                }
            } else if (propertyValues[i]["$ref"]){ 
                const ref = propertyValues[i]["$ref"]
                const referenceArray = ref.split("/")
                var schema = referenceArray[3]
                if (keyArray.includes(schema)) {
                    //duplicate schema skipped
                } else {
                    keyArray.push(schema)
                    interfaceSchemas[0].forEach((interfaceSchema) => {
                        if (schema === interfaceSchema.name) {
                            const parentId = uuidv4();
    
                            if (interfaceSchema.properties) {
    
                                var propertyKeys = Object.keys(interfaceSchema.properties);
                                var propertyValues = Object.values(interfaceSchema.properties);
                                var fieldPath = lowercaseFirstLetter(parentSchema) + "." + lowercaseFirstLetter(interfaceSchema.name)
                                
                                const parentObject = {
                                    id: parentId,
                                    label: lowercaseFirstLetter(interfaceSchema.name),
                                    icon: 'cube',
                                    isExpanded: true,
                                    childNodes: processProperties(propertyKeys, propertyValues, fieldPath),
                                    nodeData: {
                                            type: interfaceSchema.type,
                                            description: interfaceSchema.description,
                                            uuid: interfaceSchema.uuid,
                                            parentInterface: interfaceSchema.parent_interface_uuid
                                    }
                                }
                                propertiesArray.push(parentObject)
    
                            } else {
                                const parentObject = {
                                    id: parentId,
                                    label: lowercaseFirstLetter(interfaceSchema.name),
                                    icon: 'cube',
                                    isExpanded: true,
                                    nodeData: {
                                            type: interfaceSchema.type,
                                            description: interfaceSchema.description,
                                            uuid: interfaceSchema.uuid,
                                            parentInterface: interfaceSchema.parent_interface_uuid
                                    }
                                }
                                propertiesArray.push(parentObject)
                               
    
                            }
    
                }
                else {}
                
            })
                    
                }
    
            } else if (propertyValues[i]["additionalProperties"]) {

                const additionalProperties = {
                    [propertyValues[i].additionalProperties["x-additionalPropertiesName"]]: {
                        "$ref": propertyValues[i].additionalProperties["$ref"]
                    }
                }
                const parentId = uuidv4();
                const additionalPropertyKeys = Object.keys(additionalProperties);
                const additionalPropertyValues = Object.values(additionalProperties);
                const fieldPath = lowercaseFirstLetter(parentSchema) + "." + lowercaseFirstLetter(propertyKeys[i])
                const parentObject = {
                    id: parentId,
                    label: lowercaseFirstLetter(propertyKeys[i]),
                    icon: 'cube',
                    isExpanded: true,
                    childNodes: processProperties(additionalPropertyKeys, additionalPropertyValues, fieldPath),
                    nodeData: {
                            type: propertyValues[i].type,
                            description: propertyValues[i].description,
                            uuid: propertyValues[i].uuid,
                            parentInterface: propertyValues[i].parent_interface_uuid
                    }
                }
                
                propertiesArray.push(parentObject)
            
            } else if (propertyValues[i]["items"]) {
                //Processing Array Properties
                // First check is if the items property is a reference to another schema
                // If it is, we need to find the schema and process it's properties
                // If it is not, we need to process the items property as an "inline" schema...which will be named as such.
                console.log(propertyValues[i])
                   if (propertyValues[i]["items"]["$ref"]) {
                       const arrayItemSchema = propertyValues[i].items
                       const parentId = uuidv4();
                       const itemsKey = Object.keys(arrayItemSchema);
                       const itemsValue = Object.values(arrayItemSchema);
                       var refArray = itemsValue[0].split("/")
                       var refSchema = refArray[refArray.length-1]
                       const propertyPath = lowercaseFirstLetter(parentSchema) + "." + lowercaseFirstLetter(propertyKeys[i])
                       const arrayItems = []
                      
                       interfaceSchemas[0].forEach((interfaceSchema) => {
                           var properties = []
   
                           if (refSchema === interfaceSchema.name) {
                               if (!interfaceSchema.properties) {
                                   console.log("No properties")
                                   const arrayItem = {
                                       id: parentId,
                                       description: interfaceSchema.description,
                                       label: lowercaseFirstLetter(interfaceSchema.name),
                                       icon: iconGenerator(interfaceSchema.type),
                                       childNodes: properties,
                                       isExpanded: true,
                                       nodeData: {
                                           type: interfaceSchema.type,
                                           uuid: propertyValues[i].uuid,
                                           fieldPath: propertyPath
                                       }
                                   }
                                   arrayItems.push(arrayItem)
                               } else if (interfaceSchema.name == "ItemModifier") {
                                   const arrayItem = {
                                       id: parentId,
                                       description: interfaceSchema.description,
                                       label: lowercaseFirstLetter(interfaceSchema.name),
                                       icon: iconGenerator(interfaceSchema.type),
                                       isExpanded: true,
                                       nodeData: {
                                           type: interfaceSchema.type,
                                          // uuid: propertyValues[i].uuid,
                                           fieldPath: propertyPath
                                       }
                                   }
                                   arrayItems.push(arrayItem)
   
                               } else {
                                   var propertyKeys = Object.keys(interfaceSchema.properties);
                                   var propertyValues = Object.values(interfaceSchema.properties);
                                   console.log(propertyKeys, propertyValues)
                                   const arrayItem = {
                                       id: parentId,
                                       description: interfaceSchema.description,
                                       label: lowercaseFirstLetter(interfaceSchema.name),
                                       icon: iconGenerator(interfaceSchema.type),
                                       childNodes: processProperties(propertyKeys, propertyValues, interfaceSchema.name),
                                       isExpanded: true,
                                       nodeData: {
                                           type: interfaceSchema.type,
                                           fieldPath: propertyPath
                                       }
                                   }
                                   arrayItems.push(arrayItem)
                               }
                           
                               
                           }
                           else {}
                       })
   
                           const parentObject = {
                               id: parentId,
                               label: lowercaseFirstLetter(propertyKeys[i]),
                               icon: iconGenerator(propertyValues[i].type),
                               isExpanded: true,
                               childNodes: arrayItems,
                               nodeData: {
                                   description: propertyValues[i].description,
                                   type: propertyValues[i].type,
                                   uuid: propertyValues[i].uuid,
                                   fieldPath: propertyPath,
                                   items: arrayItems
                               }
                           }
                           propertiesArray.push(parentObject)
                 
                   } else if (propertyValues[i]["items"]["properties"]) {
                       const parentId = uuidv4();
                       const propertyPath = lowercaseFirstLetter(parentSchema) + "." + lowercaseFirstLetter(propertyKeys[i])
                       const parentObject = {
                           id: parentId,
                           label:lowercaseFirstLetter(propertyKeys[i]),
                           icon: iconGenerator(propertyValues[i].type),
                           isExpanded: true,
                           nodeData: {
                               description: propertyValues[i].description,
                               type: propertyValues[i].type,
                               uuid: propertyValues[i].uuid,
                               fieldPath: propertyPath,
                               items: propertyValues[i].items
                           }
                       }
                       propertiesArray.push(parentObject)
   
                   } else {
                       const parentId = uuidv4();
                       const propertyPath = lowercaseFirstLetter(parentSchema) + "." + lowercaseFirstLetter(propertyKeys[i])
                       const childNode = {
                           id: uuidv4(),
                           label: "inlineSchema",
                           icon: iconGenerator(propertyValues[i].items.type),
                           nodeData: {
                               description: propertyValues[i].items.description,
                               type: propertyValues[i].items.type,
                               uuid: propertyValues[i].uuid,
                               fieldPath: propertyPath
                           }
                       }
                       const childNodes = [childNode]
                       const parentObject = {
                           id: parentId,
                           label: lowercaseFirstLetter(propertyKeys[i]),
                           icon: iconGenerator(propertyValues[i].type),
                           isExpanded: true,
                           childNodes: childNodes,
                           nodeData: {
                               description: propertyValues[i].description,
                               type: propertyValues[i].type,
                               uuid: propertyValues[i].uuid,
                               fieldPath: propertyPath,
                               items: propertyValues[i].items
                           }
                       }
                       propertiesArray.push(parentObject)
                   }
                   
               }

        }
        updateRequiredSchema(requiredProperties)
        return propertiesArray
    })

    const iconGenerator = (type, required) => {
        var iconColor = 'gray'

        if (required === true) {
            iconColor = 'red'
        }
        switch (type) {
            case "string":
                return <Icon icon="citation" color={iconColor} style={{paddingRight: '10'}}/>
            case "integer":
                return <Icon icon="numerical" color={iconColor}/> 
            case "number":
                return <Icon icon="numerical" color={iconColor}/> 
            case "float":
                return <Icon icon="floating-point" color={iconColor}/>                
            case "boolean":
                return <Icon icon="segmented-control" color={iconColor}/>      
            case "array":
                return  <Icon icon="array" color={iconColor}/>   
            case "object":
                return <Icon icon= "cube" color={iconColor}/>   
            default: 
                return<Icon icon= "symbol-circle" color={iconColor}/>   
        }
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
            processActionSchema()
            return(response.data)
        })
        .catch(error => {
            console.log(error);
            return error
        })

    })

    useEffect(() => {
        if (interfaceSchemas.length === 0) {
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
      }, [workflow, fetchWorkflow])  

      useEffect(() => {
        if (actionRequestSchemas.length == 0) {
            processActionSchema()
        } else {
           //console.log(actionRequestSchemas)
        }
      }, [actionRequestSchemas, processActionSchema])  


return !workflow ? (
        <Loader />
    )
    : workflow.steps.length == 0 ? (
        <Loader />
    )
    : actionRequestSchemas.length == 0 ? (
        <Loader />
    )
    :(
        <div class="ActionSchemaMapper">
            <H3>Action Request Schema</H3>
            <Tree
                contents={actionRequestSchemas}
                className={Popover2Classes.ELEVATION_0}
                onNodeClick={handleActionNodeSelect}
                onNodeCollapse={handleNodeCollapse}
                onNodeExpand={handleNodeExpand}
                style={{ width: 600 }}
            />
        </div>

 ) 

}
  
ActionStepSchemaMapper.defaultProps = {
    params: {
    }
  };


export default ActionStepSchemaMapper;