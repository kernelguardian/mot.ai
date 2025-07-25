#!/bin/bash

# Vercel Build Script for MOT.AI
echo "🚀 Starting Vercel build process..."

# Install dependencies
echo "📦 Installing dependencies..."
npm ci

# Build the application
echo "🔨 Building application..."
npm run build

# Ensure dist/public directory exists
echo "📁 Ensuring build directories exist..."
mkdir -p dist/public

# Copy any additional assets if needed
echo "✅ Build complete!"

# Show build output
echo "📊 Build summary:"
ls -la dist/
if [ -d "dist/public" ]; then
  echo "Frontend build size:"
  du -sh dist/public/
fi
echo "Backend build size:"
du -sh dist/index.js