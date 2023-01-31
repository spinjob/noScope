import { Button, Card, H3, Icon, Overlay } from "@blueprintjs/core"
import React, { useCallback, useContext, useEffect, useState} from "react"
import { UserContext } from "../../context/UserContext"
import Loader from "../Loader"
import { useNavigate, useParams} from "react-router-dom";
import axios from 'axios';
import "../../styles/workflowStudioStyles.css";
import CustomerTable from "./CustomerTable";

const ManagePartnershipCustomers = ({projectCustomers, setShouldUpdateProject}) => {

  const navigate = useNavigate();
  const [userContext, setUserContext] = useContext(UserContext)
  const [organizationCustomers, setOrganizationCustomers] = useState([]);
  const [customerState, setCustomerState] = useState({});
  const [isOverlayOpen, setIsOverlayOpen] = useState(false);
  let {id} = useParams();


  const toggleOverlay = () => {
    if(isOverlayOpen){
        setIsOverlayOpen(false)
    } else {
        setIsOverlayOpen(true)
    }
  }
  const fetchOrganizationCustomers = useCallback(() => { 

    axios.get(process.env.REACT_APP_API_ENDPOINT + "/customers", {params: {organization:userContext.details.organization}})
        .then(response => {
            setOrganizationCustomers(response.data)
            for(var i = 0; i < response.data.length; i++){
              customerState[response.data[i].key] = response.data[i]
            }
            for(var i = 0; i < projectCustomers.length; i++){
              customerState[projectCustomers[i].key].selected = true
            }
            setCustomerState(customerState)
            return(response.data)
        })
        .catch(error => {
            console.log(error);
            return error
        })

});

  const updateCustomerState = (customer, e) => {
    if(e.target.checked == true) {
      customerState[customer.key].selected = true
      setCustomerState(customerState)
      console.log(customerState)
      
  } else if(e.target.checked == false) {
      customerState[customer.key].selected = false
      setCustomerState(customerState)
      console.log(customerState)
  }
  }

  const savePartnershipCustomers = () => {
    var customers = []
    var customerKeys = Object.keys(customerState)
    var customerValues = Object.values(customerState)

    for(var i = 0; i < customerKeys.length; i++){
      if(customerValues[i].selected){
        customers.push(customerValues[i])
      }
    }
    axios.put(process.env.REACT_APP_API_ENDPOINT + "/projects/" + id + '/customers' , {customers: customers}).then(response => {
      console.log(response)
      setShouldUpdateProject(true)
      toggleOverlay()
    }).catch(error => {
      console.log(error)
    })
  }

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

        console.log(userContext.details)
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
    } else if (userContext.details.organization) {
        fetchOrganizationCustomers()
    }
    
  }, [userContext.details, fetchUserDetails])

  return userContext.details === null ? (
    "Error Loading User details"
  ) : !userContext.details ? (
    <Loader />
  ) : (
    <div>
      <Overlay isOpen={isOverlayOpen} onClose={() => setIsOverlayOpen(false)} canEscapeKeyClose={true} canOutsideClickClose={true}>
        <div style={{display: 'flex', alignItems: 'center', justifyContent: 'center', height: '50vh', width: '100vw', padding: 30}}>
          <Card elevation={2} style={{  padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'right'}}>
              <Button minimal={true} icon="delete" onClick={toggleOverlay} />
            </div>
            <H3>Add Customers</H3>
            <CustomerTable customers={organizationCustomers} selectedCustomers={projectCustomers} state={'Adding'} updateCustomerState={updateCustomerState} savePartnershipCustomers={savePartnershipCustomers}/>
          </Card>
        </div>
      </Overlay>
      <div style={{display: 'flex', width: 500, paddingTop: 10}}>
              <Button onClick={toggleOverlay} icon={'search'} outlined={true} intent={'none'} text="Add Customer" />
              <div style={{paddingLeft:10}}/>
              <Button icon={'new-person'} outlined={true} intent={'primary'} text="Create & Add Customer" />
      </div> 
      <div style={{paddingTop:10}}>
      <CustomerTable customers={projectCustomers} state={'Viewing'} />
      </div>
    </div>
       
    
  )
}

export default ManagePartnershipCustomers