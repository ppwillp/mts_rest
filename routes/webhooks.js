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
  console.log(req.user);
  res.render("webhooks/add_webhook_id", {
    title: "Webhooks",
    endpoint: "Set up a Webhook Listener."
  });
});

router.post("/register", ensureAuthenticated, (req, res) => {
  getCreds(req);
  const webhook_id = req.body.webhook_id;
  console.log(req.user);
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
            console.log(req.user);
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

router.post("/:webhook_id", (req, res) => {
  const webhook_id = req.params.webhook_id;

  let event_body = req.body;
  User.findOne({ webhook_id: webhook_id }, (error, user) => {
    if (error) {
      console.log(error);
    } else {
      console.log(user);
      paypal.configure({
        mode: "sandbox",
        client_id: user.client_id,
        client_secret: user.client_secret
      });

      let authAlgo = req.headers["paypal-auth-algo"];
      let certURL = req.headers["paypal-cert-url"];
      let transmissionId = req.headers["paypal-transmission-id"];
      let transmissionSignature = req.headers["paypal-transmission-sig"];
      let transmissionTimestamp = req.headers["paypal-transmission-time"];

      let headers = {
        "paypal-auth-algo": authAlgo,
        "paypal-cert-url": certURL,
        "paypal-transmission-id": transmissionId,
        "paypal-transmission-sig": transmissionSignature,
        "paypal-transmission-time": transmissionTimestamp
      };

      console.log(event_body);
      console.log(webhook_id);
      paypal.notification.webhookEvent.verify(
        headers,
        event_body,
        webhook_id,
        (error, response) => {
          if (error) {
            console.log(error);
          } else {
            if (response.verification_status === "SUCCESS") {
              console.log("SUCCESS!");
            } else {
              console.log("NOT SUCCESS");
            }
          }
        }
      );
    }
  });
});

module.exports = router;
