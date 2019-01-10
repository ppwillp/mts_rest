const express = require("express");
const router = express.Router();
const request = require("request-promise");
const encode = require("nodejs-base64-encode");

//load Authentication Helper
const { ensureAuthenticated } = require("../helpers/auth");

router.get("/", ensureAuthenticated, (req, res) => {
  res.render("v2/index", {
    title: "V2 Orders",
    endpoint: "/v2/checkout/orders"
  });
});

router.post("/create", ensureAuthenticated, (req, res, next) => {
  const client_id = req.user.client_id;
  const client_secret = req.user.client_secret;

  let stringToEncode = client_id + ":" + client_secret;

  const encodedString = encode.encode(stringToEncode, "base64");

  let createAuth = {
    getToken: function() {
      return request({
        method: "POST",
        uri: "https://api.sandbox.paypal.com/v1/oauth2/token",
        json: true,
        headers: {
          Authorization: "Basic " + encodedString
        },
        form: {
          grant_type: "client_credentials"
        }
      });
    },

    call: function(token) {
      return request({
        method: "POST",
        uri: "https://api.sandbox.paypal.com/v2/checkout/orders",
        json: true,
        headers: {
          Authorization: "Bearer " + token,
          "content-type": "application/json"
        },
        body: {
          intent: "AUTHORIZE",
          purchase_units: [
            {
              amount: {
                currency_code: "USD",
                value: "1.00"
              }
            }
          ]
        }
      });
    }
  };

  function main() {
    return createAuth
      .getToken()
      .then(response => {
        const token = response.access_token;
        return token;
      })
      .catch(function(e) {
        console.log(e);
        throw e;
      });
  }

  main().then(response => {
    createAuth
      .call(response)
      .then(response => {
        let id = response.id;
        console.log(response);
        res.send(response);
      })
      .catch(err => console.log(err));
  });
});

router.post("/authorize", ensureAuthenticated, (req, res) => {
  const orderID = req.body.orderID;
  const client_id = req.user.client_id;
  const client_secret = req.user.client_secret;

  let stringToEncode = client_id + ":" + client_secret;

  const encodedString = encode.encode(stringToEncode, "base64");

  let authorizeOrder = {
    getToken: function() {
      return request({
        method: "POST",
        uri: "https://api.sandbox.paypal.com/v1/oauth2/token",
        json: true,
        headers: {
          Authorization: "Basic " + encodedString
        },
        form: {
          grant_type: "client_credentials"
        }
      });
    },

    captureAuth: function(token) {
      return request({
        method: "POST",
        uri: `https://api.sandbox.paypal.com/v2/checkout/orders/${orderID}/authorize`,
        json: true,
        headers: {
          Authorization: "Bearer " + token,
          "content-type": "application/json"
        }
      });
    }
  };

  function main() {
    return authorizeOrder.getToken().then(response => response.access_token);
  }

  main().then(response => {
    authorizeOrder.captureAuth(response).then(response => {
      console.log(JSON.stringify(response, null, 2));
      console.log(
        "AUTH ID: " + response.purchase_units[0].payments.authorizations[0].id
      );
      let authID = response.purchase_units[0].payments.authorizations[0].id;
      res.send(authID);
    });
  });
});

router.post("/capture", ensureAuthenticated, (req, res) => {
  const client_id = req.user.client_id;
  const client_secret = req.user.client_secret;

  let stringToEncode = client_id + ":" + client_secret;

  const encodedString = encode.encode(stringToEncode, "base64");
  const authID = req.body.authID;
  console.log(`authID: ${authID}`);

  let capture = {
    getToken: function() {
      return request({
        method: "POST",
        uri: "https://api.sandbox.paypal.com/v1/oauth2/token",
        json: true,
        headers: {
          Authorization: "Basic " + encodedString
        },
        form: {
          grant_type: "client_credentials"
        }
      });
    },

    complete: function(token) {
      return request({
        method: "POST",
        uri: `https://api.sandbox.paypal.com/v2/payments/authorizations/${authID}/capture`,
        json: true,
        headers: {
          Authorization: "Bearer " + token,
          "content-type": "application/json"
        }
      });
    }
  };

  function main() {
    return capture.getToken().then(response => response.access_token);
  }

  main().then(response => {
    capture
      .complete(response)
      .then(response => {
        console.log(response);
        let paymentInfo = JSON.stringify(response, null, 2);
        res.render("v2/success", {
          title: "Order captured",
          paymentInfo: paymentInfo
        });
      })
      .catch(err => res.json(err));
  });
});

module.exports = router;
