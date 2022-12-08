import React, { useCallback, useState, useContext, useEffect } from "react";
import { Overlay, Card, Drawer, Button, Classes} from '@blueprintjs/core';
import { useParams, useLocation } from "react-router-dom";
import Navigation from "../components/Navigation";
import { UserContext } from "../context/UserContext";
import "reactflow/dist/style.css";
import SchemaMapperHeader from "../components/EditWorkflow/SchemaMapperHeader";
import TriggerSchemaMapper from "../components/EditWorkflow/TriggerSchemaMapper";
import SchemaMappingView from "../components/EditWorkflow/SchemaMappingView";
import ActionStepSchemaMapper from "../components/EditWorkflow/ActionStepSchemaMapper";
import FieldMappingOverlay from "../components/EditWorkflow/AdaptionMenu/FieldMappingOverlay";
import "@blueprintjs/core/lib/css/blueprint.css";
import "@blueprintjs/popover2/lib/css/blueprint-popover2.css";
import axios from "axios";
import JSONPretty from 'react-json-pretty';
import {Configuration, OpenAIApi} from "openai"
import {CopyBlock, dracula} from "react-code-blocks";
import prettier from "prettier/standalone";
import parserBabel from "prettier/parser-babel";

const SchemaMapper = () => {
  let { id, workflowId } = useParams();

    const emptyNode = {
        label: "",
        nodeData: {
            type: "",
            description: "",
            uuid: "",
            fieldPath: ""
        }
    }
    const [userContext, setUserContext] = useContext(UserContext)
    const [actionNode, setActionNode] = useState(emptyNode);
    const [triggerNode, setTriggerNode] = useState(emptyNode);
    const [drawerViewOpen, setDrawerViewOpen] = useState(false);
    const [mappingViewOpen, setMappingViewOpen] = useState(false);
    const [mappingDisabled, setMappingDisabled] = useState(true);
    const [interfaceSchema, setInterfaceSchema] = useState(null);
    const [triggerSchema, setTriggerSchema] = useState([]);
    const [actionSchema, setActionSchema] = useState([]);
    const [requiredActionFields, setRequiredActionFields] = useState([]);
    const [shouldFetchMappings, setShouldFetchMappings] = useState(true);
    const [liquidTemplate, setLiquidTemplate] = useState("");
    const [generatedFunction, setGeneratedFunction] = useState("");
    const [formattedPrompt, setFormattedPrompt] = useState("");
    const [mappings, setMappings] = useState(null);
    const location = useLocation();

    const interfaces = location.state.interfaces;
    
    //Open AI Functions 
    const generatePrompt = () => {
      const promptPrefix = "Convert the following LiquidJS JSON property logic into a Javascript function that outputs a new translated object. Include the parent object's name in the function name:"
      console.log(promptPrefix + JSON.stringify(liquidTemplate))
      setFormattedPrompt(promptPrefix + JSON.stringify(liquidTemplate))
      return promptPrefix + liquidTemplate
    }

    const fetchGeneratedCode = useCallback(() => {
      const configuration = new Configuration({
        apiKey: process.env.REACT_APP_OPENAPI_API_KEY,
        organization: process.env.REACT_APP_OPENAPI_ORGANIZATION_ID
      })
      
      const openai = new OpenAIApi(configuration);

      const promptPrefix = "Convert the following LiquidJS JSON property logic into a Javascript function that takes in a requestBody and outputs a new translated object. Include the parent object's name in the function name:"
      const promptX = promptPrefix + JSON.stringify(liquidTemplate)

      openai.createCompletion(
        {
          model:"text-davinci-003",
          prompt: promptX,
          max_tokens: 1000,
          temperature: 0,
          top_p: 1,
          stream: false,
          logprobs: null,
          n: 1
      }).then((response) => {
        console.log(response.data)
        var formattedFunction = response.data.choices[0].text.replace(/(\r\n|\n|\r)/gm, "");
        var prettyFunction = prettier.format(formattedFunction, { parser: 'babel', plugins: [parserBabel] });
        setGeneratedFunction(prettyFunction);
      });

    })
  
    
    const fetchUserDetails = useCallback(() => {
          fetch(process.env.REACT_APP_API_ENDPOINT + "/users/me", {
            method: "GET",
            credentials: "include",
            // Pass authentication token as bearer token in header
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${userContext.token}`,
            },
          }).then(async response => {
            if (response.ok) {
              const data = await response.json()
              setUserContext(oldValues => {
                return { ...oldValues, details: data }
              })
            } else {
              if (response.status === 401) {
                // Edge case: when the token has expired.
                // This could happen if the refreshToken calls have failed due to network error or
                // User has had the tab open from previous day and tries to click on the Fetch button
                window.location.reload()
              } else {
                setUserContext(oldValues => {
                  return { ...oldValues, details: null }
                })
              }
            }
          })
        }, [setUserContext, userContext.token])

    const updateRequiredSchema = (schemas) => {
        setRequiredActionFields(schemas);
      }

    const storeTriggerSchema = (schemas) => {
      setTriggerSchema(schemas);
    }

    const toggleShouldFetchMappings = (shouldFetch) => {
        if (shouldFetch === true) {
          setShouldFetchMappings(true);

        } else { 
          setShouldFetchMappings(false);
        }    
    }
    
    const selectTriggerNode = (node, isSelected) => {

      if (isSelected) {
        console.log("Selected trigger node: ", node);
        setTriggerNode(node);
        setMappingDisabled(false);

      } else { 
        setTriggerNode(emptyNode);
        setMappingDisabled(true);
      }   
    }

   const selectActionNode = (node, isSelected) => {

        if (isSelected) {
          console.log("Selected action node: ", node);
          setActionNode(node);
          setMappingDisabled(false);

        } else { 
          setActionNode(emptyNode);
          setMappingDisabled(true);
        }    
   }

   const toggleOverlay = (mapping) => {
      //If mapping is provided, then we are editing an existing mapping
        if (mappingViewOpen)
        {
          setMappingViewOpen(false);
        } else {
          setMappingViewOpen(true);
        }
        
   }

   const updateLiquidTemplate = (adaptions) => {
      var jsonLiquidTemplate = {}
      if (adaptions.length > 0) {
        adaptions.forEach(adaption => {
          var path = lowercaseFirstLetter(adaption.outputSchema.nodeData.fieldPath)
          var value = lowercaseFirstLetter(adaption.formula.inputFormula)
          stringToObj(path, value, jsonLiquidTemplate)
          console.log(jsonLiquidTemplate)
        })
        setLiquidTemplate(JSON.stringify(jsonLiquidTemplate, null, "\t"));
        generatePrompt();
      }
    
   }

   function lowercaseFirstLetter(string) {
    return string.charAt(0).toLowerCase() + string.slice(1);
  }
  

   const stringToObj = (path,value,obj) => {
      var parts = path.split("."), part;
      var last = parts.pop();
      while(part = parts.shift()) {
      if( typeof obj[part] != "object") obj[part] = {};
      obj = obj[part]; // update "pointer"
      }
    obj[last] = value;
  }

    const fetchMappings = useCallback(() => {
      axios.get(process.env.REACT_APP_API_ENDPOINT + "/projects/" + id + "/workflows/" + workflowId + "/details")
      .then(response => {
          setMappings(response.data[0].steps[0].adaptions)
          updateLiquidTemplate(response.data[0].steps[0].adaptions)
          response.data[0].trigger.function ? setGeneratedFunction(response.data[0].trigger.function) : setGeneratedFunction("")
          setShouldFetchMappings(false);
          console.log("fetched mappings")
          return response
      })
      .catch(error => {
          console.log(error);
          setShouldFetchMappings(false);
          return error
      })
  })

    const fetchInterfaceSchemas = useCallback(() => {
        interfaces.forEach(element => {
            axios.get(process.env.REACT_APP_API_ENDPOINT + "/interfaces/" + element + "/objects")
            .then(response => {
                setInterfaceSchema(response.data)
                return(response.data)
            })
            .catch(error => {
                console.log(error);
                return error
            })
        });

    })

    const onDrawerClose = () => {
      console.log(liquidTemplate)
        if (drawerViewOpen) {
          setDrawerViewOpen(false);
        } else {
          setDrawerViewOpen(true);
        }
    }

    const onLiquidTemplateSave = () => {

      axios.put(process.env.REACT_APP_API_ENDPOINT + "/projects/" + id + "/workflows/" + workflowId + "/steps/0", {"fullFormula": `${liquidTemplate}`, "function": `${generatedFunction}`})
        .then(response => {
          console.log(response);
          onDrawerClose()
          return response
        })
        .catch(error => {
          console.log(error);
          return error
        })
 
    }

    useEffect(() => {
        // fetch only when user details are not present
        if (!userContext.details) {
          fetchUserDetails()
        }
      }, [userContext.details, fetchUserDetails])

      useEffect(() => {
        // fetch only when user details are not present
        if (shouldFetchMappings) {
          fetchMappings()
        }
      }, [fetchMappings, setMappings])


      useEffect(() => {
        // fetch only when user details are not present
        if (!interfaceSchema) {
          fetchInterfaceSchemas()
        }
      }, [])

  return (

    <div style={{justifyContent: 'center',alignItems: 'center'}}>
            <Navigation />
            <div style={{display: 'flex', alignItems: 'center', justifyContent: 'right',paddingRight: 190}}>
              <Button onClick={onDrawerClose}> View Liquid Template </Button>
            </div>
            <SchemaMapperHeader mappings= {mappings} requiredActionFields={requiredActionFields}/>
            <Drawer 
              title="Generations from Mappings"
              onClose={onDrawerClose}
              isOpen={drawerViewOpen}>
                <div className={Classes.DRAWER_BODY}>
                  <div className={Classes.DIALOG_BODY}>
                    <h3> Liquid Template</h3>
                      <JSONPretty id="json-pretty" data={liquidTemplate}></JSONPretty>
                  </div>
                  <div className={Classes.DIALOG_BODY}>
                    <h3> Javascript Function</h3>
                      <CopyBlock 
                        text={generatedFunction}
                        language={"javascript"}
                        showLineNumbers={true}
                        theme={dracula}
                       />
                  </div>
                </div>
                  <div className={Classes.DRAWER_FOOTER}>
                    <Button onClick={onLiquidTemplateSave}>Save Liquid Template</Button>
                    <Button icon="code" onClick={fetchGeneratedCode}>Generate Javascript</Button>
                  </div>
            </Drawer>
            <Overlay
              isOpen={mappingViewOpen} 
              onClose={toggleOverlay} 
              canEscapeKeyClose={true} 
              canOutsideClickClose={true}>
                <div style={{display: 'flex', alignItems: 'center', justifyContent: 'center', height: '50vh', width: '100vw', padding: 30}}>
                  <FieldMappingOverlay toggleOverlay ={toggleOverlay} setShouldFetchMappings={toggleShouldFetchMappings} field1={triggerNode} field2={actionNode} triggerSchema={triggerSchema} workflowId={workflowId} projectId={id}/> 
                </div>  
            </Overlay>  
            
            <div class="SchemaMapperParent">
              <TriggerSchemaMapper mappings={mappings} selectTriggerNode={selectTriggerNode} storeTriggerSchema={storeTriggerSchema} triggerSchema={triggerSchema}/>
              <SchemaMappingView mappings= {mappings} isActive={mappingDisabled} triggerField={triggerNode} selectTriggerNode={selectTriggerNode} selectActionNode={selectActionNode} actionField={actionNode} onClick={toggleOverlay} interfaceSchema={interfaceSchema} setShouldFetchMappings={toggleShouldFetchMappings}/>
              <ActionStepSchemaMapper mappings={mappings} selectActionNode={selectActionNode} actionSchema={actionSchema} updateRequiredSchema={updateRequiredSchema}/>
            </div>
  </div>
);
}

export default SchemaMapper;