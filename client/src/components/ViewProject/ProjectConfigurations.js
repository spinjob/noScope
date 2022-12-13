import { Button, FormGroup, Divider, InputGroup, Intent, Card, H3, H4 } from "@blueprintjs/core"
import React, { useCallback, useContext, useEffect, useState} from "react"
import Loader from "../Loader"
import axios from 'axios';
import "../../styles/workflowStudioStyles.css";


function ProjectConfigurations ({ project, isEditing}) {
    const [configurations, setConfigurations] = useState(project.configuration);
    const [newConfigKey, setNewConfigKey] = useState("");
    const [newConfigValue, setNewConfigValue] = useState("");

    const setConfigKey = (event) => {
        setNewConfigKey(event.target.value)
    }
    const setConfigValue = (event) => {
        setNewConfigValue(event.target.value)
    }
    const addConfiguration = (config) => {
        setConfigurations(oldValues => { 
            return {...oldValues, [newConfigKey]: newConfigValue}
        })
        setNewConfigKey("")
        setNewConfigValue("")
    }
    const handleConfigurationSave = () => {
        axios.put(process.env.REACT_APP_API_ENDPOINT + "/projects/"+ project.uuid+ "/configuration", {configurations}).then(response => {
            console.log(response)
        }).catch(error => {
            console.log(error)
        } )

    }

       
    const fetchProjectDetails = useCallback(() => { 
        axios.get(process.env.REACT_APP_API_ENDPOINT + "/projects/" + project.uuid + "/details")
        
        .then(response => {
            setConfigurations(response.data[0].configuration)
            return response
        }
        )
        .catch(error => {
            console.log(error);
            return error
        })
    });


   useEffect(() => {
        if(!configurations) {
            fetchProjectDetails()
        }
        }, [configurations, fetchProjectDetails])

    const isEditHandler = () => {
        if (isEditing) {
            return false
        }
         else {
            return true
         }
    }

    useEffect(() => {
        if (!project.configuration) {

        }
    }, [])

    const renderConfigurations = () => {
    
        if(!configurations) {
        return (<div>
            <FormGroup>
               <InputGroup value= "No Configurations" disabled = {true} id="text-input" />
            </FormGroup>

        </div>
        )} else {
        var configurationKeys = Object.keys(configurations);
        var configurationValues = Object.values(configurations);

        return configurationKeys.map((config, index) => {
            var configurationKey = config;
            var configurationPlaceholder = configurationValues[index];
            if (!isEditing) {
                var configurationValue = configurationValues[index];
            } else {
                var configurationValue = "";
                
            }

            return (
                <div>
                    <FormGroup label={configurationKey} >
                        <InputGroup placeholder= {configurationPlaceholder} value= {configurationValue} disabled = {isEditHandler()} id="text-input" />
                    </FormGroup>
                </div>
            )
        })
     }
       
    }

    return (
        <div>
            <div>
                <div style={{display:'flex', flexDirection: 'row', alignItems: 'center'}}>
                    <FormGroup label= "New Config Key" >
                        <InputGroup placeholder= "Value" id="text-input" onChange={e => setConfigKey(e)} />
                    </FormGroup>
                    <div style={{paddingLeft:20}}/>
                        <FormGroup label= "New Config Value" >
                        <InputGroup placeholder= "Value" id="text-input" onChange={e => setConfigValue(e)} />
                    </FormGroup>
                    <div style={{paddingLeft:20}}>
                        <Button outlined={true} style={{height: 30}} icon="plus" minimal={true} onClick={addConfiguration}>Add Config</Button>
                    </div>
                </div>
            </div>
            {renderConfigurations()}
            <Button text="Save Changes" outlined={true} onClick={handleConfigurationSave} intent="success" minimal={true} />
            
        </div>
    )
}
export default ProjectConfigurations