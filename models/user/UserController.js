const express = require('express');
const router = express.Router();
const User = require('./User');
const passport = require('passport');
const jwt = require('jsonwebtoken');

const {getToken, COOKIE_OPTIONS, getRefreshToken, verifyUser} = require('../../authenticate.js');
const { Error } = require('mongoose');

router.post("/signup", (req, res, next) => {
    
    // Verify that first name is not empty
    if (!req.body.firstName) {
      res.statusCode = 500
      res.send({
        name: "FirstNameError",
        message: "The first name is required",
      })
    } else {
      User.register(
        new User({ username: req.body.username }),
        req.body.password,
        (err, user) => {
          if (err) {
            res.statusCode = 500
            res.send(err)
          } else {
            user.firstName = req.body.firstName || ""
            user.lastName = req.body.lastName || ""
            user.organization = req.body.organization || ""
            user.name = req.body.name || ""
            user.auth0Id = req.body.auth0Id || ""
            user.email = req.body.email || ""
            const token = getToken({ _id: user._id })
            const refreshToken = getRefreshToken({ _id: user._id })
            user.refreshToken.push({ refreshToken })
            user.save((err, user) => {
              if (err) {
                res.statusCode = 500
                res.send(err)
              } else {
                res.cookie("refreshToken", refreshToken, COOKIE_OPTIONS)
                res.send({ success: true, token })
              }
            })
          }
        }
      )
    }
  })

router.post("/login", passport.authenticate("local"), (req, res, next) => {
    const token = getToken({ _id: req.user._id })
    const refreshToken = getRefreshToken({ _id: req.user._id })
    User.findById(req.user._id).then(
      user => {
        user.refreshToken.push({ refreshToken })
        user.save((err, user) => {
          if (err) {
            res.statusCode = 500
            res.send(err)
          } else {
            res.cookie("refreshToken", refreshToken, COOKIE_OPTIONS)
            res.send({ success: true, token })
          }
        })
      },
      err => next(err)
    )
  })

  router.post("/refreshToken", (req, res, next) => {
    const { signedCookies = {} } = req
    const { refreshToken } = signedCookies
  
    if (refreshToken) {
      try {
        const payload = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET)
        const userId = payload._id
        User.findOne({ _id: userId }).then(
          user => {
            if (user) {
              // Find the refresh token against the user record in database
              const tokenIndex = user.refreshToken.findIndex(
                item => item.refreshToken === refreshToken
              )
  
              if (tokenIndex === -1) {
                res.statusCode = 401
                res.send("Unauthorized")
              } else {
                const token = getToken({ _id: userId })
                // If the refresh token exists, then create new one and replace it.
                const newRefreshToken = getRefreshToken({ _id: userId })
                user.refreshToken[tokenIndex] = { refreshToken: newRefreshToken }
                user.save((err, user) => {
                  if (err) {
                    res.statusCode = 500
                    res.send(err)
                  } else {
                    res.cookie("refreshToken", newRefreshToken, COOKIE_OPTIONS)
                    res.send({ success: true, token })
                  }
                })
              }
            } else {
              res.statusCode = 401
              res.send("Unauthorized")
            }
          },
          err => next(err)
        )
      } catch (err) {
        res.statusCode = 401
        res.send("Unauthorized")
      }
    } else {
      res.statusCode = 401
      res.send("Unauthorized")
    }
  })

router.get("/me", verifyUser, (req, res, next) => {
    res.send(req.user)
  })  

router.post('/find', function(req,res) {
    User.findOne({email: req.body.email}, function (err, user) {
        if (err) return res.status(500).send({
            name: "UserFindError",
            error: err
        });
        res.status(200).send(user);
    });
});

router.get('/', function(req,res) {
  if(req.query.organization){
    User.find({organization: req.query.organization}, function (err, users) {
      if (err) return res.status(500).send("There was a problem finding users for the provided organization.");
      res.status(200).send(users);
    });
  }
});

router.put('/:userId', function(req,res) {
  User.updateOne({_id: req.params.userId},{organization: req.body.organization, auth0Id: req.body.auth0Id, name: req.body.name}, function (err, user) {
      if (err) return res.status(500).send("There was a problem finding the user.");
      res.status(200).send(user);
  });
});

router.get("/logout", verifyUser, (req, res, next) => {
    const { signedCookies = {} } = req
    const { refreshToken } = signedCookies
    User.findById(req.user._id).then(
      user => {
        const tokenIndex = user.refreshToken.findIndex(
          item => item.refreshToken === refreshToken
        )
  
        if (tokenIndex !== -1) {
          user.refreshToken.id(user.refreshToken[tokenIndex]._id).remove()
        }
  
        user.save((err, user) => {
          if (err) {
            res.statusCode = 500
            res.send(err)
          } else {
            res.clearCookie("refreshToken", COOKIE_OPTIONS)
            res.send({ success: true })
          }
        })
      },
      err => next(err)
    )
  })
  
module.exports = router