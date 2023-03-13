var mongoose = require('mongoose');

var JobSchema = new mongoose.Schema({
    uuid: String,
    created_at: String,
    updated_at: String,
    type: String,
    status: String,
    metadata: Object,
    created_by: String
});

mongoose.model('Job', JobSchema);

module.exports = mongoose.model('Job');
