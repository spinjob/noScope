import { Button, Card, H1, H3, Icon, Overlay } from "@blueprintjs/core"
import React, { useCallback, useContext, useEffect, useState} from "react"
import { UserContext } from "../context/UserContext"
import Loader from "../components/Loader"
import { useNavigate, useParams} from "react-router-dom";
import axios from 'axios';
import Navigation from "../components/Navigation";
import CustomerTable from "../components/ViewCustomers/CustomerTable.jsx";
import CreateCustomer from "../components/CreateCustomer/CreateCustomer";


const ManageOrganizationCustomers = (interfaces) => {

  const navigate = useNavigate();
  const [userContext, setUserContext] = useContext(UserContext)
  const [organizationCustomers, setOrganizationCustomers] = useState([]);
  const [isOverlayOpen, setIsOverlayOpen] = useState(false);

  let {id} = useParams();

  const fetchOrganizationCustomers = useCallback(() => { 

    axios.get(process.env.REACT_APP_API_ENDPOINT + "/customers", {params: {organization:userContext.details.organization}})
        .then(response => {
            setOrganizationCustomers(response.data)
            console.log(response.data)
            return(response.data)
        })
        .catch(error => {
            console.log(error);
            return error
        })

});

const toggleOverlay = () => {
    if(isOverlayOpen){
        setIsOverlayOpen(false)
    } else {
        setIsOverlayOpen(true)
    }
}

const Customers = ({organizationCustomers}) => (
    <>
      {organizationCustomers.map(customer => (
        <Card>
            <div>
                <div>
                     <H3>{customer.name}</H3>
                </div>
            </div>
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
      <Navigation />
        <Overlay isOpen={isOverlayOpen} onClose={() => setIsOverlayOpen(false)} canEscapeKeyClose={true} canOutsideClickClose={true}>
        <div style={{display: 'flex', alignItems: 'center', justifyContent: 'center', height: '50vh', width: '100vw', padding: 30}}>
              <CreateCustomer toggleOverlay={toggleOverlay} />
          </div>
        </ Overlay>
        <div style={{display: 'block', width: 600, padding: 50}}>
        <H1>Manage Customers</H1>
        <div style={{display: 'flex', paddingTop: 20}}>
          <Button icon={'new-person'} outlined={true} onClick={() => setIsOverlayOpen(true)} intent={'primary'} text="Create Customer" />
          <div style={{paddingLeft:10}}/>
          <Button icon={'th'} outlined={true} intent={'primary'} text="Import CSV" />
       </div>
          <CustomerTable customers={organizationCustomers} />
      </div>  
    </div>
   
    
  )
}

export default ManageOrganizationCustomers