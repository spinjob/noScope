const passport = require("passport")
const jwt = require("jsonwebtoken")
const dev = process.env.NODE_ENV !== "production"

//Used for creating the refresh token cookie, which should be httpOnly and secure so that it cannot be read by the client javascript. SameSite is set to "None" since client and server will be in different domains.
exports.COOKIE_OPTIONS = {
    httpOnly: true,
    secure: !dev,
    signed: true,
    maxAge: eval(process.env.REFRESH_TOKEN_EXPIRY) * 1000,
    sameSite: "none"
}

// Used to create the JWT.
exports.getToken = (user) => {
    return jwt.sign(user, process.env.JWT_SECRET, {
        expiresIn: eval(process.env.SESSION_EXPIRY)
    })
}
//Used to create the refresh token, which itself is a JWT.
exports.getRefreshToken = user => {
    const refreshToken = jwt.sign(user, process.env.REFRESH_TOKEN_SECRET, {
      expiresIn: eval(process.env.REFRESH_TOKEN_EXPIRY),
    })
    return refreshToken
  }

//A middleware that needs to be called for every authenticated request.
exports.verifyUser = passport.authenticate("jwt", { session: false })
