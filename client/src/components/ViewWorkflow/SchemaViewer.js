import React, {Component,useCallback, useContext, useEffect, useState } from 'react'
import { Tab, Tabs, Tree, Classes, Button, MenuItem, H5 } from "@blueprintjs/core";
import { Select2 } from "@blueprintjs/select";
import { IconNames } from "@blueprintjs/icons";
import axios from "axios";
import SchemaTree from "./SchemaTree"
import {TreeExample} from "./SampleSchemaTree.tsx"
import { useNavigate, useParams} from "react-router-dom";

function SchemaViewer ({ projectId, interfaces, workflow }) {

    const [currentTab, setCurrentTab] = useState("login")
    const [projectInterfaces, setProjectInterfaces] = useState([interfaces]);
    console.log("SchemaViewer Interfaces: ", interfaces)

    let {id} = useParams();

    const fetchProjectDetails = useCallback(() => { 
        axios.get(process.env.REACT_APP_API_ENDPOINT + "/projects/" + id + "/details")
        
        .then(response => {
            setProjectInterfaces(response.data[0].interfaces)
            return response
        }
        )
        .catch(error => {
            console.log(error);
            return error
        })
    });


    useEffect(() => {
        if(!interfaces) {
            fetchProjectDetails()
        } else {
            setProjectInterfaces(interfaces)
        }
    }, [projectInterfaces, fetchProjectDetails])

    return (
        <div>
            <H5>Schema Viewer</H5>
            <p>View the schema for your workflow.</p>
            <Tabs id="SchemaPreviewTabs" selectedTabId="1" style={{height:"100vh"}}>
                <Tab id="1" title="TriggerSchemas" panel={<SchemaTree interfaces={projectInterfaces} workflow={workflow}/>}/>
                <Tab id="2" title="ActionSchemas"></Tab>
            </Tabs>
        </div>
    )

}



  
SchemaViewer.defaultProps = {
    params: {
    }
  };


export default SchemaViewer;