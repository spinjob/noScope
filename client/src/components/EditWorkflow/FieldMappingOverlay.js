
import React, { useCallback, useState, useContext, useEffect } from "react";
import { Button, Icon, Intent, Card, RadioGroup, ButtonGroup, Overlay, Menu, Divider, H1, H2, H3, H4, H5, Radio, TextArea, Tag, TagInput } from '@blueprintjs/core';
import OperatorMenu from "./AdaptionMenu/OperatorMenu";
import { Popover2 } from "@blueprintjs/popover2";
import "reactflow/dist/style.css";

const FieldMappingOverlay = ({field1, field2, interfaceSchema}) => {
    const [selectedValue, setSelectedValue] = useState("one");
    const [formulaTags, setFormulaTags] = useState([field1.label]);

        const handleRadioChange = (e) => {
            console.log(field1.label)
            setSelectedValue(e.target.value)
        }

        const displayAdaptionStudio = () => {
            if (selectedValue === "one") {
                return "none"
            } else {
                return "block"
            }
        }

        const addTag = (e) => {
            console.log(e.target.innerText)
            // if (e.target.innerText === "Add") {
            //     setFormulaTags([...formulaTags, "+"])
            //     console.log(formulaTags)
            // }
        }
        
    return (

        <div style={{display: 'flex', alignItems: 'center', justifyContent: 'center', height: '50vh', width: '100vw', padding: 30}}>
            <Card elevation={3} style={{alignItems: 'center', margin: 10}}>
                <div class="SchemaMapperParent">
                    <Card elevation={3} style={{display: 'flex', alignItems: 'center', margin: 10}}> 
                        <div>
                            <H4>{field1.label}</H4>
                            <Divider/>
                            <H5>{field1.nodeData.type}</H5>
                        </div>
                    </Card>

                    <Card elevation={3} style={{display: 'flex', alignItems: 'center', margin: 10}}> 
                        <div>
                            <RadioGroup label="Choose an adaption." onChange={handleRadioChange} selectedValue={selectedValue}>
                                <Radio label="No Adaption (1:1 Mapping)" value="one" />
                                <Radio label="Use a formula" value="two" />
                                <Radio label="Enumerated value (If/Then/Else)" value="three" />
                            </RadioGroup>
                        </div>
                    </Card>
            
                    <Card elevation={3} style={{display: 'flex', alignItems: 'center', margin: 10}}> 
                        <div>
                            <H4>{field2.label}</H4>
                            <Divider/>
                            <H5>{field2.nodeData.type}</H5>
                        </div>
                    </Card>
                </div>

                <div style={{display: displayAdaptionStudio(), alignItems: 'center', justifyContent: 'center', padding: 30}}>
                    <H3>Adaption Studio</H3>
                    <ButtonGroup>
                        <Popover2 content={<OperatorMenu/>}>
                                <Button text="Add a field" rightIcon="caret-down" />
                        </Popover2>
                        <Popover2 content={<OperatorMenu addTag={addTag}/>}>
                                <Button text="Choose an operator" rightIcon="caret-down" />
                        </Popover2>
                    </ButtonGroup>
                    <TagInput placeholder="Formula" values={[formulaTags]}/>
                </div> 
            </Card> 
        </div>  

    )
}

export default FieldMappingOverlay;
