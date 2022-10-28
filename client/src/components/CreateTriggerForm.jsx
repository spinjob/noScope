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

function CreateTriggerForm({ params, setParams }) {
    const [projectName, setProjectName] = useState("");
    const [firstApi, setPrimaryApi] = useState("");
    const [secondApi, setSecondaryApi] = useState("");
    const [primaryApiIntent, setPrimaryApiIntent] = useState(Intent.NONE);
    const [secondaryApiIntent, setSecondaryApiIntent] = useState(Intent.NONE);

    const [trigger, setTrigger] = useState("");
    const [triggerIntent, setTriggerIntent] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [userContext] = useContext(UserContext);

    const navigate = useNavigate();

    const submitFormHandler = e => {

      const workflowUUID = uuidv4();
      console.log("Add Trigger");
      // setIsSubmitting(true);
      // console.log("submitting form");
      // axios.post(process.env.REACT_APP_API_ENDPOINT + "/projects/" + id + "/workflows/new", 
      // { 
      //   uuid: workflowUUID,
      //   name: projectName,
      //   interfaces: [firstApi, secondApi],
      //   created_by: userContext.details._id
      // })
      // .then(response => {  
      //   setIsSubmitting(false);
      //   navigate("/projects/" + projectUUID,{state:{projectID: projectUUID}});
      // })
      // .catch(error => { 
      //   console.log(error);
      //   setIsSubmitting(false);
      // })

    }
      
    return (
        <div className="create-trigger-form-container">
          <div className="select-workflow-trigger">
            <FormGroup
              intent={triggerIntent}
              helperText={
                triggerIntent === Intent.NONE
              }
              label="Workflow Trigger"
              labelInfo="(required)"
            >
              <SelectTrigger
                intent={triggerIntent}
                onChange={e => setTrigger(e.target.value)}
                value={trigger}
                setTrigger={trigger => {
                  setTrigger(trigger);
                }}
              />
            </FormGroup>
          </div>
        <Divider />
        <Button
        className="pt-button pt-intent-success"
        disabled={isSubmitting}
        onClick={submitFormHandler}
        text={`${isSubmitting ? "Submitting" : "Submit"}`}
        type="submit"
        />
      </div>
    );
  }
  
  CreateTriggerForm.defaultProps = {
    params: {
      triggerName: ""
    }
  };

  
  export default CreateTriggerForm;
  