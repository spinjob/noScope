import * as React from "react";
import { Button, MenuItem, H5 } from "@blueprintjs/core";
import { Select2 } from "@blueprintjs/select";
import { IconNames } from "@blueprintjs/icons";
import axios from "axios";

import * as Interfaces from "./interfaces";
//import "./SelectTADIG.css";

class SelectInterface extends React.PureComponent {
  constructor(props) {
    super(props);

    this.state = {
      interface: {name: "", uuid: ""},
      interfaces: []
    };
  }

  componentDidMount(){
    this.getInterfaces();
  }

  getInterfaces(){
        axios.get(process.env.REACT_APP_API_ENDPOINT + "/interfaces")
        .then(response => {
            this.setState(
                { 
                    interface: response.data.map((m, index) => ({ ...m, rank: index + 1 }))[0],
                    interfaces: response.data.map((m, index) => ({ ...m, rank: index + 1 }))
                }
            )
            return response
        }
        )
        .catch(error => {
            this.setState({ errorMessage: error.message });
            console.log(error);
        })

  }

  render() {
    const buttonText = this.state.interface.name
    return (
      <div className="interface-label">
        {this.props.label && <H5>{this.props.label}</H5>}
        <Select2
          fill
          items={this.state.interfaces}
          itemPredicate={Interfaces.filterInterface}
          itemRenderer={Interfaces.renderInterfaces}
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

  handleValueChange = userInterface => {
    this.setState({ interface: userInterface });
    if (this.props.setInterface) {
      this.props.setInterface(userInterface.uuid);
    }
  };
}

export default SelectInterface;
