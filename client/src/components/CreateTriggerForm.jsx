import React, { useState, useContext } from "react";
//import Project from "../models/project/Project";
import { UserContext } from "../context/UserContext"
import {
  FormGroup,
  Intent,
  Divider,
  Button,
  InputGroup,
  Card
} from "@blueprintjs/core";
import SelectTrigger from "./SelectTrigger/SelectTrigger";
import axios from "axios";
import { v4 as uuidv4 } from 'uuid';
import { useNavigate } from "react-router-dom";


function CreateTriggerForm({ prevStep, projectId, handleNewNode, nextStep, isDisabled}) {

    const [trigger, setTrigger] = useState("");
    const [triggerIntent, setTriggerIntent] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [userContext] = useContext(UserContext);

    const Continue = e => {
      //e.preventDefault();
      nextStep();
  }

  const Previous = e => {
    //e.preventDefault();
    prevStep();
}
      
    return (
        <div className="create-trigger-form-container">
          <div className="select-workflow-trigger">
            <Card>
              <h3>1. Select a Workflow Trigger</h3>
              <p>Choose the webhook that, when received, will start the workflow.</p>
              <FormGroup 
                intent={triggerIntent}
                helperText={
                  triggerIntent === Intent.NONE
                }
                label="Select a Webhook"
                labelInfo="(required)"
              >
                  <SelectTrigger
                    projectId={projectId}
                    style={{ padding: 10}}
                    intent={triggerIntent}
                    isDisabled={isDisabled}
                    onChange={e => setTrigger(trigger)}
                    value={trigger}
                    setTrigger={trigger => {
                      setTrigger(trigger);
                    }}
                  />
                  
              </FormGroup>
              <Button
                  style={{ padding: 10}}
                  className="pt-button pt-intent-success"
                  disabled={isDisabled}
                  onClick={() => {
                    handleNewNode(trigger,"trigger")
                    Continue();
                  }}
                  text={`${isSubmitting ? "Submitting" : "Select"}`}
                  type="submit"
                  />  

                </Card>
          </div>
      
        <Divider style={{padding: 5}} />
      </div>
    );
  }
  
  CreateTriggerForm.defaultProps = {
    params: {
      triggerName: "",
      triggerUuid: ""
    }
  };

  
  export default CreateTriggerForm;
  