import { Classes, Drawer, Menu, DrawerSize, Position, Button, Navbar, NavbarHeading, NavbarGroup, NavbarDivider, FileInput } from "@blueprintjs/core"
import React, { useCallback, useContext, useEffect, useState } from "react"
import { MenuItem2, MenuItem2Props } from "@blueprintjs/popover2";
import { UserContext } from "../context/UserContext"
import Loader from "./Loader"
import { useNavigate } from "react-router-dom";
import "../styles/workflowStudioStyles.css";

const SideBar = ({isOpen, setIsSideBarOpen}) => {

  const navigate = useNavigate();

  const onClose = () => {
    setIsSideBarOpen(false);
  }

  const handleMonitor = () => {
  
  }

  const handleWorkflowStudio = () => {
    
  }

  const handleIntegrations = () =>{
    navigate('/projects');
  }
  const handleAPIExplorer = () => {

  }


  return (
    <div>
        <Drawer title="Navigation" onClose={onClose} isOpen={isOpen} hasBackdrop={false} position={Position.LEFT} canEscapeKeyClose={true} canOutsideClickClose={true} size={'300px'}>
            <div className={Classes.DRAWER_BODY}>
                  <div className={Classes.DIALOG_BODY}>
                        <Menu>
                          <MenuItem2 icon="flows" text="Integrations" onClick={handleIntegrations} />
                          <MenuItem2 icon="edit" text="Workflow Studio" onClick={handleWorkflowStudio} />
                          <MenuItem2 icon="search-around" text="API Explorer" onClick={handleAPIExplorer} />
                          <MenuItem2 icon="step-chart" text="Monitor" onClick={handleMonitor}/>
                      </Menu>
                    </div>
                </div>
                  <div className={Classes.DRAWER_FOOTER}>
            </div>
        </Drawer>
   </div>     
  )
}

export default SideBar