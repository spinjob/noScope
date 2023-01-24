import {Column, Cell, Table2 } from '@blueprintjs/table';
import { Button, Intent } from '@blueprintjs/core';
import { UserContext } from "../../context/UserContext"
import Loader from "../Loader"
import { useNavigate, useParams} from "react-router-dom";
import React, { useCallback, useContext, useEffect, useState} from "react"
import axios from 'axios';

export default function CustomerTable({customers}) {
    const navigate = useNavigate();

    const userNameCellRenderer = (rowIndex) => {
        return <Cell>{customers[rowIndex].name}</Cell>;
    }

    const keyCellRenderer = (rowIndex) => {
        return <Cell>{customers[rowIndex].key}</Cell>;
    }

    const notesCellRenderer = (rowIndex) => {
        return <Cell>{customers[rowIndex].notes}</Cell>;
    }

    const configurationCellRenderer = (rowIndex) => {
        return <Cell><Button intent={Intent.PRIMARY} onClick={console.log(`${customers[rowIndex]}`)}>Edit</Button></Cell>;
    }

    return (
        <div style={{width: '50vw', paddingTop: 20}}>
             <Table2 numRows={customers.length}>
                <Column name="Key" cellRenderer={keyCellRenderer} />
                <Column name="Name" cellRenderer={userNameCellRenderer} />
                <Column name="Notes" cellRenderer={notesCellRenderer} />
                <Column name="Configuration" cellRenderer={configurationCellRenderer} />
            </Table2>
        </div>
       
    )
}