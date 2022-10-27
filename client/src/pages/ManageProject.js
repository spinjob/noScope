import { Card, Button, Callout, FormGroup, InputGroup } from "@blueprintjs/core"
import React, { useContext, useState, useCallback, useEffect } from "react"
import { UserContext } from "../context/UserContext"
import Loader from "../components/Loader"
import Navigation from "../components/Navigation"
import axios from 'axios';
import { useLocation, useParams } from "react-router-dom";

const ManageProject = () => {

    const [projectInterfaces, setInterfaces] = useState([]);

    const [userContext, setUserContext] = useContext(UserContext)
    const location = useLocation();

    let { id } = useParams();

    console.log(id);
    
    const fetchProjectDetails = useCallback(() => { 
        axios.get(process.env.REACT_APP_API_ENDPOINT + "/projects/" + id + "/details")
        .then(response => {
            setInterfaces(response.data.map((m, index) => ({ ...m, rank: index + 1 })))

            return response
        }
        )
        .catch(error => {
            console.log(error);
            return error
        })
    });

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
        if(!projectInterfaces.length) {
            fetchProjectDetails()
        }
      }, [projectInterfaces, fetchProjectDetails])


      return userContext.details === null ? (
        "Error Loading User details"
      ) : !userContext.details ? (
        <Loader />
      ) : !projectInterfaces[0] ? ( 
        <Loader />
     ) : (
        <div style={{display: 'block', width: 500, padding: 30}}>
            <Navigation />
            <Card>
                <h1>Manage Project</h1>
                <h2>{projectInterfaces[0].name}</h2>
                <p>Project ID: {projectInterfaces[0].uuid}</p>
            </Card>
            <Card>
                <h2>Primary Interface</h2>
                <p>Interface ID: {projectInterfaces[0].interfaces[0]}</p>
            </Card>
            <Card>
                <h2>Secondary Interface</h2>
                <p>Interface ID: {projectInterfaces[0].interfaces[1]}</p>
            </Card>
       </div>     
        
      )

}

export default ManageProject