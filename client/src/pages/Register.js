import { Button, Callout, FormGroup, InputGroup } from "@blueprintjs/core"
import React, { useContext, useState } from "react"
import { UserContext } from "../context/UserContext"
import axios from "axios"

const Register = () => {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [organization, setOrganization] = useState("")
  const [setUserContext] = useContext(UserContext)

  const setUserToken = (token) => {
      setUserContext(oldValues => {
        return { ...oldValues, token: token }
      })
  }
  const formSubmitHandler = e => {
    e.preventDefault()
    setIsSubmitting(true)
    setError("")

    const genericErrorMessage = "Something went wrong! Please try again later."

    axios.get(process.env.REACT_APP_API_ENDPOINT + "/organization/"+organization).then(response => {

        fetch(process.env.REACT_APP_API_ENDPOINT + "/users/signup", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ firstName, lastName, username: email, password, organization }),
        })
          .then(async response => {
            setIsSubmitting(false)
            if (!response.ok) {
              if (response.status === 400) {
                setError("Please fill all the fields correctly!")
              } else if (response.status === 401) {
                setError("Invalid email and password combination.")
              } else if (response.status === 500) {
                console.log(response)
                const data = await response.json()
                if (data.message) setError(data.message || genericErrorMessage)
              } else {
                setError(genericErrorMessage)
              }
            } else {
              const data = await response.json()
              console.log(data);
              setUserToken(data.token)
            }
          })
          .catch(error => {
            console.log(error)
            setIsSubmitting(false)
            setError(genericErrorMessage)
          })

    }).catch(error => {
      console.log(error)
      setIsSubmitting(false)
      setError("Organization not found!")
    
    })

    
  }

  return (
    <>
      {error && <Callout intent="danger">{error}</Callout>}

      <form onSubmit={formSubmitHandler} className="auth-form">
        <FormGroup label="Organization" labelFor="organization">
            <InputGroup
              id="organizationCode"
              placeholder="Organization Code"
              onChange={e => setOrganization(e.target.value)}
              value={organization}
            />
        </FormGroup>
        <FormGroup label="First Name" labelFor="firstName">
          <InputGroup
            id="firstName"
            placeholder="First Name"
            onChange={e => setFirstName(e.target.value)}
            value={firstName}
          />
        </FormGroup>
        <FormGroup label="Last Name" labelFor="firstName">
          <InputGroup
            id="lastName"
            placeholder="Last Name"
            onChange={e => setLastName(e.target.value)}
            value={lastName}
          />
        </FormGroup>
        <FormGroup label="Email" labelFor="email">
          <InputGroup
            id="email"
            type="email"
            placeholder="Email"
            onChange={e => setEmail(e.target.value)}
            value={email}
          />
        </FormGroup>
        <FormGroup label="Password" labelFor="password">
          <InputGroup
            id="password"
            placeholder="Password"
            type="password"
            onChange={e => setPassword(e.target.value)}
            value={password}
          />
        </FormGroup>
        <Button
          intent="primary"
          disabled={isSubmitting}
          text={`${isSubmitting ? "Registering" : "Register"}`}
          fill
          type="submit"
        />
      </form>
    </>
  )
}

export default Register