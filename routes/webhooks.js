const express = require("express");
const router = express.Router();
const paypal = require("paypal-rest-sdk");
const passport = require("passport");
const mongoose = require("mongoose");

//load Authentication Helper
const { ensureAuthenticated } = require("../helpers/auth");

//load User Model
require("../models/User");
const User = mongoose.model("users");

//function to pull credentials from user
const getCreds = req => {
  const client_id = req.user.client_id;
  const client_secret = req.user.client_secret;

  paypal.configure({
    mode: "sandbox",
    client_id: client_id,
    client_secret: client_secret
  });

  return paypal;
};

//begin routes
router.get("/", ensureAuthenticated, (req, res) => {
  console.log(req.user);
  res.render("webhooks/index", {
    title: "Webhooks",
    endpoint: "/v1/notifications/webhooks"
  });
});

router.get("/add_webhook_id", ensureAuthenticated, (req, res) => {
  res.render("webhooks/add_webhook_id", {
    title: "Webhooks",
    endpoint: "Set up a Webhook Listener."
  });
});

router.post("/register", ensureAuthenticated, (req, res) => {
  getCreds();
  const webhook_id = req.body.webhook_id;

  User.findOne({ email: req.user.email }).then(user => {
    if (user.webhook_id) {
      req.flash("error_msg", "Webhook ID already registered");
      res.render("webhooks/add_webhook_id", {
        title: "Webhooks",
        endpoint: "/v1/notifications/webhooks"
      });
    } else {
      User.update(
        { _id: req.user._id },
        { $push: { webhook_id } },
        (err, success) => {
          if (err) {
            req.flash("error_msg", "Something went wrong");
            res.render("webhooks/add_webhook_id", {
              title: "Webhooks",
              endpoint: "/v1/notifications/webhooks"
            });
          } else {
            req.flash("success_msg", "Webhook ID added");
            res.render("webhooks/index", {
              title: "Webhooks",
              endpoint: "/v1/notifications/webhooks"
            });
          }
        }
      );
    }
  });
});

router.post("/:webhook_id", ensureAuthenticated, (req, res) => {
  getCreds();
  User.findOne({ webhook_id }),
    (err, response) => {
      if (err) console.log(err);
      console.log(response);
    };
});

module.exports = router;
