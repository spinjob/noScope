import { H1, Card, H3, H4, H5, Button, Divider } from "@blueprintjs/core"
import React, { useContext, useState, useCallback, useEffect, useRef } from "react"
import { UserContext } from "../../context/UserContext"
import Loader from "../Loader"
import ReactMarkdown from "react-markdown"
import Navigation from "../Navigation"
import axios from 'axios';
import { useNavigate } from "react-router-dom";

const InterfacePreview = ({interfaceSelected, selectedInterfaceSecurityScheme, selectedInterfaceActions, selectedInterfaceWebhooks, selectedInterfaceObjects, isLoading, setIsLoading}) => {
   
    const [userContext, setUserContext] = useContext(UserContext)
    
    return interfaceSelected && isLoading ? (
        <Loader />
      ) : selectedInterfaceObjects.length == 0 ? (
        <div>
            <H3>Select an API to Preview</H3>
         </div>
      ) 
      : (
            <div className="container" style={{padding:40}}>
                <div>
                    <H1>{interfaceSelected.name}</H1>
                    <ReactMarkdown>{interfaceSelected.description}</ReactMarkdown>
                    <Card>
                        <H5># of Schema: {selectedInterfaceObjects.length}</H5>
                        <H5># of Actions: {selectedInterfaceActions.length}</H5>
                        <H5># of Webhooks: {selectedInterfaceWebhooks.length}</H5>
                    </Card>

                </div>
                <Divider />
                <Card>
                    <H4>Security Scheme</H4>
                    <H5>Name: {selectedInterfaceSecurityScheme[0].name}</H5>
                    <H5>Type: {selectedInterfaceSecurityScheme[0].type}</H5>
                    <ReactMarkdown>{selectedInterfaceSecurityScheme[0].description}</ReactMarkdown>
                   
                </Card>
            </div>

      )
}

export default InterfacePreview