import * as React from "react";
import { Button, MenuItem, H5 } from "@blueprintjs/core";
import { Select2 } from "@blueprintjs/select";
import { IconNames } from "@blueprintjs/icons";

import * as Interfaces from "./interfaces";
//import "./SelectTADIG.css";

class SelectInterface extends React.PureComponent {
  constructor(props) {
    super(props);

    this.state = {
      interface: Interfaces.userInterfaces[0]
    };
  }
  render() {
    const buttonText = this.state.interface.name;
    return (
      <div className="interface-label">
        {this.props.label && <H5>{this.props.label}</H5>}
        <Select2
          fill
          items={Interfaces.userInterfaces}
          itemPredicate={Interfaces.filterInterface}
          itemRenderer={Interfaces.renderInterfaces}
          noResults={<MenuItem disabled={true} text="No results." />}
          onItemSelect={this.handleValueChange}
        >
          <Button
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
    console.log(userInterface)
    this.setState({ interface: userInterface });
    if (this.props.setInterface) {
      this.props.setInterface(userInterface.name);
    }
  };
}

export default SelectInterface;
