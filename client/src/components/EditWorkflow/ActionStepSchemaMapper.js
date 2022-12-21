import React , {Component,useCallback, useContext, useEffect, useState } from 'react'
import '@blueprintjs/core/lib/css/blueprint.css';
import { useParams, useLocation } from "react-router-dom";
import { Tree, Classes as Popover2Classes, Icon, Card, ContextMenu, Tooltip2, H1, H2, H3, H4, H5, Divider, } from "@blueprintjs/core";
import { Select2 } from "@blueprintjs/select";
import { IconNames } from "@blueprintjs/icons";
import axios from "axios";
import _ from "lodash";
import Loader from '../Loader';
import { hasTypescriptData } from '@blueprintjs/docs-theme/lib/esm/common/context';
import {v4 as uuidv4} from 'uuid';

function ActionStepSchemaMapper ({mappings, schemaTree, selectActionNode, updateRequiredSchema, storeSchemaTree}) {

    let { id, workflowId } = useParams();
    const location = useLocation();

    const [interfaces, setInterfaces] = useState(location.state.interfaces)
    const [interfaceSchemas, setInterfaceSchemas] = useState([])
    const [actionRequestSchemas, setActionRequestSchemas] = useState(schemaTree)
    const [workflow, setWorkflow] = useState(location.state.workflow)
    const [interfaceParameters, setInterfaceParameters] = useState([]);
    const [actionParameters, setActionParameters] = useState([]);
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
       if (mappings) {
        mappings.forEach((mapping) => {
            mappedOutputSchema.push(mapping.outputSchema.nodeData.fieldPath)
        })

        if (mappedOutputSchema.includes(nodeLabel)) {
            isDisabled = true
        } else {
            isDisabled = false
        }
        return isDisabled
       }
     
    })
    
    const processActionPathParameters = useCallback(() => {
        let firstStep = workflow.steps[0]
        let requiredParameters = [];
        if (!firstStep) {
            console.log("No first step")

        } else {
            
            if(firstStep.request.parameters) {
                const interfaceActionParameters = [];
                firstStep.request.parameters.forEach((parameter) => {
                    
                    interfaceParameters.forEach((interfaceParameter) => {
                    
                        if (parameter === interfaceParameter.parameter_name) {
                            if (!interfaceParameter.schemaReference){
                                const parameterObject = {
                                    id: interfaceParameter.uuid,
                                    label: lowercaseFirstLetter(interfaceParameter.name),
                                    icon: iconGenerator(interfaceParameter.type),
                                    nodeData: {
                                            type: interfaceParameter.type,
                                            description: interfaceParameter.description,
                                            uuid: interfaceParameter.uuid,
                                            parentInterface: interfaceParameter.parent_interface_uuid,
                                            parameter_type: interfaceParameter.parameter_type,
                                            required: interfaceParameter.required,
                                            fieldPath: interfaceParameter.parameter_type + "." + interfaceParameter.name,
                                    }
                                }
                                if (interfaceParameter.required) {
                                    requiredParameters.push(parameterObject)
                                }
                                interfaceActionParameters.push(parameterObject)
                            } else {
                                interfaceSchemas.forEach((interfaceSchema) => {
                                    if (interfaceParameter.schemaReference === interfaceSchema.name) {
                                        const parameterObject = {
                                            id: interfaceParameter.uuid,
                                            label: lowercaseFirstLetter(interfaceParameter.name),
                                            icon: iconGenerator(interfaceParameter.type),
                                            nodeData: {
                                                    type: interfaceSchema.type,
                                                    description: interfaceParameter.description,
                                                    uuid: interfaceParameter.uuid,
                                                    parentInterface: interfaceParameter.parent_interface_uuid,
                                                    parameter_type: interfaceParameter.parameter_type,
                                                    required: interfaceParameter.required,
                                                    fieldPath: interfaceParameter.parameter_type + "." + interfaceParameter.name,
                                            }
                                        }
                                        if (interfaceParameter.required) {
                                            requiredParameters.push(parameterObject)
                                        }
                                        interfaceActionParameters.push(parameterObject)
                                    }
                                })
                                
                            }
                           
                        } 
                    })
                })
                setActionParameters(interfaceActionParameters)
                updateRequiredSchema(requiredParameters)
            }
        }   
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
        if (interfaces) {
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
        }

    })

    const fetchWorkflow = useCallback(() => {

        axios.get(process.env.REACT_APP_API_ENDPOINT + "/projects/" + id + "/workflows/" + workflowId + "/details")
        .then(response => {
            setWorkflow(response.data[0])
            fetchInterfaceParameters(response.data[0].steps[0].request.parent_interface_uuid)
            return(response.data)
        })
        .catch(error => {
            console.log(error);
            return error
        })

    })

    const fetchInterfaceParameters = useCallback((interfaceId) => {
        
        axios.get(process.env.REACT_APP_API_ENDPOINT + "/interfaces/" + interfaceId + "/parameters")
        .then(response => {
            setInterfaceParameters(response.data)
            return(response.data)
        })
        .catch(error => {
            console.log(error);
            return error
        })

    })

    const renderRequestBodyTree = useCallback(() => {
    
        if (actionRequestSchemas) {
            
        }
        return !actionRequestSchemas ? (
            <div>
                <H5>Request Body Schema</H5>
                <Card>
                    <body style={{color: "grey"}}>
                        No Request Body
                    </body>
                </Card>
            </div>
        )
        : (
            <div>
                <H5>Request Body Schema</H5>
                <Tree
                    contents={schemaTree}
                    className={Popover2Classes.ELEVATION_0}
                    onNodeClick={handleActionNodeSelect}
                    onNodeCollapse={handleNodeCollapse}
                    onNodeExpand={handleNodeExpand}
                    style={{ width: 600 }}
                />
            </div>
            
        )
        

    })

    const renderParameterTree = useCallback((type) => {
        var nodes = [];
        var capitalizedType = type.charAt(0).toUpperCase() + type.slice(1)
        if (actionParameters) {
            actionParameters.forEach(node => {
                if (node.nodeData.parameter_type == type) {
                    nodes.push(node)
                }
            })
        }
        if (type == "header") {

            return nodes.length == 0 ? (
                <div>
                    <H5>{capitalizedType} Parameters</H5>
                    <Card> 
                        <body style={{color: "grey"}}>
                            No {capitalizedType} Parameters
                        </body>
                    </Card>
                </div>
            )
            : (
                <div>
                    <H5>Header Parameters</H5>
                    <Tree
                        contents={nodes}
                        className={Popover2Classes.ELEVATION_0}
                        onNodeClick={handleActionNodeSelect}
                        onNodeCollapse={handleNodeCollapse}
                        onNodeExpand={handleNodeExpand}
                        style={{ width: 600 }}
                    />
                </div>
                
            )
        } else if (type == "path") {
            return nodes.length == 0 ? (
                <div>
                    <H5>{capitalizedType} Parameters</H5>
                    <Card> 
                        <body style={{color: "grey"}}>
                            No {capitalizedType} Parameters
                        </body>
                    </Card>
                </div>
            )
            : (
                <div>
                    <H5>Path Parameters</H5>
                    <Tree
                        contents={nodes}
                        className={Popover2Classes.ELEVATION_0}
                        onNodeClick={handleActionNodeSelect}
                        onNodeCollapse={handleNodeCollapse}
                        onNodeExpand={handleNodeExpand}
                        style={{ width: 600 }}
                    />
                </div>
                
            )
        }

        
    })

    useEffect(() => {
        if (interfaceSchemas.length == 0 && interfaces) {
          fetchInterfaceSchemas();
        } 
      }, [])  
      
      useEffect(() => {
        if (!workflow) {
            fetchWorkflow();
        } else {
            fetchInterfaceParameters(workflow.steps[0].request.parent_interface_uuid)
        }
      }, [])  

      useEffect(() => {
        if (actionParameters.length == 0) {
            processActionPathParameters()
        } else {
           //console.log(actionRequestSchemas)
        }
      }, [actionParameters, processActionPathParameters])  


return !workflow ? (
        <Loader />
    )
    : !workflow.steps ? (
        <Loader />
    )
    : (
        <div class="ActionSchemaMapper">
            <H3>Action Request Schema</H3>
            <H4>{workflow.steps[0].request.method.toUpperCase() + " " + workflow.steps[0].request.path}</H4>
            <div style={{paddingBottom: 20, paddingTop: 20}}>
                {renderParameterTree("path")}   
            </div>
            <Divider />
            <div style={{paddingBottom: 20, paddingTop: 20}}>
                {renderParameterTree("header")}
            </div>
            <Divider />
            
            <div style={{paddingBottom: 20, paddingTop: 20}}>
                {renderRequestBodyTree()}
            </div>
            {/* <H5>Request Body Schema</H5>
            <Tree
                contents={actionRequestSchemas}
                className={Popover2Classes.ELEVATION_0}
                onNodeClick={handleActionNodeSelect}
                onNodeCollapse={handleNodeCollapse}
                onNodeExpand={handleNodeExpand}
                style={{ width: 600 }}
            /> */}
        </div>

 ) 

}
  
ActionStepSchemaMapper.defaultProps = {
    params: {
    }
  };


export default ActionStepSchemaMapper;