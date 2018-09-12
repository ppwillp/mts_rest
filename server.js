const express = require('express');
const app = express();
const port = 5000;
const paypal = require('paypal-rest-sdk');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const exphbs = require('express-handlebars');

//Routing
const router = express.Router();

//LOAD ROUTES
const payments = require('./routes/payments');

//PayPal Credentials

paypal.configure({
  'mode': 'sandbox',
  'client_id': 'Af_OpabuECsNfU6AzLf1PT213b3BGAy6CRJa5IEr3hteYlOFobgeo0D9gTXxgH4l4UjyhJplVW2xaGVO',
  'client_secret': 'EIcCShuD64_P_poFIfldFS9xj7t_wfKDTSzWCaOy8y8JUtsZ9A3pp9fcgPfWcqiUWw01BOPlz_6DWpUt'
});

//*********MIDDLEWARE*********//

//body-parser middleware
app.use(bodyParser.urlencoded({ extended: false }));

//handlebars middleware
app.engine('handlebars', exphbs({
  defaultLayout: 'main'
}));
app.set('view engine', 'handlebars');

//CORS Middleware
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

//index route
app.get('/', (req, res) => {
  const title = "MTS REST Tool";
  res.render('index', {
    title: title
  });
});

//about route
app.get('/about', (req, res) => {
const title = "About";
res.render('about', {
  title: title
});
});

//USE ROUTES
app.use('/payments', payments);

app.listen(port, () => {
  console.log(`Server started on port ${port}`);
})