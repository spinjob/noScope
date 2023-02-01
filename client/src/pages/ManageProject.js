import { Card, Divider, Button, H1, H2, H3, Tabs, Tab} from "@blueprintjs/core"
import React, { useContext, useState, useCallback, useEffect } from "react"
import { UserContext } from "../context/UserContext"
import Loader from "../components/Loader"
import Navigation from "../components/Navigation"
import axios from 'axios';
import ProjectWorkflows from "../components/ViewProject/ProjectWorkflows"
import ProjectInterfaces from "../components/ViewProject/ProjectInterfaces"
import ProjectConfigurations from "../components/ViewProject/ProjectConfigurations"
import ManagePartnershipCustomers from "../components/ViewCustomers/ManagePartnershipCustomers"
import ProjectOnboarding from "../components/ViewProject/ProjectOnboarding"
import ProjectSupport from "../components/ViewProject/ProjectSupport"
import { useLocation, useParams, useNavigate } from "react-router-dom";
import "../styles/workflowStudioStyles.css";


const ManageProject = () => {

    const [project, setProject] = useState({});
    const [interfaces, setInterfaces] = useState([]);
    const [userContext, setUserContext] = useContext(UserContext)
    const [isEditing, setIsEditing] = useState(false);
    const [navBarTabId, setNavBarTabId] = useState("overview");
    const [shouldUpdateProject, setShouldUpdateProject] = useState(false);

    const navigate = useNavigate();

    let { id } = useParams();

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
    
    const fetchProjectDetails = useCallback(() => { 
        axios.get(process.env.REACT_APP_API_ENDPOINT + "/projects/" + id + "/details")
        
        .then(response => {
            setProject(response.data[0])
            setShouldUpdateProject(false)
            return response
        }
        )
        .catch(error => {
           setShouldUpdateProject(false)
            console.log(error);
            return error
        })
    });

    const fetchInterfaceDetails = useCallback(() => { 
      axios.post(process.env.REACT_APP_API_ENDPOINT + "/projects/interfaces", {"interfaces": project.interfaces})
      
      .then(response => {
          setInterfaces(response.data)
          return response
      }
      )
      .catch(error => {
          console.log(error);
          return error
      })
  });

  const handleTabChange = (e) => {
        setNavBarTabId(e);
    }

  const renderWorkflowPanel = () => {
    return (
         <div class="ManageProjectParent" >
              <div class="ManageProjectChild1">
                <Card elevation={3}>
                 <H3>APIs</H3>
                    <ProjectInterfaces project={project}/>
                </Card> 
                <div style={{paddingTop: 30}}/>
                <Card elevation={3}>
                  <div class="ManageProjectConfigurationParent">
                    <div class="ManageProjectConfigurationChild1">
                        <H3>Partnership Configurations</H3>
                    </div>
                    <div class="ManageProjectConfigurationChild2">
                       <Button icon={handleEditIcon()} onClick={handleEdit} minimal={true}/>
                    </div>
                  </div>
                    <ProjectConfigurations interfaces={project.interfaces} project={project} isEditing={isEditing} /> 
                </Card>  
                </div>
                <div class="ManageProjectChild2">
                <Card elevation={3}>
                    <H3>Workflows</H3>
                        <Button intent={'primary'} text="New Workflow" onClick={() => navigate("/projects/"+project.uuid+"/workflows/new")}> </Button>
                        <ProjectWorkflows projectId={id} />
                  </Card>
                </div>
          </div>
    )
  }

    const handleEdit = () => {
      console.log(isEditing)
        if (isEditing == true) {
          setIsEditing(false)
        } else if (isEditing == false) {
          setIsEditing(true)
        }
      
    }

    const handleEditIcon = () => {
      if(isEditing == true) {
        return "cross"
      } else if (isEditing == false) {
        return "edit"
      }
  }

    useEffect(() => {
        // fetch only when user details are not present
        if (!userContext.details) {
          fetchUserDetails()
        }
      }, [userContext.details, fetchUserDetails])

    useEffect(() => {
        if(!project._id || shouldUpdateProject) {
            fetchProjectDetails()
        }
      }, [project, fetchProjectDetails])

    useEffect(() => {
        if(project._id && interfaces.length == 0) {
          fetchInterfaceDetails()
        }
      }, [interfaces, fetchInterfaceDetails])


      return userContext.details === null ? (
        "Error Loading User details"
      ) : !userContext.details ? (
        <Loader />
      ) : !project ? ( 
        <Loader />
     ) : (
        <div>
            <Navigation />
            <div className="container" style={{padding:40}}>
                <H1>Manage Partnership</H1>
            </div>
            <Divider />
            <H2 style={{paddingLeft:40, paddingTop: 40}}>{project.name}</H2>
            <div style={{paddingLeft: 40, paddingTop: 20}}/>
           <div style={{paddingLeft: 40}}>
              <Tabs onChange={handleTabChange} selectedTabId={navBarTabId} animate={true}>
                  <Tab id="overview" title="Overview" panel={renderWorkflowPanel()} />
                  <Tab id="customers" title="Partnership Customers" panel={<ManagePartnershipCustomers setShouldUpdateProject={setShouldUpdateProject} projectCustomers={project.customers} customerConfigurations={project.customer_configuration} />} />
                  <Tab id="onboarding" title="Onboarding" panel={<ProjectOnboarding />} />
                  <Tab id="support" title="Support" panel={<ProjectSupport />} />
              </Tabs>
            </div>
        </div>
      )

}

export default ManageProject