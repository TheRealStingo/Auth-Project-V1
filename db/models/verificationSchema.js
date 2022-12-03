const mongoose = require("mongoose")


const VerifyUser = new mongoose.Schema({
    uid:{
        type:String,
        required:true
    },
    token:{
        type:String,
        required:true,
        uniqe:true
    },
    expiresAt:{
        type:Number,
        required:true
    }
})


module.exports= mongoose.model("VerifyUser",VerifyUser)