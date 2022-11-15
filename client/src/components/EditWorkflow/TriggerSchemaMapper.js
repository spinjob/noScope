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

function TriggerSchemaMapper ({selectTriggerNode}) {

    let { id, workflowId } = useParams();
    const location = useLocation();

    const [interfaces, setInterfaces] = useState(location.state.interfaces)
    const [interfaceSchemas, setInterfaceSchemas] = useState([])
    const [haveFetchInterfaceSchemas, setHaveFetchInterfaceSchemas] = useState(false)
    const [triggerRequestSchemas, setTriggerRequestSchemas] = useState([])
    const [triggerResponseSchemas, setTriggerResponseSchemas] = useState([])
    const [actionRequestSchemas, setActionRequestSchemas] = useState([])
    const [workflow, setWorkflow] = useState(location.state.workflow)
    const [selected, setSelected] = useState(0)

    const webhook = workflow.trigger.webhook

    const handleNodeExpand = useCallback((node) => {
        node.isExpanded = true
        setTriggerRequestSchemas(_.cloneDeep(triggerRequestSchemas));
    })

    const handleNodeCollapse = useCallback((node) => {
        node.isExpanded = false
        setTriggerRequestSchemas(_.cloneDeep(triggerRequestSchemas));

    })

    const handleActionNodeSelect = useCallback((node) => {
        //console.log(node)
        if (node.icon && node.icon === "cube") {} 
        else {
            if (selected == 0) {
                if (node.isSelected) {
                    node.isSelected = false
                    setSelected(0)
                } else {
                    node.isSelected = true
                    setSelected(1)
                    selectTriggerNode(node)
                }
            } else {
                if (node.isSelected) {
                    node.isSelected = false
                    setSelected(0)
                } else {
                }
    
            }
         }
        setTriggerRequestSchemas(_.cloneDeep(triggerRequestSchemas));

    })

    const processWebhookSchema = useCallback(() => {
        if (!webhook) {
            console.log("No Webhook")
        } else {

            if (!webhook.request_body && !webhook.responses){
               // console.log("No Webhook Schema")
                return []
            } else if (!webhook.request_body && webhook.responses) {
               // console.log("No Webhook Request Schema")
               
            } else if (!webhook.responses && webhook.request_body) {
                //console.log("No Webhook Response Schema")

            } else if (webhook.request_body && webhook.responses) {
                //console.log("Webhook Request and Response Schema")
                if (webhook.request_body.schema.length > 0) {
                    const treeArray = [];

                    webhook.request_body.schema.forEach((schema) => {
                        if (interfaceSchemas.length == 0 && haveFetchInterfaceSchemas == false) {
                            // fetchInterfaceSchemas();
                        } else {
                            interfaceSchemas[0].forEach((interfaceSchema) => {
                                if (schema === interfaceSchema.name) {
                                    const parentId = uuidv4();
                                    if (interfaceSchema.properties) {
                                        var propertyKeys = Object.keys(interfaceSchema.properties);
                                        var propertyValues = Object.values(interfaceSchema.properties);
                                        var properties = processProperties(propertyKeys, propertyValues, interfaceSchema.name)
    
                                        const parentObject = {
                                            id: parentId,
                                            label: interfaceSchema.name,
                                            icon: 'cube',
                                            childNodes: properties,
                                            isExpanded: true,
                                            nodeData: {
                                                pathName: interfaceSchema.name,
                                                schema: interfaceSchema
                                            }
                                        }
    
                                        treeArray.push(parentObject)
                                    } else {
    
                                        const parentObject = {
                                            id: parentId,
                                            label: interfaceSchema.name,
                                            icon: 'cube'
                                        }
                                        treeArray.push(parentObject)
                                    }
                                    
                                }
                                else {}
                            })
                        }


                    })
                    setTriggerRequestSchemas(treeArray)
                }
                
                // webhook.responses.forEach((response) => {
        
                //     if (response.schema.length > 0) {
                //         response.schema.forEach((schema) => {
                //             interfaceSchemas.forEach((interfaceSchema) => {
                //                 if (schema === interfaceSchema.name) {
                //                     const parentId = uuidv4();

                //                     if (interfaceSchema.properties !== undefined) {

                //                         var propertyKeys = Object.keys(interfaceSchema.properties);
                //                         var propertyValues = Object.values(interfaceSchema.properties);
                                        
                //                         const parentObject = {
                //                             id: parentId,
                //                             label: interfaceSchema.name,
                //                             icon: 'cube',
                //                             isExpanded: false,
                //                             childNodes: processProperties(propertyKeys, propertyValues)
                //                         }
                //                         setTriggerResponseSchemas([...triggerResponseSchemas, parentObject])
    
                //                     } else {
                //                         const parentObject = {
                //                             id: parentId,
                //                             label: interfaceSchema.name,
                //                             icon: 'cube',
                //                             isExpanded: false,
                //                         }

                //                         setTriggerResponseSchemas([...triggerResponseSchemas, parentObject])
    
                //                     }

                //                 }
                //                 else {}
                //             })
                //         })
                        
                //     }
                // })
            }
        }
       

    })
    const processProperties = useCallback((propertyKeys, propertyValues, parentSchema) => {

        const propertiesArray = [];
        const keyArray = [];

        for (var i = 0; i < propertyKeys.length; ++i) {
            const propertyID = uuidv4();
            
            if (!propertyValues[i]["$ref"] && !propertyValues[i].additionalProperties) {
                const propertyObject = {
                    id: propertyID,
                    label: propertyKeys[i],
                    icon: iconGenerator(propertyValues[i].type),
                    nodeData: propertyValues[i]
                }
                propertiesArray.push(propertyObject)
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
                                
                                const parentObject = {
                                    id: parentId,
                                    label: interfaceSchema.name,
                                    icon: 'cube',
                                    isExpanded: true,
                                    childNodes: processProperties(propertyKeys, propertyValues),
                                    nodeData: {
                                        pathName: parentSchema + "." + propertyKeys[i],
                                        schema: interfaceSchema
                                    }
                                }
                                propertiesArray.push(parentObject)
    
                            } else {
                                const parentObject = {
                                    id: parentId,
                                    label: interfaceSchema.name,
                                    icon: 'cube',
                                    isExpanded: true,
                                    nodedata: {
                                        pathName: parentSchema + "." + propertyKeys[i],
                                        schema: interfaceSchema
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
                const parentObject = {
                    id: parentId,
                    label: propertyKeys[i],
                    icon: 'cube',
                    isExpanded: true,
                    childNodes: processProperties(additionalPropertyKeys, additionalPropertyValues),
                    nodeData: propertyValues[i]
                }
                
                propertiesArray.push(parentObject)
            
            }

        }
        return propertiesArray
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
        if (interfaceSchemas.length === 0) {
          fetchInterfaceSchemas();
        }
      }, [interfaceSchemas, fetchInterfaceSchemas])   
      
      useEffect(() => {
        if (!workflow) {
            fetchWorkflow();
            console.log("fetching workflow")
        } else {
            //console.log(workflow)
        }
      }, [workflow, fetchWorkflow])  

    //   useEffect(() => {
    //     if (actionRequestSchemas.length == 0) {
    //         processActionSchema()
    //         console.log("processing action schema")
    //     } else {
    //        //console.log(actionRequestSchemas)
    //     }
    //   }, [actionRequestSchemas, processActionSchema])  

      useEffect(() => {
        if (triggerRequestSchemas.length == 0) {
            processWebhookSchema()
        } else {
           //console.log(actionRequestSchemas)
        }
      }, [triggerRequestSchemas, processWebhookSchema])  



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
            <H3>Webhook Schema</H3>
            <Tree
                contents={triggerRequestSchemas}
                className={Popover2Classes.ELEVATION_0}
                onNodeClick={handleActionNodeSelect}
                onNodeCollapse={handleNodeCollapse}
                onNodeExpand={handleNodeExpand}
                style={{ width: 600 }}
            />
        </div>

        // <div>
        //     Action Step Schema
        // </div>
 ) 

}
  
TriggerSchemaMapper.defaultProps = {
    params: {
    }
  };


export default TriggerSchemaMapper;