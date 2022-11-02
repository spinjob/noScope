import React, { useState, useContext } from "react";
//import Project from "../models/project/Project";
import { UserContext } from "../../context/UserContext"
import {
  FormGroup,
  Intent,
  Divider,
  Card,
    Button
} from "@blueprintjs/core";
import SelectAction from "./SelectAction/SelectAction";

function CreateActionForm({ prevStep, projectId, handleNewNode, nextStep, isDisabled}) {

    const [action, setAction] = useState("");
    const [actionIntent, setActionIntent] = useState("");
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
        <div className="create-action-form-container">
          <div className="select-workflow-action">
            <Card>
              <h3>2. Select an Action</h3>
              <p>Choose the first API call to perform after the trigger is received.</p>
              <FormGroup 
                intent={actionIntent}
                helperText={
                    actionIntent === Intent.NONE
                }
                label="Select an Action"
                labelInfo="(required)"
              >
                  <SelectAction
                    projectId={projectId}
                    style={{ padding: 10}}
                    intent={actionIntent}
                    onChange={e => setAction(action)}
                    value={action}
                    isDisabled={isDisabled}
                    setAction={action => {
                        setAction(action);
                    }}
                  />
                  
              </FormGroup>
                              
              <Button
                  style={{ padding: 10}}
                  className="pt-button pt-intent-next"
                  disabled={isDisabled}
                  onClick={()=> Previous()}
                  text={`${isSubmitting ? "Loading" : "Previous"}`}
                  type="submit"
              />
              <Button
                  style={{ padding: 10}}
                  className="pt-button pt-intent-success"
                  disabled={isDisabled}
                  onClick={() => {
                    handleNewNode(action,"action");
                    Continue()
                  }}
                  text={`${isSubmitting ? "Submitting" : "Next"}`}
                  type="submit"
                  />  

                </Card>
          </div>
      
        <Divider style={{padding: 5}} />
      </div>
    );
  }
  
  CreateActionForm.defaultProps = {
    params: {
      actionName: "",
      actionUuid: ""
    }
  };

  
  export default CreateActionForm;
  