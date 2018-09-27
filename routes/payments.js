const express = require('express');
const router = express.Router();
const paypal = require('paypal-rest-sdk');
const passport = require('passport');

//load Authentication Helper
const {ensureAuthenticated} = require('../helpers/auth');

/* 
****************************************************************************************************************
ADD ensureAuthenticated TO ALL ROUTES
**********************************************************************************************

*/

/*function getCreds(req) {
  const client_id = req.user.client_id;
  const client_secret = req.user.client_secret;

  paypal.configure({
    'mode': 'sandbox',
    'client_id': client_id,
    'client_secret': client_secret
  });

  return paypal;
}*/

router.get('/', (req, res) => {
  const title = "Create Payment";
  const endpoint = "/v1/payments/payment";
  res.render('payments/index', {
    title: title,
    endpoint: endpoint
  });
});

//create payment

router.post('/create', (req, res, next) => {
  //getCreds(req);
  /* const client_id = req.user.client_id;
  const client_secret = req.user.client_secret;
  console.log(client_id);
  paypal.configure({
    'mode': 'sandbox',
    'client_id': client_id,
    'client_secret': client_secret
  });*/

  const title = "Create Payment";
  const endpoint = "/v1/payments/payment";
  const create_payment_json = req.body.json;
  console.log(create_payment_json);
  
  paypal.payment.create(create_payment_json, function(error, payment) {
    if(error) {
      errorResponse = JSON.stringify(error);
      console.log(error);
      res.render('payments/index', {
        error: error,
        errorResponse: errorResponse,
        title: title,
        endpoint: endpoint
      });
    } else {
      console.log(payment);
      let link = '';
  
      for(let i = 0; i < payment.links.length; i++) {
        if(payment.links[i].rel === 'approval_url') {
          link = payment.links[i].href;
          console.log(link);
        }
      }
      const paymentInfo = JSON.stringify(payment, null, 2);
      
      res.render('payments/index', {
        link: link,
        paymentInfo: paymentInfo,
        title: title,
        endpoint: endpoint
      });
  
    }
  })
  });

  //after leaving PayPal, load this page

router.get('/execute', (req, res) => {
  /* const client_id = req.user.client_id;
  const client_secret = req.user.client_secret;
  console.log(client_id);
  paypal.configure({
    'mode': 'sandbox',
    'client_id': client_id,
    'client_secret': client_secret
  });*/
  const title = "Execute Payment";
  const endpoint = "/v1/payments/payment/{payment_id}/execute";
  const payerID = req.query.PayerID;
  const paymentID = req.query.paymentId;
  console.log(paymentID);
  const execute_payment_json = req.body.json;
  console.log(execute_payment_json);

  res.render('payments/execute', {
    title: title,
    payerID: payerID,
    paymentID: paymentID,
    endpoint: endpoint
  });
});

//call to execute payment

router.post('/execute', (req, res, next) => {
 /* const client_id = req.user.client_id;
  const client_secret = req.user.client_secret;
  console.log(client_id);
  paypal.configure({
    'mode': 'sandbox',
    'client_id': client_id,
    'client_secret': client_secret
  });*/

  const title = "Execute Payment";
  const endpoint = "/v1/payments/payment/{payment_id}/execute";
  const paymentID = req.body.paymentID;
  
  const execute_payment_json = req.body.json;
  

  
  paypal.payment.execute(paymentID, execute_payment_json, function(error, payment) {
    if(error) {
       errorResponse = JSON.stringify(error, null, 2);
      console.log(error);
      res.render('payments/execute', {
        error: error,
        errorResponse: errorResponse,
        title: title,
        endpoint: endpoint
      });
    } else {
      console.log(payment);
      const paymentInfo = JSON.stringify(payment, null, 2);
      let paymentID = payment.id;
      res.render('payments/execute', {
        title: title,
        paymentInfo: paymentInfo,
        endpoint: endpoint,
        paymentID: paymentID
      });
    }
  });
});

