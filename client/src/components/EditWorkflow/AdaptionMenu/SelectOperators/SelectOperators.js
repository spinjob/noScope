
import React from 'react'
import { Menu, MenuItem, Icon, Position, Button, ButtonGroup } 
    from '@blueprintjs/core';
import '@blueprintjs/core/lib/css/blueprint.css';
import '@blueprintjs/icons/lib/css/blueprint-icons.css'
import { Popover2 } from '@blueprintjs/popover2';

const SelectOperators = ({inputType}) => {

    const returnTypedOperators = (type) => {
        
        if (type==="string"){
            console.log("string")
            return stringOperators
        } if (type==="float" || type==="integer"){
            console.log("number")
            return numericalOperators
        }
    }
    const numericalOperators = () => (
        <Menu>
            <MenuItem text= "Add" icon="plus" />
            <MenuItem text= "Subtract" icon="minus" />
            <MenuItem text= "Divide" icon="divide"/>
            <MenuItem text="Multiply" icon="cross" />
        </Menu>
    )
    
    const stringOperators = () => (
        <Menu>
            <MenuItem text="Append" icon="unresolve" />
            <MenuItem text="Prepend" icon="unresolve" />
            <MenuItem text= "Split" icon="flow-review" />
            <MenuItem text="Slice" icon="cut" />
            <MenuItem text= "Strip Whitespace" icon="dot" />
        </Menu>
    )
    return (
        <div>
            <Popover2> 
                {returnTypedOperators(inputType)}
            </Popover2>
            {/* <Popover2 content={returnTypedOperators(inputType)}>
            </Popover2> */}
        </div>
    )

}

export default SelectOperators