const paypal = require('paypal-rest-sdk');

// Configure PayPal SDK with your credentials
paypal.configure({
  'mode': 'sandbox', // Use 'sandbox' for testing and 'live' for production
  'client_id': process.env.PAYPAL_CLIENT_ID, // Your PayPal Client ID
  'client_secret': process.env.PAYPAL_SECRET_KEY // Your PayPal Secret Key
});

module.exports = paypal;
