const express = require('express');
const router = express.Router();
const paypal = require('paypal-rest-sdk');
const request = require('request-promise');

router.get('/', (req, res) => {
  res.render('disputes/index', {
    title: "Customer Disputes API",
    endpoint: "/v1/customer/disputes"
  });
});

router.post('/listDisputes', (req, res, next) => {
  var disputeReq = {
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

    listDisputes: function(token) {
      return request({
        "method": "GET",
        "uri": "https://api.sandbox.paypal.com/v1/customer/disputes?page_size=50",
        "json": true,
        "headers": {
          "Authorization": "Bearer " + token,
          "content-type": "application/x-www-form-urlencoded"
        }
      });
    }
  };

  function main() {
    return disputeReq.getToken()
      .then(response => {
        const token = response.access_token;
        
        return token;
      })
      .catch(function(e) {
        console.log(e);
        throw e;
      });
  }

  main()
    .then(response => {
      
      disputeReq.listDisputes(response)
        .then(response => {
          var disputes = {
            items: [{}]
          };
          for(let i = 0; i < response.items.length; i++) {
            disputes.items[i] = {
              "dispute_id": response.items[i].dispute_id,
              "create_time": response.items[i].create_time,
              "update_time": response.items[i].update_time,
              "reason": response.items[i].reason,
              "status": response.items[i].status,
              "dispute_amount": {
                "value": response.items[i].dispute_amount.value,
                "currency_code": response.items[i].dispute_amount.currency_code
              }
            };
          }
          const disputesString = JSON.stringify(response, null, 2);
          
          res.render('disputes/listDisputes', {
            title: "List Disputes",
            endpoint: "/v1/customer/disputes",
            disputes: disputes,
            disputesString: disputesString
          });
        })
        .catch(function(e) {
          let eString = JSON.stringify(e, null, 2);
          res.render('disputes/listDisputes', {
            title: "List Disputes",
            endpoint: "/v1/customer/disputes",
            e: e
          });
        });
    });

});

router.post('/disputeDetails', (req, res, next) => {
  const dispute_id = req.body.dispute_id;

  var disputeDetails = {
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
    getDetails: function(token) {
      return request({
        "method": "GET",
        "uri": "https://api.sandbox.paypal.com/v1/customer/disputes/" + dispute_id,
        "json": true,
         "headers": {
           "Authorization": "Bearer " + token,
           "content-type": "application/x-www-form-urlencoded"
         }
      });
    }
  };

  function main() {
    return disputeDetails.getToken()
      .then(response => {
        const token = response.access_token;
        
        return token;
      })
      .catch(function(e) {
        console.log(e);
        throw e;
      });
  }

  main()
    .then(response => {
      disputeDetails.getDetails(response)
        .then(response => {
          var disputeInfo = {
            "dispute_id": response.dispute_id,
            "create_time": response.create_time,
            "update_time": response.update_time,
            "disputed_transactions": [{
              "seller_transaction_id": response.disputed_transactions[0].seller_transaction_id,
              "create_time": response.disputed_transactions[0].create_time,
              "transaction_status": response.disputed_transactions[0].transaction_status,
              "gross_amount": {
                "currency_code": response.disputed_transactions[0].gross_amount.currency_code,
                "value": response.disputed_transactions[0].gross_amount.value
              },
              "seller": {
                "email": response.disputed_transactions[0].seller.email,
                "merchant_id": response.disputed_transactions[0].seller.merchant_id,
                "name": response.disputed_transactions[0].seller.name
              },
              "items": [{
                "item_id": response.disputed_transactions[0].items.item_id
              }],
              "seller_protection_eligible": response.disputed_transactions[0].seller_protection_eligible
            }],
            "reason": response.reason,
            "status": response.status,
            "dispute_amount": {
              "currency_code": response.dispute_amount.currency_code,
              "value": response.dispute_amount.value
            },
            "dispute_life_cycle_stage": response.dispute_life_cycle_stage,
            "dispute_channel": response.dispute_channel
          };
    
          disputeInfo.offer = {};
          var isEmpty = function(obj) {
            return Object.keys(obj).length === 0;
          }
    
          if(response.offer && response.offer.buyer_requested_amount) {
            disputeInfo.offer.buyer_requested_amount = {
              "currency_code": response.offer.buyer_requested_amount.currency_code,
              "value": response.offer.buyer_requested_amount.value
            }
          }
    
          if(response.offer && response.offer.seller_offered_amount) {
            disputeInfo.offer.seller_offered_amount = {
              "currency_code": response.offer.seller_offered_amount.currency_code,
              "value": response.offer.seller_offered_amount.value
            }
          }
        
          disputeInfo.messages = [{}];
    
          for(let i = 0; i < response.messages.length; i++) {
            disputeInfo.messages[i] = {
              "posted_by": response.messages[i].posted_by,
              "time_posted": response.messages[i].time_posted,
              "content": response.messages[i].content
            }
          };
          
          disputeInfo.links = [{}];
          for(let i = 0; i < response.links.length; i++) {
            disputeInfo.links[i] = {
              "href": response.links[i].href,
              "rel": response.links[i].rel,
              "method": response.links[i].method
            }
          };
          const disputesString = JSON.stringify(response, null, 2);
          res.render('disputes/disputeDetails', {
            title: "Show Dispute Details",
            endpoint: "/v1/customer/disputes/{dispute_id}",
            disputeInfo: disputeInfo,
            disputesString: disputesString
          });

        }).catch(function(e) {
          const eString = JSON.stringify(e, null, 2);
          res.render('disputes/disputeDetails', {
            title: "Show Dispute Details",
            endpoint: "/v1/customer/disputes/{dispute_id}",
            eString: eString
          });
        });
    });

});

