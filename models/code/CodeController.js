var express = require('express');
var router = express.Router();
router.use(express.urlencoded({extended: true}));
router.use(express.json());
const axios = require('axios');
const {gptEngineerConnection} = require('../../db');
const mongoose = require('mongoose');
const GridFSBucket = require('mongodb').GridFSBucket;
const {constructWorkflowPrompt} = require('../../utils/workflowPromptGenerator');

let bucket;

gptEngineerConnection.once('open', () => {
    bucket = new GridFSBucket(gptEngineerConnection.db);
});
  
  
// RETRIEVES GENERATED CODE FROM GRIDFS

router.get('/:id/files', (req, res) => {
    const metadataFilter = { 'metadata.workflow_id': req.params.id };
    bucket.find(metadataFilter).toArray((err, files) => {
      if (err) {
        res.status(500).send(err);
        return;
      }
      if (!files || files.length === 0) {
        res.status(404).send('No files found');
        return;
      }
  
      const filePromises = files.map(file => {
        return new Promise((resolve, reject) => {
          let fileContent = '';
          const readStream = bucket.openDownloadStream(file._id);
  
          readStream.on('data', chunk => {
            fileContent += chunk.toString();
          });
  
          readStream.on('end', () => {
            file.content = fileContent;
            resolve(file);
          });
  
          readStream.on('error', reject);
        });
      });
  
      Promise.all(filePromises)
        .then(filesWithContent => res.send(filesWithContent))
        .catch(err => res.status(500).send(err));
    });
});

// TRIGGER CODE GENERATION

router.post('/:id/generate', async (req, res) => { 
    try {
        const workflowId = req.params.id;
        const language = req.body.metadata.language;
        const additionalInstructions = req.body.metadata.additional_instructions;

        const prompt = await constructWorkflowPrompt(workflowId, language, additionalInstructions);
        // console.log(prompt);
        // res.status(200);
        const requestBody = {
            project_path: req.body.project_path,
            project_prompt: prompt,
            metadata: req.body.metadata,
        };

        const response = await axios.post(process.env.GPT_ENG_API_HOST + '/generate', requestBody); 
        console.log(response.data);
        res.status(200).send(response.data);
    } catch (error) {
        console.log(error);
        res.status(500).send(error);
    }
});

module.exports = router;