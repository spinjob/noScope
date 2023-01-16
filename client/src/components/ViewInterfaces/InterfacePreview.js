import { H1, Card, H3, H4, H5, H6, Button, FormGroup, InputGroup, Divider } from "@blueprintjs/core"
import React, { useContext, useState, useCallback, useEffect, useRef } from "react"
import { UserContext } from "../../context/UserContext"
import Loader from "../Loader"
import ReactMarkdown from "react-markdown"
import Navigation from "../Navigation"
import axios from 'axios';
import { useNavigate } from "react-router-dom";

const InterfacePreview = ({interfaceSelected, selectedInterfaceSecurityScheme, selectedInterfaceActions, selectedInterfaceWebhooks, selectedInterfaceObjects, isLoading, setIsLoading}) => {
   
    const [userContext, setUserContext] = useContext(UserContext);
    const [isEditing, setIsEditing] = useState(false);
    const [newSandboxServer, setNewSandboxServer] = useState(null);
    const [newProductionServer, setNewProductionServer] = useState(null)
    const [credentialsMap, setCredentialsMap] = useState({"sandbox": {}, "production": {}});
    var authenticationFlowAction = null
    var sandboxServer = ""
    var productionServer = ""

    if(selectedInterfaceSecurityScheme) {
        authenticationFlowAction = selectedInterfaceActions.filter(function (action) {
            // console.log(action.path)
            // console.log(selectedInterfaceSecurityScheme[0].flows[0].tokenUrl)
            if (selectedInterfaceSecurityScheme[0] && selectedInterfaceSecurityScheme[0].flows[0] && selectedInterfaceSecurityScheme[0].flows[0].tokenUrl) {
                return action.path == selectedInterfaceSecurityScheme[0].flows[0].tokenUrl
            }
          
        })
    }


    const isEditHandler = () => {
        if (isEditing) {
            return false
        }
         else {
            return true
         }
    }

    const setSandboxServer = (event) => {
        setNewSandboxServer(event.target.value)
    }

    const setProductionServer = (event) => {
        setNewProductionServer(event.target.value)
    }

    const setCredentialsMapHandler = (event) => {
        console.log(event)
        var placeholder = event.target.attributes.placeholder.value
        var key = placeholder.split(" ")[2]
        var value = event.target.value
        var environment = event.target.id.split("-")[0]
        var map = credentialsMap
        console.log(map)
        if(!map[environment]) {
            map[environment] = {}
            map[environment][key] = value
        } else {
            map[environment][key] = value
        }

        setCredentialsMap(map)
    }   

    const handleServerSave = () => {
        var requestBody = {
            sandboxServer: newSandboxServer,
            productionServer: newProductionServer,
            credentials: credentialsMap ? credentialsMap : {}
        }
        console.log(requestBody)

        axios.put(process.env.REACT_APP_API_ENDPOINT + "/interfaces/"+ interfaceSelected.uuid+ "/servers", requestBody)
        .then(response => {
            console.log(response)
        }).catch(error => {
            console.log(error)
        } )
    }

    const authenticationFlowInputs = (schemaKeys, schemaValues, icon, environment) =>  (
        <>
             {schemaKeys.map((key, index) => { 
                if(credentialsMap[environment] && credentialsMap[environment][key]) {
                    return (
                        <div style={{flexDirection:'row'}}>
                            <FormGroup label={key}>
                                <InputGroup leftIcon = {icon} defaultValue = {credentialsMap[environment][key]} placeholder= {key} onChange={setCredentialsMapHandler} id={environment + '-text-input'} />
                            </FormGroup>
                        </div>
                    )
                } else {
                    return (
                        <div>
                            <FormGroup label={key}>
                                <InputGroup text={"Test"} leftIcon = {icon} placeholder= {'Enter your '+key + ' here'} onChange={setCredentialsMapHandler} id={environment + '-text-input'} />
                            </FormGroup>
                        </div>
                    )
                }
            }
        )}
        </>
    ) 

    const renderAuthenticationInputs = (environment) => {
        if(authenticationFlowAction && authenticationFlowAction[0] && authenticationFlowAction[0].requestBody2 && authenticationFlowAction[0].requestBody2.schema) { 
            var schemaKeys = Object.keys(authenticationFlowAction[0].requestBody2.schema)
            var schemaValues = Object.values(authenticationFlowAction[0].requestBody2.schema)
            var icon = ''
            if(environment == "sandbox") {
                icon = "lab-test"
            } else if(environment == "production") {
                icon = "high-priority"
            }
            return authenticationFlowInputs(schemaKeys, schemaValues, icon, environment)
        } else {
            return <p style={{color: 'grey'}}>No Authentication Credentials Documented</p>
        }
    }

    const renderSecurityScheme = () => {
        var securitySchemeType = selectedInterfaceSecurityScheme[0].type ? selectedInterfaceSecurityScheme[0].type : ""
        var securitySchemeFlow = selectedInterfaceSecurityScheme[0].flows[0] ? selectedInterfaceSecurityScheme[0].flows[0] : null
        if(securitySchemeFlow) {
            var securitySchemeFlowType = securitySchemeFlow.type ? securitySchemeFlow.type : ""
            var securitySchemeAuthorizationUrl = securitySchemeFlow.tokenUrl ? securitySchemeFlow.tokenUrl : ""
            
            return (
                <div style={{paddingTop: 20}}>
                    <Card elevation={2}>
                        <H3>Security Scheme Documentation</H3>
                        <H5>Type: {securitySchemeType}</H5>
                        <p>FLow Type: {securitySchemeFlowType}</p>
                        <p>Authorization URL: {securitySchemeAuthorizationUrl}</p>
                        <ReactMarkdown>{selectedInterfaceSecurityScheme[0].description}</ReactMarkdown>
                    </Card>
                </div> 
            )
       } else {
              return (
                <div style={{paddingTop: 20}}>
                     <Card elevation={2}>
                          <H3>Security Scheme Documentation</H3>
                          <H5>Type: {securitySchemeType}</H5>
                          <ReactMarkdown>{selectedInterfaceSecurityScheme[0].description}</ReactMarkdown>
                     </Card>
                </div> 
              )
       }
        
       
    }

    useEffect(() => {
        if(interfaceSelected && interfaceSelected.credentials) {
            setCredentialsMap(interfaceSelected.credentials)
 
        }
        if(interfaceSelected && interfaceSelected.sandbox_server == "" && interfaceSelected.production_server == "") {
            // setNewSandboxServer("")
            // setNewProductionServer("")
        } if(interfaceSelected && !interfaceSelected.credentials) {
            setCredentialsMap({"sandbox": {}, "production": {}})
        }
    },[credentialsMap,renderAuthenticationInputs ])


    return interfaceSelected && isLoading ? (
        <Loader />
      ) : selectedInterfaceObjects.length == 0 || !interfaceSelected ? (
        <div>
            <H3>Select an API to Preview</H3>
         </div>
      ) 
      : selectedInterfaceSecurityScheme.length == 0 ? (
        <div>
            <div className="container" style={{padding:40}}>
            <H1>{interfaceSelected.name}</H1>
                <div>
                    <div style={{paddingTop: 20}}>
                        <Card elevation={2} style={{width: '100%'}}>
                            <FormGroup disabled = {isEditHandler()} style={{width: '100%'}} label={<H3>API Settings</H3>} >
                                <Card style={{paddingBottom: 40}}>
                                    <H5>Production</H5>
                                    <H6>Base URL: </H6>
                                        <div style={{ width: '40%', flexDirection: 'row', alignItems: 'center', paddingBottom: 20}}>
                                            <InputGroup style={{width: '100%'}} onChange={setProductionServer} defaultValue= {interfaceSelected.production_server} id="text-input" />
                                        </div>
                                        <H6>Authentication Configurations</H6>
                                        <div style={{ width: '40%', flexDirection: 'row', alignItems: 'center'}}>
                                            {renderAuthenticationInputs('production')}
                                        </div>  
                                    <div/>
                                </Card>
                                <div style={{paddingTop: 20}}/>
                                <Card style={{paddingBottom: 20}}>
                                    <H5>Sandbox</H5>
                                        <H6>Base URL: </H6>
                                            <div style={{ width: '40%', flexDirection: 'row', alignItems: 'center', paddingBottom: 20}}>
                                                <InputGroup onChange={setSandboxServer} defaultValue= {interfaceSelected.sandbox_server} id="text-input" />
                                            </div>
                                            <H6>Authentication Configurations</H6>
                                            <div style={{ width: '40%', flexDirection: 'row', alignItems: 'center'}}>
                                                {renderAuthenticationInputs('sandbox')}
                                            </div>  
                                        <div/>
                                </Card>
                            </FormGroup>
                            <Button text={"Save"} minimal={true} onClick={handleServerSave} outlined={true} d/>
                        </Card>
                    </div>
                    {/* <ReactMarkdown>{interfaceSelected.description}</ReactMarkdown> */}
                </div>
                <div style={{paddingTop: 20}}>
                        <Card elevation={2}>
                            <H3>Data Summary</H3>
                            <p># of Schema: {selectedInterfaceObjects.length}</p>
                            <p># of Actions: {selectedInterfaceActions.length}</p>
                            <p># of Webhooks: {selectedInterfaceWebhooks.length}</p>
                        </Card>
                    </div>
            </div>
        </div>
      ) 
      : (
        <div>
        <div className="container" style={{padding:40}}>
        <H1>{interfaceSelected.name}</H1>
            <div>
                <div style={{paddingTop: 20}}>
                    <Card elevation={2} style={{width: '100%'}}>
                        <FormGroup disabled = {isEditHandler()} style={{width: '100%'}} label={<H3>API Settings</H3>} >
                            <Card style={{paddingBottom: 40}}>
                                <H5>Production</H5>
                                <H6>Base URL: </H6>
                                    <div style={{ width: '40%', flexDirection: 'row', alignItems: 'center', paddingBottom: 20}}>
                                        <InputGroup style={{width: '100%'}} onChange={setProductionServer} defaultValue= {interfaceSelected.production_server} id="text-input" />
                                    </div>
                                    <H6>Authentication Configurations</H6>
                                    <div style={{ width: '40%', flexDirection: 'row', alignItems: 'center'}}>
                                        {renderAuthenticationInputs('production')}
                                    </div>  
                                <div/>
                            </Card>
                            <div style={{paddingTop: 20}}/>
                            <Card style={{paddingBottom: 20}}>
                                <H5>Sandbox</H5>
                                    <H6>Base URL: </H6>
                                        <div style={{ width: '40%', flexDirection: 'row', alignItems: 'center', paddingBottom: 20}}>
                                            <InputGroup onChange={setSandboxServer} defaultValue= {interfaceSelected.sandbox_server} id="text-input" />
                                        </div>
                                        <H6>Authentication Configurations</H6>
                                        <div style={{ width: '40%', flexDirection: 'row', alignItems: 'center'}}>
                                            {renderAuthenticationInputs('sandbox')}
                                        </div>  
                                    <div/>
                            </Card>
                        </FormGroup>
                        <Button text={"Save"} minimal={true} onClick={handleServerSave} outlined={true} d/>
                    </Card>
                </div>
                {/* <ReactMarkdown>{interfaceSelected.description}</ReactMarkdown> */}
            </div>
            {renderSecurityScheme()}
            {/* <div style={{paddingTop: 20}}>
                <Card elevation={2}>
                    <H3>Security Scheme Documentation</H3>
                    <H5>Type: {selectedInterfaceSecurityScheme[0].type}</H5>
                    <p>FLow Type: {selectedInterfaceSecurityScheme[0].flows[0].type}</p>
                    <p>Authorization URL: {selectedInterfaceSecurityScheme[0].flows[0].tokenUrl}</p>
                    <ReactMarkdown>{selectedInterfaceSecurityScheme[0].description}</ReactMarkdown>
                </Card>
            </div>  */}
            <div style={{paddingTop: 20}}>
                    <Card elevation={2}>
                        <H3>Data Summary</H3>
                        <p># of Schema: {selectedInterfaceObjects.length}</p>
                        <p># of Actions: {selectedInterfaceActions.length}</p>
                        <p># of Webhooks: {selectedInterfaceWebhooks.length}</p>
                    </Card>
                </div>
        </div>
        </div>
      )
}

export default InterfacePreview