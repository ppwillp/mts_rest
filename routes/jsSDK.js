const express = require("express");
const router = express.Router();
const checkoutNodeJssdk = require("@paypal/checkout-server-sdk");

//load Authentication Helper
const { ensureAuthenticated } = require("../helpers/auth");

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

router.get("/", ensureAuthenticated, (req, res) => {
  const client_id = req.user.client_id;

  res.render("js_sdk/index", {
    title: "JavaScript SDK",
    endpoint: "client side integration",
    client_id
  });
});

router.post("/getDetails", ensureAuthenticated, (req, res) => {
  console.log("Reached");
  function client() {
    return new checkoutNodeJssdk.core.PayPalHttpClient(environment());
  }

  function environment() {
    let clientId = req.user.client_id;
    let clientSecret = req.user.client_secret;

    return new checkoutNodeJssdk.core.SandboxEnvironment(
      clientId,
      clientSecret
    );
  }

  const paypalClient = client();

  async function handleRequest() {
    const orderID = req.body.orderID;
    console.log(orderID);
    let request = new checkoutNodeJssdk.orders.OrdersGetRequest(orderID);

    let order;
    try {
      order = await paypalClient.execute(request);
    } catch (err) {
      console.error(err);
      return res.send(500);
    }

    res.send(200);
  }
  handleRequest();
});

module.exports = router;
