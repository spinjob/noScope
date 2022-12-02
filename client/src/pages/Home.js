import { Button, Card} from "@blueprintjs/core"
import React, { useCallback, useContext, useEffect, useState } from "react"
import { UserContext } from "../context/UserContext"
import Loader from "../components/Loader"
import Navigation from "../components/Navigation"
import {useNavigate } from "react-router-dom";
import SideBar from "../components/SideBar";

const Home = () => {
  const [userContext, setUserContext] = useContext(UserContext)
  const [isSideBarOpen, setIsSideBarOpen] = useState(false);
  const navigate = useNavigate();

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

  const newProjectHandler = () => {
    navigate('/projects/new');
  }

  const toggleSideBar = () => {
    setIsSideBarOpen(!isSideBarOpen);
  }

  return userContext.details === null ? (
    "Error Loading User details"
  ) : !userContext.details ? (
    <Loader />
  ) : (
    <div style={{display: 'block', width: 500, padding: 30}}>
        <Navigation toggleSideBar={toggleSideBar} />
        <SideBar isOpen={isSideBarOpen} setIsSideBarOpen={setIsSideBarOpen}/>
        <body style={{padding: 30, align: 'left'}}>
            <Card elevation="1">
                <div className="user-details">
                    <div>
                    <p>
                        Welcome&nbsp;
                        <strong>
                        {userContext.details.firstName}
                        {userContext.details.lastName &&
                            " " + userContext.details.lastName}
                        </strong>!
                    </p>
                    </div>
                </div>
            </Card>
        </body>   
   </div>     
    
  )
}

export default Home