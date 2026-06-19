const jwt = require("jsonwebtoken")
const tokenBlacklistModel = require("../models/blacklist.model")
const mongoose = require("mongoose")
const devStore = require("../services/devStore.service")

function isUsingDevStore() {
    return mongoose.connection.readyState !== 1
}

function getJwtSecret() {
    return process.env.JWT_SECRET || "local-dev-secret"
}

async function authUser(req, res, next) {

    const token = req.cookies.token

    if (!token) {
        return res.status(401).json({
            message: "Token not provided."
        })
    }

    const isTokenBlacklisted = isUsingDevStore()
        ? await devStore.isTokenBlacklisted(token)
        : await tokenBlacklistModel.findOne({
            token
        })

    if (isTokenBlacklisted) {
        return res.status(401).json({
            message: "token is invalid"
        })
    }

    try {
        const decoded = jwt.verify(token, getJwtSecret())

        req.user = decoded

        next()

    } catch (err) {

        return res.status(401).json({
            message: "Invalid token."
        })
    }

}


module.exports = { authUser }
