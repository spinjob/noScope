
import React, { useCallback, useState, useContext, useEffect } from "react";
import { Button, Icon,  Intent, Card, RadioGroup, ButtonGroup, Overlay, Menu, Divider, H1, H2, H3, H4, H5, H6, Radio, TextArea, Tag, TagInput } from '@blueprintjs/core';
import { Popover2, MenuItem2 } from "@blueprintjs/popover2";
import "reactflow/dist/style.css";
import SelectSchema from "./SelectSchema/SelectSchema";
import axios from "axios";
import {v4 as uuidv4} from 'uuid';
import Loader from "../../Loader";
import SelectOperators from "./SelectOperators/SelectOperators";

const FieldMappingOverlay = ({project, field1, field2, triggerSchema, workflowId, projectId, toggleOverlay, selectedMapping, setShouldFetchMappings}) => {
    const [selectedValue, setSelectedValue] = useState("one");
    const [equation, setEquation] = useState(field1.nodeData.fieldPath);
    const [schema, setSchema] = useState("");
    const [schemaIntent, setSchemaIntent] = useState("");
    const [isLoading, setIsLoading] = useState(false);
        const handleRadioChange = (e) => {
                setSelectedValue(e.target.value)
                if(e.target.value === "three"){
                    constructForLoopLiquidTemplate(field1, field2)
            }
        }
        const constructForLoopLiquidTemplate = (field1, field2) => {
           if (field1.nodeData.type == "array" && field2.nodeData.type == "array"){
                    setEquation(`{%- for ${field1.nodeData.items[0].label} in ${field1.nodeData.fieldPath} %}
                        {{${field2.nodeData.items[0].label}}}               
                        {% endfor %}`)
         } else if (field1.nodeData.type == "array" && field2.nodeData.type != "array"){
                setEquation(`{%- for ${field1.nodeData.items[0].label} in ${field1.nodeData.fieldPath} %}
                {{${field2.nodeData.fieldPath}}}}                
                {% endfor %}`)
            }
        }
        const displayAdaptionStudio = () => {
            if (selectedValue === "one") {
                return "none"
            } else {
                return "block"
            }
        }

        const displayConfigurationMenu = () => {
            if (selectedValue === "three") {
                return "block"
            } else {
                return "none"
            }
        }

        const renderConfigurationMenu = () => {
            return (
                <Menu>
                    {renderConfigurationItems()}
                </Menu>
            )
        }

        const renderConfigurationItems = () => {
            if(!project.configuration) {
                    console.log("no configurations")
            } else {
                var configurationKeys = Object.keys(project.configuration)
                var configurationValues = Object.values(project.configuration)
                return configurationKeys.map((key, index) => {
                    return <MenuItem2 text={key +" : "+configurationValues[index]} icon="cog" onClick={handleFieldAddition}/>
                })

            }
        }

        const shouldDisplayEnumMenu = () => {
            if(!field2.nodeData.enum) {
                return 
            } else {
                return (
                    <Popover2 style={{width: '30%'}} content={renderEnumMenu()}>
                         <Button style={{width: '30%'}} minimal={true} outlined={true} icon="th-list">Enumerations</Button>
                     </Popover2>
                )
            }
        }
        
        const renderEnumMenu = () => {
            return (
                <Menu>
                    {renderEnumMenuItems()}
                </Menu>
            )
        }
        const renderEnumMenuItems = () => {
            if(!field2.nodeData.enum) {
                    console.log("no configurations")
            } else {
                return field2.nodeData.enum.map((key, index) => {
                    return <MenuItem2 text={key} icon="citation" onClick={handleEnumerationAddition}/>
                })

            }
        }

        const returnTypedOperators = (type) => {
            
            if (type==="string"){
                console.log("string")
                return ( 
                <Menu>
                    <MenuItem2 text="Append" icon="unresolve" onClick={handleOperatorAddition}/>
                    <MenuItem2 text="Prepend" icon="unresolve" onClick={handleOperatorAddition}/>
                    <MenuItem2 text= "Split" icon="flow-review" onClick={handleOperatorAddition}/>
                    <MenuItem2 text="Truncate" icon="cut" onClick={handleOperatorAddition}/>
                    <MenuItem2 text="Slice" icon="cut" onClick={handleOperatorAddition}/>
                    <MenuItem2 text= "Strip Whitespace" icon="dot" onClick={handleOperatorAddition}/>
                </Menu>
            )
            } if (type==="float" || type==="integer" || type==="number"){
                console.log("number")
                return  (
                <Menu>
                    <MenuItem2 text= "Add" icon="plus" onClick={handleOperatorAddition}/>
                    <MenuItem2 text= "Subtract" icon="minus" onClick={handleOperatorAddition} />
                    <MenuItem2 text= "Divide" icon="divide" onClick={handleOperatorAddition}/>
                    <MenuItem2 text="Multiply" icon="cross" onClick={handleOperatorAddition}/>
                </Menu>
                )
            } else {
                console.log("no input field")
            }
        }
    
        const handleMappingSubmit = () => {
            console.log("Field 1")
            console.log(field1)
            console.log("Field 2")
            console.log(field2)
            const mappingUuid = uuidv4();
            var inputFormula = ""
            var outputFormula = ""
            var formattedEquation = ""
            ///Need to add a check to add an IF statement to the Liquid Template if the trigger field is optional (i.e. if the field may not always be provided) to remove the template field if null.
            if (field1.nodeData.fieldPath.length > 0) {
                if (field1.nodeData.required && field2.nodeData.type == "number" | field2.nodeData.type == "integer" | field2.nodeData.type == "float"){
                    inputFormula = "{{"+ equation + " | plus: 0}}"
                    outputFormula = "{" + field2.nodeData.fieldPath + "}"
                    formattedEquation = inputFormula + "=" + outputFormula
                } else if (field1.nodeData.required && field2.nodeData.type == "string") {
                    inputFormula = "{{"+ equation + "}}"
                    outputFormula = "{" + field2.nodeData.fieldPath + "}"
                    formattedEquation = inputFormula + "=" + outputFormula
                }
                else if (field1.nodeData.required == false | !field1.nodeData.required && field2.nodeData.type == "number" | field2.nodeData.type == "integer" | field2.nodeData.type == "float"){
                    inputFormula = "{% if " + field1.nodeData.fieldPath + " != null %} {{ "+ equation + " | plus: 0}} {% endif %}"
                    outputFormula = "{" + field2.nodeData.fieldPath + "}"
                    formattedEquation = inputFormula + "=" + outputFormula
                }
                else if (field1.nodeData.required == false | !field1.nodeData.required && field2.nodeData.type == "string"){
                    inputFormula = "{% if " + field1.nodeData.fieldPath + " != null %} {{ "+ equation + "}} {% endif %}"
                    outputFormula = "{" + field2.nodeData.fieldPath + "}"
                    formattedEquation = inputFormula + "=" + outputFormula
                } 
            } else if (field1.nodeData.fieldPath.length == 0){
                inputFormula = "{{ "+ equation + "}}"
                outputFormula = "{" + field2.nodeData.fieldPath + "}"
                formattedEquation = inputFormula + "=" + outputFormula
            }
            
            setIsLoading(true);
            const requestBody =  {
                uuid: mappingUuid,
                inputSchema: field1,
                outputSchema: field2,
                formula: {
                    fullFormula: formattedEquation,
                    inputFormula: inputFormula,
                    outputFormula: outputFormula
                } 
             }

             axios.put(process.env.REACT_APP_API_ENDPOINT + "/projects/"+ projectId + "/workflows/" + workflowId +"/map", requestBody).then(response => {
                setIsLoading(false);
                setShouldFetchMappings(true);
             }).catch(error => {
                console.log(error);
                setIsLoading(false);
             })
        }

        const handleFieldAddition = (config) => {
            setEquation(equation + " " + config.target.innerText.split(" : ")[1])
        }

        const handleEnumerationAddition = (value) => {
            if (equation.length > 0){
                setEquation(equation + " " + "'"+ value.target.innerText + "'")
            } else {
                setEquation(equation + "'"+ value.target.innerText + "'")
            }
          
        }

        const handleConfigurationSelection = (schema) => {
            setEquation(equation + " "+ schema.nodeData.fieldPath)
        }


        const handleOperatorAddition = (operatorSlug) => {
            console.log(operatorSlug.target.innerText)
            if (operatorSlug.target.innerText === "Add"){
                setEquation(equation + " | plus: ")
            } else if (operatorSlug.target.innerText === "Subtract"){
                setEquation(equation + " | minus: ")
            } else if (operatorSlug.target.innerText === "Divide"){
                setEquation(equation + " | divided_by: ")
            } else if (operatorSlug.target.innerText === "Multiply"){
                setEquation(equation + " | times: ")
            } else if (operatorSlug.target.innerText=="Append"){
                setEquation(equation + " | append: ")
            } else if (operatorSlug.target.innerText=="Prepend"){
                setEquation(equation + " | prepend: ")
            } else if (operatorSlug.target.innerText=="Split"){
                setEquation(equation + " | split: ','")
            } else if (operatorSlug.target.innerText=="Truncate"){
                setEquation(equation + " | truncate: ")
            } else if (operatorSlug.target.innerText=="Slice"){
                setEquation(equation + " | slice: ")
            } else if (operatorSlug.target.innerText=="Strip Whitespace"){
                setEquation(equation + " | strip")
            }
        }
        
        
        const isIterable = (field1) => {
            if (field1.nodeData.type === "array") {
                return "block"
            } else {
                console.log("not iterable")
                return "none"
            }
        }



    return isLoading ? (
    
    <Loader/>
    
    ) : ( <div style={{display: 'flex', alignItems: 'center', justifyContent: 'center', height: '50vh', width: '100vw', paddingTop: 500}}>
            <Card elevation={3} style={{display: 'block', alignItems: 'center',margin: 10, padding: 50}}>
                <div style={{ display: 'flex', justifyContent: 'right'}}>
                 <Button minimal={true} icon="delete" onClick={toggleOverlay} />
                </div>
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
                                        <Radio label="For Each" value="three" style={{display: isIterable(field1)}} />
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
                        <H6>Using <a href="https://shopify.github.io/liquid/">LiquidJS syntax</a>, we can create a formula template that can be used to generate the output field's value. </H6>
                        <ButtonGroup fill={true} style={{display: 'flex', width: 350}}>
                                    <Popover2 content={returnTypedOperators(field1.nodeData.type)}>
                                            <Button minimal={true} outlined={true} icon="menu">Operators</Button>
                                    </Popover2>
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
                                    <Popover2 style={{width: '30%'}} content={renderConfigurationMenu()}>
                                            <Button style={{width: '30%'}} minimal={true} outlined={true} icon="cog">Configurations</Button>
                                    </Popover2>
                                    {shouldDisplayEnumMenu()}
                                
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
