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
  let event_body =
    '{"id":"WH-82L71649W50323023-5WC64761VS637831A","event_version":"1.0","create_time":"2016-10-05T14:57:40Z","resource_type":"sale","event_type":"PAYMENT.SALE.COMPLETED","summary":"Payment completed for $ 6.01 USD","resource":{"id":"8RS6210148826604N","state":"completed","amount":{"total":"6.01","currency":"USD","details":{"subtotal":"3.00","tax":"0.01","shipping":"1.00","handling_fee":"2.00","shipping_discount":"3.00"}},"payment_mode":"INSTANT_TRANSFER","protection_eligibility":"ELIGIBLE","protection_eligibility_type":"ITEM_NOT_RECEIVED_ELIGIBLE,UNAUTHORIZED_PAYMENT_ELIGIBLE","transaction_fee":{"value":"0.47","currency":"USD"},"invoice_number":"","custom":"Hello World!","parent_payment":"PAY-11X29866PC6848407K72RIQA","create_time":"2016-10-05T14:57:18Z","update_time":"2016-10-05T14:57:26Z","links":[{"href":"https://api.sandbox.paypal.com/v1/payments/sale/8RS6210148826604N","rel":"self","method":"GET"},{"href":"https://api.sandbox.paypal.com/v1/payments/sale/8RS6210148826604N/refund","rel":"refund","method":"POST"},{"href":"https://api.sandbox.paypal.com/v1/payments/payment/PAY-11X29866PC6848407K72RIQA","rel":"parent_payment","method":"GET"}]},"links":[{"href":"https://api.sandbox.paypal.com/v1/notifications/webhooks-events/WH-82L71649W50323023-5WC64761VS637831A","rel":"self","method":"GET"},{"href":"https://api.sandbox.paypal.com/v1/notifications/webhooks-events/WH-82L71649W50323023-5WC64761VS637831A/resend","rel":"resend","method":"POST"}]}';
  console.log(`req.body = ${JSON.stringify(req.body)}`);
  console.log(`req.headers = ${req.headers}`);
  User.findOne({ webhook_id: webhook_id }, (error, user) => {
    if (error) {
      console.log(error);
    } else {
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
