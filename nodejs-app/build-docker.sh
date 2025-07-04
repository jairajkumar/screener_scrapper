#!/bin/bash

# Stock Analysis Tool Docker Build Script

set -e

echo "🐳 Building Stock Analysis Tool Docker Image"
echo "============================================="
echo "📦 This will download Puppeteer's Chrome (~170MB) during build"
echo "⚡ Using BuildKit for faster builds..."
echo ""

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if .env file exists
if [ ! -f .env ]; then
    echo "⚠️  Warning: .env file not found!"
    echo "   Please copy .env.example to .env and configure your credentials:"
    echo "   cp .env.example .env"
    echo "   Then edit .env with your Screener.in credentials and Gemini API key"
    echo ""
    read -p "Continue without .env file? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Build the Docker image with BuildKit for better caching
echo "🔨 Building Docker image with BuildKit (this may take a few minutes)..."
DOCKER_BUILDKIT=1 docker build --progress=plain -t stock-analysis:latest .

if [ $? -eq 0 ]; then
    echo "✅ Docker image built successfully!"
    echo ""
    echo "🚀 To run the application:"
    echo "   docker run -p 3000:3000 --env-file .env stock-analysis:latest"
    echo ""
    echo "   Or use docker-compose:"
    echo "   docker-compose up -d"
    echo ""
    echo "🌐 Access the application at: http://localhost:3000"
    echo ""
    echo "💡 Note: Puppeteer will use its own Chrome installation for web scraping"
    echo "💡 Tip: Subsequent builds will be faster due to Docker layer caching"
else
    echo "❌ Docker build failed!"
    exit 1
fi 