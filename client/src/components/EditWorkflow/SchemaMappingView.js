import React, { useCallback, useState, useContext, useEffect } from "react";
import { Button, Icon, Intent, Card, Menu, Divider, H1, H2, H3, H4, H5 } from '@blueprintjs/core';
import axios from "axios";
import { useParams } from "react-router-dom";
import Loader from "../Loader";

import "reactflow/dist/style.css";

const SchemaMappingView = ({triggerField, actionField, onClick, isActive, interfaceSchema}) => {

    const [mappings, setMappings] = useState(null);
    let {id, workflowId} = useParams();
    const [shouldFetchMappings, setShouldFetchMappings] = useState(true);

    const fetchMappings = useCallback(() => {
        axios.get(process.env.REACT_APP_API_ENDPOINT + "/projects/" + id + "/workflows/" + workflowId + "/details")
        .then(response => {
            setMappings(response.data[0].steps[0].adaptions)
            console.log("fetched mappings")
            return response
        })
        .catch(error => {
            console.log(error);
            setShouldFetchMappings(true)
            return error
        })
    })


    const renderMappingCards = (mappings) => {
        return mappings.map((mapping) => {
            return (
                <Card>
                    <div style={{display:'flex', justifyContent: 'center'}}>
                        <H4 style={{paddingRight: 10}}>{mapping.inputSchema.label}</H4>
                        <Icon icon="arrow-right" iconSize={20}/>
                        <H4 style={{paddingLeft: 10}} >{mapping.outputSchema.label}</H4>
                    </div>
                    
                    <p>{mapping.formula}</p>
                </Card>
            )
        })
    }

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
                return null
    }
}

    useEffect(() => {
        // fetch once
        if (!mappings) {
            fetchMappings()
        } else {
            renderMappingCards(mappings)
            console.log(mappings)
        }
    }, [])

    return (
        <div>
        <div class="SchemaMappingView">
            <Card style={{display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                <Card elevation={3} style={{display: 'flex', alignItems: 'center', margin: 10}}> 
                        <div>
                        <Icon icon={iconGenerator(triggerField.nodeData.type)}/> <H4>{triggerField.label}</H4>
                        <p>{triggerField.nodeData.description}</p>
                        <Divider/>
                            <br></br>
                            <H5>{triggerField.nodeData.fieldPath}</H5>
                            </div>
                    </Card>
                    <div class="SchemaMappingViewButton">
                        <Button disabled={isActive} minimal={true} outlined={true} onClick={onClick} text="Map"/>
                    </div>
                    <Card elevation={3} style={{display: 'flex', alignItems: 'center', margin: 10}}> 
                        <div>
                        <Icon icon={iconGenerator(actionField.nodeData.type)}/> 
                        <H4>{actionField.label}</H4>
                        <p>{actionField.nodeData.description}</p>
                        <Divider/>
                            <br></br>
                            <H5>{actionField.nodeData.fieldPath}</H5>
                            </div>
                    </Card>
            </Card>
           
        </div>
            <div style={{paddingTop:20}}>
                <H4>Schema Mappings & Adaptions</H4>
                {mappings ? renderMappingCards(mappings) : null}
            </div>

        </div>
        
    )
}

export default SchemaMappingView;