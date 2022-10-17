const express = require('express');
const router = express.Router();
const User = require('./User');

const {getToken, COOKIE_OPTIONS, getRefreshToken} = require('../../authenticate.js');
const { Error } = require('mongoose');


router.post("/signup", (req, res) => {
    //Verify that the first name isn't empty
    if (!req.body.firstName) {
        res.statusCode = 500
        res.send({
            name: "FirstNameError",
            message: "First name cannot be empty"
        })
    } else {
        User.register(
            new User({username: req.body.username}),
            req.body.password,
            (err, user) => { 
                if (err) {
                    res.statusCode = 500
                    res.send(err)
                } else {
                    user.firstName = req.body.firstName
                    user.lastName = req.body.lastName || ""
                    const token = getToken({_id: user._id})
                    const refreshToken = getRefreshToken({_id: user._id})
                    user.refreshToken.push({refreshToken})
                    user.save((err, user) => {
                        if (err){
                            res.statusCode = 500
                            res.send(err)
                        } else {
                            res.cookie('refreshToken', refreshToken, COOKIE_OPTIONS)
                            res.send({success: true, token})
                        }
                     }
                    )
                    
                }
            }
        )
    }
})

module.exports = router