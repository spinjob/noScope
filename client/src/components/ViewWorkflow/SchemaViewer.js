import React, {Component,useCallback, useContext, useEffect, useState } from 'react'
import { Tab, Tabs, Tree, Classes, Button, MenuItem, H5 } from "@blueprintjs/core";
import { Select2 } from "@blueprintjs/select";
import { IconNames } from "@blueprintjs/icons";
import axios from "axios";
import SchemaTree from "./SchemaTree"
import {TreeExample} from "./SampleSchemaTree.tsx"
import { useNavigate, useParams} from "react-router-dom";

function SchemaViewer ({ projectId, interfaces, workflow }) {

    const [currentTab, setCurrentTab] = useState("1")
    const [projectInterfaces, setProjectInterfaces] = useState([interfaces]);
    const [project, setProject] = useState(null);

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

    const fetchWorkflowDetails = useCallback(() => { 
        axios.post(process.env.REACT_APP_API_ENDPOINT + "/projects/" + id + "/workflows/details", {"parent_project_uuid": projectId})
        
        .then(response => {
            return response
        }
        )
        .catch(error => {
            console.log(error);
            return error
        })
    });

    const handleTabChange = (tabId) => {

        setCurrentTab(tabId)
    }

    const fetchActionName = (method, path) => {
        return method + " " + path
    } 


    useEffect(() => {
        if(!interfaces) {
            fetchProjectDetails()
        } else {
            setProjectInterfaces(interfaces)
        }
    }, [projectInterfaces, fetchProjectDetails])


    useEffect(() => {
        if(!workflow) {
            workflow = fetchWorkflowDetails()
        } else {
            
        }
    }, [projectInterfaces, fetchProjectDetails])

    return (
        <div>
            <H5>Schema Viewer</H5>
            <p>View the schema for your workflow.</p>
            <Tabs id="SchemaPreviewTabs" selectedTabId={currentTab} style={{height:"100vh"}} onChange={handleTabChange}>
                <Tab id="1" title= {workflow.trigger.webhook.name} panel={<SchemaTree interfaces={projectInterfaces} workflow={workflow} type="trigger"/>}/>
                <Tab id="2" title={fetchActionName(workflow.steps[0].request.method, workflow.steps[0].request.path)} panel={<SchemaTree interfaces={projectInterfaces} workflow={workflow} type="action"/>}/>
            </Tabs>
        </div>
    )

}



  
SchemaViewer.defaultProps = {
    params: {
    }
  };


export default SchemaViewer;