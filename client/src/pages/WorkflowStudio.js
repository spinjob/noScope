import React, { useCallback } from "react";
import { useParams } from "react-router-dom";
import Navigation from "../components/Navigation";
import WorkflowForm from "../components/WorkflowForm";

import "./workflowStudioStyles.css";
import ReactFlow, {
  addEdge,
  Controls,
  Background,
  useNodesState,
  useEdgesState
} from "reactflow";
import "reactflow/dist/style.css";
// import {
//   nodes as initialNodes,
//   edges as initialEdges
// } from "./initial-elements";

const onInit = (reactFlowInstance) =>
  console.log("flow loaded:", reactFlowInstance);

const WorkflowStudio = () => {
    let { id } = useParams();

    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  
    const onConnect = useCallback(
      (params) => setEdges((eds) => addEdge(params, eds)),
      [setEdges]
    );

    const handleNewNode = (node, type) => {    
        const triggerX = 0;
        const triggerY = 20;

        if (type === "trigger") {
            
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
        }  else if (type === "action" && node.method in ("post","put")) {

            
        }
            
           
    }

  return (

    <div>
        <body>
            <Navigation />
            <div class="Parent">
                <div class="child1">
                <WorkflowForm projectId={id} handleNewNode={handleNewNode} />
                {/* <CreateTriggerForm projectId={id} handleNewNode={handleNewNode} /> */}
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
