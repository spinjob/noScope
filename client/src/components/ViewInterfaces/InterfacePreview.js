import { H1, Card, H3, H4, Button, Divider } from "@blueprintjs/core"
import React, { useContext, useState, useCallback, useEffect, useRef } from "react"
import { UserContext } from "../../context/UserContext"
import Loader from "../Loader"
import Navigation from "../Navigation"
import axios from 'axios';
import { useNavigate } from "react-router-dom";

const InterfacePreview = ({interfaceSelected, selectedInterfaceObjects, isLoading, setIsLoading}) => {
   
    const [userContext, setUserContext] = useContext(UserContext)
    console.log(selectedInterfaceObjects)
    console.log(selectedInterfaceObjects[0])
    return interfaceSelected && isLoading ? (
        <Loader />
      ) : selectedInterfaceObjects.length == 0 ? (
        <div>
            <H3>Select an API to Preview</H3>
         </div>
      ) 
      : (
            <div className="container" style={{padding:40}}>
                <Card>
                    <H3>{selectedInterfaceObjects[0].parent_interface_uuid}</H3>
                    <H3># of Schema: {selectedInterfaceObjects.length}</H3>
                </Card>
            </div>

      )
}

export default InterfacePreview