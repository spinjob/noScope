import React, { useState, useContext } from "react";
//import Project from "../models/project/Project";
import { UserContext } from "../../context/UserContext"
import {
  Button,
  Divider,
  Card
} from "@blueprintjs/core";


function ConfirmWorkflow({ prevStep, projectId, handleNewNode, nextStep, createWorkflow}) {

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [workflowName, setWorkflowName] = useState("");
    const [formValid, setFormValid] = useState(false);
    const [isDisabled, setIsDisabled] = useState(true);
    const [formError, setFormError] = useState("");
    const [userContext] = useContext(UserContext);

    const Confirm = e => {
          
      createWorkflow(workflowName);

    }

    const Previous = e => {
        prevStep();
    }

    const onChange = e => {
        setWorkflowName(e.target.value);

        if(e.target.value == ""){
          setFormValid(false);
          setIsDisabled(true);
        } else {
          setFormValid(true);
          setIsDisabled(false);
        }
    }
      
    return (
        <div className="create-action-form-container">
          <div className="select-workflow-action">
            <Card>
              <h3>3. Name Your Workflow!</h3>
              <p>Provide a name that describes your workflow and confirm to proceed to data mapping.</p>
              {/* <FormErrors formError={formError} /> */}
            <input class="bp4-input .modifier" onChange={onChange} placeholder="Workflow Name" dir="auto" value={workflowName} />
            <br/>
             <br/>
                              
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
                  disabled = {isDisabled}
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
  