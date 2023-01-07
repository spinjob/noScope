import { Button, H1, H2, H3, H4, H5, Icon, Card, ButtonGroup} from "@blueprintjs/core"
import React, { useCallback, useContext, useEffect, useState } from "react"
import { UserContext } from "../context/UserContext"
import Loader from "../components/Loader"
import Navigation from "../components/Navigation"
import {useNavigate } from "react-router-dom";
import SideBar from "../components/SideBar";
import postmanLogo from "../assets/logo-postman.png"
import openApiLogo from "../assets/logo-openapi.png"

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
            <div style={{width: '95vw', paddingLeft: 30}}>
                 <H1 style={{paddingTop: 30}}>Import API</H1>
                  <div style={{display: 'flex', paddingTop: 20}}>
                    <Card style={{width: 400, height: 200}} interactive={true} elevation="1">
                      <img src={openApiLogo} style={{width: 40, height: 40}} alt="logo"/>
                      <H3 style={{paddingTop:20}}>Open API</H3> 
                      <ButtonGroup style={{paddingTop: 20}}>
                        <Button icon={'git-branch'} text='v3.0' intent={'primary'} outlined={true}/>
                        <Button icon={'git-branch'} text='v2.0' intent={'primary'} outlined={true}/>
                      </ButtonGroup>
                    </Card>
                    <div style={{width: 20}}></div>
                    <Card style={{width: 400}} interactive={true} elevation="1">
                      <img src={postmanLogo} alt="logo" style={{width: 40, height: 40}}/>
                      <H3 style={{paddingTop:20}}>Postman Collection</H3>
                      <ButtonGroup style={{paddingTop: 20}}>
                        <Button icon={'git-branch'} text='v2' intent={'primary'} outlined={true}/>
                      </ButtonGroup> 
                    </Card>
                  </div>
          </div>
        
   </div>     
    
  )
}

export default Home