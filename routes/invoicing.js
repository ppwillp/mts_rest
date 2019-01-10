const express = require("express");
const router = express.Router();
const paypal = require("paypal-rest-sdk");
const encode = require("nodejs-base64-encode");

//load Authentication Helper
const { ensureAuthenticated } = require("../helpers/auth");

const getCreds = req => {
  const client_id = req.user.client_id;
  const client_secret = req.user.client_secret;

  paypal.configure({
    mode: "sandbox",
    client_id: client_id,
    client_secret: client_secret
  });
  return paypal;
};

router.get("/", ensureAuthenticated, (req, res) => {
  getCreds(req);
  res.render("invoicing/index", {
    title: "Invoicing API",
    endpoint: "/v1/invoicing/invoices"
  });
});

router.get("/create_invoice", ensureAuthenticated, (req, res) => {
  getCreds(req);
  let email = req.user.email;
  res.render("invoicing/create_invoice", {
    title: "Create Invoice",
    endpoint: "/v1/invoicing/invoices",
    email
  });
});

router.post("/create", ensureAuthenticated, (req, res, next) => {
  getCreds(req);
  const json = req.body.json;

  paypal.invoice.create(json, function(error, invoice_template) {
    if (error) {
      let errorResponse = JSON.stringify(error, null, 2);
      res.render("invoicing/create_invoice", {
        title: "Create Invoice",
        endpoint: "/v1/invoicing/invoices",
        email: req.user.email,
        errorResponse
      });
    } else {
      let paymentInfo = JSON.stringify(invoice_template, null, 2);
      let invoice_id = invoice_template.id;
      res.render("invoicing/create_invoice", {
        title: "Create Invoice",
        endpoint: "/v1/invoicing/invoices",
        email: req.user.email,
        paymentInfo,
        invoice_id
      });
    }
  });
});

router.post("/send", ensureAuthenticated, (req, res) => {
  getCreds(req);
  let invoice_id = req.body.invoice_id;
  let email = req.user.email;
  paypal.invoice.send(invoice_id, (error, response) => {
    if (error) {
      let errorResponseSend = JSON.stringify(error, null, 2);
      res.render("invoicing/create_invoice", {
        title: "Create Invoice",
        endpoint: "/v1/invoicing/invoices",
        email,
        errorResponseSend
      });
    } else {
      let sendHTTPStatusCode = response.httpStatusCode;
      res.render("invoicing/create_invoice", {
        title: "Create Invoice",
        endpoint: "/v1/invoicing/invoices",
        email,
        sendHTTPStatusCode
      });
    }
  });
});

router.post("/cancel", ensureAuthenticated, (req, res) => {
  getCreds(req);
  let invoice_id = req.body.invoice_id;
  let json = req.body.json;

  paypal.invoice.cancel(invoice_id, json, (error, response) => {
    if (error) {
      let cancelErrorResponse = JSON.stringify(error, null, 2);
      res.render("invoicing/create_invoice", {
        title: "Create Invoice",
        endpoint: "/v1/invoicing/invoices",
        cancelErrorResponse,
        invoice_id
      });
    } else {
      let cancelPaymentHTTPStatusCode = response.httpStatusCode;
      res.render("invoicing/create_invoice", {
        title: "Create Invoice",
        endpoint: "/v1/invoicing/invoices",
        cancelPaymentHTTPStatusCode,
        invoice_id
      });
    }
  });
});

router.get("/create_invoice_template", ensureAuthenticated, (req, res) => {
  getCreds(req);
  let email = req.user.email;
  res.render("invoicing/create_invoice_template", {
    title: "Create Invoice Template",
    endpoint: "/v1/invoicing/templates",
    email
  });
});

router.post("/list_templates", ensureAuthenticated, (req, res) => {
  getCreds(req);
  paypal.invoiceTemplate.list(function(error, invoice_template) {
    if (error) {
      let errorResponseTemplateList = JSON.stringify(error, null, 2);
      res.render("invoicing/create_invoice", {
        title: "Create Invoice Template",
        endpoint: "/v1/invoicing/templates",
        email: req.user.email,
        errorResponseTemplateList
      });
    } else {
      let paymentInfoTemplateList = JSON.stringify(invoice_template, null, 2);
      res.render("invoicing/create_invoice", {
        title: "Create Invoice Template",
        endpoint: "/v1/invoicing/templates",
        email: req.user.email,
        paymentInfoTemplateList
      });
    }
  });
});

