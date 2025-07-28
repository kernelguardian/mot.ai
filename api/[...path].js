// Vercel API route handler - catch all API paths
import { initializeApp } from '../dist/production.js';

let app = null;

export default async function handler(req, res) {
  try {
    // Set NODE_ENV for production
    process.env.NODE_ENV = 'production';
    
    if (!app) {
      app = await initializeApp();
    }
    
    // Handle the request with Express app
    return app(req, res);
  } catch (error) {
    console.error('Vercel API handler error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}