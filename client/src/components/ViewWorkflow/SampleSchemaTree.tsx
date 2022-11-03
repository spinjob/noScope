import cloneDeep from "lodash/cloneDeep";
import * as React from "react";

import { Classes, Icon, Intent, Tree, TreeNodeInfo } from "@blueprintjs/core";
import { Example, ExampleProps } from "@blueprintjs/docs-theme";
import { ContextMenu2, Classes as Popover2Classes, Tooltip2 } from "@blueprintjs/popover2";

type NodePath = number[];

type TreeAction =
    | { type: "SET_IS_EXPANDED"; payload: { path: NodePath; isExpanded: boolean } }
    | { type: "DESELECT_ALL" }
    | { type: "SET_IS_SELECTED"; payload: { path: NodePath; isSelected: boolean } };

function forEachNode(nodes: TreeNodeInfo[] | undefined, callback: (node: TreeNodeInfo) => void) {
    if (nodes === undefined) {
        return;
    }

    for (const node of nodes) {
        callback(node);
        forEachNode(node.childNodes, callback);
    }
}

function forNodeAtPath(nodes: TreeNodeInfo[], path: NodePath, callback: (node: TreeNodeInfo) => void) {
    callback(Tree.nodeFromPath(path, nodes));
}

function treeExampleReducer(state: TreeNodeInfo[], action: TreeAction) {
    switch (action.type) {
        case "DESELECT_ALL":
            const newState1 = cloneDeep(state);
            forEachNode(newState1, node => (node.isSelected = false));
            return newState1;
        case "SET_IS_EXPANDED":
            const newState2 = cloneDeep(state);
            forNodeAtPath(newState2, action.payload.path, node => (node.isExpanded = action.payload.isExpanded));
            return newState2;
        case "SET_IS_SELECTED":
            const newState3 = cloneDeep(state);
            forNodeAtPath(newState3, action.payload.path, node => (node.isSelected = action.payload.isSelected));
            return newState3;
        default:
            return state;
    }
}

export const TreeExample: React.FC<ExampleProps> = props => {
    const [nodes, dispatch] = React.useReducer(treeExampleReducer, INITIAL_STATE);

    const handleNodeClick = React.useCallback(
        (node: TreeNodeInfo, nodePath: NodePath, e: React.MouseEvent<HTMLElement>) => {
            const originallySelected = node.isSelected;
            if (!e.shiftKey) {
                dispatch({ type: "DESELECT_ALL" });
            }
            dispatch({
                payload: { path: nodePath, isSelected: originallySelected == null ? true : !originallySelected },
                type: "SET_IS_SELECTED",
            });
        },
        [],
    );

    const handleNodeCollapse = React.useCallback((_node: TreeNodeInfo, nodePath: NodePath) => {
        dispatch({
            payload: { path: nodePath, isExpanded: false },
            type: "SET_IS_EXPANDED",
        });
    }, []);

    const handleNodeExpand = React.useCallback((_node: TreeNodeInfo, nodePath: NodePath) => {
        dispatch({
            payload: { path: nodePath, isExpanded: true },
            type: "SET_IS_EXPANDED",
        });
    }, []);

    return (
        <Example options={false} {...props}>
            <Tree
                contents={nodes}
                onNodeClick={handleNodeClick}
                onNodeCollapse={handleNodeCollapse}
                onNodeExpand={handleNodeExpand}
                className={Classes.ELEVATION_0}
            />
        </Example>
    );
};

const contentSizing = { popoverProps: { popoverClassName: Popover2Classes.POPOVER2_CONTENT_SIZING } };

/* tslint:disable:object-literal-sort-keys so childNodes can come last */
const INITIAL_STATE: TreeNodeInfo[] = [
    {
        id: 1,
        icon: "cube",
        isExpanded: true,
        label: (
            <ContextMenu2 {...contentSizing} content={<div>Hello there!</div>}>
                <Tooltip2 content="I'm a folder <3" placement="right">
                   Object
                </Tooltip2>
            </ContextMenu2>
        ),
        childNodes: [
            {
                id: 2,
                icon: "citation",
                label: "String",
                secondaryLabel: (
                    <Tooltip2 content="Required!">
                        <Icon icon="asterisk" color="red" />
                    </Tooltip2>
                ),
            },
            {
                id: 3,
                icon: <Icon icon="citation" intent={Intent.PRIMARY} className={Classes.TREE_NODE_ICON} />,
                label: "String",
            },
            {
                id: 4,
                hasCaret: true,
                icon: "cube",
                label: (
                    <ContextMenu2 {...contentSizing} content={<div>Hello there!</div>}>
                        <Tooltip2 content="foo" placement="right">
                            Object
                        </Tooltip2>
                    </ContextMenu2>
                ),
                childNodes: [
                    { id: 6, icon: "numerical", label: "Number" },
                    {
                        id: 7,
                        hasCaret: true,
                        icon: "cube",
                        label: (
                            <ContextMenu2 {...contentSizing} content={<div>Hello there!</div>}>
                                Object
                            </ContextMenu2>
                        ),
                        childNodes: [
                            { id: 8, icon: "floating-point", label: "Float" },
                            { id: 9, icon: "array", label: "Array" },
                        ],
                    },
                ],
            },
        ],
    }
];