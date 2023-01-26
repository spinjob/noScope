import { Button, Card, H3, Icon, FormGroup, InputGroup, TextArea } from "@blueprintjs/core"
import React, { useCallback, useContext, useEffect, useRef, useState} from "react"
import { UserContext } from "../../context/UserContext"
import Loader from "../Loader"
import { useNavigate, useParams} from "react-router-dom";
import axios from 'axios';
import CreateCustomerConfigurations from "./CreateCustomerConfigurations";


const CreateCustomer = ({toggleOverlay}) => {

    const [userContext, setUserContext] = useContext(UserContext)
    const [customerName, setCustomerName] = useState('')
    const [customerKey, setCustomerKey] = useState('')
    const [customerNotes, setCustomerNotes] = useState('')
    const [customerEmail, setCustomerEmail] = useState('')
    const [customerConfigurations, setCustomerConfigurations] = useState({})
    
    const navigate = useNavigate();
    
    const updateConfigurations = (configurations) => {
        console.log(configurations)
        setCustomerConfigurations(configurations)
    }

    const handleCustomerCreation = () => {
        axios.post(process.env.REACT_APP_API_ENDPOINT + "/customers", 
        {
            name: customerName, 
            key: customerKey,
            notes: customerNotes,
            email: customerEmail,
            configurations: customerConfigurations,
            parent_organizations: [userContext.details.organization]
        })
            .then(response => {
                console.log(response.data)
                toggleOverlay()
                return(response.data)
            })
            .catch(error => {
                console.log(error);
                return error
            })
    }

    return (
        <Card style={{width: '40vw'}} >
            <div style={{ display: 'flex', justifyContent: 'right'}}>
                 <Button minimal={true} icon="delete" onClick={toggleOverlay} />
            </div>
            <div style={{padding:30}}>
                <H3>Create Customer</H3>
                <FormGroup label="Customer Key">
                    <InputGroup placeholder="What unique identifier can be used for this customer?" id="customerKey" onChange={e =>setCustomerKey(e.target.value)} value={customerKey}/>
                </FormGroup>

                <FormGroup label="Customer Name">
                    <InputGroup placeholder="Individual or Company Name" id="customerName" onChange={e =>setCustomerName(e.target.value)} value={customerName}/>
                </FormGroup>

                <FormGroup label="Customer Email">
                    <InputGroup placeholder="Email for the primary point-of-contact" id="customerEmail" onChange={e =>setCustomerEmail(e.target.value)} value={customerEmail}/>
                </FormGroup>


                <FormGroup label="Customer Notes">
                    <TextArea style={{width: '75vw'}} placeholder="Any unstructured notes for this customer." id="customerNotes" onChange={e =>setCustomerNotes(e.target.value)} value={customerNotes}/>
                </FormGroup>

                {/* <CreateCustomerConfigurations updateConfigurations={updateConfigurations} /> */}

                <Button text="Create" outlined={true} intent={'success'} onClick={handleCustomerCreation}/>
            </div>
         
            
        </Card>
    
    )
}

export default CreateCustomer