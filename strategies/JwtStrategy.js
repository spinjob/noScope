const passport = require('passport');
const JwtStrategy = require('passport-jwt').Strategy, ExtractJwt = require('passport-jwt').ExtractJwt;
const User = require('../models/user/User');

const opts = {};
opts.jwtFromRequest = ExtractJwt.fromAuthHeaderAsBearerToken();
opts.secretOrKey = process.env.JWT_SECRET;

passport.use(
    new JwtStrategy(opts, function(jwt_payload, done) {
        User.findById(jwt_payload.id, function(err, user) {
            if (err) {
                return done(err, false);
            }
            if (user) {
                return done(null, user);
            } else {
                return done(null, false);
            }
        });
    })
);