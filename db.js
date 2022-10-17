const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const url = process.env.MONGO_DB_CONNECTION_STRING

mongoose.connect(url, {
    useNewUrlParser: true, 
    useUnifiedTopology: true
}).then((db) => {
        console.log("connected to db")
        })
    .catch((err) => {
        console.log(err)
    });

