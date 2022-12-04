const express = require("express");
const routes = express.Router();
const {
  addUser,
  authUser,
  verifyUser,
  deleteUser,
  editUser,
  resetUser,
  sendResetToken,
} = require("../controllers/actions");

routes.route("/v1/signin").post(authUser);
routes.route("/v1/signup").post(addUser);
routes.route("/v1/verify/:token").get(verifyUser);
routes.route("/v1/delete").delete(deleteUser);
routes.route("/v1/account").post(editUser);
routes.route("/v1/reset").post(sendResetToken).post(resetUser);
routes.route("/v1/reset/:token").post(resetUser);

module.exports = routes;
