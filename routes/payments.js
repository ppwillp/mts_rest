const express = require('express');
const router = express.Router();
const paypal = require('paypal-rest-sdk');

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
  const title = "Execute Payment";
  const endpoint = "/v1/payments/payment/{payment_id}/execute";
  const paymentID = req.body.paymentID;
  console.log(paymentID)
  const execute_payment_json = req.body.json;
  console.log(execute_payment_json);

  paypal.payment.execute(paymentID, execute_payment_json, function(error, payment) {
    if(error) {
       errorResponse = JSON.stringify(error);
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
      res.render('payments/execute', {
        title: title,
        paymentInfo: paymentInfo,
        endpoint: endpoint
      });
    }
  });
});



module.exports = router;