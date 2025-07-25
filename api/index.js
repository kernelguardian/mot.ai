// Vercel API route handler
import { initializeApp } from '../dist/index.js';

let app = null;

export default async function handler(req, res) {
  try {
    if (!app) {
      app = await initializeApp();
    }
    return app(req, res);
  } catch (error) {
    console.error('Vercel handler error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}