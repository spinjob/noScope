import React, { useCallback, useParams, useState } from "react";
import { Button, MenuItem, H5 } from "@blueprintjs/core";
import { Select2 } from "@blueprintjs/select";
import { IconNames } from "@blueprintjs/icons";
import axios from "axios";
import {withRouter} from 'react-router';

import * as Triggers from "./triggers";
//import "./SelectTADIG.css";

class SelectTrigger extends React.PureComponent {
  constructor(props) {
    super(props);

    this.state = {
     trigger: {name: "", uuid: ""},
      triggers: []
    };
  }

  componentDidMount(){
    this.getTriggers();
    console.log("componentDidMount")
    console.log(this.getTriggers())
  }

  async getTriggers(){

    const projects = await axios.get(process.env.REACT_APP_API_ENDPOINT + "/projects/5814af2a-2e0d-4bfb-ba5e-52fec2bfb20e/details").then( response => {return response.data})
       
    axios.post(process.env.REACT_APP_API_ENDPOINT + "/interfaces/webhooks", {
        "interfaces": projects[0].interfaces
      }).then(
        response => {
            this.setState(
                { 
                    triggers: response.data.map((m, index) => ({ ...m, rank: index + 1 }))
                }
            )
           //console.log(response)
            return response.data
        }
      )
      
  }
  // Each of the Select2 components will display the same interface name BUT there will not be a UUID.  So, the user *must* select an interface for the UUID to pass through for the creation of the project on the back-end.
  render() {
    const buttonText = this.state.trigger.name
    return (
      <div className="trigger-label">
        {this.props.label && <H5>{this.props.label}</H5>}
        <Select2
          fill
          items={this.state.triggers}
          itemPredicate={Triggers.filterTriggers}
          itemRenderer={Triggers.renderTriggers}
          noResults={<MenuItem disabled={true} text="No results." />}
          onItemSelect={this.handleValueChange}
        >
          <Button
          {...this.props}
            intent={this.props.intent}
            text={buttonText}
            rightIcon="caret-down"
            icon={IconNames.CODE}
          />
        </Select2>
      </div>
    );
  }

  handleValueChange = trigger => {
    this.setState({ trigger: trigger });
    if (this.props.setTrigger) {
      this.props.setTrigger(trigger.uuid);
    }
  };
}

export default SelectTrigger;
