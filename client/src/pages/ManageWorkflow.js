import React, {useContext, useCallback, useEffect, useState } from 'react';
import { Button, Intent, Card, Menu, Divider, H1, H2, H3, H4, H5 } from '@blueprintjs/core';
import { UserContext} from '../context/UserContext';
import { useNavigate, useParams } from 'react-router-dom';
import Navigation from '../components/Navigation';
import Loader from '../components/Loader';
import ReactFlow, {
    addEdge,
    Controls,
    Background,
    useNodesState,
    useEdgesState
  } from "reactflow";
import axios from 'axios';
import SchemaViewer from '../components/ViewWorkflow/SchemaViewer';

import "reactflow/dist/style.css";
  
const onInit = (reactFlowInstance) =>
    console.log("flow loaded:", reactFlowInstance);

const ManageWorkflow = () => {
    const [userContext, setUserContext] = useContext(UserContext)
    let {id, workflowId} = useParams();
    const [workflow, setWorkflow] = useState(null);
    const [project, setProject] = useState(null);
    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);
    const navigate = useNavigate();

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

    const formatFlowInputs = (nodes, edges) => {
        
        let formattedNodes = nodes.map(node => {
            return delete node._id
        })

        let formattedEdges = edges.map(edge => {
            return delete edge._id
        })

        setNodes(formattedNodes)
        setEdges(formattedEdges)

        return {
            nodes: formattedNodes,
            edges: formattedEdges
        }
    }

    const fetchWorkflowDetails = useCallback(() => {

        axios.get(process.env.REACT_APP_API_ENDPOINT + "/projects/" + id + "/workflows/"+ workflowId +"/details")
        .then(response => {
            setWorkflow(response.data[0]);
            formatFlowInputs(response.data[0].nodes, response.data[0].edges)
            return(response.data)
        })
        .catch(error => {
            console.log(error);
            return error
        })

    })
     
    const fetchProjectDetails = useCallback(() => { 
        axios.get(process.env.REACT_APP_API_ENDPOINT + "/projects/" + id + "/details")
        
        .then(response => {
            setProject(response.data[0])
            return response
        }
        )
        .catch(error => {
            console.log(error);
            return error
        })
    });

    const schemaMapperButtonHandler = () => {
        navigate("/projects/" + id + "/workflows/" + workflowId + "/mapper", { state:{workflow: workflow, project: project} })
    }
      
    const onConnect = useCallback(
        (params) => setEdges((eds) => addEdge(params, eds)),
        [setEdges]
      );

      const renderSchemaViewer = () => {
        if (!project) {
            return <SchemaViewer workflow={workflow} />
        } else if (!project.interfaces) {
            return <SchemaViewer workflow={workflow} />
        } else {
            return <SchemaViewer workflow={workflow} interfaces={project.interfaces} />
        }
      }

      const constructTriggerUrl = () => {
        return process.env.REACT_APP_API_ENDPOINT + "/projects/" + id + "/workflows/" + workflowId + "/trigger/" + workflow.trigger.uuid
      }

    useEffect(() => {
        // fetch only when user details are not present
        if (!userContext.details) {
          fetchUserDetails()
        }
      }, [userContext.details, fetchUserDetails])   

    useEffect(() => {
        // fetch only when user details are not present
        if (!workflow) {
          fetchWorkflowDetails()
        }
      }, [workflow, fetchWorkflowDetails])  

      useEffect(() => {
        // fetch only when user details are not present
        if (!project) {
            fetchProjectDetails()
        }
      }, [project, fetchProjectDetails])   


      return userContext.details === null ? (
        "Error Loading User details"
      ) : !userContext.details ? (
        <Loader />
      ) : !workflow ? ( 
        <Loader />
     ) : (
        <div>
            <Navigation />
            <div className="container" style={{padding:40}}>
                <H2 >Manage Workflow</H2>
            </div>
            <Divider />  
            <div style={{padding:40}}>
              <H2 style={{paddingBottom: 40}}>{workflow.name}</H2>
              <H4>Trigger URL</H4>
              <body>{process.env.REACT_APP_API_ENDPOINT + "/projects/" + id + "/workflows/" + workflowId + "/trigger"}</body> 
                  
            </div>
          
            <div class="ManageProjectParent" >
                <div class="ManageProjectChild1">
                <H3 style={{padding:15}}>Workflow Diagram</H3>   
                <Card elevation={3} style={{display: 'flex', alignItems: 'center', margin: 10, height: "90vh"}}>
                    <ReactFlow
                        nodes={workflow.nodes}
                        edges={workflow.edges}
                        onNodesChange={onNodesChange}
                        onEdgesChange={onEdgesChange}
                        onConnect={onConnect}
                        onInit={onInit}
                        fitView
                        attributionPosition="top-right"
                    >
                        <Controls />
                        <Background color="#aaa" gap={16} />
                    </ReactFlow>
                </Card>      
                </div> 
                <div class="ManageProjectChild2">
                <H3 style={{padding:15}}>Schema Preview</H3> 
                    <Card elevation={3} style={{display: 'flex', margin: 10, height: "100vh"}}>
                        {renderSchemaViewer()}
                    </Card>
                </div>
            </div>
        </div>
      )

}

export default ManageWorkflow;