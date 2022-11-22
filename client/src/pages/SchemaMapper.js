import React, { useCallback, useState, useContext, useEffect } from "react";
import { Overlay, Card } from '@blueprintjs/core';
import { useParams, useLocation } from "react-router-dom";
import Navigation from "../components/Navigation";
import { UserContext } from "../context/UserContext";
import "reactflow/dist/style.css";
import SchemaMapperHeader from "../components/EditWorkflow/SchemaMapperHeader";
import TriggerSchemaMapper from "../components/EditWorkflow/TriggerSchemaMapper";
import SchemaMappingView from "../components/EditWorkflow/SchemaMappingView";
import ActionStepSchemaMapper from "../components/EditWorkflow/ActionStepSchemaMapper";
import FieldMappingOverlay from "../components/EditWorkflow/AdaptionMenu/FieldMappingOverlay";
import "@blueprintjs/core/lib/css/blueprint.css";
import "@blueprintjs/popover2/lib/css/blueprint-popover2.css";
import axios from "axios";

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
    const [mappingDisabled, setMappingDisabled] = useState(true);
    const [interfaceSchema, setInterfaceSchema] = useState(null);
    const [triggerSchema, setTriggerSchema] = useState([]);
    const [actionSchema, setActionSchema] = useState([]);
    const [requiredActionFields, setRequiredActionFields] = useState([]);
    const [mappedActionFields, setMappedActionFields] = useState([]);
    const [shouldFetchMappings, setShouldFetchMappings] = useState(true);
    const [mappings, setMappings] = useState(null);
    const location = useLocation();

    const interfaces = location.state.interfaces;

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

   const updateRequiredSchema = (schemas) => {
      setRequiredActionFields(schemas);
  }

    const storeTriggerSchema = (schemas) => {
      setTriggerSchema(schemas);
    }

    const selectTriggerNode = (node, isSelected) => {

      if (isSelected) {
        setTriggerNode(node);
        setMappingDisabled(false);

      } else { 
        setTriggerNode(emptyNode);
        setMappingDisabled(true);
      }   
    }


   const toggleShouldFetchMappings = (shouldFetch) => {

    if (shouldFetch === true) {
      setShouldFetchMappings(true);

    } else { 
      setShouldFetchMappings(false);
    }    
}

  const handleMappedNodes = (triggerNode, actionNode) => {
      console.log("triggerNode", triggerNode);
      console.log("actionNode", actionNode);
  }

   const selectActionNode = (node, isSelected) => {

        if (isSelected) {
          setActionNode(node);
          setMappingDisabled(false);

        } else { 
          setActionNode(emptyNode);
          setMappingDisabled(true);
        }    
   }

   const toggleOverlay = () => {
     if (mappingViewOpen)
     {
      setMappingViewOpen(false);
    } else {
      setMappingViewOpen(true);
    }
    
  }

    const fetchMappings = useCallback(() => {
      axios.get(process.env.REACT_APP_API_ENDPOINT + "/projects/" + id + "/workflows/" + workflowId + "/details")
      .then(response => {
          setMappings(response.data[0].steps[0].adaptions)
          setShouldFetchMappings(false);
          console.log("fetched mappings")
          return response
      })
      .catch(error => {
          console.log(error);
          setShouldFetchMappings(false);
          return error
      })
  })

    const fetchInterfaceSchemas = useCallback(() => {

        interfaces.forEach(element => {
            axios.get(process.env.REACT_APP_API_ENDPOINT + "/interfaces/" + element + "/objects")
            .then(response => {
                setInterfaceSchema(response.data)
                return(response.data)
            })
            .catch(error => {
                console.log(error);
                return error
            })
        });

    })

    useEffect(() => {
        // fetch only when user details are not present
        if (!userContext.details) {
          fetchUserDetails()
        }
      }, [userContext.details, fetchUserDetails])

      useEffect(() => {
        // fetch only when user details are not present
        if (shouldFetchMappings) {
          fetchMappings()
        }
      }, [fetchMappings, setMappings])


      useEffect(() => {
        // fetch only when user details are not present
        if (!interfaceSchema) {
          fetchInterfaceSchemas()
        }
      }, [])

  return (

    <div style={{justifyContent: 'center',alignItems: 'center'}}>
            <Navigation />
            <SchemaMapperHeader mappings= {mappings} requiredActionFields={requiredActionFields}/>
                <Overlay
                isOpen={mappingViewOpen} 
                onClose={toggleOverlay} 
                canEscapeKeyClose={true} 
                canOutsideClickClose={true}>
                  <div style={{display: 'flex', alignItems: 'center', justifyContent: 'center', height: '50vh', width: '100vw', padding: 30}}>
                    <FieldMappingOverlay handleMappedNodes={handleMappedNodes} setShouldFetchMappings={toggleShouldFetchMappings} field1={triggerNode} field2={actionNode} triggerSchema={triggerSchema} workflowId={workflowId} projectId={id}/> 
                  </div>  
                </Overlay>  
            <div class="SchemaMapperParent">
              <TriggerSchemaMapper selectTriggerNode={selectTriggerNode} storeTriggerSchema={storeTriggerSchema} triggerSchema={triggerSchema}/>
              <SchemaMappingView mappings= {mappings} isActive={mappingDisabled} triggerField={triggerNode} actionField={actionNode} onClick={toggleOverlay} interfaceSchema={interfaceSchema} setShouldFetchMappings={toggleShouldFetchMappings}/>
              <ActionStepSchemaMapper mappings={mappings} selectActionNode={selectActionNode} actionSchema={actionSchema} updateRequiredSchema={updateRequiredSchema}/>
            </div>
  </div>
);
}

export default SchemaMapper;