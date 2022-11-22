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
                                                label: schema.name,
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
                                                label: schema.name,
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
            if (!propertyValues[i]["$ref"] && !propertyValues[i].additionalProperties) {
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
                            fieldPath: parentSchema + "." + propertyKeys[i],
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
                            fieldPath: parentSchema + "." + propertyKeys[i],
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
                                var fieldPath = parentSchema + "." + interfaceSchema.name
                                
                                const parentObject = {
                                    id: parentId,
                                    label: interfaceSchema.name,
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
                                    label: interfaceSchema.name,
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
                const fieldPath = parentSchema + "." + propertyKeys[i]
                const parentObject = {
                    id: parentId,
                    label: propertyKeys[i],
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