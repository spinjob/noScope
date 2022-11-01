import React, { useState, useContext } from "react";
//import Project from "../models/project/Project";
import { UserContext } from "../context/UserContext"
import {
  FormGroup,
  Intent,
  Button,
  Divider,
  Card
} from "@blueprintjs/core";

function ConfirmWorkflow({ prevStep, projectId, handleNewNode, nextStep, isDisabled, createWorkflow}) {

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [userContext] = useContext(UserContext);

    const Confirm = e => {
      
      createWorkflow();
    }

    const Previous = e => {
        //e.preventDefault();
        prevStep();
    }
      
    return (
        <div className="create-action-form-container">
          <div className="select-workflow-action">
            <Card>
              <h3>3. Confirm Your Workflow</h3>
              <p>Confirm the trigger and action to proceed to data mapping!</p>
                              
              <Button
                  style={{ padding: 10}}
                  className="pt-button pt-intent-next"
                  onClick={()=> Previous()}
                  text={`${isSubmitting ? "Loading" : "Previous"}`}
                  type="submit"
              />
              <Button
                  style={{ padding: 10}}
                  className="pt-button pt-intent-success"
                  onClick={() => {
                    Confirm()
                  }}
                  text={`${isSubmitting ? "Submitting" : "Confirm Workflow"}`}
                  type="submit"
                  />  

                </Card>
          </div>
      
        <Divider style={{padding: 5}} />
      </div>
    );
  }
  
  ConfirmWorkflow.defaultProps = {
    params: {
      actionName: "",
      actionUuid: "",
      triggerName: "",
      triggerUuid: ""
    }
  };

  
  export default ConfirmWorkflow;
  