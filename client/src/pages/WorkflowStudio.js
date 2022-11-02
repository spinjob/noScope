import React, { useCallback, useState, useContext, useEffect } from "react";
import { useParams } from "react-router-dom";
import Navigation from "../components/Navigation";
import WorkflowForm from "../components/CreateWorkflow/WorkflowForm";
import { UserContext } from "../context/UserContext";
import {useNavigate } from "react-router-dom";

import "../styles/workflowStudioStyles.css";
import ReactFlow, {
  addEdge,
  Controls,
  Background,
  useNodesState,
  useEdgesState
} from "reactflow";
import "reactflow/dist/style.css";
import axios from "axios";
import {v4 as uuidv4} from 'uuid';

// import {
//   nodes as initialNodes,
//   edges as initialEdges
// } from "./initial-elements";

const onInit = (reactFlowInstance) =>
  console.log("flow loaded:", reactFlowInstance);

const WorkflowStudio = () => {
    let { id } = useParams();
    const navigate = useNavigate();

    const [userContext, setUserContext] = useContext(UserContext)
    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);
    const [trigger, setTrigger] = useState({});
    //turn into array to support more than one action
    const [action, setAction] = useState({});

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

      useEffect(() => {
        // fetch only when user details are not present
        if (!userContext.details) {
          fetchUserDetails()
        }
      }, [userContext.details, fetchUserDetails])
  
    const onConnect = useCallback(
      (params) => setEdges((eds) => addEdge(params, eds)),
      [setEdges]
    );

    const createWorkflow = (workflowName) => {
        const workflowUuid = uuidv4();
        const stepUuid = uuidv4();
        const triggerUuid = uuidv4()
        const workflowStep = {
            uuid: stepUuid,
            sequence: 1,
            type: 'httpRequest',
            parent_workflow_uuid: workflowUuid,
            request: {
                path: action.path,
                parameters: action.parameters,
                method: action.method,
                parent_interface_uuid: action.parent_interface_uuid,
                request_body: action.request_body
            }
        }

        const workflowTrigger = {
            uuid: triggerUuid,
            sequence: 0,
            type: 'httpWebhook',
            parent_workflow_uuid: workflowUuid,
            webhook: {
                uuid: trigger.uuid,
                name: trigger.name,
                parameters: trigger.parameters,
                method: trigger.method,
                request_body: trigger.request_body,
                responses: trigger.responses
            }
        }

        const workflow = {
            uuid: workflowUuid,
            name: workflowName,
            parent_project_uuid: id,
            steps: [workflowStep],
            trigger: workflowTrigger,
            created_at: new Date().toISOString().replace(/T/, ' ').replace(/\..+/, ''),
            updated_at: new Date().toISOString().replace(/T/, ' ').replace(/\..+/, ''),
            created_by: userContext.details._id,
            nodes: nodes,
            edges: edges
        }

        console.log(nodes[0])
        console.log(edges[0])

        axios.post(process.env.REACT_APP_API_ENDPOINT + "/projects/"+ id +"/workflows", workflow)
            .then(response => {  

                console.log(response.data)

                axios.put(process.env.REACT_APP_API_ENDPOINT + "/projects/"+id, workflow)
                .then(response => {  

                    navigate("/projects/" + id + "/workflows/"+workflowUuid,{state:{projectID: id, workflowID: workflowUuid}});
                })
                .catch(error => { 
                    console.log(error);
                })


            })
            .catch(error => { 
                console.log(error);
            })

    }


    const handleNewNode = (node, type) => {    
        const triggerX = 0;
        const triggerY = 20;

        if (type === "trigger") {

            setTrigger(node);
            
            const triggerNodes =  [{
                id: "trigger",
                type: "input",
                data: {
                label: node.name
                },
                position: { x: triggerX, y: triggerY },
                style: {
                    width: 170,
                    height: 140,
                  }
            }]

            const schemaY = 50
            node.requestBody.schema.forEach( function (schema, index) {

                const childNode = {
                    id: "trigger_schema"+index,
                    type: "input",
                    data: {
                    label: schema
                    },
                    position: { x: 10, y: (40+index*schemaY) },
                    parentNode: "trigger",
                    draggable: false,
                    connectable: false,
                    extent: "parent"
                }

                triggerNodes.push(childNode);
                
            });

            setNodes(nodes => [...nodes, ...triggerNodes]);

        } else if (type === "action" && node.method == "get") {

            setAction(node);

            const actionNodeHeight = (node.responses.length * 50) + 20
            const actionNodeId = "action_"+(nodes.length+1)
            const actionEdgeLabel = node.method+ " " +node.path

            const actionNodes =  [{
                id: actionNodeId,
                type: "default",
                data: {
                label: node.name
                },
                position: { x: triggerX, y: 200},
                style: {
                    width: 170,
                    height: actionNodeHeight,
                  }
            }]

            const actionEdge =  {
                    id: "etrigger-"+actionNodeId,
                    source: "trigger",
                    target: actionNodeId,
                    animated: true,
                    label: actionEdgeLabel
            }

            node.responses.forEach( function (response, index) {

                const childNode = {
                     id: "action_response_schema"+index,
                     type: "input",
                      data: {
                        label: response.http_status_code
                       },
                    position: { x: 10, y: (40+(45*index)) },
                    parentNode: actionNodeId,
                    draggable: true,
                    connectable: false,
                    extent: "parent", 
                    style: {
                        width: 150,
                        height: 40,
                      }
               }

                 actionNodes.push(childNode);
                    
         });

            setNodes(nodes => [...nodes, ...actionNodes]);
            setEdges(edges => [...edges, actionEdge]);
        }  else if (type === "action" && node.method == "post"||"put") {

            setAction(node);
            
            if (node.requestBody != null){
                const actionNodeHeight = (node.requestBody.schema.length * 50) + 40
                const actionNodeId = "action_"+(nodes.length+1)
                const actionEdgeLabel = node.method+ " " +node.path

                const actionNodes =  [{
                    id: actionNodeId,
                    type: "default",
                    data: {
                    label: node.name
                    },
                    position: { x: triggerX, y: 200 },
                    style: {
                        width: 170,
                        height: actionNodeHeight,
                    }
                }]

                const actionEdge =  {
                    id: "etrigger-"+actionNodeId,
                    source: "trigger",
                    target: actionNodeId,
                    animated: true,
                    label: actionEdgeLabel
                }

                const schemaY = 50
                node.requestBody.schema.forEach( function (schema, index) {

                    const childNode = {
                        id: "action_request_schema"+index,
                        type: "input",
                        data: {
                        label: schema
                        },
                        position: { x: 10, y: (40+index*schemaY) },
                        parentNode: actionNodeId,
                        draggable: false,
                        connectable: false,
                        extent: "parent"
                    }

                    actionNodes.push(childNode);
                    
                });

                setNodes(nodes => [...nodes, ...actionNodes]);
                setEdges(edges => [...edges, actionEdge]);

            }
                        
        }
            
           
    }

  return (

    <div>
        <body>
            <Navigation />
            <div class="Parent">
                <div class="child1">
                <WorkflowForm 
                    projectId={id} 
                    handleNewNode={handleNewNode} 
                    createWorkflow={createWorkflow}/>
                </div>
                <div class="child2">
                    <ReactFlow
                        nodes={nodes}
                        edges={edges}
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
                    </div>
            </div>
        </body>
  </div>
);
}

export default WorkflowStudio;
