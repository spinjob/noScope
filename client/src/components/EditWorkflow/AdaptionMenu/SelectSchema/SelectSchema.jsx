import React, { useCallback, useParams, useState } from "react";
import { Button, MenuItem, H5 } from "@blueprintjs/core";
import { Select2 } from "@blueprintjs/select";
import { IconNames } from "@blueprintjs/icons";
import axios from "axios";
import {withRouter} from 'react-router';

import {filterSchema, renderSchemas, schemaSelectProps} from "./schemas";

class SelectSchema extends React.PureComponent {
  constructor(props) {
    super(props);

    this.state = {
     schema: {icon:"",label:"", id: "", nodeData:{description: "", fieldPath: "", type: "", uuid: ""}},
     schemas: []
    }
  }

  componentDidMount(){
    if(
        this.props.schemas.length > 0) {
          console.log(this.props.schemas)
    }
    else {
       console.log( "No schemas found")
    };
  }


  // Each of the Select2 components will display the same interface name BUT there will not be a UUID.  So, the user *must* select an interface for the UUID to pass through for the creation of the project on the back-end.
  render() {
    const buttonText = "Add another field"
    return (
      <div className="schema-label">
        {this.props.label && <H5>{this.props.label}</H5>}
        <Select2
          fill
          items={this.props.schemas}
          itemPredicate={filterSchema}
          itemRenderer={renderSchemas}
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
            minimal={true}
            outlined={true}
          />
        </Select2>
      </div>
    );
  }

  handleValueChange = schema => {
    this.setState({ schema: schema });
    if (this.props.setSchema) {
      this.props.setSchema(schema);
    }
  };
}

export default SelectSchema;
