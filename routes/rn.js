const paypal = require("paypal-rest-sdk");
const express = require("express");
const router = express.Router();

paypal.configure({
  mode: "sandbox",
  client_id:
    "Af_OpabuECsNfU6AzLf1PT213b3BGAy6CRJa5IEr3hteYlOFobgeo0D9gTXxgH4l4UjyhJplVW2xaGVO",
  client_secret:
    "EIcCShuD64_P_poFIfldFS9xj7t_wfKDTSzWCaOy8y8JUtsZ9A3pp9fcgPfWcqiUWw01BOPlz_6DWpUt"
});

router.get("/", (req, res) => {
  res.render("rn/index");
});

router.post("/paypal", (req, res) => {
  const create_payment_json = {
    intent: "sale",
    payer: {
      payment_method: "paypal"
    },
    redirect_urls: {
      return_url: "https://guarded-brook-41995.herokuapp.com/rn/success",
      cancel_url: "https://guarded-brook-41995.herokuapp.com/rn/cancel"
    },
    transactions: [
      {
        item_list: {
          items: [
            {
              name: "item",
              sku: "item",
              price: "1.00",
              currency: "USD",
              quantity: 1
            }
          ]
        },
        amount: {
          currency: "USD",
          total: "1.00"
        },
        description: "This is the payment description."
      }
    ]
  };

  paypal.payment.create(create_payment_json, function(error, payment) {
    if (error) {
      console.log(error);
      // throw error;
    } else {
      console.log(payment);
      res.redirect(payment.links[1].href);
    }
  });
});

router.get("/success", (req, res) => {
  const PayerID = req.query.PayerID;
  const paymentId = req.query.paymentId;

  const execute_payment_json = {
    payer_id: PayerID
  };

  paypal.payment.execute(paymentId, execute_payment_json, function(
    error,
    payment
  ) {
    if (error) {
      console.log(error);
      throw error;
    } else {
      console.log(payment);
      res.render("rn/success");
    }
  });
});

router.get("/cancel", (req, res) => {
  res.render("rn/cancel");
});

module.exports = router;
