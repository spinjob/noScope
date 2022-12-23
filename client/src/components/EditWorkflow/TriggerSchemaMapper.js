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
    const [selectedTriggerPath, setSelectedTriggerPath] = useState([])
    const [triggerResponseSchemas, setTriggerResponseSchemas] = useState([])
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
    const handleNodeClick = useCallback((node, nodePath, e) => {

        if (node.icon && node.icon === "cube") {
        } else {
            console.log("Clicked node: ")
            console.log("node", node)
            console.log("nodePath", nodePath)
            
            if(node.isSelected){
                //CASE: Clicked node is already selected
                    if(selectedTriggerPath.length > 0 && selectedTriggerPath !== nodePath){
                        //CASE: Another node is selected
                        node.isSelected = false
                        selectTriggerNode(node, false)
                        setSelectedTriggerPath([])
                        setTriggerRequestSchemas(_.cloneDeep(schemaTree));

                    } else if (selectedTriggerPath.length > 0 && selectedTriggerPath === nodePath) {
                        //CASE: Clicked node is selected
                        node.isSelected = false
                        selectTriggerNode(node, false)
                        setSelectedTriggerPath([])
                        setTriggerRequestSchemas(_.cloneDeep(schemaTree));

                    } else if(selectedTriggerPath.length === 0) {
                        //CASE: No other node is selected
                        node.isSelected = false
                        selectTriggerNode(node, false)
                        setSelectedTriggerPath([])
                        setTriggerRequestSchemas(_.cloneDeep(schemaTree));

                    }
            } else if (node.isSelected === false | node.isSelected === undefined) {
                //CASE: Node is not selected

                    if(selectedTriggerPath.length > 0 && selectedTriggerPath !== nodePath){
                        //CASE: Another node is selected
                            node.isSelected = true
                            selectTriggerNode(node, true)
                            setSelectedTriggerPath(nodePath)
                            Tree.nodeFromPath(selectedTriggerPath, schemaTree).isSelected = false
                            setTriggerRequestSchemas(_.cloneDeep(schemaTree));
                            setTriggerRequestSchemas(_.cloneDeep(schemaTree));

                    } else if (selectedTriggerPath.length > 0 && selectedTriggerPath === nodePath) {
                        //CASE: Clicked node is thought to be selected. This is a bug. Set the Tree node to selected
                        node.isSelected = true
                        selectTriggerNode(node, true)
                        setSelectedTriggerPath(nodePath)
                        setTriggerRequestSchemas(_.cloneDeep(schemaTree));
                        
                    } else if(selectedTriggerPath.length === 0) {
                        //CASE: No other node is selected
                        node.isSelected = true
                        selectTriggerNode(node, true)
                        setSelectedTriggerPath(nodePath)
                        setTriggerRequestSchemas(_.cloneDeep(schemaTree));
                    }
                
            }
        }
    
        console.log("selectedTriggerPath: ", selectedTriggerPath)
        console.log("actionRequestSchemas: ", schemaTree)
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
                onNodeClick={handleNodeClick}
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