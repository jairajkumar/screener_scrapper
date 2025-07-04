#!/bin/bash

# Quick Docker Build Script for Stock Analysis Tool

set -e

echo "⚡ Quick Docker Build for Stock Analysis Tool"
echo "============================================="
echo "🚀 Faster build with minimal optimizations"
echo ""

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

# Build the Docker image quickly
echo "🔨 Building Docker image (quick mode)..."
docker build -t stock-analysis:latest .

if [ $? -eq 0 ]; then
    echo "✅ Docker image built successfully!"
    echo ""
    echo "🚀 To run the application:"
    echo "   docker run -p 3000:3000 --env-file .env stock-analysis:latest"
    echo ""
    echo "🌐 Access the application at: http://localhost:3000"
else
    echo "❌ Docker build failed!"
    exit 1
fi 