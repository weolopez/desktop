#!/bin/bash

echo "🚀 Starting Desktop Browser with Headless Chrome..."
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    echo "   Visit: https://nodejs.org/"
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies (including Puppeteer)..."
    echo "   This may take a few minutes as Puppeteer downloads Chromium..."
    npm install
    echo ""
fi

# Check if Puppeteer is installed
if [ ! -d "node_modules/puppeteer" ]; then
    echo "❌ Puppeteer not found. Installing..."
    npm install puppeteer
    echo ""
fi

# Start the Chrome server
echo "🌐 Starting Chrome headless server on http://localhost:3001"
echo "📱 Open your browser and navigate to: http://localhost:3001"
echo ""
echo "✨ Features:"
echo "   • Full website compatibility with headless Chrome"
echo "   • Interactive browsing through screenshots"
echo "   • Complete JavaScript execution"
echo "   • Real browser rendering"
echo ""
echo "Press Ctrl+C to stop the server"
echo "----------------------------------------"

npm run chrome