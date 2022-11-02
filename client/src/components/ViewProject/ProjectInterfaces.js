import { Button, Card, H3, H4 } from "@blueprintjs/core"
import React, { useCallback, useContext, useEffect, useState} from "react"
import { UserContext } from "../../context/UserContext"
import Loader from "../Loader"
import { useNavigate, useParams} from "react-router-dom";
import axios from 'axios';
import "../../styles/workflowStudioStyles.css";

const ProjectInterfaces = (project) => {

  const navigate = useNavigate();
  const [userContext, setUserContext] = useContext(UserContext)
  const [interfaces, setInterfaces] = useState([]);
  let {id} = useParams();

  const fetchInterfaceDetails = useCallback(() => { 

    axios.post(process.env.REACT_APP_API_ENDPOINT + "/projects/interfaces", {interfaces: project.project.interfaces})
        .then(response => {
            setInterfaces(response.data)
            console.log(response.data)
            return(response.data)
        })
        .catch(error => {
            console.log(error);
            return error
        })

});

  const Interfaces = ({projectInterfaces}) => (
  //  console.log(projectInterfaces)
    <>
      {projectInterfaces.map(projectInterface => (
        <Card>
           <H3>
                {projectInterface.name}
           </H3>
           <H4>
                {projectInterface.version}
           </H4>
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
    if(!interfaces.length) {
        fetchInterfaceDetails()
    }
  }, [interfaces, fetchInterfaceDetails])


  return userContext.details === null ? (
    "Error Loading User details"
  ) : !userContext.details ? (
    <Loader />
  ) : (
    <div style={{display: 'block', width: 500, padding: 30}}>
        <Interfaces projectInterfaces={interfaces}/>
   </div>     
    
  )
}

export default ProjectInterfaces