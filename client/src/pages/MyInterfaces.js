import { H1, Card, H3, H4, Button, Divider } from "@blueprintjs/core"
import React, { useContext, useState, useCallback, useEffect, useRef } from "react"
import { UserContext } from "../context/UserContext"
import Loader from "../components/Loader"
import Navigation from "../components/Navigation"
import InterfacePreview from "../components/ViewInterfaces/InterfacePreview"
import axios from 'axios';
import MyProjectsTable from "../components/MyProjectsTable.tsx"
import { useNavigate } from "react-router-dom";

const MyInterfaces = () => {

    const [myInterfaces, setInterfaces] = useState([]);
    const [selectedInterfaceObjects, setSelectedInterfaceObjects] = useState([]);
    const [userContext, setUserContext] = useContext(UserContext)
    const [selectedInterface, setSelectedInterface] = useState(myInterfaces[0]);
    const [isLoading, setIsLoading] = useState(true);
    const navigate = useNavigate();
    
    const fetchMyInterfaces = useCallback(() => { 
        axios.get(process.env.REACT_APP_API_ENDPOINT + "/interfaces", {
            headers: {
                "Content-Type": "application/json",
                'Authorization': `Bearer ${userContext.token}`
            }
        })
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

      const selectInterface = (selectedInterface) => {
        setSelectedInterface(selectedInterface);
        console.log(selectedInterface.uuid);
        setIsLoading(true);
        fetchInterfaceObjects(selectedInterface.uuid)
      }

      const fetchInterfaceObjects = async(uuid) => { 
        axios.get(process.env.REACT_APP_API_ENDPOINT + "/interfaces/" + uuid + "/objects")
        .then(response => {
            setSelectedInterfaceObjects(response.data.map((m, index) => ({ ...m, rank: index + 1 })))
            console.log(response.data)
            setIsLoading(false)
            return response
        }
        )
        .catch(error => {
            console.log(error);
            return error
        })
    };
      
      const Interfaces = ({myInterfaces}) => (
        //  console.log(projectInterfaces)
          <>
            {myInterfaces.map(myInterface => (   
            <div style={{padding:20, width: '100%'}}>
                    <Card style={{paddingTop: 30, width:'100%'}} elevation={2} interactive={true} onClick={() => selectInterface(myInterface)}>
                        <div style={{display:"flex"}}>
                            <div style={{display:"block"}}>
                                <H3>
                                    {myInterface.name}
                                </H3>
                                <H4>
                                    {myInterface.version}
                                </H4>
                            </div>
                            <div style={{display:"block", marginLeft:"auto"}}>
                                <Button minimal={true} outlined={true} onClick={() => navigate("/interfaces/" + myInterface.uuid)} >
                                    View Details
                                </Button>
                            </div>
                        </div>
                    </Card>
            </div>
            ))}
          </>
        ); 
      useEffect(() => {
        // fetch only when user details are not present
        if (!userContext.details) {
          fetchUserDetails()
        }
      }, [userContext.details, fetchUserDetails])
      
      useEffect(() => {
        if(!myInterfaces.length && userContext.details) {
            fetchMyInterfaces()
        }
      }, [myInterfaces, fetchMyInterfaces])

      useEffect(() => {
        if (selectedInterface && isLoading) {
           fetchInterfaceObjects()
        } else {

        }
    }, []);



      return userContext.details === null ? (
        "Error Loading User details"
      ) : !userContext.details ? (
        <Loader />
      ) : (
        <div>
        <Navigation />
        <div className="container" style={{padding:40}}>
            <H1 >IMPORTED APIs</H1>
        </div>
        <Divider />
        <div class="ManageInterfacesParent" >
            <div class="ManageInterfacesChild1">
                <Card elevation={3} style={{width:'100%'}}>
                    <div style={{display: 'block'}}>
                        <div style={{alignItems: 'left', display: 'block', paddingTop: 20}}>
                            <Interfaces myInterfaces={myInterfaces}/>
                        </div>
                    </div>     
                </Card>      
            </div>
            <div class="ManageInterfacesChild2">
                <Card elevation={3}>
                        <InterfacePreview isLoading={isLoading} selectedInterfaceObjects={selectedInterfaceObjects} setIsLoading={setIsLoading} interfaceSelected={selectedInterface} />
                </Card>
            </div>
        </div>
        </div>
        
      )

}

export default MyInterfaces