const express = require('express');
const router = express.Router();
const paypal = require('paypal-rest-sdk');
const request = require('request-promise');
const encode = require('nodejs-base64-encode');

//load Authentication Helper
const {ensureAuthenticated} = require('../helpers/auth');

router.get('/', ensureAuthenticated, (req, res) => {

  res.render('sync/index', {
  title: "PayPal Sync API",
  endpoint: "/v1/reporting/transactions"
});
});

router.post('/transactions', ensureAuthenticated, (req, res, next) => {
  const client_id = req.user.client_id;
  const client_secret = req.user.client_secret;

let stringToEncode = client_id + ":" + client_secret;

const encodedString = encode.encode(stringToEncode, 'base64');
const uri = req.body.queryString;
var transactions = {
  getToken: function() {
    return request({
      "method": "POST",
      "uri": "https://api.sandbox.paypal.com/v1/oauth2/token",
      "json": true,
      "headers": {
        "Authorization": "Basic " + encodedString
      },
      "form": {
        "grant_type": "client_credentials"
      }
    });
  },

  showDetails: function(token) {
    return request({
      "method": "GET",
      "uri": "https://api.sandbox.paypal.com" + uri,
      "json": true,
      "headers": {
        "Authorization": "Bearer " + token,
        "content-type": "application/x-www-form-urlencoded"
      }
    });
  }
};

function main() {
  return transactions.getToken().then(response => {
    token = response.access_token;
    console.log(token);
    return token;
  }).catch(function(e) {
    console.log(e);
    return next(e);
  })};

  main().then(response => {
    transactions.showDetails(response).then(response => {
      
      const paymentInfo = JSON.stringify(response, null, 2);
      res.render('sync/showDetails', {
        title: "List Transactions",
        endpoint: "/v1/reporting/transactions",
        paymentInfo: paymentInfo
      });
    }).catch(function(e) {
      const errorResponse = JSON.stringify(e, null, 2);
      res.render('sync/showDetails', {
        title: "List Transactions",
        endpoint: "/v1/reporting/transactions",
        errorResponse: errorResponse
      });
    });
  });
});

module.exports = router;