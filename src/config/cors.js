const cors = require("cors");

const corsoptions = {
  origin: [
    'https://your-website-domain.com',    // Your website
    'https://postman-requests.com',
    'http://localhost:3000',
  ],
  methods: ['POST', 'PUT'],
  allowedHeaders: ['Content-Type', 'X-Custom-Auth'],
  credentials: true
}

module.exports = cors(corsoptions);
