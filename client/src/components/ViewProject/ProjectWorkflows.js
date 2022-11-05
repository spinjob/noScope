import { Button, Card, H3, Icon } from "@blueprintjs/core"
import React, { useCallback, useContext, useEffect, useState} from "react"
import { UserContext } from "../../context/UserContext"
import Loader from "../Loader"
import { useNavigate, useParams} from "react-router-dom";
import axios from 'axios';
import "../../styles/workflowStudioStyles.css";

const ProjectWorkflows = (interfaces) => {

  const navigate = useNavigate();
  const [userContext, setUserContext] = useContext(UserContext)
  const [projectWorkflows, setProjectWorkflows] = useState([]);
  const [hasCheckedWorkflows, setHasCheckedWorkflows] = useState(false);
  let {id} = useParams();

  const fetchWorkflowDetails = useCallback(() => { 

    axios.post(process.env.REACT_APP_API_ENDPOINT + "/projects/" + id + "/workflows/details", {parent_project_uuid: id})
        .then(response => {
            setProjectWorkflows(response.data)
            setHasCheckedWorkflows(true)
            return(response.data)
        })
        .catch(error => {
            setHasCheckedWorkflows(true)
            console.log(error);
            return error
        })

});

const renderStatusIcon = (status) => {

    if (status === "needs_mapping") {
        return <Icon icon="one-to-many" color="green" />
    } else if (status === "inactive") {
        return <Icon icon="symbol-circle" color="red" />
    } else if (status === "active") {
        return <Icon icon="offline" color="green" />
    } else {
        return <Icon icon="help" color="gray" />
    }
}

const Workflows = ({projectWorkflows}) => (
    <>
      {projectWorkflows.map(workflow => (
        <Card>
            <div class="ProjectWorkflowsParent">
                <div class="ProjectWorkflowsChild1">
                 {renderStatusIcon(workflow.status)}
                </div>
                <div class="ProjectWorkflowsChild2">
                     <H3>{workflow.name}</H3>
                     <Button text="Details" onClick={() => navigate("/projects/" + id + "/workflows/" + workflow.uuid)}> </Button>
                </div>
            </div>
        </Card>
      ))}
    </>
  ); 

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

  useEffect(() => {
    // fetch only when user details are not present
    if (!userContext.details) {
      fetchUserDetails()
    }
  }, [userContext.details, fetchUserDetails])

  useEffect(() => {
    if(hasCheckedWorkflows==false) {
        fetchWorkflowDetails()
    }
  }, [projectWorkflows, fetchWorkflowDetails])


  return userContext.details === null ? (
    "Error Loading User details"
  ) : !userContext.details ? (
    <Loader />
  ) : (
    <div style={{display: 'block', width: 500, padding: 30}}>
        <Workflows projectWorkflows={projectWorkflows}/>
   </div>     
    
  )
}

export default ProjectWorkflows