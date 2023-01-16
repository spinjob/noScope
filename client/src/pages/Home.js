import { Button, H1, H2, H3, H4, H5, Icon, Tag, Card, ButtonGroup} from "@blueprintjs/core"
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
    } else {
      console.log(userContext)
    }
  }, [userContext.details, fetchUserDetails])

  return userContext.details === null ? (
    "Error Loading User details"
  ) : !userContext.details ? (
    <Loader />
  ) : (
    <div style={{display: 'block', width: 500, padding: 30}}>
        <Navigation />
            <div style={{width: '95vw', paddingLeft: 30}}>
                 <H1 style={{paddingTop: 30}}>Welcome, {userContext.details.firstName}</H1>
                 <div style={{paddingTop: 30}}>
                  <H2>Getting Started</H2>
                  <div style={{display: 'flex', paddingTop: 20}}>
                    <Card style={{width: 400}} interactive={true} elevation="1">
                        {/* <img src={openApiLogo} style={{width: 40, height: 40}} alt="logo"/> */}
                        <Icon icon="import" iconSize={30} style={{color:'#004D46'}}/>
                        <H3 style={{paddingTop:20,paddingBottom: 20}}>1. Import Open API Spec</H3> 
                        <p>Supported Open API versions:</p>
                        <div style={{display: 'flex', paddingTop: 2}}>
                          <Tag large={true} leftIcon={'git-branch'} minimal={true} key={'v2'}>v2.X</Tag>
                          <div style={{width: 5}}></div>
                          <Tag large={true} leftIcon={'git-branch'} minimal={true} key={'v3'}>v3.X</Tag>
                        </div>
                    </Card>
                    <div style={{width: 20}}></div>
                    <Card style={{width: 400}} interactive={true} onClick={() => navigate('/projects/new')} elevation="1">
                      <Icon icon="add-location" iconSize={30} style={{color:'#007067'}}/>
                      <H3 style={{paddingTop:20, paddingBottom: 20}}>2. Create a new Partnership</H3>
                      <p>Start a technical partnership in Scope to store shared documentation and build workflows between your APIs.</p>
                    </Card>
                    <div style={{width: 20}}></div>
                    <Card style={{width: 400}} interactive={true} elevation="1">
                      <Icon icon="flow-branch" iconSize={30} style={{color:'#00A396'}}/>
                      <H3 style={{paddingTop:20, paddingBottom: 20}}>3. Create a Workflow</H3>
                      <p>Design your workflow by selecting a webhook trigger and a series of API requests for Scope to perform.</p>
                    </Card>
                    <div style={{width: 20}}></div>
                    <Card style={{width: 400}} interactive={true} elevation="1">
                      <Icon icon="many-to-one" iconSize={30} style={{color:'#13C9BA'}}/>
                      <H3 style={{paddingTop:20, paddingBottom: 20}}>4. Map your data & deploy</H3>
                      <p>Between each step, there will be data to process, map, or ignore. Map the required data for each API request and go live with your workflow.</p>
                    </Card>
                  </div>
                  </div>
          </div>
        
   </div>     
    
  )
}

export default Home