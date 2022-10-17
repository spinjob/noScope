const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const User = require('../models/user/User');

//Called during login/signup
passport.use(new LocalStrategy(User.authenticate()));

//Called after logging in / signing up to set user details in req.user
passport.serializeUser(User.serializeUser());