router.get("/invoice_operations", ensureAuthenticated, (req, res) => {
  getCreds(req);
  res.render("invoicing/invoice_operations", {
    title: "Invoice Operations",
    endpoint: "/v1/invoicing/invoices"
  });
});

router.get("/list_invoices", ensureAuthenticated, (req, res) => {
  getCreds(req);
  paypal.invoice.list((error, invoices) => {
    if (error) {
      let listErrorResponse = JSON.stringify(error, null, 2);
      res.render("invoices/invoice_operations", {
        title: "Invoice Operations",
        endpoint: "/v1/invoicing/invoices",
        listErrorResponse
      });
    } else {
      let listResponse = JSON.stringify(invoices, null, 2);
      res.render("invoicing/invoice_operations", {
        title: "Invoice Operations",
        endpoint: "/v1/invoicing/invoices",
        listResponse
      });
    }
  });
});

router.post("/show_details", ensureAuthenticated, (req, res) => {
  getCreds(req);
  let invoice_id = req.body.invoice_id;

  paypal.invoice.get(invoice_id, (error, invoice) => {
    if (error) {
      let invoiceInfoErrorResponse = JSON.stringify(error, null, 2);
      res.render("invoicing/invoice_operations", {
        title: "Invoice Operations",
        endpoint: "/v1/invoicing/invoices",
        invoiceInfoErrorResponse
      });
    } else {
      let invoiceInfo = JSON.stringify(invoice, null, 2);
      res.render("invoicing/invoice_operations", {
        title: "Invoice Operations",
        endpoint: "/v1/invoicing/invoices",
        invoiceInfo
      });
    }
  });
});

router.post("/qr_code", ensureAuthenticated, (req, res) => {
  getCreds(req);
  let invoice_id = req.body.invoice_id;
  let height = req.body.height;
  let width = req.body.width;

  paypal.invoice.qrCode(invoice_id, height, width, (error, qr) => {
    if (error) {
      let qrCodeErrorResponse = JSON.stringify(error, null, 2);
      res.render("invoicing/invoice_operations", {
        title: "Invoice Operations",
        endpoint: "/v1/invoicing/invoices",
        invoice_id,
        qrCodeErrorResponse
      });
    } else {
      let qrCode = JSON.stringify(qr, null, 2);
      let qrCodeText = qr.image;
      res.render("invoicing/invoice_operations", {
        title: "Invoice Operations",
        endpoint: "/v1/invoicing/invoices",
        invoice_id,
        qrCode,
        qrCodeText
      });
    }
  });
});

router.post("/create_template", ensureAuthenticated, (req, res) => {
  getCreds(req);
  const json = req.body.json;

  paypal.invoiceTemplate.create(json, function(error, invoice_template) {
    if (error) {
      let errorResponse = JSON.stringify(error, null, 2);
      res.render("invoicing/create_invoice_template", {
        title: "Create Invoice Template",
        endpoint: "/v1/invoicing/templates",
        email: req.user.email,
        errorResponse
      });
    } else {
      let paymentInfo = JSON.stringify(invoice_template, null, 2);
      let template_id = invoice_template.template_id;
      res.render("invoicing/create_invoice_template", {
        title: "Create Invoice Template",
        endpoint: "/v1/invoicing/templates",
        email: req.user.email,
        paymentInfo,
        template_id
      });
    }
  });
});

router.post("/template_details", ensureAuthenticated, (req, res) => {
  let template_id = req.body.template_id;
  paypal.invoiceTemplate.get(template_id, (error, template) => {
    if (error) {
      let templateInfoErrorResponse = JSON.stringify(error, null, 2);
      res.render("invoicing/create_invoice_template", {
        title: "Create Invoice Template",
        endpoint: "/v1/invoicing/templates",
        email: req.user.email,
        templateInfoErrorResponse,
        template_id
      });
    } else {
      let templateInfo = JSON.stringify(template, null, 2);
      res.render("invoicing/create_invoice_template", {
        title: "Create Invoice Template",
        endpoint: "/v1/invoicing/templates",
        email: req.user.email,
        templateInfo,
        template_id
      });
    }
  });
});

module.exports = router;
