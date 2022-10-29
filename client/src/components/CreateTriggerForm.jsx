import React, { useState, useContext } from "react";
//import Project from "../models/project/Project";
import { UserContext } from "../context/UserContext"
import {
  FormGroup,
  Intent,
  Divider,
  Button,
  InputGroup
} from "@blueprintjs/core";
import SelectTrigger from "./SelectTrigger/SelectTrigger";
import axios from "axios";
import { v4 as uuidv4 } from 'uuid';
import { useNavigate } from "react-router-dom";


function CreateTriggerForm({ params, setParams, nodes}) {

    const [trigger, setTrigger] = useState("");
    const [triggerIntent, setTriggerIntent] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [userContext] = useContext(UserContext);

    const navigate = useNavigate();

    const submitFormHandler = e => {
      const triggerNode =  {
        id: "100",
        type: "input",
        data: {
          label: trigger.name
        },
        position: { x: 250, y: 0 }
      }

      console.log(triggerNode)


    }
      
    return (
        <div className="create-trigger-form-container">
          <div className="select-workflow-trigger">
            <h3>Select a Workflow Trigger</h3>
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
                  style={{ padding: 10}}
                  intent={triggerIntent}
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
                disabled={isSubmitting}
                onClick={submitFormHandler}
                text={`${isSubmitting ? "Submitting" : "Submit"}`}
                type="submit"
                />
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
  