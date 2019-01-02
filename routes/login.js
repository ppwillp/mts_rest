const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const passport = require("passport");
const mongoose = require("mongoose");

//load User Model
require("../models/User");
const User = mongoose.model("users");

//user login route
router.get("/login", (req, res) => {
  const title = "Login";
  const endpoint = "enter your credentials";
  res.render("login/login", {
    title: title,
    endpoint: endpoint
  });
});

//login Post from form with local strategy
router.post("/login", (req, res, next) => {
  passport.authenticate("local", {
    successRedirect: "/",
    failureRedirect: "/login/login",
    failureFlash: true
  })(req, res, next);
});

//user register route
router.get("/register", (req, res) => {
  const title = "Register User";
  const endpoint = "...";
  res.render("login/register", {
    title: title,
    endpoint: endpoint
  });
});

//register POST
router.post("/register", (req, res, next) => {
  let errors = [];
  if (req.body.password != req.body.password2) {
    errors.push({ text: "Passwords do not match" });
  }
  if (req.body.password.length < 6) {
    errors.push({ text: "Password must be at least 6 characters" });
  }
  if (errors.length > 0) {
    res.render("login/register", {
      errors: errors,
      email: req.body.email,
      password: req.body.password,
      client_id: req.body.client_id,
      client_secret: req.body.client_secret
    });
  } else {
    User.findOne({ email: req.body.email }).then(user => {
      if (user) {
        req.flash("error_msg", "Email already registered");
        res.redirect("/users/login");
      } else {
        const newUser = new User({
          email: req.body.email,
          password: req.body.password,
          client_id: req.body.client_id,
          client_secret: req.body.client_secret
        });
        bcrypt.genSalt(10, (err, salt) => {
          bcrypt.hash(newUser.password, salt, (err, hash) => {
            if (err) throw err;
            newUser.password = hash;
            newUser
              .save()
              .then(user => {
                req.flash(
                  "success_msg",
                  "You are now registered! Continue to login"
                );
                res.redirect("/login/login");
              })
              .catch(err => {
                console.log(err);
                return;
              });
          });
        });
      }
    });
  }
});

//logout route
router.get("/logout", (req, res) => {
  req.logout();
  req.flash("success_msg", "You are logged out");
  res.redirect("/login/login");
});

module.exports = router;
