import React, { useCallback, useState, useContext, useEffect } from "react";
import { ProgressBar, Card, H1, H2, H3, H4, H5 } from "@blueprintjs/core";
import "reactflow/dist/style.css";

const SchemaMapperHeader = ({requiredActionFields, mappings}) => {
    const requiredActionFieldsCount = requiredActionFields.length;
    var requiredMappings = mappings;
    var requiredMappingsCount = 0
    
    if (!mappings) {
        console.log("No Mappings")
    } else {
        requiredMappings = requiredMappings.filter(mapping => mapping.outputSchema.nodeData.required);
        requiredMappingsCount = requiredMappings.length;
    } 

    return (
        <div style={{ padding: 30}}>
            <Card style={{width: '85vw', display: 'block'}}>
                <div style={{display: 'block', width: '75vw', padding: 30, justifyContent: 'left', alignContent: 'center', alignItems: 'center'}}>
                    <div style={{display: 'block', width: 300, alignContent: 'center', alignItems: 'center'}}>
                        <H5> {requiredMappingsCount} out of {requiredActionFieldsCount} Required Fields Mapped</H5>
                    </div>
                    <div style={{display: 'block', width: 300, alignContent: 'center', alignItems: 'center'}}>
                        <ProgressBar intent={'primary'} stripes={false} value={requiredMappingsCount / requiredActionFieldsCount}/>
                    </div>
                </div>
            </Card>
        </div>
    )
}

export default SchemaMapperHeader;