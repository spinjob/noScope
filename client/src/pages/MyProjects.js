import { H1, Button, Divider } from "@blueprintjs/core"
import React, { useContext, useState, useCallback, useEffect } from "react"
import { UserContext } from "../context/UserContext"
import Loader from "../components/Loader"
import Navigation from "../components/Navigation"
import axios from 'axios';
import MyProjectsTable from "../components/MyProjectsTable.tsx"
import { useNavigate } from "react-router-dom";

const MyProjects = () => {

    const [myProjects, setProjects] = useState([]);
    const [userContext, setUserContext] = useContext(UserContext)
    const navigate = useNavigate();
    
    const fetchMyProjects = useCallback(() => { 
        axios.get(process.env.REACT_APP_API_ENDPOINT + "/projects/")
        .then(response => {
            setProjects(response.data.map((m, index) => ({ ...m, rank: index + 1 })))

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
        if(!myProjects.length) {
            fetchMyProjects()
        }
      }, [myProjects, fetchMyProjects])


      return userContext.details === null ? (
        "Error Loading User details"
      ) : !userContext.details ? (
        <Loader />
      ) : (
        <div style={{display: 'block', width: 500, padding: 50}}>
            <Navigation />
            <div>
                <H1>My Partnerships
                </H1>
            </div>
            <div style={{alignItems: 'left', display: 'block', paddingTop: 20}}>
            <Button intent={'primary'}  text="NEW PARTNERSHIP" onClick={() => navigate("/projects/new")}> </Button>
            </div>
            <div style={{paddingTop: 20}}>
                <MyProjectsTable />
            </div>
           
       </div>     
        
      )

}

export default MyProjects