router.post('/send-message', (req, res, next) => {
  const title = "Send Message";
  const dispute_id = req.body.dispute_id;
  const message = req.body.message;

  var disputeMessage = {
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
    sendMessage: function(token) {
      return request({
        "method": "POST",
        "uri": "https://api.sandbox.paypal.com/v1/customer/disputes/" + dispute_id + "/send-message",
        "json": true,
        "headers": {
          "Authorization": "Bearer " + token,
          "content-type": "application/json"
        },
        "body": {
          "message": message
        }
      });
    }
  };

  function main() {
    return disputeMessage.getToken()
      .then(response => {
        const token = response.access_token;
        return token;
      })
      .catch(function(e) {
        console.log(e);
        throw e;
      });
  }


main()
  .then(response => {
    disputeMessage.sendMessage(response)
      .then(response => {
        const message = JSON.stringify(response, null, 2);
        res.render('disputes/action', {
          title: title,
          endpoint: "/v1/customer/disputes/",
          message: message
        });
      })
      .catch(function(e) {
        const eMessage = JSON.stringify(e, null, 2);
        res.render('disputes/action', {
          title: title,
          endpoint: "/v1/customer/disputes/",
          eMessage: eMessage
        });
      });
  });
});

router.post('/accept-claim', (req, res, next) => {
  const title = "Accept Claim";
  const dispute_id = req.body.dispute_id;
  const note = req.body.note;
  var acceptClaim = {
    getToken: function() {
      return request({
        "method": "POST",
        "uri": "https://api.sandbox.paypal.com/v1/oauth2/token",
        "json": true,
        "headers": {
          "Authorization": "Basic QWZfT3BhYnVFQ3NOZlU2QXpMZjFQVDIxM2IzQkdBeTZDUkphNUlFcjNodGVZbE9Gb2JnZW8wRDlnVFh4Z0g0bDRVanloSnBsVlcyeGFHVk86RUljQ1NodUQ2NF9QX3BvRklmbGRGUzl4ajd0X3dmS0RUU3pXQ2FPeTh5OEpVdHNaOUEzcHA5ZmNnUGZXY3FpVVd3MDFCT1Bsel82RFdwVXQ=",
        },
        "form": {
          "grant_type": "client_credentials"
        }
      });
    },
    complete: function(token) {
      return request({
        "method": "POST",
        "uri": "https://api.sandbox.paypal.com/v1/customer/disputes/" + dispute_id + "/accept-claim",
        "json": true,
        "headers": {
          "Authorization": "Bearer " + token,
          "content-type": "application/json"
        },
        "body": {
          "note": note
        }
      })
    }
  };

  function main() {
    return acceptClaim.getToken()
      .then(response => {
        const token = response.access_token;
        return token;
      })
      .catch(function(e) {
        console.log(e);
        throw e;
      });
  }

  main()
  .then(response => {
    acceptClaim.complete(response)
      .then(response => {
        const message = JSON.stringify(response, null, 2);
        res.render('disputes/action', {
          title: title,
          endpoint: "/v1/customer/disputes/",
          message: message
        });
      })
      .catch(function(e) {
        const eMessage = JSON.stringify(e, null, 2);
        res.render('disputes/action', {
          title: title,
          endpoint: "/v1/customer/disputes/",
          eMessage: eMessage
        });
      });
  });
});

