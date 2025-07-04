#!/bin/bash

# Docker Test Script for Stock Analysis Tool

set -e

echo "🧪 Testing Stock Analysis Tool Docker Container"
echo "==============================================="

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if image exists
if ! docker image inspect stock-analysis:latest &> /dev/null; then
    echo "❌ Docker image 'stock-analysis:latest' not found."
    echo "   Please build the image first: ./build-docker.sh"
    exit 1
fi

# Check if .env file exists
if [ ! -f .env ]; then
    echo "⚠️  Warning: .env file not found!"
    echo "   Some features may not work without proper credentials."
fi

echo "🚀 Starting test container..."
CONTAINER_ID=$(docker run -d -p 3000:3000 --env-file .env --name stock-analysis-test stock-analysis:latest)

echo "⏳ Waiting for container to start..."
sleep 10

# Test health endpoint
echo "🔍 Testing health endpoint..."
if curl -f http://localhost:3000/api/health &> /dev/null; then
    echo "✅ Health check passed!"
else
    echo "❌ Health check failed!"
    docker logs $CONTAINER_ID
    docker stop $CONTAINER_ID
    docker rm $CONTAINER_ID
    exit 1
fi

# Test web interface
echo "🌐 Testing web interface..."
if curl -f http://localhost:3000 &> /dev/null; then
    echo "✅ Web interface is accessible!"
else
    echo "❌ Web interface failed!"
fi

# Show container logs
echo "📋 Container logs:"
docker logs $CONTAINER_ID

echo ""
echo "🧹 Cleaning up test container..."
docker stop $CONTAINER_ID
docker rm $CONTAINER_ID

echo ""
echo "✅ Docker test completed successfully!"
echo "🚀 Your Docker image is ready to use!"
echo ""
echo "To run the application:"
echo "   docker run -p 3000:3000 --env-file .env stock-analysis:latest"
echo "   or"
echo "   docker-compose up -d" 