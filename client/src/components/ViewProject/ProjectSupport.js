import { Button, Card, H3, H4 } from "@blueprintjs/core"
import React, { useCallback, useContext, useRef, useEffect, useState} from "react"
import { UserContext } from "../../context/UserContext"
import Loader from "../Loader"
import { useNavigate, useParams} from "react-router-dom";
import axios from 'axios';
import {Editor} from "@tinymce/tinymce-react";
import "../../styles/workflowStudioStyles.css";

const ProjectSupport = () => {

  const [userContext, setUserContext] = useContext(UserContext)
  let {id} = useParams();
  const editorRef = useRef(null);
  const log = () => {
    if (editorRef.current) {
        console.log(editorRef.current.getContent());
    }
    };


  return userContext.details === null ? (
    "Error Loading User details"
  ) : !userContext.details ? (
    <Loader />
  ) : (
    <div>
        <Editor
        apiKey={process.env.REACT_APP_TINYMCE_API_KEY}
        onInit={(evt,editor) => editorRef.current = editor}
        initialValue="<p>Support Details for this partnership</p>"
        init={{
            height: 500,
            menubar: false,
            plugins: [
                'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview',
                'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
                'insertdatetime', 'media', 'table', 'code', 'help', 'wordcount','linkchecker', 'autolink', 'link','code'
              ],
              toolbar: 'undo redo | blocks | ' +
              'bold italic forecolor link code | alignleft aligncenter ' +
              'alignright alignjustify | bullist numlist outdent indent | ' +
              'help',
            content_style: 'body { font-family:Helvetica,Arial,sans-serif; font-size:14px }'
          }}/>
            <Button onClick={log}>Log editor content</Button>
    </div>
    
  )
}

export default ProjectSupport