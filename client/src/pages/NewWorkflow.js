import React, { useCallback, useState } from "react";
import ReactFlow, {
  addEdge,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState
} from "reactflow";
import "reactflow/dist/style.css";
import Navigation from "../components/Navigation";
import CreateTriggerForm from "../components/CreateTriggerForm";
import {Drawer, Classes, Icon} from "@blueprintjs/core";
import axios from "axios";
import FloatingActionButton from "../components/FloatingActionButton/FloatingActionButton.jsx";
import { FcAbout, FcBusinessman, FcCamera, FcFullTrash } from "react-icons/fc";

import {
  nodes as initialNodes,
  edges as initialEdges
} from "./initial-elements";

const onInit = (reactFlowInstance) =>
  console.log("flow loaded:", reactFlowInstance);
  

const OverviewFlow = () => {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const onConnect = useCallback(
    (params) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const [isDrawerOpen, setIsDrawerOpen] = useState(true);
  const onClose = () => setIsDrawerOpen(false);
  const onOpen = () => setIsDrawerOpen(true);


  const floatingButtonActions = [
    { label: "Triggers", icon: <Icon icon="play"/>, onClick: onOpen },
    { label: "Actions", icon: <FcBusinessman />, onClick: console.log },

  ];


  return (
   <div style={{height: 1000, width: 1400}}>  
      <FloatingActionButton actions={floatingButtonActions}/>
      <Navigation />
      <Drawer
        isOpen={isDrawerOpen}
        icon="flow: branch"
        title="Workflow Editor"
        hasBackdrop={true}
        canEscapeKeyClose={true}
        canOutsideClickClose={true}
        onClose={onClose}>
        <div className={Classes.DRAWER_BODY}>
          <div className={Classes.DIALOG_BODY}>
            <CreateTriggerForm nodes={{initialNodes}}/>
          </div>
        </div>
        <div className={Classes.DRAWER_FOOTER}>Drawer Footer</div>
      </Drawer>
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
        {/* <MiniMap
          nodeStrokeColor={(n) => {
            if (n.style?.background) return n.style.background;
            if (n.type === "input") return "#0041d0";
            if (n.type === "output") return "#ff0072";
            if (n.type === "default") return "#1a192b";
            return "#eee";
          }}
          nodeColor={(n) => {
            if (n.style?.background) return n.style.background;

            return "#fff";
          }}
          nodeBorderRadius={2}
      /> */}
      <Controls />
      <Background color="#aaa" gap={16} />
    </ReactFlow>
   </div>
   
   
  );
};

export default OverviewFlow;
