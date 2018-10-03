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
  res.render('subscriptions/index', {
    title: "Subscriptions",
    endpoint: 'Billing Plans and Billing Agreements'
  });
});

//billing plans routes

router.get('/billing_plans', ensureAuthenticated, (req, res) => {
  getCreds(req);
  res.render('subscriptions/billing_plans', {
    title: "Create and Update Billing Plan",
    endpoint: "/v1/payments/billing-plans"
  });
});

//create billing plan
router.post('/create_billing_plan', ensureAuthenticated, (req, res, next) => {
  getCreds(req);
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
router.post('/update', ensureAuthenticated, (req, res, next) => {
  getCreds(req);
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

router.get('/billing_plans_details', ensureAuthenticated, (req, res) => {
  getCreds(req);
  res.render('subscriptions/billing_plans_details', {
    title: "List and Show Billing Plan Details",
    endpoint: "/v1/payments/billing-plans/{plan_id}" 
  });
});

//list billing plans
router.post('/list', ensureAuthenticated, (req, res, next) => {
  getCreds(req);
  let list_billing_plan = req.body.json;
  console.log(list_billing_plan);
  list_billing_plan = JSON.parse(list_billing_plan);
  
  paypal.billingPlan.list(list_billing_plan, function(error, billingPlan) {
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

//Billing Plan Details
router.post('/planDetails', ensureAuthenticated, (req, res, next) => {
  getCreds(req);
  const billingPlanId = req.body.billingPlanId;
  paypal.billingPlan.get(billingPlanId, function(error, billingPlan) {
    if(error) {
      let errorResponse2 = JSON.stringify(error, null, 2);
      res.render('subscriptions/billing_plans_details', {
        title: "List and Show Billing Plan Details",
        endpoint: "/v1/payments/billing-plans/{plan_id}",
        error: error,
        errorResponse2: errorResponse2 
      });
    } else {
      let planInfo = JSON.stringify(billingPlan, null, 2);
      res.render('subscriptions/billing_plans_details', {
        title: "List and Show Billing Plan Details",
        endpoint: "/v1/payments/billing-plans/{plan_id}",
        planInfo: planInfo 
      });
    }
  });
});


///////////////////////////////////////////////////////////////////////////////////////////////////////
//Billing Agreements//

//create Billing Agreement
router.get('/billing_agreement_create', ensureAuthenticated, (req, res) => {
  getCreds(req);

res.render('subscriptions/billing_agreement_create', {
  title: "Create Billing Agreement API",
  endpoint: "/v1/payments/billing-agreements"
});
});

router.post('/createBA', ensureAuthenticated, (req, res, next) => {
  getCreds(req);
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
router.get('/billing_agreement_execute', ensureAuthenticated, (req, res) => {
  getCreds(req);
  let token = req.query.token;
  res.render('subscriptions/billing_agreement_execute', {
    title: "Execute Billing Agreement",
    endpoint: "/v1/payments/billing-agreements/{payment_token}/agreement-execute",
    token: token 
  });
});

//Execute Agreement POST
router.post('/executeBA', ensureAuthenticated, (req, res, next) => {
  getCreds(req);
  const paymentToken = req.body.paymentToken;
  
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

//Billing Agreement Operations
router.get('/billing_agreement_operations', ensureAuthenticated, (req, res) => {
  getCreds(req);
  res.render('subscriptions/billing_agreement_operations', {
    title: "Billing Agreement Operations",
    endpoint: "/billing-agreements"
  });
});

router.post('/updateBA', ensureAuthenticated, (req, res, next) => {
  getCreds(req);
  const billingAgreementId = req.body.billingAgreementId;
  const billing_agreement_update_attributes = req.body.json;

  paypal.billingAgreement.update(billingAgreementId, billing_agreement_update_attributes, function(error, response) {
    if(error) {
      let updateErrorResponse = JSON.stringify(error, null, 2);
      res.render('subscriptions/billing_agreement_operations', {
        title: "Billing Agreement Operations",
        endpoint: "/billing-agreements",
        error: error,
        updateErrorResponse: updateErrorResponse
      });
    } else {
      let updateInfo = JSON.stringify(response, null, 2);
      res.render('subscriptions/billing_agreement_operations', {
        title: "Billing Agreement Operations",
        endpoint: "/billing-agreements",
        updateInfo: updateInfo
      });
    }
  });
});

//Show BA Details
router.post('/getBADetails', ensureAuthenticated, (req, res, next) => {
  getCreds(req);
  let billingAgreementId = req.body.billingAgreementId;

  paypal.billingAgreement.get(billingAgreementId, function(error, response) {
    if(error) {
      let detailsErrorResponse = JSON.stringify(error, null, 2);
      res.render('subscriptions/billing_agreement_operations', {
        title: "Billing Agreement Operations",
        endpoint: "/billing-agreements",
        error: error,
        detailsErrorResponse: detailsErrorResponse
      });
    } else {
      let agreementDetails = JSON.stringify(response, null, 2);
      res.render('subscriptions/billing_agreement_operations', {
        title: "Billing Agreement Operations",
        endpoint: "/billing-agreements",
        agreementDetails: agreementDetails
      });
    }
  });
});

module.exports = router;