var mongoose = require('mongoose');
const passportLocalMongoose = require('passport-local-mongoose');

const Session = new mongoose.Schema({
    refreshToken: {
        type: String,
        default: ""
    },
});

const UserSchema = new mongoose.Schema({
    firstName: {
        type: String,
        default: ""
    },
    lastName: {
        type: String,
        default: ""
    },
    organization: {
        type: String,
        default: ""
    },
    name: {
        type: String,
        default: ""
    },
    email: {
        type: String,
        default: ""
    },
    auth0Id: {
        type: String,
        default: ""
    },
    authStrategy: {
        type: String,
        default: "local"
    },
    refreshToken: {
        type: [Session]
    }
});

UserSchema.set('toJSON', {
    transform: function (doc, ret, options) {
        delete ret.refreshToken
        return ret;
    }
});

UserSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model("User", UserSchema);
