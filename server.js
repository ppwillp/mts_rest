const express = require('express');
const app = express();
const port = 5000;
const paypal = require('paypal-rest-sdk');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const exphbs = require('express-handlebars');
const session = require('express-session');
const flash = require('connect-flash');
const passport = require('passport');
const request = require('request-promise');
const encode = require('nodejs-base64-encode');


//Routing
const router = express.Router();

//LOAD ROUTES
const payments = require('./routes/payments');
const login = require('./routes/login');
const checkout = require('./routes/checkout');
const payouts = require('./routes/payouts');
const sync = require('./routes/sync');
const subscriptions = require('./routes/subscriptions');
const disputes = require('./routes/disputes');

//Passport config
require('./config/passport')(passport);

//DB CONFIG
const db = require('./config/database');

//connect to mongoose
//*local connection
//use promise to connect and catch an err

mongoose.connect(db.mongoURI, { useNewUrlParser: true })
.then(() => console.log('MongoDB connected...'))
.catch(err => console.log(err));
//

//load Authentication Helper
const {ensureAuthenticated} = require('./helpers/auth');

//PayPal Credentials

require('./models/User');

const User = mongoose.model('users');

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

//Express Session Middleware
app.use(session({
  secret: 'secret',
  resave: true,
  saveUninitialized: true
}));

//Use Passport Middleware AFTER EXPRESS MIDDLEWARE
app.use(passport.initialize());
app.use(passport.session());

//Connect Flash middleware
app.use(flash());

//global variables for flash/session
app.use(function(req, res, next) {
  res.locals.success_msg = req.flash('success_msg');
  res.locals.error_msg = req.flash('error_msg');
  res.locals.error = req.flash('error');
  res.locals.user = req.user || null;
  next();
})

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
app.use('/login', login);
app.use('/checkout', checkout);
app.use('/payouts', payouts);
app.use('/sync', sync);
app.use('/subscriptions', subscriptions);
app.use('/disputes', disputes);

app.listen(port, () => {
  console.log(`Server started on port ${port}`);
})