const checkoutNodeJssdk = require("@paypal/checkout-server-sdk");

function client() {
  return new checkoutNodeJssdk.core.PayPalHttpClient(environment());
}

function environment() {}
