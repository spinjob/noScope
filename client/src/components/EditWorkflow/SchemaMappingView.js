import React, { useCallback, useState, useContext, useEffect } from "react";
import { Button, Icon, Intent, Card, Menu, Divider, H1, H2, H3, H4, H5 } from '@blueprintjs/core';

import "reactflow/dist/style.css";

const SchemaMappingView = ({triggerField, actionField, onClick}) => {

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

    return (
        <div class="SchemaMappingView">
            <Card elevation={3} style={{display: 'flex', alignItems: 'center', margin: 10}}> 
                   <div>
                   <Icon icon={iconGenerator(triggerField.nodeData.type)}/> <H4>{triggerField.label}</H4>
                   <Divider/>
                    <H5>{triggerField.nodeData.type}</H5>
                    <br></br>
                    <p>{triggerField.nodeData.description}</p>
                    <p>{triggerField.nodeData.uuid}</p>
                    </div>
            </Card>
            <div class="SchemaMappingViewButton">
                <Button minimal={true} outlined={true} onClick={onClick} text="Map"/>
            </div>
            <Card elevation={3} style={{display: 'flex', alignItems: 'center', margin: 10}}> 
                   <div>
                   <Icon icon={iconGenerator(actionField.nodeData.type)}/> 
                   <H4>{actionField.label}</H4>
                   <Divider/>
                   <H5>{actionField.nodeData.type}</H5>
                    <br></br>
                    <p>{actionField.nodeData.description}</p>
                    <p>{actionField.nodeData.uuid}</p>
                    </div>
            </Card>
        </div>
    )
}

export default SchemaMappingView;