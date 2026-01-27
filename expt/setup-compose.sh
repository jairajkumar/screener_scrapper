#!/bin/bash

# Setup Docker Compose with GitHub Container Registry
# This script configures docker-compose.yml with your GitHub username

set -e

echo "🔧 Setting up Docker Compose for Stock Analysis Tool"
echo "===================================================="

# Check if GitHub username is provided
if [ -z "$1" ]; then
    echo "❌ GitHub username is required!"
    echo ""
    echo "Usage: $0 <github-username>"
    echo ""
    echo "Example:"
    echo "  $0 johndoe"
    echo ""
    echo "This will configure docker-compose.yml to use:"
    echo "  ghcr.io/johndoe/stock-analysis:latest"
    exit 1
fi

GITHUB_USERNAME="$1"
IMAGE_NAME="ghcr.io/$GITHUB_USERNAME/stock-analysis:latest"

echo "🔧 Configuration:"
echo "  GitHub Username: $GITHUB_USERNAME"
echo "  Image: $IMAGE_NAME"
echo ""

# Update docker-compose.yml with the correct image
echo "📝 Updating docker-compose.yml..."
sed -i "s|ghcr.io/YOUR_USERNAME/stock-analysis:latest|$IMAGE_NAME|g" docker-compose.yml

if [ $? -eq 0 ]; then
    echo "✅ docker-compose.yml updated successfully!"
    echo ""
    echo "🚀 Now you can run:"
    echo "   docker-compose up -d"
    echo ""
    echo "📋 Other useful commands:"
    echo "   docker-compose down          # Stop the application"
    echo "   docker-compose logs -f       # View logs"
    echo "   docker-compose restart       # Restart the application"
    echo "   docker-compose pull          # Pull latest image"
    echo ""
    echo "🌐 Access the application at: http://localhost:3000"
    echo "📦 Image: https://ghcr.io/$GITHUB_USERNAME/stock-analysis"
else
    echo "❌ Failed to update docker-compose.yml!"
    exit 1
fi 