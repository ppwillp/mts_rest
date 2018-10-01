const paypal = require('paypal-rest-sdk');
const express = require('express');
const router = express.Router();
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
res.render('checkout/index', {
  title: "PayPal Checkout",
  endpoint: ""
});
});

router.post('/create_payment', (req, res, next) => {
  const create_payment_json = {
    "intent": "sale",
    "payer": {
        "payment_method": "paypal"
    },
    "redirect_urls": {
        "return_url": "http://localhost:5000/checkout/redirect",
        "cancel_url": "http://localhost:5000/checkout/index"
    },
    "transactions": [{
        "item_list": {
            "items": [{
                "name": "item",
                "sku": "item",
                "price": "1.00",
                "currency": "USD",
                "quantity": 1
            }]
        },
        "amount": {
            "currency": "USD",
            "total": "1.00"
        },
        "description": "This is the payment description."
    }]
  };

  paypal.payment.create(create_payment_json, function(error, payment) {
    if(error) {
      console.log(error);
      return next(error);
    } else {
      console.log(payment);
      res.send(payment.id);
      
    }
  })
});

router.post('/execute_payment', (req, res, next) => {
  const payerID = req.body.payerID;
  const paymentID = req.body.paymentID;

  const execute_payment_json = {
    "payer_id": payerID
  };

  paypal.payment.execute(paymentID, execute_payment_json, function(error, response) {
    if(error) {
      let errorResponse = JSON.stringify(error, null, 2);
      res.send(errorResponse);
    } else {
      let paymentInfo = JSON.stringify(response, null, 2);
      res.send(paymentInfo);
    }
  });
});

module.exports = router;