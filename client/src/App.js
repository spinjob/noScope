import { Card, Tab, Tabs} from "@blueprintjs/core"
import { useCallback, useContext, useEffect, useState } from "react"
import { UserContext } from "./context/UserContext"
import Loader from "./components/Loader"
import Login from "./pages/Login"
import Register from "./pages/Register"
import Home from "./pages/Home"
import NewProject from "./pages/NewProject"
import ManageProject from "./pages/ManageProject"
import { BrowserRouter, Route, Routes } from 'react-router-dom';


function App() {

  const [currentTab, setCurrentTab] = useState("login")
  const [userContext, setUserContext] = useContext(UserContext)
  
 
  const verifyUser = useCallback(() => {
    fetch(process.env.REACT_APP_API_ENDPOINT + "/users/refreshToken", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
    }).then(async response => {
      if (response.ok) {
        const data = await response.json()
        setUserContext(oldValues => {
          return { ...oldValues, token: data.token }
        })
      } else {
        setUserContext(oldValues => {
          return { ...oldValues, token: null }
        })
      }
      // call refreshToken every 5 minutes to renew the authentication token.
      setTimeout(verifyUser, 5 * 60 * 1000)
    })
  }, [setUserContext])

  useEffect(() => {
    verifyUser()
  }, [verifyUser])

    /**
   * Sync logout across tabs
   */
     const syncLogout = useCallback(event => {
      if (event.key === "logout") {
        // If using react-router-dom, you may call history.push("/")
        window.location.reload()
      }
    }, [])
  
    useEffect(() => {
      window.addEventListener("storage", syncLogout)
      return () => {
        window.removeEventListener("storage", syncLogout)
      }
    }, [syncLogout])

  return  userContext.token === null ? (
    <Card elevation="1">
      <Tabs id="Tabs" onChange={setCurrentTab} selectedTabId={currentTab}>
        <Tab id="login" title="Login" panel={<Login />} />
        <Tab id="register" title="Register" panel={<Register />} />
        <Tabs.Expander />
      </Tabs>
    </Card>
  ) : userContext.token ? (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/projects/new" element={<NewProject />} />
      <Route path="/projects/:id" element={<ManageProject />} />
    </Routes> 
  ) : (
    <Loader />
  )
}

export default App