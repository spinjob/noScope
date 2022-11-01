import React, { useCallback, useState, useContext, useEffect } from "react";
import { useParams } from "react-router-dom";
import Navigation from "../components/Navigation";
import { UserContext } from "../context/UserContext"
import ReactFlow, {
  addEdge,
  Controls,
  Background,
  useNodesState,
  useEdgesState
} from "reactflow";
import "reactflow/dist/style.css";

const onInit = (reactFlowInstance) =>
  console.log("flow loaded:", reactFlowInstance);

const SchemaMapper = () => {
    let { id, workflowId } = useParams();

    const [userContext, setUserContext] = useContext(UserContext)

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

  return (

    <div>
        <body>
            <Navigation />
            <div class="Parent">
                <div class="child1">
                    <p>Column 1</p>
                </div>
                <div class="child2">
                    <p>Column 2</p>
                </div>
            </div>
        </body>
  </div>
);
}

export default SchemaMapper;
