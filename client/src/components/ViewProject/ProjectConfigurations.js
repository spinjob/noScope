import { Button, FormGroup, Divider, InputGroup, Intent, Card, H3, H4, H5, H6, Tabs, Tab} from "@blueprintjs/core"
import { Select2, ItemRenderer } from "@blueprintjs/select"
import { MenuItem2 } from "@blueprintjs/popover2"
import React, { useCallback, useContext, useEffect, useState} from "react"
import Loader from "../Loader"
import axios from 'axios';
import "../../styles/workflowStudioStyles.css";


function ProjectConfigurations ({ project, isEditing}) {
    const [configurations, setConfigurations] = useState(project.configuration);
    const [customerConfigurations, setCustomerConfigurations] = useState({});
    const [newConfigKey, setNewConfigKey] = useState("");
    const [newConfigValue, setNewConfigValue] = useState("");
    const [newConfigType, setNewConfigType] = useState("string");
    const [newCustomerConfigKey, setNewCustomerConfigKey] = useState("");
    const [newCustomerConfigType, setNewCustomerConfigType] = useState("string");
    const [navBarTabId, setNavBarTabId] = useState("globalConfigs");
    const [isDisabled, setIsDisabled] = useState(true);
    const [isCustomerConfigDisabled, setIsCustomerConfigDisabled] = useState(true);
    const [didFetchProject, setDidFetchProject] = useState(false);
    
    const setConfigKey = (event) => {
        setNewConfigKey(event.target.value)
    }
    const setConfigValue = (event) => {
        setNewConfigValue(event.target.value)
    }
    const setConfigType = (event) => {
        setNewConfigType(event.value)
    }
    const setCustomerConfigKey = (event) => {
        setNewCustomerConfigKey(event.target.value)
    }
    const setCustomerConfigType = (event) => {
        setNewCustomerConfigType(event.value)
    }

    const configurationTypeOptions = [
        {label: "String", value: "string", icon: "citation"},
        {label: "Integer", value: "integer", icon: "numerical"},
        {label: "Boolean", value: "boolean", icon: "tick"},
        {label: "Float", value: "float", icon: "floating-point"},
        {label: "Array", value: "array", icon: "array"},
        {label: "Object", value: "object", icon: "cube"}].map((f, index) => ({ ...f, rank: index + 1 }));
    
    const renderConfigurationType = (item, {handleClick, modifiers}) => {
        if (!modifiers.matchesPredicate) {
            return null;
        }
        return (
            <MenuItem2
                active={modifiers.active}
                key={item.value}
                onClick={handleClick}
                text={item.label}
                icon={item.icon}
                value={item.value}
                shouldDismissPopover={false}
            />
        );
    }

    const addConfiguration = (config) => {
        setConfigurations(oldValues => { 
            return {...oldValues, [newConfigKey]: {"value": newConfigValue, "type": newConfigType}}
        })
        setNewConfigKey("")
        setNewConfigValue("")
    }


    const addCustomerConfiguration = () => {
        var newConfiguration = {
            [newCustomerConfigKey]: {
                "key": newCustomerConfigKey, 
                "type": newCustomerConfigType, 
                "customers": {}
            }
        }
        console.log(newConfiguration)
        if(!customerConfigurations) {
            setCustomerConfigurations(newConfiguration)
        } else {
            setCustomerConfigurations(oldValues => { 
                return {...oldValues, newConfiguration}
            })
        }
     
        console.log(customerConfigurations)
        setNewCustomerConfigKey("")
    }


    const handleConfigurationSave = () => {
        axios.put(process.env.REACT_APP_API_ENDPOINT + "/projects/"+ project.uuid+ "/configuration", {configurations, customerConfigurations}).then(response => {
            console.log(response)
        }).catch(error => {
            console.log(error)
        } )
    }
    const fetchProjectDetails = useCallback(() => { 
        axios.get(process.env.REACT_APP_API_ENDPOINT + "/projects/" + project.uuid + "/details")
        
        .then(response => {
            setConfigurations(response.data[0].configuration)
            setCustomerConfigurations(response.data[0].customer_configuration)
            setDidFetchProject(true)
            return response
        }
        )
        .catch(error => {
            console.log(error);
            return error
        })
    });

    const handleTabChange = (e) => {
        setNavBarTabId(e);
    }


    const isEditHandler = () => {
        if (isEditing) {
            return false
        }
         else {
            return true
         }
    }


   useEffect(() => {
        if(!configurations && didFetchProject == false || !customerConfigurations && didFetchProject == false) {
            fetchProjectDetails()
        } 
        }, [configurations, fetchProjectDetails])

    useEffect(() => {
        if (!project.configuration) {

        }
    }, [])

    useEffect(() => {
        if (newConfigKey.length > 0 && newConfigValue.length > 0) {
            setIsDisabled(false)
        } else {
            setIsDisabled(true)
        }
    }, [isDisabled, setIsDisabled, newConfigKey, newConfigValue])


    useEffect(() => {
        if (newCustomerConfigKey.length > 0) {
            setIsCustomerConfigDisabled(false)
        } else {
            setIsCustomerConfigDisabled(true)
        }
    }, [isCustomerConfigDisabled, setIsCustomerConfigDisabled, newCustomerConfigKey])

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
            var configurationPlaceholder = configurationValues[index].value;
            var configurationType = configurationValues[index].type;

            if (!isEditing) {
                var configurationValue = configurationValues[index].value;
            } else {
                var configurationValue = "";
                
            }

            return (
                <div>
                    <Card>
                        <FormGroup>
                            <H6>{configurationKey}</H6>
                            <p>{configurationType}</p>
                            <div style={{paddingTop:5}}/>
                            <InputGroup placeholder= {configurationPlaceholder} value= {configurationValue} disabled = {isEditHandler()} id="text-input" />
                        </FormGroup>
                    </Card>
                </div>
            )
        })
     }
       
    }

    const renderCustomerConfigurations = () => {
    
        if(!customerConfigurations) {
        return (<div>
            <FormGroup>
               <InputGroup value= "No Configurations" disabled = {true} id="text-input" />
            </FormGroup>

        </div>
        )} else {
        var customerConfigurationKeys = Object.keys(customerConfigurations);
        var customerConfigurationValues = Object.values(customerConfigurations);

        return customerConfigurationKeys.map((config, index) => {
            var customerConfigurationKey = config;
            var customerConfigurationType = customerConfigurationValues[index].type;

            return (
                <div>
                    <Card>
                        <FormGroup>
                            <H6>{customerConfigurationKey}</H6>
                            <p>{customerConfigurationType}</p>
                        </FormGroup>
                    </Card>
                </div>
            )
        })
     }
       
    }

    const renderPartnershipConfigurationTab = () => {

        return (
            
            <div>
                <i>Global configuration keys and values are set here and are assumed to be the same across all Partnership Customers.</i>
                <div style={{paddingTop: 20}}/>
                <Card style={{paddingBottom:20}}>
                    <H5>New Global Configuration</H5>
                    <div style={{display:'flex', flexDirection: 'row', alignItems: 'center'}}>
                    
                        <FormGroup label= "Key" >
                            <InputGroup placeholder= "Provide a unique key" id="text-input" onChange={e => setConfigKey(e)} />
                        </FormGroup>
                        <div style={{paddingLeft:20}}/>
                        <FormGroup label= "Value" >
                            <InputGroup placeholder= "Provide a config value" id="text-input" onChange={e => setConfigValue(e)} />
                        </FormGroup>
                        <div style={{paddingLeft:20}}/>
                        <FormGroup label= "Type" >
                            <Select2 items={configurationTypeOptions} itemRenderer={renderConfigurationType} onItemSelect={setConfigType} filterable={false}>
                                <Button text={newConfigType} rightIcon="caret-down" />
                            </Select2>
                        </FormGroup>
                    </div>
                    <Button disabled={isDisabled} outlined={true} style={{height: 30}} icon="plus" minimal={true} onClick={addConfiguration}>Add Config</Button>

                </Card>
            
            <div style={{paddingBottom: 20}}/>
            <H5>Existing Configurations</H5>
            {renderConfigurations()}
            <div style={{paddingTop: 20}}/>
            <Button text="Save Changes" outlined={true} onClick={handleConfigurationSave} intent="success" minimal={true} />
         </div>
        
        )
    }

     const renderCustomerConfigurationTab = () => {

        return (

            <div>
                <i>Customer configuration values are set in the 'Partnership Customers' tab. The values are assumed to be customer-specific.</i>
                <div style={{paddingTop: 20}}/>
                <Card style={{paddingBottom:20}}>
                    <H5>New Customer Configuration</H5>
                    <div style={{display:'flex', flexDirection: 'row', alignItems: 'center'}}>
                    
                        <FormGroup label= "Key" >
                            <InputGroup placeholder= "Provide a unique key" id="text-input" onChange={e => setCustomerConfigKey(e)} />
                        </FormGroup>
                        <div style={{paddingLeft:20}}/>
                        <FormGroup label= "Type" >
                            <Select2 items={configurationTypeOptions} itemRenderer={renderConfigurationType} onItemSelect={setCustomerConfigType} filterable={false}>
                                <Button text={newCustomerConfigType} rightIcon="caret-down" />
                            </Select2>
                        </FormGroup>
                    </div>
                    <Button disabled={isCustomerConfigDisabled} outlined={true} style={{height: 30}} icon="plus" minimal={true} onClick={addCustomerConfiguration}>Add Config</Button>
                </Card>
            
            <div style={{paddingBottom: 20}}/>
            <H5>Existing Configurations</H5>
            {renderCustomerConfigurations()}
            <div style={{paddingTop: 20}}/>
            <Button text="Save Changes" outlined={true} onClick={handleConfigurationSave} intent="success" minimal={true} />
         </div>
        
        )
    }

    return (
        <div>
            <Tabs onChange={handleTabChange} selectedTabId={navBarTabId} animate={true}>
                <Tab id="globalConfigs" title="Global" panel={renderPartnershipConfigurationTab()} />
                <Tab id="customerConfigs" title="Customer Specific" panel={renderCustomerConfigurationTab()} />
            </Tabs>
        </div>
    )
}
export default ProjectConfigurations