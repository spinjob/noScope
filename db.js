const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const url = process.env.MONGO_DB_CONNECTION_STRING
//MONGO_DB_CONNECTION_STRING = mongodb+srv://beaver_admin:5SUfuTcWS8lq6PoG@cluster0.uppqagb.mongodb.net/?retryWrites=true&w=majority

mongoose.connect(url, {
    useNewUrlParser: true, 
    useUnifiedTopology: true
}).then((db) => {
        console.log("connected to db")
        })
    .catch((err) => {
        console.log(err)
    });

const gptEngineerConnection = mongoose.createConnection(`${url}/gpt-engineer`, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    dbName: 'gpt-engineer'
});

gptEngineerConnection.on('connected', () => console.log('Connected to GPT Engineer DB'))
gptEngineerConnection.on('error', (err) => console.log(err))

module.exports = {
    gptEngineerConnection
}