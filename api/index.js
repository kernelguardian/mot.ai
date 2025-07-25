// Vercel serverless function entry point for API routes
const path = require('path');

// Set NODE_ENV to production for Vercel
process.env.NODE_ENV = 'production';

// Import the built Express app
const appPath = path.resolve(__dirname, '../dist/index.js');

module.exports = require(appPath).default || require(appPath);