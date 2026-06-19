const mongoose = require("mongoose")



async function connectToDB() {
    mongoose.set("bufferCommands", false)

    if (!process.env.MONGO_URI) {
        console.warn("MONGO_URI is not set. Using in-memory dev storage for this run.")
        return false
    }

    try {
        await mongoose.connect(process.env.MONGO_URI)

        console.log("Connected to Database")
        return true
    }
    catch (err) {
        console.error("Database connection failed. Using in-memory dev storage for this run.")
        console.error(err.message)
        return false
    }
}

module.exports = connectToDB
