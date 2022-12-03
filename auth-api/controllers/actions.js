const User = require("../../db/models/userSchema")
const VerifyUser = require("../../db/models/verificationSchema")
const sendVerificationEmail = require("./sendVerification")
const crypto = require("crypto");

const idGen = () => [...Array(16)].map(() => Math.floor(Math.random() * 16).toString(16)).join('');
const validEmail = email=> /^([a-zA-Z0-9_\.\-])+\@(([a-zA-Z0-9\-])+\.)+([a-zA-Z0-9]{2,4})+$/.test(email)
const validPassword = password=>password.length>=7


let authUser = (req,res)=>{
  
    !Object.values(req.body).every(e=>e) ? res.send({status:"Fix skill issue"}) :         
    User.findOne({email:req.body.email.toLowerCase(),passwordSHA256:crypto.createHash('sha256').update(req.body.password).digest('hex')})
       .then(user=>{
        user ? !user.isVerified ? 
          VerifyUser.findOne({uid:user._id}).then(oldToken=>{
                  Date.now()> oldToken.expiresAt  ? 
            VerifyUser.findOneAndUpdate({uid:user._id},{expiresAt:Date.now()+600000,token:idGen()},{new:true}).then(newToken=>
                sendVerificationEmail(user.email,newToken.token).then(res.send({message:"Token Updated , please verify your email"})).catch(err=>res.send(err))).catch(err=>res.send(err))
                  : res.send({status:"Your verifcation token is already active check ur email"})
          })

        
        : User.findOneAndUpdate({_id:user._id},{lastLoginData:{
                timestamp:Date.now(),
                ip:req.ip
            }})
            .then(()=>res.send({status:"Login successfully"}))
            .catch(err=>res.json(err))
        :  res.send({status:"Invalid email or password"})
       })
       .catch(err=>res.json(err))
    }

let addUser = (req,res)=>{
      !Object.values(req.body).every(e=>e) ? res.send({status:"Fix skill issue"}) :
    User.create({
        email:req.body.email.toLowerCase(),
        passwordSHA256:crypto.createHash('sha256').update(req.body.password).digest('hex'),
        lastLoginData:{
            timestamp:Date.now(),
            ip:req.ip
        }
    })
    .then(user=>{
        VerifyUser.create({
            uid:user._id,
            token:idGen(),
            expiresAt:Date.now()+600000
        }) 
        .then(token=>{
            sendVerificationEmail(user.email,token.token)
              .then(res.send({status:"Account created successfully , check your email"}))
              .catch(err=>res.send(err))
            
        })
        .catch(err=>res.send(err))
    })
    
    .catch(err=> err.keyValue.hasOwnProperty('email') ? res.json({status:"Email already used"}):res.json({err}))
}






let verifyUser = (req,res)=>{

         VerifyUser.findOne({token:req.params.token})
           .then(data=>{
            !data ? res.send({status:"Fix skill issue"}) :  
           Date.now()< data.expiresAt ?
           User.findByIdAndUpdate({_id:data.uid},{isVerified:true})
             .then(()=>{
                VerifyUser.findOneAndDelete({token:data.token})
                 .then(()=>res.send({status:"Account verified successfully"}))
                 .catch(err=>res.send(err))
             })
             .catch(err=>res.send(err))
            
      : res.send({status:"Expired token, login to get a new one"})
        })
        
           .catch(err=>res.send(err))
}



let deleteUser = (req,res)=>{
    User.findOneAndDelete({email:req.body.email.toLowerCase(),passwordSHA256:crypto.createHash('sha256').update(req.body.password).digest('hex')})
    .then(res.send({message:"Sorry to see you go"}))
}

let editUser=(req,res)=>{
  
    !(Object.keys(req.body).length<=2 && (req.body.hasOwnProperty("email") && req.body.hasOwnProperty("password") || (req.body.hasOwnProperty("email") || req.body.hasOwnProperty("password"))))?
         res.send({status:"Fix skill issue"}) 
         :  User.findOneAndUpdate({email:req.body.email},{email:req.body.email,passwordSHA256:crypto.createHash('sha256').update(req.body.password).digest('hex')})
              .then(res.send({status:"Updated Successfully"}))
              .catch(err=>res.send(err))
         
        
}



 

module.exports = {
    authUser,
    addUser,
    verifyUser,
    deleteUser,
    editUser
}



