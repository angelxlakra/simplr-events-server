const cors = require("cors");

const corsoptions = {
  origin: [
    'https://simplr-events-arb.vercel.app',    // Your website
    'https://postman-requests.com',
    'http://localhost:3000',
  ],
  methods: ['POST', 'PUT'],
  allowedHeaders: ['Content-Type', 'X-Custom-Auth'],
  credentials: true
}

module.exports = cors(corsoptions);
