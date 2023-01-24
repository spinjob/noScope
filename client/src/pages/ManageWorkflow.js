import React, {useContext, useCallback, useEffect, useState } from 'react';
import { Button, Intent, Card, Menu, Divider, H1, H2, H3, H4, H5, Tag } from '@blueprintjs/core';
import {Cell, Row, Column, Table2, TruncatedFormat2} from '@blueprintjs/table';
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
import WorkflowLogChart from '../components/ViewWorkflow/WorkflowLogChart';
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
    const [workflowLogs, setWorkflowLogs] = useState([]);
    const navigate = useNavigate();

    console.log(workflowLogs)
   
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

    const fetchWorkflowLogs = useCallback(() => {
        axios.get(process.env.REACT_APP_API_ENDPOINT + "/workflows/"+ workflowId +"/logs")
        .then(response => {
            setWorkflowLogs(response.data)
            return(response.data)
        })
        .catch(error => {
            console.log(error);
            return error
        })
    })

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
            fetchWorkflowLogs();
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
        navigate("/projects/" + id + "/workflows/" + workflowId + "/mapper", { state:{workflow: workflow, project: project, interfaces: project.interfaces} })
    }

  //Execution Log Table - Cell Renderers
    const logTimestampCellRenderer = (rowIndex) => {

     
      return <Cell>{ <TruncatedFormat2 detectTruncation={true}>{workflowLogs[rowIndex].created_at}</TruncatedFormat2>}</Cell>
    }
    const logUuidCellRenderer = (rowIndex) => {
      
      return <Cell>{<TruncatedFormat2 detectTruncation={true}>{workflowLogs[rowIndex].uuid}</TruncatedFormat2>}</Cell>
    }
    const logMessageCellRenderer = (rowIndex) => {
      return <Cell>{<TruncatedFormat2 detectTruncation={true}>{workflowLogs[rowIndex].message}</TruncatedFormat2>}</Cell>
    }
    const logLevelCellRenderer = (rowIndex) => {
      return <Cell>{<TruncatedFormat2 detectTruncation={true}>{workflowLogs[rowIndex].level}</TruncatedFormat2>}</Cell>
     }

     const renderWorkflowStatus = () => {
        if (workflow.status == 'active') {
            return <Tag large="true" minimal="true" intent="success">Active</Tag>
        } else if (workflow.status == 'inactive') {
            return <Tag large="true" minimal="true" intent="danger">Disabled</Tag>
        } else if (workflow.status == 'needs_mapping') {
            return <Tag large="true" minimal="true" intent="warning">Mapping Incomplete</Tag>
        }
     }
      
    const onConnect = useCallback(
        (params) => setEdges((eds) => addEdge(params, eds)),
        [setEdges]
      );

      // const renderSchemaViewer = () => {
      //   if (!project) {
      //       return <SchemaViewer workflow={workflow} />
      //   } else if (!project.interfaces) {
      //       return <SchemaViewer workflow={workflow} />
      //   } else {
      //       return <SchemaViewer workflow={workflow} interfaces={project.interfaces} />
      //   }
      // }

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
        } else {
        }
      }, [])  

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
              <H2 style={{padding:15}}>{workflow.name}</H2>
              <div style={{paddingLeft:15, paddingBottom: 50}}>
                {renderWorkflowStatus()}
                <Button style={{marginLeft: 10}} onClick={schemaMapperButtonHandler} intent="primary" icon="edit" text="Edit Schema Mapping" />
              </div>
              <H4 style={{paddingLeft:15}}>Trigger URL</H4>
              <body style={{paddingLeft:15, paddingTop:15}}>{process.env.REACT_APP_API_ENDPOINT + "/projects/" + id + "/workflows/" + workflowId + "/trigger"}</body> 
              {/* <div style={{padding: 15}}>
                <Card>
                  <WorkflowLogChart/>
                </Card>  
              </div> */}
            </div>
          
            <div class="ManageProjectParent" >
                <div class="ManageProjectChild1">
                <H3 style={{padding:15}}>Workflow Overview</H3> 
                <div style={{paddingLeft:15, paddingBottom: 20}}>
                  <Button outlined={true} style={{height: 5}} intent="primary" icon="manual" text="Generate Documentation" />
                </div>
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
                <H3 style={{padding:15}}>Execution Logs</H3> 
                    <Card elevation={3} style={{display: 'flex', alignItems: 'center', margin: 10, height: "90vh"}}>
                        <Table2 columnWidths={[200,100, 600]} numRows={workflowLogs.length} style={{width: '100%'}}>
                            <Column name="Timestamp" cellRenderer={logTimestampCellRenderer}/>
                            <Column name="Level" cellRenderer={logLevelCellRenderer}/>
                            <Column name="Message" cellRenderer={logMessageCellRenderer}/>
                        </Table2>
                    </Card>
                </div>
            </div>
        </div>
      )

}

export default ManageWorkflow;