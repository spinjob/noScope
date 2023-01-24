import { Button, Card, H3, Icon } from "@blueprintjs/core"
import React, { useCallback, useContext, useEffect, useState} from "react"
import { UserContext } from "../../context/UserContext"
import Loader from "../Loader"
import { useNavigate, useParams} from "react-router-dom";
import axios from 'axios';
import "../../styles/workflowStudioStyles.css";

const ManagePartnershipCustomers = (interfaces) => {

  const navigate = useNavigate();
  const [userContext, setUserContext] = useContext(UserContext)
  const [organizationCustomers, setOrganizationCustomers] = useState([]);
  let {id} = useParams();


  const fetchOrganizationCustomers = useCallback(() => { 

    axios.get(process.env.REACT_APP_API_ENDPOINT + "/customers", {params: {organiztion:userContext.details.organization}})
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
    <div style={{display: 'flex', width: 500, paddingTop: 10}}>
        <Button icon={'search'} outlined={true} intent={'none'} text="Add Customer" />
        <div style={{paddingLeft:10}}/>
        <Button icon={'new-person'} outlined={true} intent={'primary'} text="Create & Add Customer" />
        {/* <Customers organizationCustomers={projectWorkflows}/> */}
   </div>     
    
  )
}

export default ManagePartnershipCustomers