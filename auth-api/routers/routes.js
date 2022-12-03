const express = require("express")
const routes = express.Router()
const {addUser,authUser,verifyUser,deleteUser,editUser} = require("../controllers/actions")
const sendVerificationEmail = require("../controllers/sendVerification")

routes.route("/v1/signin").post(authUser)
routes.route("/v1/signup").post(addUser)
routes.route("/v1/verify/:token").get(verifyUser)
routes.route("/v1/delete").delete(deleteUser)
routes.route("/v1/account").post(editUser)







module.exports = routes