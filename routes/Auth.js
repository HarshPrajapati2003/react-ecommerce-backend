const express = require("express");
const {
  createUser,
  loginUser,
  checkAuth,
  logout,
  resetPassowrdRequest,resetPassowrd
} = require("../Controller/Auth");
const passport = require("passport");

const router = express.Router();
// /auth is already added in base path
router
  .post("/signup", createUser)
  .post("/login", passport.authenticate("local"), loginUser)
  .get("/check", passport.authenticate("jwt"), checkAuth)
  .get("/logout",logout)
  .post("/reset-password-request",resetPassowrdRequest)
  .post("/reset-password",resetPassowrd)


exports.router = router;
