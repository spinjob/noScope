import { H1, Card, H3, H4, H5, Button, FormGroup, InputGroup, Divider } from "@blueprintjs/core"
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
    const [newSandboxServer, setNewSandboxServer] = useState("");
    const [newProductionServer, setNewProductionServer] = useState("");

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

    const handleServerSave = () => {
        axios.put(process.env.REACT_APP_API_ENDPOINT + "/interfaces/"+ interfaceSelected.uuid+ "/servers", {sandboxServer: newSandboxServer, productionServer: newProductionServer})
        .then(response => {
            console.log(response)
        }).catch(error => {
            console.log(error)
        } )
    }

    useEffect(() => {
        if(interfaceSelected) {
 
        }
        if(interfaceSelected && interfaceSelected.sandbox_server == "" && interfaceSelected.production_server == "") {
            setNewSandboxServer("")
            setNewProductionServer("")
        }
    },[])

    return interfaceSelected && isLoading ? (
        <Loader />
      ) : selectedInterfaceObjects.length == 0 || !interfaceSelected ? (
        <div>
            <H3>Select an API to Preview</H3>
         </div>
      ) 
      : (
        <div>
            <div className="container" style={{padding:40}}>
            <H1>{interfaceSelected.name}</H1>
                <div>
                    <div style={{paddingTop: 20}}>
                        <Card elevation={2}>
                            <H4>Summary</H4>
                            <p># of Schema: {selectedInterfaceObjects.length}</p>
                            <p># of Actions: {selectedInterfaceActions.length}</p>
                            <p># of Webhooks: {selectedInterfaceWebhooks.length}</p>
                        </Card>
                    </div>
                    <div style={{paddingTop: 20}}>
                        <Card elevation={2} style={{width: '100%'}}>
                            <FormGroup disabled = {isEditHandler()} style={{width: '100%'}} label={<H4>Servers</H4>} >
                                <p>Production: </p>
                                    <div style={{ width: '40%', flexDirection: 'row', alignItems: 'center'}}>
                                        <InputGroup style={{width: '100%'}} onChange={setProductionServer} placeholder= {interfaceSelected.production_server} id="text-input" />
                                    </div>
                                <div style={{paddingBottom: 20}} />
                                <p>Sandbox: </p>
                                <div style={{ width: '40%', flexDirection: 'row', alignItems: 'center'}}>
                                        <InputGroup onChange={setSandboxServer} placeholder= {interfaceSelected.sandbox_server} id="text-input" />
                                </div>
                            </FormGroup>
                            <Button text={"Save"} minimal={true} onClick={handleServerSave} outlined={true} d/>
                        </Card>
                    </div>
                    {/* <ReactMarkdown>{interfaceSelected.description}</ReactMarkdown> */}
                </div>
                <div style={{paddingTop: 20}}>
                    <Card elevation={2}>
                        <H4>Security Scheme</H4>
                        <H5>Name: {selectedInterfaceSecurityScheme[0].name}</H5>
                        <H5>Type: {selectedInterfaceSecurityScheme[0].type}</H5>
                        <ReactMarkdown>{selectedInterfaceSecurityScheme[0].description}</ReactMarkdown>
                    </Card>
                </div> 
            </div>
        </div>
            

      )
}

export default InterfacePreview