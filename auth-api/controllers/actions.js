const User = require("../../db/models/userSchema");
const VerifyUser = require("../../db/models/verificationSchema");
const ResetUser = require("../../db/models/ResetSchema");
const sendVerificationEmail = require("./sendVerification");
const crypto = require("crypto");
const tokenType = [
  ["Email Verifcation", "verify"],
  ["Password Reset", "reset"],
];

const idGen = (num) =>
  [...Array(num)]
    .map(() => Math.floor(Math.random() * 16).toString(16))
    .join("");
const validEmail = (email) =>
  /^([a-zA-Z0-9_\.\-])+\@(([a-zA-Z0-9\-])+\.)+([a-zA-Z0-9]{2,4})+$/.test(email);
const validPassword = (password) => password.length >= 7;

let authUser = (req, res) => {
  !Object.values(req.body).every((e) => e)
    ? res.send({ status: "Fix skill issue" })
    : User.findOne({
        email: req.body.email.toLowerCase(),
        passwordSHA256: crypto
          .createHash("sha256")
          .update(req.body.password)
          .digest("hex"),
      })
        .then((user) => {
          user
            ? !user.isVerified
              ? VerifyUser.findOne({ uid: user._id }).then((oldToken) => {
                  Date.now() > oldToken.expiresAt
                    ? VerifyUser.findOneAndUpdate(
                        { uid: user._id },
                        { expiresAt: Date.now() + 600000, token: idGen(16) },
                        { new: true }
                      )
                        .then((newToken) =>
                          sendVerificationEmail(
                            user.email,
                            newToken.token,
                            tokenType[0]
                          )
                            .then(
                              res.send({
                                message:
                                  "Token Updated , please verify your email",
                              })
                            )
                            .catch((err) => res.send(err))
                        )
                        .catch((err) => res.send(err))
                    : res.send({
                        status:
                          "Your verifcation token is already active check ur inbox and verify your email",
                      });
                })
              : User.findOneAndUpdate(
                  { _id: user._id },
                  {
                    lastLoginData: {
                      timestamp: Date.now(),
                      ip: req.ip,
                    },
                  }
                )
                  .then(() => res.send({ status: "Login successfully" }))
                  .catch((err) => res.json(err))
            : res.send({ status: "Invalid email or password" });
        })
        .catch((err) => res.json(err));
};

let addUser = (req, res) => {
  !Object.values(req.body).every((e) => e)
    ? res.send({ status: "Fix skill issue" })
    : User.create({
        email: req.body.email.toLowerCase(),
        passwordSHA256: crypto
          .createHash("sha256")
          .update(req.body.password)
          .digest("hex"),
        lastLoginData: {
          timestamp: Date.now(),
          ip: req.ip,
        },
      })
        .then((user) => {
          VerifyUser.create({
            uid: user._id,
            token: idGen(16),
            expiresAt: Date.now() + 600000,
          })
            .then((token) => {
              sendVerificationEmail(user.email, token.token, tokenType[0])
                .then(
                  res.send({
                    status: "Account created successfully , check your email",
                  })
                )
                .catch((err) => res.send(err));
            })
            .catch((err) => res.send(err));
        })

        .catch((err) =>
          err.keyValue.hasOwnProperty("email")
            ? res.json({ status: "Email already used" })
            : res.json({ err })
        );
};

let verifyUser = (req, res) => {
  VerifyUser.findOne({ token: req.params.token })
    .then((data) => {
      !data
        ? res.send({ status: "Fix skill issue" })
        : Date.now() < data.expiresAt
        ? User.findByIdAndUpdate({ _id: data.uid }, { isVerified: true })
            .then(() => {
              VerifyUser.findOneAndDelete({ token: data.token })
                .then(() =>
                  res.send({ status: "Account verified successfully" })
                )
                .catch((err) => res.send(err));
            })
            .catch((err) => res.send(err))
        : res.send({ status: "Expired token, login to get a new one" });
    })

    .catch((err) => res.send(err));
};

let deleteUser = (req, res) => {
  User.findOneAndDelete({
    email: req.body.email.toLowerCase(),
    passwordSHA256: crypto
      .createHash("sha256")
      .update(req.body.password)
      .digest("hex"),
  }).then(res.send({ message: "Sorry to see you go" }));
};

let editUser = (req, res) => {
  !(
    Object.keys(req.body).length <= 2 &&
    ((req.body.hasOwnProperty("email") &&
      req.body.hasOwnProperty("password")) ||
      req.body.hasOwnProperty("email") ||
      req.body.hasOwnProperty("password"))
  )
    ? res.send({ status: "Fix skill issue" })
    : User.findOneAndUpdate(
        { email: req.body.email },
        {
          email: req.body.email,
          passwordSHA256: crypto
            .createHash("sha256")
            .update(req.body.password)
            .digest("hex"),
        }
      )
        .then(res.send({ status: "Updated Successfully" }))
        .catch((err) => res.send(err));
};

let sendResetToken = (req, res) => {
  User.findOne({ email: req.body.email }).then((user) => {
    !user
      ? res.send({ status: "User doesnt exist" })
      : ResetUser.findOne({ uid: user._id }).then((token) => {
          !token
            ? ResetUser.create({
                uid: user._id,
                token: idGen(32),
                expiresAt: Date.now() + 600000,
              })
                .then((newToken) => {
                  sendVerificationEmail(
                    req.body.email,
                    newToken.token,
                    tokenType[1]
                  )
                    .then(res.send({ status: "Please Check your email" }))
                    .catch((err) => res.send(err));
                })
                .catch((err) => res.send(err))
            : Date.now() < token.expiresAt
            ? res.send({ status: "Check your email u have an active token" })
            : ResetUser.findOneAndUpdate(
                {
                  uid: token.uid,
                  expiresAt: Date.now() + 300000,
                  token: idGen(32),
                },
                { new: true }
              )
                .then((newToken) => {
                  sendVerificationEmail(
                    req.body.email,
                    newToken.token,
                    tokenType[1]
                  )
                    .then(
                      res.send({
                        status: "Token updated, Please check your email",
                      })
                    )
                    .catch((err) => res.send(err));
                })
                .catch((err) => res.send(err));
        });
  });
};

let resetUser = (req, res) => {
  ResetUser.findOne({ token: req.params.token })
    .then((token) => {
      !token
        ? res.send({
            status: "Please request a password reset before trying to reset ",
          })
        : Date.now() > token.expiresAt
        ? res.send({ status: "Please request a new one" })
        : User.findOneAndUpdate(
            { _id: token.uid },
            {
              passwordSHA256: crypto
                .createHash("sha256")
                .update(req.body.password)
                .digest("hex"),
            }
          )
            .then((user) => {
              ResetUser.findOneAndDelete({ uid: user._id })
                .then(res.send({ status: "Password updated" }))
                .catch((err) => res.send(err));
            })
            .catch((err) => res.send(err));
    })
    .catch((err) => res.send(err));
};

module.exports = {
  authUser,
  addUser,
  verifyUser,
  deleteUser,
  editUser,
  sendResetToken,
  resetUser,
};
