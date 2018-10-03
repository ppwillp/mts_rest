const express = require('express');
const router = express.Router();
const paypal = require('paypal-rest-sdk');

//load Authentication Helper
const {ensureAuthenticated} = require('../helpers/auth');

function getCreds(req) {
  const client_id = req.user.client_id;
  const client_secret = req.user.client_secret;

  paypal.configure({
    'mode': 'sandbox',
    'client_id': client_id,
    'client_secret': client_secret
  });

  return paypal;
}

router.get('/', ensureAuthenticated, (req, res) => {
  getCreds(req);
  function randomInt() {
    return Math.floor(Math.random() * 100000);
  }

  const sender_batch_id = randomInt();
  res.render('payouts/index', {
    title: "Payouts API",
    endpoint: "/v1/payments/payouts",
    sender_batch_id: sender_batch_id
  });
});

router.post('/create', ensureAuthenticated, (req, res, next) => {
  getCreds(req);
const creat_payout_json = req.body.json;

paypal.payout.create(creat_payout_json, function(error, payment) {
  if(error) {
    const errorResponse = JSON.stringify(error, null, 2);
    console.log(errorResponse);
    res.render('payouts/index', {
      title: "Payouts API",
      endpoint: "/v1/payments/payouts",
      errorResponse: errorResponse,
      error: error
    });
  } else {
    const paymentInfo = JSON.stringify(payment, null, 2);
    console.log(payment);
    const payout_batch_id = payment.batch_header.payout_batch_id;
    console.log(payout_batch_id);
    res.render('payouts/index', {
      title: "Payouts API",
      endpoint: "/v1/payments/payouts",
      paymentInfo: paymentInfo,
      payout_batch_id: payout_batch_id
    });
  }
});
});

router.post('/getPayoutDetails', ensureAuthenticated, (req, res, next) => {
  getCreds(req);
const payoutId = req.body.id;
console.log("payoutID is " + payoutId);
paypal.payout.get(payoutId, function(error, payout) {
  if(error) {
    const errorResponse = JSON.stringify(error, null, 2);
    res.render('payouts/payoutDetails', {
      title: "Show Payout Details",
      endpoint: "/v1/payments/payouts/payout_batch_id",
      error: error,
      errorResponse: errorResponse
    });
  } else {
    const paymentInfo = JSON.stringify(payout, null, 2);
    res.render('payouts/payoutDetails', {
      title: "Show Payout Details",
      endpoint: "/v1/payments/payouts/payout_batch_id",
      paymentInfo: paymentInfo
    });
  }
});
});

module.exports = router;