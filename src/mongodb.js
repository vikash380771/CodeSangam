const mongoose = require("mongoose")
mongoose.connect("mongodb://localhost:27017/CodesangamData")
    .then(() => {
        console.log("mongodb connected")
    })
    .catch(() => {
        console.log("error!!")
    })
const UserSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true,
      
    },
    isVerified: {
        type: Boolean,
        default: false,
    },
    verificationToken: {
        type: String,
    },
})
const collection = new mongoose.model("LoginDetails", UserSchema)
module.exports = collection