router.post('/escalate', (req, res, next) => {
  const title = "Escalate Dispute to a Claim";
  const dispute_id = req.body.dispute_id;
  const note = req.body.note;

  var escalation = {
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
    claim: function(token) {
      return request({
        "method": "POST",
        "uri": "https://api.sandbox.paypal.com/v1/customer/disputes/" + dispute_id + "/escalate",
        "json": true,
        "headers": {
          "Authorization": "Bearer " + token,
          "content-type": "application/json"
        },
        "body": {
          "note": note
        }
      })
    }
  };

  function main() {
    return escalation.getToken()
      .then(response => {
        const token = response.access_token;
        return token;
      })
      .catch(function(e) {
        console.log(e);
        throw e;
      });
  }

  main()
  .then(response => {
    escalation.claim(response)
      .then(response => {
        const message = JSON.stringify(response, null, 2);
        res.render('disputes/action', {
          title: title,
          endpoint: "/v1/customer/disputes/",
          message: message
        });
      })
      .catch(function(e) {
        const eMessage = JSON.stringify(e, null, 2);
        res.render('disputes/action', {
          title: title,
          endpoint: "/v1/customer/disputes/",
          eMessage: eMessage
        });
      });
  });

});

router.post('/makeOffer', (req, res, next) => {
  const title = "Make Offer";
  const dispute_id = req.body.dispute_id;
  const note = req.body.note;
  const offerType = req.body.offerType;
  const amount = req.body.amount;

  var obj = {
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
      })
    },
    makeOffer: function(token) {
      return request({
        "method": "POST",
        "uri": "https://api.sandbox.paypal.com/v1/customer/disputes/" + dispute_id + "/make-offer",
        "json": true,
        "headers": {
          "Authorization": "Bearer " + token,
          "content-type": "application/json"
        },
        "body": {
          "note": note,
          "offer_amount": {
            "currency_code": "USD",
            "value": amount
          },
          "offer_type": offerType
        }
      })
    }
  };

  function main() {
    return obj.getToken()
      .then(response => {
        const token = response.access_token;
        return token;
      })
      .catch(function(e) {
        console.log(e);
        throw e;
      });
  }

  main()
  .then(response => {
    obj.makeOffer(response)
      .then(response => {
        const message = JSON.stringify(response, null, 2);
        res.render('disputes/action', {
          title: title,
          endpoint: "/v1/customer/disputes/",
          message: message
        });
      })
      .catch(function(e) {
        const eMessage = JSON.stringify(e, null, 2);
        res.render('disputes/action', {
          title: title,
          endpoint: "/v1/customer/disputes/",
          eMessage: eMessage
        });
      });
  });

});

module.exports = router;