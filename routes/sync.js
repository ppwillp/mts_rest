const express = require('express');
const router = express.Router();
const paypal = require('paypal-rest-sdk');
const request = require('request-promise');



router.get('/', (req, res) => {

  res.render('sync/index', {
  title: "PayPal Sync API",
  endpoint: "/v1/reporting/transactions"
});
});

router.post('/transactions', (req, res, next) => {
const uri = req.body.queryString;
var transactions = {
  getToken: function() {
    return request({
      "method": "POST",
      "uri": "https://api.sandbox.paypal.com/v1/oauth2/token",
      "json": true,
      "headers": {
        "Authorization": "Basic QWZfT3BhYnVFQ3NOZlU2QXpMZjFQVDIxM2IzQkdBeTZDUkphNUlFcjNodGVZbE9Gb2JnZW8wRDlnVFh4Z0g0bDRVanloSnBsVlcyeGFHVk86RUljQ1NodUQ2NF9QX3BvRklmbGRGUzl4ajd0X3dmS0RUU3pXQ2FPeTh5OEpVdHNaOUEzcHA5ZmNnUGZXY3FpVVd3MDFCT1Bsel82RFdwVXQ="
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