const nodemailer = require("nodemailer")
require("dotenv").config()








  let sendVerificationEmail = (email,verifcationLink)=>
   
    nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.GMAIL_USER,
            pass: process.env.GMAIL_PASS
        }
    }).sendMail({
        from: 'Stingo <brinis.nadjib.lp@gmail.com>',
        to: email,
        subject: 'Email Verifcation',
        text: `localhost:300/api/v1/verify/${verifcationLink}`
    })

    


module.exports = sendVerificationEmail