router.post('/getDetails', (req, res, next) => {
  const paymentId = req.body.payID;
  
  
  paypal.payment.get(paymentId, function(error, payment) {
    if(error) {
      let errorResponse = JSON.stringify(error, null, 2);
      res.render('payments/execute', {
        title: "Show Payment Details",
        endpoint: "/v1/payments/payment/{payment_id}",
        error: error,
        errorResponse: errorResponse
      });
    } else {
      let getInfo = JSON.stringify(payment, null, 2);
      let paymentID = payment.id;
      res.render('payments/execute', {
        title: "Show Payment Details",
        endpoint: "/v1/payments/payment/{payment_id}",
        getInfo: getInfo,
        paymentID: paymentID
      });
    }
  });
});

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//Authorizations//

router.get('/authorizations', (req, res) => {
  res.render('payments/authorizations', {
    title: "Capture Authorization",
    endpoint: "/v1/payments/authorization/{authorization_id}/capture"
  });
});

router.post('/captureAuth', (req, res, next) => {
  const authID = req.body.authID;
  let capture_details = req.body.json;
  capture_details = JSON.parse(capture_details);
  
  paypal.authorization.capture(authID, capture_details, function(error, response) {
    if(error) {
      let captureErrorResponse = JSON.stringify(error, null, 2);
      res.render('payments/authorizations', {
        title: "Capture Authorization",
        endpoint: "/v1/payments/authorization/{authorization_id}/capture",
        error: error,
        captureErrorResponse: captureErrorResponse,
        authID: authID
      });
    } else {
      let captureInfo = JSON.stringify(response, null, 2);
      res.render('payments/authorizations', {
        title: "Capture Authorization",
        endpoint: "/v1/payments/authorization/{authorization_id}/capture",
        captureInfo: captureInfo,
        authID: authID
    });
  }
  });
});

router.post('/showAuthDetails', (req, res, next) => {
  const authID = req.body.authID;

  paypal.authorization.get(authID, function(error, response) {
    if(error) {
      let authDetailsErrorResponse = JSON.stringify(error, null, 2);
      res.render('payments/authorizations', {
        title: "Capture Authorization",
        endpoint: "/v1/payments/authorization/{authorization_id}/capture",
        error: error,
        authDetailsErrorResponse: authDetailsErrorResponse,
        authID: authID
      });
    } else {
      let authDetails = JSON.stringify(response, null, 2);
      res.render('payments/authorizations', {
        title: "Capture Authorization",
        endpoint: "/v1/payments/authorization/{authorization_id}/capture",
        authDetails: authDetails,
        authID: authID
      });
    }
  });
});

router.post('/reauthorizeAuth', (req, res, next) => {
  const authID = req.body.ID;
  let reauthorize_details = req.body.json;
  reauthorize_details = JSON.parse(reauthorize_details);

  paypal.authorization.reauthorize(authID, reauthorize_details, function(error, response) {
    if(error) {
      let reauthorizeErrorResponse = JSON.stringify(error, null, 2);
      res.render('payments/authorizations', {
        title: "Reauthorize Authorization",
        endpoint: "/v1/payments/authorization/{authorization_id}/reauthorize",
        error: error,
        reauthorizeErrorResponse: reauthorizeErrorResponse,
        authID: authID
      });
    } else {
      let reauthorizeInfo = JSON.stringify(response, null, 2);
      res.render('payments/authorizations', {
        title: "Reauthorize Authorization",
        endpoint: "/v1/payments/authorization/{authorization_id}/capture",
        reauthorizeInfo: reauthorizeInfo,
        authID: authID
      });
    }
  });
});

router.post('/voidAuth', (req, res, next) => {
  const authID = req.body.authID;

  paypal.authorization.void(authID, function(error, response) {
    if(error) {
      let voidAuthErrorResponse = JSON.stringify(error, null, 2);
      res.render('payments/authorizations', {
        title: "Void Authorization",
        endpoint: "/v1/payments/authorization/{authorization_id}/void",
        error: error,
        voidAuthErrorResponse: voidAuthErrorResponse,
        authID: authID
      });
    } else {
      let voidAuthInfo = JSON.stringify(response, null, 2);
      res.render('payments/authorizations', {
        title: "Void Authorization",
        endpoint: "/v1/payments/authorization/{authorization_id}/void",
        voidAuthInfo: voidAuthInfo,
        authID: authID
      });
    }
  });
});


