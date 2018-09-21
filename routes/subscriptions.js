const express = require('express');
const router = express.Router();
const paypal = require('paypal-rest-sdk');

router.get('/', (req, res) => {
  res.render('subscriptions/index', {
    title: "Subscriptions",
    endpoint: 'Billing Plans and Billing Agreements'
  });
});

//billing plans routes

router.get('/billing_plans', (req, res) => {
  res.render('subscriptions/billing_plans', {
    title: "Create and Update Billing Plan",
    endpoint: "/v1/payments/billing-plans"
  });
});

//create billing plan
router.post('/create_billing_plan', (req, res, next) => {
let isoDate = new Date();
isoDate.setSeconds(isoDate.getSeconds() + 4);
isoDate.toISOString().slice(0, 19) + 'Z';

const billingPlanAttributes = req.body.json;

paypal.billingPlan.create(billingPlanAttributes, function(error, billingPlan) {
  if(error) {
    const errorResponse = JSON.stringify(error, null, 2);

    res.render('subscriptions/billing_plans', {
      title: "Create and Update Billing Plan",
      endpoint: "/v1/payments/billing-plans",
      error: error,
      errorResponse: errorResponse
    });
  } else {
    const paymentInfo = JSON.stringify(billingPlan, null, 2);
    const planId = billingPlan.id;
    console.log(planId);
    res.render('subscriptions/billing_plans', {
      title: "Create and Update Billing Plan",
      endpoint: "/v1/payments/billing-plans",
      paymentInfo: paymentInfo,
      planId: planId
    });
  }
});

});

//update billing plan
router.post('/update', (req, res, next) => {
  const billing_plan_update_attributes = req.body.json;
  const billingPlanId = req.body.planId;

  paypal.billingPlan.update(billingPlanId, billing_plan_update_attributes, function(error, response) {
    if(error) {
      
      res.render('subscriptions/billing_plans', {
        title: "Create and Update Billing Plan",
        endpoint: "/v1/payments/billing-plans",
        error: error
      });
    } else {
      let statusCode = response.httpStatusCode;
      res.render('subscriptions/billing_plans', {
        title: "Create and Update Billing Plan",
        endpoint: "/v1/payments/billing-plans",
        statusCode: statusCode
      });
    }
  });
});

router.get('/billing_plans_details', (req, res) => {
  res.render('subscriptions/billing_plans_details', {
    title: "List and Show Billing Plan Details",
    endpoint: "/v1/payments/billing-plans/{plan_id}" 
  });
});

//list billing plans
router.post('/list', (req, res, next) => {
  
  const list_billing_plan = req.body.json;
  
  paypal.billingPlan.list(list_billing_plan, function(error, bililngPlan) {
    if(error) {
      let errorResponse = JSON.stringify(error, null, 2);
      res.render('subscriptions/billing_plans_details', {
        title: "List and Show Billing Plan Details",
        endpoint: "/v1/payments/billing-plans/{plan_id}",
        error: error,
        errorResponse: errorResponse 
      });
    } else {
      let paymentInfo = JSON.stringify(billingPlan, null, 2);
      res.render('subscriptions/billing_plans_details', {
        title: "List and Show Billing Plan Details",
        endpoint: "/v1/payments/billing-plans/{plan_id}",
        paymentInfo: paymentInfo 
      });
    }
  });
});


///////////////////////////////////////////////////////////////////////////////////////////////////////
//Billing Agreements//

//create Billing Agreement
router.get('/billing_agreement_create', (req, res) => {

res.render('subscriptions/billing_agreement_create', {
  title: "Create Billing Agreement API",
  endpoint: "/v1/payments/billing-agreements"
});
});

router.post('/createBA', (req, res, next) => {
  const billingAgreementAttributes = req.body.json;

  paypal.billingAgreement.create(billingAgreementAttributes, function(error, billingAgreement) {
    if(error) {
      let errorResponse = JSON.stringify(error, null, 2);
      res.render('subscriptions/billing_agreement_create', {
        title: "Create Billing Agreement API",
        endpoint: "/v1/payments/billing-agreements",
        error: error,
        errorResponse: errorResponse
      });
    } else {
      let paymentInfo = JSON.stringify(billingAgreement, null, 2);
      let link = '';
      
      for(let i = 0; i < billingAgreement.links.length; i++) {
        if(billingAgreement.links[i].rel === 'approval_url') {
          link = billingAgreement.links[i].href;
          console.log(link);
        }
      }

      res.render('subscriptions/billing_agreement_create', {
        title: "Create Billing Agreement API",
        endpoint: "/v1/payments/billing-agreements",
        paymentInfo: paymentInfo,
        link: link
      });
    }
  })
});

//Execute Agreement GET
router.get('/billing_agreement_execute', (req, res) => {
  let token = req.query.token;
  res.render('subscriptions/billing_agreement_execute', {
    title: "Execute Billing Agreement",
    endpoint: "/v1/payments/billing-agreements/{payment_token}/agreement-execute",
    token: token 
  });
});

//Execute Agreement POST
router.post('/executeBA', (req, res, next) => {
  const paymentToken = req.body.paymentToken;
  console.log(paymentToken);
  paypal.billingAgreement.execute(paymentToken, {}, function(error, billingAgreement) {
    if(error) {
      let errorResponse = JSON.stringify(error, null, 2);
      res.render('subscriptions/billing_agreement_execute', {
        title: "Execute Billing Agreement",
        endpoint: "/v1/payments/billing-agreements/{payment_token}/agreement-execute",
        error: error,
        errorResponse: errorResponse
      });
    } else {
      let paymentInfo = JSON.stringify(billingAgreement, null, 2);
      res.render('subscriptions/billing_agreement_execute', {
        title: "Execute Billing Agreement",
        endpoint: "/v1/payments/billing-agreements/{payment_token}/agreement-execute",
        paymentInfo: paymentInfo 
      });
    }
  });
});

module.exports = router;