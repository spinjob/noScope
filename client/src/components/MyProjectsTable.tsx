import React, {useEffect, useState, useRef, useCallback} from "react";
import { Card, Button, MenuItem, H1, H2, H3, H4, H5 } from "@blueprintjs/core";
import { useNavigate } from "react-router-dom";
import { Table2, Column, Cell} from '@blueprintjs/table';
import axios from "axios";
import "@blueprintjs/core/lib/css/blueprint.css";
import "@blueprintjs/table/lib/css/table.css";

export default function MyProjectsTable() {

    const navigate = useNavigate();
    const [projects, setProjects] = useState<Array<Array<String>>>([]);

    const formatProjectData = (data) => {
      var newProjects : string[][] = []
      
      data.forEach(element => {
        var projectArray : string[] = []
        var projectName : string = element.name
        var projectInterfaces = element.interfaces.join(", ")
        var projectUUID = element.uuid
        projectArray.push(projectName, projectInterfaces, projectUUID)
        newProjects.push(projectArray)
      });

      return newProjects

    }
    const fetchProjects = () => {
      axios.get(process.env.REACT_APP_API_ENDPOINT + "/projects")
      .then(response => {
          setProjects(formatProjectData(response.data));
          return formatProjectData(response.data)
      }
      )
      .catch(error => {
          console.log(error);
      })
  
  }
        
  useEffect(() => {
    if(!projects.length) {
        fetchProjects()
    }
  }, [projects, setProjects])

  const getCellData = (rowIndex: number, columnIndex: number) => {
    return projects[rowIndex][columnIndex];
  };

  const cellRenderer = (rowIndex: number, columnIndex: number) => (
    <Cell>{`${projects[rowIndex][columnIndex]}`}</Cell>
  );

  const columns = ["name", "interfaces", "uuid"].map(
    (element: string, index: number) => {
      return <Column key={index} name={element} cellRenderer={cellRenderer} />;
    }
  );

  const clickHandler = (uuid) => {
      navigate("/project/" + uuid)
  }


  return (
    <>
      {/* <Table2 numRows={projects.length} getCellClipboardData={getCellData}>
        {columns}
      </Table2> */}
      <div>
        {projects.map((project, index) => (

            <Card>
              <H3>{project[0]}</H3>
              <Button text="Details" onClick={() => navigate("/projects/" + project[2])}> </Button>
            </Card>

        ))}
      
      </div>
    </>
  );
}


