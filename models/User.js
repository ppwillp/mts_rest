//model for MongoDB
const mongoose = require('mongoose');
const schema = mongoose.Schema;

//Create Schema
const UserSchema = new schema({
  email: {
    type: String,
    required: true
  },
  password: {
    type: String,
    required: true
  },
  client_id: {
    type: String,
    required: true
  },
  client_secret: {
    type: String,
    required: true
  },
  date: {
    type: Date,
    default: Date.now
  }
});

mongoose.model('users', UserSchema);