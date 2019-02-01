const express = require("express");
const router = express.Router();
const request = require("request-promise");
const encode = require("nodejs-base64-encode");

//load Authentication Helper
const { ensureAuthenticated } = require("../helpers/auth");

const getCreds = req => {
  const client_id = req.user.client_id;
  const client_secret = req.user.client_secret;

  let stringToEncode = `${client_id}:${client_secret}`;
  let encodedString = encode.encode(stringToEncode, "base64");
  return encodedString;
};

router.get("/", ensureAuthenticated, (req, res) => {
  res.render("v2/index", {
    title: "V2 Orders",
    endpoint: "/v2/checkout/orders"
  });
});

router.get("/as1", ensureAuthenticated, (req, res) => {
  res.render("v2/as1", {
    title: "V2 AS1",
    endpoint: "/v2/checkout/orders"
  });
});

router.get("/as2", ensureAuthenticated, (req, res) => {
  res.render("v2/as2", {
    title: "V2 AS2",
    endpoint: "/v2/checkout/orders"
  });
});

router.post("/create", ensureAuthenticated, (req, res, next) => {
  let paymentString = req.body.json;
  paymentString = paymentString.replace(/\s/g, "");
  let paymentObj = JSON.parse(paymentString);

  const intent = paymentObj.intent;
  let renderString = "";
  let title = "";
  let endpoint = "";

  if (intent === "AUTHORIZE") {
    renderString = "v2/as1";
    title = "V2 AS1";
    endpoint = "/v2/checkout/orders/{order_id}/authorize";
  } else {
    renderString = "v2/as2";
    title = "V2 AS2";
    endpoint = "/v2/checkout/orders/{order_id}/capture";
  }

  let create = {
    getToken: function() {
      return request({
        method: "POST",
        uri: "https://api.sandbox.paypal.com/v1/oauth2/token",
        json: true,
        headers: {
          Authorization: `Basic ${getCreds(req)}`
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
        body: paymentObj
      });
    }
  };

  const main = () => {
    return create
      .getToken()
      .then(response => {
        const token = response.access_token;
        return token;
      })
      .catch(function(e) {
        throw e;
      });
  };

  main().then(response => {
    create
      .call(response)
      .then(response => {
        let paymentInfo = JSON.stringify(response, null, 2);
        let id = response.id;
        let approveUri = "";
        for (let i = 0; i < response.links.length; i++) {
          if (response.links[i].rel === "approve") {
            approveUri = response.links[i].href;
          }
        }

        res.render(renderString, {
          title,
          endpoint,
          paymentInfo,
          id,
          approveUri
        });
      })
      .catch(err => {
        let errorResponse = JSON.stringify(err, null, 2);
        res.render(renderString, {
          title,
          endpoint,
          errorResponse
        });
      });
  });
});

router.post("/capture", ensureAuthenticated, (req, res) => {
  const order_id = req.body.order_id;

  let capture = {
    getToken: function(token) {
      return request({
        method: "POST",
        uri: "https://api.sandbox.paypal.com/v1/oauth2/token",
        json: true,
        headers: {
          Authorization: `Basic ${getCreds(req)}`
        },
        form: {
          grant_type: "client_credentials"
        }
      });
    },
    complete: function(token) {
      return request({
        method: "POST",
        uri: `https://api.sandbox.paypal.com/v2/checkout/orders/${order_id}/capture`,
        json: true,
        headers: {
          Authorization: "Bearer " + token,
          "content-type": "application/json",
          Prefer: "return=representation"
        }
      });
    }
  };

  const main = () => {
    return capture.getToken().then(response => response.access_token);
  };

  main().then(response =>
    capture
      .complete(response)
      .then(response => {
        {
          let captureInfo = JSON.stringify(response, null, 2);
          let order_id = response.id;
          res.render("v2/as2", {
            title: "V2 AS2",
            endpoint: "/v2/checkout/orders",
            captureInfo,
            order_id
          });
        }
      })
      .catch(err => {
        let captureErrorResponse = JSON.stringify(err, null, 2);
        res.render("v2/as2", {
          title: "V2 AS2",
          endpoint: "/v2/checkout/orders",
          captureErrorResponse
        });
      })
  );
});

router.post("/authorize", ensureAuthenticated, (req, res) => {
  const auth_id = req.body.auth_id;

  let authorize = {
    getToken: function() {
      return request({
        method: "POST",
        uri: "https://api.sandbox.paypal.com/v1/oauth2/token",
        json: true,
        headers: {
          Authorization: `Basic ${getCreds(req)}`
        },
        form: {
          grant_type: "client_credentials"
        }
      });
    },
    complete: function(token) {
      return request({
        method: "POST",
        uri: `https://api.sandbox.paypal.com/v2/checkout/orders/${auth_id}/authorize`,
        json: true,
        headers: {
          Authorization: `Bearer ${token}`,
          "content-type": "application/json"
        }
      });
    }
  };

  const main = () => {
    return authorize.getToken().then(response => response.access_token);
  };

  main().then(response =>
    authorize
      .complete(response)
      .then(response => {
        let authInfo = JSON.stringify(response, null, 2);
        let authorization_id =
          response.purchase_units[0].payments.authorizations[0].id;
        res.render("v2/as1", {
          title: "V2 AS1",
          endpoint: "/v2/checkout/orders/{order_id}/authorize",
          authInfo,
          authorization_id
        });
      })
      .catch(err => {
        let authErrorResponse = JSON.stringify(err, null, 2);
        res.render("v2/as1", {
          title: "V2 AS1",
          endpoint: "/v2/checkout/orders/{order_id}/authorize",
          authErrorResponse
        });
      })
  );
});

router.post("/capture_authorization", ensureAuthenticated, (req, res) => {
  const auth_id = req.body.auth_id;

  let capture = {
    getToken: function() {
      return request({
        method: "POST",
        uri: "https://api.sandbox.paypal.com/v1/oauth2/token",
        json: true,
        headers: {
          Authorization: `Basic ${getCreds(req)}`,
          Prefer: "return=representation"
        },
        form: {
          grant_type: "client_credentials"
        }
      });
    },
    complete: function(token) {
      return request({
        method: "POST",
        uri: `https://api.sandbox.paypal.com/v2/payments/authorizations/${auth_id}/capture`,
        json: true,
        headers: {
          Authorization: `Bearer ${token}`,
          "content-type": "application/json"
        }
      });
    }
  };

  const main = () => {
    return capture.getToken().then(response => response.access_token);
  };

  main().then(response =>
    capture
      .complete(response)
      .then(response => {
        let captureAuthInfo = JSON.stringify(response, null, 2);
        let order_id = response.id;

        res.render("v2/as1", {
          title: "V2 AS1",
          endpoint: "/v2/checkout/orders",
          captureAuthInfo,
          order_id
        });
      })
      .catch(err => {
        let captureAuthErrorResponse = JSON.stringify(err, null, 2);
        res.render("v2/as1", {
          title: "V2 AS1",
          endpoint: "/v2/checkout/orders",
          captureAuthErrorResponse
        });
      })
  );
});

router.post("/show_order_details", ensureAuthenticated, (req, res) => {
  let order_id = req.body.order_id;

  let referer = req.body.referer;
  let title,
    endpoint = "";
  if (referer === "as1") {
    title = "V2 AS1";
    endpoint = "/v2/checkout/orders/{order_id}";
  } else {
    title = "V2 AS2";
    endpoint = "/v2/checkout/orders/{order_id}";
  }

  let order = {
    getToken: function() {
      return request({
        method: "POST",
        uri: "https://api.sandbox.paypal.com/v1/oauth2/token",
        json: true,
        headers: {
          Authorization: `Basic ${getCreds(req)}`,
          Prefer: "return=representation"
        },
        form: {
          grant_type: "client_credentials"
        }
      });
    },
    getDetails: function(token) {
      return request({
        method: "GET",
        uri: `https://api.sandbox.paypal.com/v2/checkout/orders/${order_id}`,
        json: true,
        headers: {
          Authorization: `Bearer ${token}`,
          "content-type": "application/json"
        }
      });
    }
  };

  const main = () => {
    return order.getToken().then(response => response.access_token);
  };

  main().then(response => {
    order
      .getDetails(response)
      .then(data => {
        let order_details_info = JSON.stringify(data, null, 2);
        res.render(`v2/${referer}`, {
          title,
          endpoint,
          order_details_info
        });
      })
      .catch(err => {
        let order_detais_ErrorResponse = JSON.stringify(err, null, 2);
        res.render(`v2/${referer}`, {
          title,
          endpoint,
          order_detais_ErrorResponse
        });
      });
  });
});

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//SPB SPB SPB///////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

module.exports = router;
