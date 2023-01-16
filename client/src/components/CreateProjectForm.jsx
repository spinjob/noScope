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
import SelectInterface from "./SelectInterface/SelectInterface";
import axios from "axios";
import { v4 as uuidv4 } from 'uuid';
import { useNavigate } from "react-router-dom";

function CreateProjectForm({ params, setParams }) {
    const [projectName, setProjectName] = useState("");
    const [firstApi, setPrimaryApi] = useState("");
    const [secondApi, setSecondaryApi] = useState("");
    const [primaryApiIntent, setPrimaryApiIntent] = useState(Intent.NONE);
    const [secondaryApiIntent, setSecondaryApiIntent] = useState(Intent.NONE);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [userContext] = useContext(UserContext);

    const navigate = useNavigate();

    const submitFormHandler = e => {

      const projectUUID = uuidv4();

      setIsSubmitting(true);
      console.log("submitting form");
      axios.post(process.env.REACT_APP_API_ENDPOINT + "/projects/new", 
      { 
        uuid: projectUUID,
        name: projectName,
        interfaces: [firstApi, secondApi],
        created_by: userContext.details._id
      })
      .then(response => {  
        setIsSubmitting(false);
        navigate("/projects/" + projectUUID,{state:{projectID: projectUUID}});
      })
      .catch(error => { 
        console.log(error);
        setIsSubmitting(false);
      })

    }
      
    return (
        <div className="create-project-form-container">
          <FormGroup label="Partnership Name" labelFor="text-input" labelInfo="(required)">
              <InputGroup 
              id="text-input" 
              placeholder="Partnership Name" 
              onChange={e => setProjectName(e.target.value)}
              value={projectName} />
            </FormGroup>
          <div className="select-primary-api">
            <FormGroup
              intent={primaryApiIntent}
              helperText={
                primaryApiIntent === Intent.NONE
              }
              label="Primary API"
              labelInfo="(required)"
            >
              <SelectInterface
                intent={primaryApiIntent}
                onChange={e => setPrimaryApi(e.target.value)}
                value={firstApi}
                setInterface={firstApi => {
                  setPrimaryApi(firstApi);
                  if (firstApi === secondApi) {
                    setPrimaryApiIntent(Intent.DANGER);
                  } else {
                    setPrimaryApiIntent(Intent.NONE);
                  }
                }}
              />
            </FormGroup>
          </div>
          <div className="select-secondary-api">
            <FormGroup
              intent={secondaryApiIntent}
              helperText={
                secondaryApiIntent === Intent.NONE
              }
              label="Secondary API"
              labelInfo="(required)"
            >
              <SelectInterface
                intent={secondaryApiIntent}
                onChange={e => setSecondaryApi(e.target.value)}
                value={secondApi}
                setInterface={secondApi => {
                  setSecondaryApi(secondApi);
                  if (secondApi === firstApi) {
                    setSecondaryApiIntent(Intent.DANGER);
                  } else {
                    setSecondaryApiIntent(Intent.NONE);
                  }
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
  
  CreateProjectForm.defaultProps = {
    params: {
      firstApi: "",
      secondApi: ""
    }
  };

  
  export default CreateProjectForm;
  