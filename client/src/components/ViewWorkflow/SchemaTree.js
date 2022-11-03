import React , {Component,useCallback, useContext, useEffect, useState } from 'react'
import '@blueprintjs/core/lib/css/blueprint.css';
import { Tree, Classes as Popover2Classes, ContextMenu, Tooltip2 } from "@blueprintjs/core";
import { Select2 } from "@blueprintjs/select";
import { IconNames } from "@blueprintjs/icons";
import axios from "axios";
import '@blueprintjs/core/lib/css/blueprint.css';


function SchemaTree ({ projectId, interfaces, actions, trigger}) {

    const [isOpen, setIsOpen] = React.useState(true)
    const contentSizing = { popoverProps: { popoverClassName: Popover2Classes.POPOVER_CONTENT_SIZING } };
    const sampleData = [
        {
            id: 5, label: "Schema Parent",
            isExpanded: isOpen,
            childNodes: [
                {
                    id: 0,
                    icon: "folder-close",
                    label: "Folders",
                },
                {
                    id: 1,
                    icon: "user",
                    label: "Profile",
                    childNodes: [
                        { id: 5, label: "No-Icon Item" },
                        { id: 6, icon: "tag", label: "Item 1" },
                        {
                            id: 7,
                            hasCaret: true,
                            icon: "folder-close",
                            label: (
                                <ContextMenu {...contentSizing} content={<div>Hello there!</div>}>
                                    Folder 3
                                </ContextMenu>
                            ),
                            childNodes: [
                                { id: 8, icon: "document", label: "Item 0" },
                                { id: 9, icon: "tag", label: "Item 1" },
                            ],
                        },
                    ],
                },
                {
                    id: 2,
                    icon: "folder-close",
                    label: "Documents"
                }
            ]
        },
    ];


    return (
            <Tree
            contents={sampleData}
            className={Popover2Classes.ELEVATION_0}
            onNodeClick={()=>setIsOpen(true)}
            />
    )

}
  
SchemaTree.defaultProps = {
    params: {
    }
  };


export default SchemaTree;