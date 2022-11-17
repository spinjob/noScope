import React from "react"
import {Menu, MenuDivider, MenuItem, Props} from "@blueprintjs/core"

const OperatorMenu = ({addTag}) => {

    return (
        <Menu>
            <MenuItem text="Add" icon="plus" onClick={addTag}/>
            <MenuItem text="Subtract" icon="minus" onClick={addTag}/>
            <MenuItem text="Multiply" icon="small-cross" onClick={addTag}/>
            <MenuItem text="Divide" icon="divide" onClick={addTag}/>
            <MenuItem text="Exponent" icon="chevron-up" onClick={addTag}/>
        </Menu>
    )
}

export default OperatorMenu