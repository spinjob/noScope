import React, { useCallback, useParams, useState } from "react";
import { Button, MenuItem, H5 } from "@blueprintjs/core";
import { Select2 } from "@blueprintjs/select";
import { IconNames } from "@blueprintjs/icons";
import axios from "axios";
import {withRouter} from 'react-router';

import * as Actions from "./actions";
//import "./SelectTADIG.css";

class SelectAction extends React.PureComponent {
  constructor(props) {
    super(props);

    this.state = {
     action: {name: "", uuid: ""},
     actions: [],
     projectId: props.projectId,
     interfaces: props.interfaces
    };

    console.log("SelectAction.jsx")
    console.log(this.props.interfaces)
  }

  componentDidMount(){
    this.getActions();
  }

  async getActions(){

    const projects = await axios.get(process.env.REACT_APP_API_ENDPOINT + "/projects/" + this.state.projectId +"/details").then( response => {return response.data})
       
    axios.post(process.env.REACT_APP_API_ENDPOINT + "/interfaces/actions", {
        "interfaces": projects[0].interfaces
      }).then(
        response => {
            this.setState(
                { 
                    // actions: response.data.map((m, index) => ({ ...m, rank: index + 1 }))
                    actions: response.data.map((m, index) => (
                      { ...m, 
                        rank: index + 1, 
                        interface_name: this.props.interfaces.length > 0 ? (this.props.interfaces.filter(
                            function(api) {
                              return api.uuid == m.parent_interface_uuid
                            }
                          )[0].name) : ("")
                      }
                    )
                  )
                }
            )
           //console.log(response)
            return response.data
        }
      )
      
  }
  // Each of the Select2 components will display the same interface name BUT there will not be a UUID.  So, the user *must* select an interface for the UUID to pass through for the creation of the project on the back-end.
  render() {
    const buttonText = this.state.action.name
    return (
      <div className="trigger-label">
        {this.props.label && <H5>{this.props.label}</H5>}
        <Select2
          fill
          items={this.state.actions}
          itemPredicate={Actions.filterActions}
          itemRenderer={Actions.renderActions}
          noResults={<MenuItem disabled={true} text="No results." />}
          onItemSelect={this.handleValueChange}
          disabled={this.props.isDisabled}
        >
          <Button
          {...this.props}
            intent={this.props.intent}
            text={buttonText}
            rightIcon="caret-down"
            icon={IconNames.CODE}
            disabled={this.props.isDisabled}
          />
        </Select2>
      </div>
    );
  }

  handleValueChange = action => {
    this.setState({ action: action });
    if (this.props.setAction) {
      this.props.setAction(action);
    }
  };
}

export default SelectAction;
