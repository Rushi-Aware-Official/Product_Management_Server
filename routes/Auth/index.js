import express from "express";
import {
  forgotPassword,
  isAuthentication,
  login,
  logoutReq,
  sendMailWithResetPasswordLink,
  updatePassword,
} from "../../services/Auth/index.js";
import {
  loginLimiter,
  passwordUpdateLimiter,
  resetPasswordLimiter,
  verify,
  verifyForForgotPassForms,
} from "../../middlewares/jwt.js";

const routes = express.Router();

routes.post("/login", loginLimiter, login);
routes.post("/logout", logoutReq);
routes.get("/verify", isAuthentication);
routes.post("/update-password", verify, passwordUpdateLimiter, updatePassword);
routes.post(
  "/send-reset-password-link",
  resetPasswordLimiter,
  sendMailWithResetPasswordLink
);
routes.post(
  "/forgot-password",
  resetPasswordLimiter,
  verifyForForgotPassForms,
  forgotPassword
);

export default routes;
