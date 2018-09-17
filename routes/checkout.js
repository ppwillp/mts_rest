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

module.exports = router;