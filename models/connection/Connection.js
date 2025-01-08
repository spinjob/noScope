var mongoose = require('mongoose');
var ConnectionSchema = new mongoose.Schema({
    uuid: String,
    name: String,
    categories: [String],
    created_at: String,
    updated_at: String,
    deleted_at: String,
    account_token: String,
    service: String,
    organization: String,
    status: String,
    configurations: Object,
});

mongoose.model('Connection', ConnectionSchema);

module.exports = mongoose.model('Connection');
