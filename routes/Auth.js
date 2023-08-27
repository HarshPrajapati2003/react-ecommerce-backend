const express = require("express");
const {
  createUser,
  loginUser,
  checkAuth,
  resetPassowrdRequest,resetPassowrd
} = require("../Controller/Auth");
const passport = require("passport");

const router = express.Router();
// /auth is already added in base path
router
  .post("/signup", createUser)
  .post("/login", passport.authenticate("local"), loginUser)
  .get("/check", passport.authenticate("jwt"), checkAuth)
  .post("/reset-password-request",resetPassowrdRequest)
  .post("/reset-password",resetPassowrd)


exports.router = router;
