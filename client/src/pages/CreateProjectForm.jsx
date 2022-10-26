import React, { useState } from "react";
import {
  FormGroup,
  Intent,
  Divider
} from "@blueprintjs/core";
import SelectInterface from "../components/SelectInterface/SelectInterface";

function CreateProjectForm({ params, setParams }) {
    const [firstApi, setPrimaryApi] = useState("");
    const [secondApi, setSecondaryApi] = useState("");
    const [primaryApiIntent, setPrimaryApiIntent] = useState(Intent.NONE);
    const [secondaryApiIntent, setSecondaryApiIntent] = useState(Intent.NONE);
  
    return (
      <div className="create-project-form">
        <div className="create-project-container">
          <div className="ba-vpmn">
            <FormGroup
              intent={primaryApiIntent}
              helperText={
                primaryApiIntent === Intent.NONE
                  ? "Select Primary API"
                  : "Choose the API you are integrating from."
              }
              label="Primary API"
              labelInfo="(required)"
            >
              <SelectInterface
                intent={primaryApiIntent}
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
          <div className="ba-hpmn">
            <FormGroup
              intent={secondaryApiIntent}
              helperText={
                secondaryApiIntent === Intent.NONE
                  ? "Select Secondary API"
                  : "Choose the Secondary API you'll be integrating with the Primary."
              }
              label="Secondary API"
              labelInfo="(required)"
            >
              <SelectInterface
                intent={secondaryApiIntent}
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
        </div>
        <Divider />
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
  