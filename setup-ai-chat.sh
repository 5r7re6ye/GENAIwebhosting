#!/bin/bash

# AI Chat Setup Script
echo "🤖 Setting up AI Chat for React App..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

echo "✅ Node.js and npm are installed"

# Install dependencies
echo "📦 Installing dependencies..."
npm install express cors dotenv nodemon

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file..."
    cp env.example .env
    echo "✅ .env file created. Please edit it with your configuration."
else
    echo "✅ .env file already exists"
fi

echo ""
echo "🎉 Setup complete!"
echo ""
echo "To start the application:"
echo "1. Run 'npm run dev' in one terminal (for React app)"
echo "2. Run 'npm run server:dev' in another terminal (for backend server)"
echo ""
echo "To test the AI chat:"
echo "1. Open your browser to http://localhost:5173"
echo "2. Login to your dashboard"
echo "3. Click on 'AI 助手' in the left menu"
echo "4. Click '開始對話' to start chatting"
echo ""
echo "For production deployment, run 'npm run start'"
