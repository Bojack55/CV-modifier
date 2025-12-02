const serverless = require('serverless-http');
const app = require('../../server');

// Wrap Express app for Netlify
const handler = serverless(app);

module.exports = { handler };
