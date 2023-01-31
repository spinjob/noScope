import {Column, Cell, Table2, TableLoadingOption} from '@blueprintjs/table';
import { Button, Intent,Menu, MenuItem, Checkbox } from '@blueprintjs/core';
import { Classes, Popover2 } from "@blueprintjs/popover2";
import { UserContext } from "../../context/UserContext"
import Loader from "../Loader"
import { useNavigate, useParams} from "react-router-dom";
import React, { useCallback, useContext, useEffect, useRef, useState} from "react"
import axios from 'axios';

export default function CustomerTable({customers, state, selectedCustomers, updateCustomerState, savePartnershipCustomers}) {
    const navigate = useNavigate();
    const loadingOptions = [TableLoadingOption.CELLS]

    const renderEditMenu = (rowIndex) => {
        return (
        <Popover2 content={
            <Menu>
                <MenuItem icon="edit" text="Edit" onClick={() => navigate(`/customers/${customers[rowIndex].key}`)} />
                <MenuItem icon="delete" text="Delete" onClick={() => console.log("Delete")} />
            </Menu>
        } placement={'bottom'} >
             <Button minimal={true} alignText="left" text="..." />
        </Popover2>
        )
    }
    const userNameCellRenderer = (rowIndex) => {
        return <Cell style={{height: 20}}>{customers[rowIndex].name}</Cell>;
    }
    const keyCellRenderer = (rowIndex) => {
        return <Cell style={{height: 20}}>{customers[rowIndex].key}</Cell>;
    }

    const notesCellRenderer = (rowIndex) => {
        return <Cell style={{height: 20}}>{customers[rowIndex].notes}</Cell>;
    }

    const editCellRenderer = (rowIndex) => {
        return <Cell style={{height: 20}}>{renderEditMenu()}</Cell>;
    }
    const emailCellRenderer = (rowIndex) => {
        return <Cell style={{height: 20}}>{customers[rowIndex].email}</Cell>;
    }

    const selectCellRenderer = (rowIndex) => {
        var selected = false;
        for (let i = 0; i < selectedCustomers.length; i++) {
            if (selectedCustomers[i].key == customers[rowIndex].key) {
                selected = true;
            }
        }
        return <Cell style={{height: 20}}><Checkbox defaultChecked={selected} onChange={(e) => updateCustomerState(customers[rowIndex], e)} /></Cell>;
    }

    const generateRowHeights = () => {
        const rowHeights = [];
        for (let i = 0; i < customers.length; i++) {
            rowHeights.push(50);
        }
        return rowHeights;
    }

    return !customers || customers.length == 0 ?  (
        <div style={{width: '80vw', paddingTop: 20}}>
             <Table2 loadingOptions={loadingOptions} numRows={10}>
                <Column name="Key"/>
                <Column name="Name"  />
                <Column name="Email"/>
                <Column name="Notes"  />
                <Column name="Manage"/>
            </Table2>
        </div>
    ) : state == 'Adding' ? (
        <div style={{width: '80vw', paddingTop: 20}}>
        <Table2 numRows={customers.length} columnWidths={[100,200,200,200,400]} rowHeights={generateRowHeights()}>
            <Column name="Select" cellRenderer={selectCellRenderer} />
           <Column name="Key" cellRenderer={keyCellRenderer} />
           <Column name="Name" cellRenderer={userNameCellRenderer} />
           <Column name="Email" cellRenderer={emailCellRenderer} />
           <Column name="Notes" cellRenderer={notesCellRenderer} />
       </Table2>
       <div style={{display: 'flex', justifyContent: 'flex-end', marginTop: 20}}>
              <Button outlined={true} intent={Intent.DANGER} text="Cancel" />
                <Button outlined={true} intent={Intent.SUCCESS} text="Add Selected" onClick={savePartnershipCustomers} />
        </div>
   </div>
    ) : state == 'Viewing' ? (
        <div style={{width: '80vw', paddingTop: 20}}>
        <Table2 numRows={customers.length} columnWidths={[200,200,200,300,150]} rowHeights={generateRowHeights()}>
           <Column name="Key" cellRenderer={keyCellRenderer} />
           <Column name="Name" cellRenderer={userNameCellRenderer} />
           <Column name="Email" cellRenderer={emailCellRenderer} />
           <Column name="Notes" cellRenderer={notesCellRenderer} />
           <Column name="Manage" cellRenderer={editCellRenderer} />
       </Table2>
   </div>
    ) : (
        <div style={{width: '80vw', paddingTop: 20}}>
        <Table2 numRows={customers.length} columnWidths={[200,200,200,300,150]} rowHeights={generateRowHeights()}>
           <Column name="Key" cellRenderer={keyCellRenderer} />
           <Column name="Name" cellRenderer={userNameCellRenderer} />
           <Column name="Email" cellRenderer={emailCellRenderer} />
           <Column name="Notes" cellRenderer={notesCellRenderer} />
           <Column name="Manage" cellRenderer={editCellRenderer} />
       </Table2>
   </div>
    )
}