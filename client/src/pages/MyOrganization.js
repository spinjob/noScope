import { H1, H2, Button, Divider } from "@blueprintjs/core"
import React, { useContext, useState, useCallback, useEffect } from "react"
import { UserContext } from "../context/UserContext"
import Loader from "../components/Loader"
import Navigation from "../components/Navigation"
import axios from 'axios';
import { useNavigate } from "react-router-dom";
import ManageOrganizationCustomers from "./ManageOrganizationCustomers"

const MyOrganization = () => {

    const [myOrganization, setMyOrganization] = useState(null);
    const [userContext, setUserContext] = useContext(UserContext)
    const navigate = useNavigate();
    
    const fetchMyOrganization = useCallback(() => { 
        axios.get(process.env.REACT_APP_API_ENDPOINT + "/organizations/"+userContext.details.organization)
        .then(response => {
            setMyOrganization(response.data)
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
         if (userContext.details && !myOrganization) {
            fetchMyOrganization()
         }
        }, [myOrganization, fetchMyOrganization])

      return userContext.details === null ? (
        "Error Loading User details"
      ) : !userContext.details || !myOrganization ? (
        <Loader />
      ) : (
        <div>
            <Navigation />
            <div style={{display: 'block', width: 500, padding: 50}}>
                <H1>My Organization</H1>
                <div style={{alignItems: 'left', display: 'block', paddingTop: 20}}>
                    <H2>{myOrganization.name}</H2>
                </div>
            </div>
       </div>     
        
      )

}

export default MyOrganization