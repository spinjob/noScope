import React, { useCallback, useState, useContext, useEffect } from "react";
import { Overlay, Card } from '@blueprintjs/core';

import { useParams } from "react-router-dom";
import Navigation from "../components/Navigation";
import { UserContext } from "../context/UserContext";
import "reactflow/dist/style.css";
import SchemaMapperHeader from "../components/EditWorkflow/SchemaMapperHeader";
import TriggerSchemaMapper from "../components/EditWorkflow/TriggerSchemaMapper";
import SchemaMappingView from "../components/EditWorkflow/SchemaMappingView";
import ActionStepSchemaMapper from "../components/EditWorkflow/ActionStepSchemaMapper";
import "@blueprintjs/core/lib/css/blueprint.css";
import "@blueprintjs/popover2/lib/css/blueprint-popover2.css";

const SchemaMapper = () => {
    let { id, workflowId } = useParams();

    const emptyNode = {
        label: "",
        nodeData: {
            type: "",
            description: "",
            uuid: ""
        }
    }

    const [userContext, setUserContext] = useContext(UserContext)
    const [actionNode, setActionNode] = useState(emptyNode);
    const [triggerNode, setTriggerNode] = useState(emptyNode);
    const [mappingViewOpen, setMappingViewOpen] = useState(false);

    const fetchUserDetails = useCallback(() => {
        fetch(process.env.REACT_APP_API_ENDPOINT + "/users/me", {
          method: "GET",
          credentials: "include",
          // Pass authentication token as bearer token in header
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${userContext.token}`,
          },
        }).then(async response => {
          if (response.ok) {
            const data = await response.json()
            setUserContext(oldValues => {
              return { ...oldValues, details: data }
            })
          } else {
            if (response.status === 401) {
              // Edge case: when the token has expired.
              // This could happen if the refreshToken calls have failed due to network error or
              // User has had the tab open from previous day and tries to click on the Fetch button
              window.location.reload()
            } else {
              setUserContext(oldValues => {
                return { ...oldValues, details: null }
              })
            }
          }
        })
      }, [setUserContext, userContext.token])


    const selectTriggerNode = (node) => {
      setTriggerNode(node);
      console.log(node)
     }
    

   const selectActionNode = (node) => {
       setActionNode(node);
       console.log(node)
   }

   const toggleOverlay = () => {
     if (mappingViewOpen)
      {
        setMappingViewOpen(false);
      } else {
        setMappingViewOpen(true);
      }
    
  }

    useEffect(() => {
        // fetch only when user details are not present
        if (!userContext.details) {
          fetchUserDetails()
        }
      }, [userContext.details, fetchUserDetails])

  return (

    <div style={{justifyContent: 'center',alignItems: 'center'}}>
            <Navigation />
            <SchemaMapperHeader />

              <Overlay
              isOpen={mappingViewOpen} 
              onClose={toggleOverlay} 
              canEscapeKeyClose={true} 
              canOutsideClickClose={true}>
                <div 
                style={{display: 'flex', alignItems: 'center', justifyContent: 'center', height: '50vh', width: '100vw', padding: 30}}>
                <Card elevation={3} style={{alignItems: 'center', margin: 10}}>
                    <p>Mapping</p>  
                  </Card> 
                </div>  
              </Overlay>
            
            <div class="SchemaMapperParent">
              <TriggerSchemaMapper selectTriggerNode={selectTriggerNode} />
              <div>
                <SchemaMappingView triggerField={triggerNode} actionField={actionNode} onClick={toggleOverlay}/>
              </div>
              <ActionStepSchemaMapper selectActionNode={selectActionNode} />
            </div>
  </div>
);
}

export default SchemaMapper;