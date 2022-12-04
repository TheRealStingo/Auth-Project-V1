const nodemailer = require("nodemailer");
require("dotenv").config();

let sendVerificationEmail = (email, verifcationLink, token) =>
  nodemailer
    .createTransport({
      service: "gmail",
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS,
      },
    })
    .sendMail({
      from: "Stingo <brinis.nadjib.lp@gmail.com>",
      to: email,
      subject: token[0],
      text: `localhost:300/api/v1/${token[1]}/${verifcationLink}`,
    });

module.exports = sendVerificationEmail;
