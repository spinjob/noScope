import React , {Component,useCallback, useContext, useEffect, useState } from 'react'
import '@blueprintjs/core/lib/css/blueprint.css';
import { useParams, useLocation } from "react-router-dom";
import { Tree, TreeNodeInfo, Classes as Popover2Classes, Icon, Card, ContextMenu, Tooltip2, H1, H2, H3, H4, H5, Divider, TreeNode, } from "@blueprintjs/core";
import { Select2 } from "@blueprintjs/select";
import { IconNames } from "@blueprintjs/icons";
import axios from "axios";
import _ from "lodash";
import Loader from '../Loader';
import {v4 as uuidv4} from 'uuid';

function ActionStepSchemaMapper ({mappings, schemaTree, selectActionNode, updateRequiredSchema, storeSchemaTree, parameterTrees}) {

    let { id, workflowId } = useParams();
    const location = useLocation();

    const [interfaces, setInterfaces] = useState(location.state.interfaces)
    const [interfaceSchemas, setInterfaceSchemas] = useState([])
    const [actionRequestSchemas, setActionRequestSchemas] = useState(schemaTree)
    const [actionParameterSchemas, setActionParameterSchemas] = useState(parameterTrees)
    const [workflow, setWorkflow] = useState(location.state.workflow)
    const [interfaceParameters, setInterfaceParameters] = useState([]);
    const [actionParameters, setActionParameters] = useState([]);
    const [selectedActionPath, setSelectedActionPath] = useState([])
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

    const handleNodeClick = useCallback((node, nodePath, e) => {

        if (node.icon && node.icon === "cube") {
        } else {
            console.log("Clicked node: ")
            console.log("node", node)
            console.log("nodePath", nodePath)
            
            if(node.isSelected){
                //CASE: Clicked node is already selected
                    if(selectedActionPath.length > 0 && selectedActionPath !== nodePath){
                        //CASE: Another node is selected
                        node.isSelected = false
                        selectActionNode(node, false)
                        setSelectedActionPath([])
                        setActionRequestSchemas(_.cloneDeep(schemaTree));

                    } else if (selectedActionPath.length > 0 && selectedActionPath === nodePath) {
                        //CASE: Clicked node is selected
                        node.isSelected = false
                        selectActionNode(node, false)
                        setSelectedActionPath([])
                        setActionRequestSchemas(_.cloneDeep(schemaTree));

                    } else if(selectedActionPath.length === 0) {
                        //CASE: No other node is selected
                        node.isSelected = false
                        selectActionNode(node, false)
                        setSelectedActionPath([])
                        setActionRequestSchemas(_.cloneDeep(schemaTree));

                    }
            } else if (node.isSelected === false | node.isSelected === undefined) {
                //CASE: Node is not selected

                    if(selectedActionPath.length > 0 && selectedActionPath !== nodePath){
                        //CASE: Another node is selected
                            node.isSelected = true
                            selectActionNode(node, true)
                            setSelectedActionPath(nodePath)
                            Tree.nodeFromPath(selectedActionPath, schemaTree).isSelected = false
                            setActionRequestSchemas(_.cloneDeep(schemaTree));
                            setActionRequestSchemas(_.cloneDeep(schemaTree));

                    } else if (selectedActionPath.length > 0 && selectedActionPath === nodePath) {
                        //CASE: Clicked node is thought to be selected. This is a bug. Set the Tree node to selected
                        node.isSelected = true
                        selectActionNode(node, true)
                        setSelectedActionPath(nodePath)
                        setActionRequestSchemas(_.cloneDeep(schemaTree));
                        
                    } else if(selectedActionPath.length === 0) {
                        //CASE: No other node is selected
                        node.isSelected = true
                        selectActionNode(node, true)
                        setSelectedActionPath(nodePath)
                        setActionRequestSchemas(_.cloneDeep(schemaTree));
                    }
                
            }
        }
    
        console.log("selectedActionPath: ", selectedActionPath)
        console.log("actionRequestSchemas: ", schemaTree)
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
        return !schemaTree ? (
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
                    onNodeClick={handleNodeClick}
                    onNodeCollapse={handleNodeCollapse}
                    onNodeExpand={handleNodeExpand}
                    style={{ width: 600 }}
                />
            </div>
            
        )
        

    })

    const renderParameterTree = useCallback((type) => {

        var headerTree = workflow.steps[0].request.parameterTree.header
        var pathTree = workflow.steps[0].request.parameterTree.path

        var headerTreeArray = []
        var pathTreeArray = []

        headerTreeArray.push(headerTree)
        pathTreeArray.push(pathTree)


        var capitalizedType = type.charAt(0).toUpperCase() + type.slice(1)

        if (type == "header") {

            return !headerTree ? (
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
                        contents={headerTreeArray}
                        className={Popover2Classes.ELEVATION_0}
                        onNodeClick={handleNodeClick}
                        onNodeCollapse={handleNodeCollapse}
                        onNodeExpand={handleNodeExpand}
                        style={{ width: 600 }}
                    />
                </div>
                
            )
        } else if (type == "path") {
            return !pathTree ? (
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
                        contents={pathTreeArray}
                        className={Popover2Classes.ELEVATION_0}
                        onNodeClick={handleNodeClick}
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
        if (actionRequestSchemas.length == 0 && schemaTree) {
            setActionRequestSchemas(schemaTree)
        }
      }, [actionRequestSchemas, setActionRequestSchemas])  

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
        </div>

 ) 

}
  
ActionStepSchemaMapper.defaultProps = {
    params: {
    }
  };


export default ActionStepSchemaMapper;