////////////////////////////////////////////////////////////////////////////////////////////////////
/////*****                  ORDERS *********** */
/////////////////////////////////////////////////////////////////////////////////////////////////////

router.get('/orders', (req, res) => {
  res.render('payments/orders', {
    title: "Capture Order",
    endpoint: "/v1/payments/orders/{order_id}/capture"
  });
});

router.post('/captureOrder', (req, res, next) => {
  const orderID = req.body.orderID;
  let capture_details = req.body.json;
  capture_details = JSON.parse(capture_details);

  paypal.order.capture(orderID, capture_details, function(error, response) {
    if(error) {
      let captureErrorResponse = JSON.stringify(error, null, 2);
      res.render('payments/orders', {
        title: "Capture Order",
        endpoint: "/v1/payments/orders/{order_id}/capture",
        error: error,
        captureErrorResponse: captureErrorResponse,
        orderID: orderID
      });
    } else {
      let captureInfo = JSON.stringify(response, null, 2);
      res.render('payments/orders', {
        title: "Capture Order",
        endpoint: "/v1/payments/orders/{order_id}/capture",
        captureInfo: captureInfo,
        orderID: orderID
      });
    }
  });
});

router.post('/authOrder', (req, res, next) => {
  const orderID = req.body.orderID;
  let authorize_details = req.body.json;
  authorize_details = JSON.parse(authorize_details);
  console.log("orderID: " + orderID + "\nauthorize_details: " + authorize_details);
  paypal.order.authorize(orderID, authorize_details, function(error, response) {
    if(error) {
      let authOrderErrorResponse = JSON.stringify(error, null, 2);
      res.render('payments/orders', {
        title: "Authorize Order",
        endpoint: "/v1/payments/orders/{order_id}/authorize",
        error: error,
        authOrderErrorResponse: authOrderErrorResponse,
        orderID: orderID
      });
    } else {
      let authOrderInfo = JSON.stringify(response, null, 2);
      res.render('payments/orders', {
        title: "Authorize Order",
        endpoint: "/v1/payments/orders/{order_id}/authorize",
        authOrderInfo: authOrderInfo,
        orderID: orderID
      });
    }
  });
});

router.post('/showOrderDetails', (req, res, next) => {
  const orderID = req.body.orderID;

  paypal.order.get(orderID, function(error, response) {
    if(error) {
      let orderDetailsErrorResponse = JSON.stringify(error, null, 2);
      res.render('payments/orders', {
        title: "Show Order Details",
        endpoint: "/v1/payments/orders/{order_id}",
        error: error,
        orderDetailsErrorResponse: orderDetailsErrorResponse,
        authID: authID
      });
    } else {
      let orderDetails = JSON.stringify(response, null, 2);
      res.render('payments/orders', {
        title: "Show Order Details",
        endpoint: "/v1/payments/orders/{order_id}",
        orderDetails: orderDetails,
        orderID: orderID
      });
    }
  });
});

router.post('/voidOrder', (req, res, next) => {
  const orderID = req.body.orderID;

  paypal.order.void(orderID, function(error, response) {
    if(error) {
      let voidOrderErrorResponse = JSON.stringify(error, null, 2);
      res.render('payments/orders', {
        title: "Void Order",
        endpoint: "/v1/payments/orders/{order_id}/do-void",
        error: error,
        voidOrderErrorResponse: voidOrderErrorResponse,
        orderID: orderID
      });
    } else {
      let voidOrderInfo = JSON.stringify(response, null, 2);
      res.render('payments/orders', {
        title: "Void Order",
        endpoint: "/v1/payments/orders/{order_id}/do-void",
        voidOrderInfo: voidOrderInfo,
        orderID: orderID
      });
    }
  });
});

module.exports = router;