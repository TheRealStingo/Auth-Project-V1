const mongoose = require("mongoose")

const User = new mongoose.Schema({
    email:{
        type:String,
        required:true,
        trim:true,
        unique:true
    },
    passwordSHA256:{
        type:String,
        required:true,
        trim:true
    },
    isVerified:{
        type:Boolean,
        default:false
    },
    lastLoginData:{
        type:Object,
        required:true,
            timestamp:{
               type:Number,
               required:true,
            },

            ip:{
                type:String,
                required:true,
            }
            
   }
})


module.exports = mongoose.model("User",User)