var mongoose = require('mongoose');
//var mongooseWebhooks = require('mongoose-webhooks');
var UserSchema = new mongoose.Schema({
    name: String,
    email: String,
    password: String
});

//UserSchema.plugin(mongooseWebhooks, {'urls': 'http://localhost:3000/users'})

mongoose.model('User', UserSchema);

module.exports = mongoose.model('User');
