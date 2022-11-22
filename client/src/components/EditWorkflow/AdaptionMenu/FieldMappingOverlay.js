
import React, { useCallback, useState, useContext, useEffect } from "react";
import { Button, Icon, Intent, Card, RadioGroup, ButtonGroup, Overlay, Menu, Divider, H1, H2, H3, H4, H5, H6, Radio, TextArea, Tag, TagInput } from '@blueprintjs/core';
import { Popover2 } from "@blueprintjs/popover2";
import "reactflow/dist/style.css";
import SelectSchema from "./SelectSchema/SelectSchema";
import axios from "axios";
import {v4 as uuidv4} from 'uuid';
import Loader from "../../Loader";

const FieldMappingOverlay = ({field1, field2, triggerSchema, workflowId, projectId, toggleOverlay, handleMappedNodes, setShouldFetchMappings}) => {
    const [selectedValue, setSelectedValue] = useState("one");
    const [equation, setEquation] = useState("{"+field1.nodeData.fieldPath+"}");
    const [schema, setSchema] = useState("");
    const [schemaIntent, setSchemaIntent] = useState("");
    const [isLoading, setIsLoading] = useState(false);

        const handleRadioChange = (e) => {
            setSelectedValue(e.target.value)
        }

        const displayAdaptionStudio = () => {
            if (selectedValue === "one") {
                return "none"
            } else {
                return "block"
            }
        }

        const handleMappingSubmit = () => {
            handleMappedNodes(field1, field2);
            const mappingUuid = uuidv4();
            const formattedEquation = equation + "=" + "{" + field2.nodeData.fieldPath + "}"
            setIsLoading(true);
            const requestBody =  {
                uuid: mappingUuid,
                inputSchema: field1,
                outputSchema: field2,
                formula: formattedEquation
             }
             axios.put(process.env.REACT_APP_API_ENDPOINT + "/projects/"+ projectId + "/workflows/" + workflowId +"/map", requestBody).then(response => {
                handleMappedNodes(field1, field2);
                setIsLoading(false);
                setShouldFetchMappings(true);
             }).catch(error => {
                console.log(error);
                setIsLoading(false);
             })
        }

        const handleFieldAddition = (schema) => {
            setEquation(equation + "{" + schema.nodeData.fieldPath + "}")
        }

    return isLoading ? (
    
    <Loader/>
    
    ) : ( <div style={{display: 'flex', alignItems: 'center', justifyContent: 'center', height: '50vh', width: '100vw', paddingTop: 500}}>
            <Card elevation={3} style={{display: 'block', alignItems: 'center',margin: 10, padding: 50}}>
                <H1 style={{alignContent:'center'}}>Mapping Configuration</H1>
                    <div class="SchemaMapperParent">
                        <div style={{display: 'block', margin: 10}}>
                            <H4>Input Property</H4>
                            <Card elevation={3} style={{display: 'block', alignItems: 'center'}}> 
                                <div>
                                    <H5>{field1.label}</H5>
                                    <p>{field1.nodeData.type}</p>
                                    <p>{field1.nodeData.description}</p>
                                    <Divider/>
                                    <br></br>
                                    <H6>{field1.nodeData.fieldPath}</H6>
                                </div>
                            </Card>
                        </div>
                        <Icon icon="arrow-right" iconSize={50}/>
                        <div style={{display: 'block', margin: 10}}>
                            <Card elevation={3} style={{display: 'block', alignItems: 'center', margin: 10}}> 
                            
                                <div>
                                    <RadioGroup label="Select an adaption type" onChange={handleRadioChange} selectedValue={selectedValue}>
                                        <Radio label="No changes to input" value="one" />
                                        <Radio label="Write a formula" value="two" />
                                    </RadioGroup>
                                </div>
                            </Card>
                        </div>
                        <Icon icon="arrow-right" iconSize={50}/>
                        <div style={{display: 'block', margin: 10}}>
                            <H4>Output Property</H4>
                            <Card elevation={3} style={{display: 'block', alignItems: 'center', margin: 10}}> 
                                <div>
                                    <H5>{field2.label}</H5>
                                    <p>{field1.nodeData.type}</p>
                                    <p>{field2.nodeData.description}</p>
                                    <Divider/>
                                    <br></br>
                                    <H6>{field2.nodeData.fieldPath}</H6>
                                </div>
                            </Card>
                        </div>
                    </div>
                    <div style={{display: displayAdaptionStudio(), alignItems: 'center', justifyContent: 'center', margin: 10}}>
                        <H3>Adaption Studio</H3>
                        <H6>Write a formula to adapt the input property. Field variables will be in curly brackets.</H6>
                        <ButtonGroup>
                                <SelectSchema
                                    schemas={triggerSchema.map((m, index) => ({ ...m, rank: index + 1 }))}
                                    style={{ padding: 10}}
                                    intent={schemaIntent}
                                    onChange={e => setSchema(schema)}
                                    value={schema}
                                    setSchema={schema => {
                                    setSchema(schema);
                                    handleFieldAddition(schema);
                                }}/>
                        </ButtonGroup>
                        <div style={{display: 'flex', alignItems: 'center', justifyContent: 'left',paddingTop: 10}}>
                                <TextArea style={{ width: 500, height: 100}} placeholder="Equation" value={equation} onChange={(e) => setEquation(e.target.value)}/>
                                <div style={{width: 30}} />
                                <p style={{padding: 10}}>{"= " +field2.nodeData.fieldPath}</p> 
                            </div>
                        <br/>
                    </div> 
                    <div style={{margin: 10}}>
                            <Button onClick={handleMappingSubmit} >Submit Mapping</Button>
                    </div>
            </Card> 
        </div>  

    )
   
}

export default FieldMappingOverlay;
