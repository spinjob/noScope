import React , {Component,useCallback, useContext, useEffect, useState } from 'react'
import '@blueprintjs/core/lib/css/blueprint.css';
import { Tree, Classes as Popover2Classes, ContextMenu, Tooltip2 } from "@blueprintjs/core";
import { Select2 } from "@blueprintjs/select";
import { IconNames } from "@blueprintjs/icons";
import axios from "axios";
import '@blueprintjs/core/lib/css/blueprint.css';
import _ from "lodash";
import Loader from '../Loader';


function SchemaTree ({ projectId, interfaces, workflow}) {

    const [isOpen, setIsOpen] = React.useState(true)
    const [interfaceSchemas, setInterfaceSchemas] = useState([])
    const [triggerRequestSchemas, setTriggerRequestSchemas] = useState([])
    const [triggerResponseSchemas, setTriggerResponseSchemas] = useState([])
    const [actionRequestSchemas, setActionRequestSchemas] = useState([])
    const [actionResponseSchemas, SetActionResponseSchemas] = useState([])

    const webhook = workflow.trigger.webhook
    console.log("SchemaTree Interfaces:" + interfaces)

    const handleNodeExpand = useCallback((node) => {
        node.isExpanded = true
        setTriggerRequestSchemas(_.cloneDeep(triggerRequestSchemas));
    })

    const handleNodeCollapse = useCallback((node) => {

        node.isExpanded = false
        setTriggerRequestSchemas(_.cloneDeep(triggerRequestSchemas));

    })

    const processWebhookSchema = useCallback(() => {
        if (!webhook) {
            console.log("No Webhook")
        } else {
            if (!webhook.request_body && !webhook.responses){
                console.log("No Webhook Schema")
                return []
            } else if (!webhook.request_body && webhook.responses) {
                console.log("No Webhook Request Schema")
               
            } else if (!webhook.responses && webhook.request_body) {
                console.log("No Webhook Response Schema")

            } else if (webhook.request_body && webhook.responses) {
                console.log("Webhook Request and Response Schema")
                if (webhook.request_body.schema.length > 0) {
                    const treeArray = [];
                    webhook.request_body.schema.forEach((schema) => {

                        interfaceSchemas[0].forEach((interfaceSchema) => {
                            
                            if (schema === interfaceSchema.name) {
                                const parentId = Math.floor(Math.random() * 1000) + 1;
                                if (interfaceSchema.properties) {
                                    var propertyKeys = Object.keys(interfaceSchema.properties);
                                    var propertyValues = Object.values(interfaceSchema.properties);
                                    var properties = processProperties(propertyKeys, propertyValues)

                                    const parentObject = {
                                        id: parentId,
                                        label: interfaceSchema.name,
                                        icon: 'cube',
                                        childNodes: properties,
                                        isExpanded: false
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

                    })
                    setTriggerRequestSchemas(treeArray)
                }
                
                webhook.responses.forEach((response) => {
        
                    if (response.schema.length > 0) {
                        response.schema.forEach((schema) => {
                            interfaceSchemas.forEach((interfaceSchema) => {
                                if (schema === interfaceSchema.name) {
                                    const parentId = Math.floor(Math.random() * 1000) + 1;

                                    if (interfaceSchema.properties !== undefined) {

                                        var propertyKeys = Object.keys(interfaceSchema.properties);
                                        var propertyValues = Object.values(interfaceSchema.properties);
                                        
                                        const parentObject = {
                                            id: parentId,
                                            label: interfaceSchema.name,
                                            icon: 'cube',
                                            isExpanded: false,
                                            childNodes: processProperties(propertyKeys, propertyValues)
                                        }
                                        setTriggerResponseSchemas([...triggerResponseSchemas, parentObject])
    
                                    } else {
                                        const parentObject = {
                                            id: parentId,
                                            label: interfaceSchema.name,
                                            icon: 'cube',
                                            isExpanded: false,
                                        }

                                        setTriggerResponseSchemas([...triggerResponseSchemas, parentObject])
    
                                    }

                                }
                                else {}
                            })
                        })
                        
                    }
                })
            }
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
    
    // const processReferences = (ref) => {
    //     const referenceArray = ref.split("/")
    //     var schema = referenceArray[3]
        
    //     interfaceSchemas[0].forEach((interfaceSchema) => {
    //         if (schema === interfaceSchema.name) {
    //             const parentId = Math.floor(Math.random() * 1000) + 1;

    //             if (interfaceSchema.properties) {

    //                 var propertyKeys = Object.keys(interfaceSchema.properties);
    //                 var propertyValues = Object.values(interfaceSchema.properties);
                    
    //                 const parentObject = {
    //                     id: parentId,
    //                     label: interfaceSchema.name,
    //                     icon: 'cube',
    //                     isExpanded: false,
    //                     childNodes: processProperties(propertyKeys, propertyValues)
    //                 }

    //                 return parentObject

    //             } else {
    //                 const parentObject = {
    //                     id: parentId,
    //                     label: interfaceSchema.name,
    //                     icon: 'cube',
    //                     isExpanded: false,
    //                 }
    //                 return parentObject

    //             }

    //         }
    //         else {}
    //     })

    //  }

    const processProperties = useCallback((propertyKeys, propertyValues) => {

        const propertiesArray = [];
        const keyArray = [];

        for (var i = 0; i < propertyKeys.length; ++i) {
            const propertyID = Math.floor(Math.random() * 1000) + 1;
            
            if (!propertyValues[i]["$ref"]){
                const propertyObject = {
                    id: propertyID,
                    label: propertyKeys[i],
                    icon: iconGenerator(propertyValues[i].type)
                }
                propertiesArray.push(propertyObject)
            } else { 
                const ref = propertyValues[i]["$ref"]
                const referenceArray = ref.split("/")
                var schema = referenceArray[3]
                if (keyArray.includes(schema)) {
                    //duplicate schema skipped
                } else {
                    keyArray.push(schema)
                    interfaceSchemas[0].forEach((interfaceSchema) => {
                        if (schema === interfaceSchema.name) {
                            const parentId = Math.floor(Math.random() * 1000) + 1;
    
                            if (interfaceSchema.properties) {
    
                                var propertyKeys = Object.keys(interfaceSchema.properties);
                                var propertyValues = Object.values(interfaceSchema.properties);
                                
                                const parentObject = {
                                    id: parentId,
                                    label: interfaceSchema.name,
                                    icon: 'cube',
                                    isExpanded: false,
                                    childNodes: processProperties(propertyKeys, propertyValues)
                                }
                                propertiesArray.push(parentObject)
    
                            } else {
                                const parentObject = {
                                    id: parentId,
                                    label: interfaceSchema.name,
                                    icon: 'cube',
                                    isExpanded: false,
                                }
                                propertiesArray.push(parentObject)
    
                            }
    
                }
                else {}
                
            })
                    
                }
        

            }

        }
        return propertiesArray
    })

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

    useEffect(() => {
        if (interfaceSchemas.length === 0) {
          fetchInterfaceSchemas();
        }
      }, [interfaceSchemas, fetchInterfaceSchemas])   
    
      useEffect(() => {
        if (interfaceSchemas.length > 0 && triggerRequestSchemas.length === 0) {
            processWebhookSchema();
        }
      }, [triggerRequestSchemas, processWebhookSchema])   



    return !interfaceSchemas ? (
        <Loader />
    )
    : interfaceSchemas.length == 0 ? (
        <Loader />
    )
    : (
        <Tree
        contents={triggerRequestSchemas}
        className={Popover2Classes.ELEVATION_0}
        onNodeClick={()=>setIsOpen(true)}
        onNodeCollapse={handleNodeCollapse}
        onNodeExpand={handleNodeExpand}
        style={{ width: 600 }}
        />
)


}
  
SchemaTree.defaultProps = {
    params: {
    }
  };


export default SchemaTree;