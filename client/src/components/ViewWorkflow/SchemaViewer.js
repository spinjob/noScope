import React, {Component,useCallback, useContext, useEffect, useState } from 'react'
import { Tab, Tabs, Tree, Classes, Button, MenuItem, H5 } from "@blueprintjs/core";
import { Select2 } from "@blueprintjs/select";
import { IconNames } from "@blueprintjs/icons";
import axios from "axios";
import SchemaTree from "./SchemaTree"
import {TreeExample} from "./SampleSchemaTree.tsx"

function SchemaViewer ({ projectId, interfaces, actions, trigger}) {

    const [currentTab, setCurrentTab] = useState("login")

    return (
        <div>
            <H5>Schema Viewer</H5>
            <p>View the schema for your workflow.</p>
            <Tabs id="SchemaPreviewTabs" selectedTabId="1" style={{height:"90vh"}}>
                <Tab id="1" title="TriggerSchemas" panel={<TreeExample style={{width:200}}/>}/>
                <Tab id="2" title="ActionSchemas"></Tab>
            </Tabs>
        </div>
    )

}
  
SchemaViewer.defaultProps = {
    params: {
    }
  };


export default SchemaViewer;