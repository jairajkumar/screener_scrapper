#!/bin/bash

# Build and Push Docker Image to GitHub Container Registry
# This creates a portable image that can be pulled on any platform

set -e

echo "🏗️ Building and Pushing Stock Analysis Docker Image"
echo "==================================================="
echo "📦 Creating portable image for GitHub Container Registry..."
echo ""

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if GitHub username is provided
if [ -z "$1" ]; then
    echo "❌ GitHub username is required!"
    echo ""
    echo "Usage: $0 <github-username>"
    echo ""
    echo "Example:"
    echo "  $0 johndoe"
    echo ""
    echo "This will create: ghcr.io/johndoe/stock-analysis:latest"
    exit 1
fi

GITHUB_USERNAME="$1"
IMAGE_NAME="ghcr.io/$GITHUB_USERNAME/stock-analysis"
TAG="latest"

echo "🔧 Configuration:"
echo "  GitHub Username: $GITHUB_USERNAME"
echo "  Image Name: $IMAGE_NAME:$TAG"
echo ""

# Navigate to nodejs-app directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
NODEJS_APP_DIR="$SCRIPT_DIR/nodejs-app"

if [ ! -d "$NODEJS_APP_DIR" ]; then
    echo "❌ Error: nodejs-app directory not found"
    exit 1
fi

cd "$NODEJS_APP_DIR"

# Check if user is logged in to GitHub Container Registry
echo "🔐 Checking GitHub Container Registry login..."
if ! docker info | grep -q "Username"; then
    echo "⚠️  Not logged in to GitHub Container Registry"
    echo "   Please login with: echo \$GITHUB_TOKEN | docker login ghcr.io -u $GITHUB_USERNAME --password-stdin"
    echo "   Or create a Personal Access Token at: https://github.com/settings/tokens"
    echo ""
    read -p "Continue without login? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Build the Docker image
echo "🔨 Building Docker image..."
docker build -t "$IMAGE_NAME:$TAG" .

if [ $? -ne 0 ]; then
    echo "❌ Docker build failed!"
    exit 1
fi

# Tag for latest
docker tag "$IMAGE_NAME:$TAG" "$IMAGE_NAME:latest"

echo "✅ Image built successfully!"
echo ""

# Ask if user wants to push to GitHub
read -p "Push image to GitHub Container Registry? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "📤 Pushing image to GitHub Container Registry..."
    docker push "$IMAGE_NAME:$TAG"
    docker push "$IMAGE_NAME:latest"
    
    if [ $? -eq 0 ]; then
        echo ""
        echo "✅ Image pushed successfully!"
        echo ""
        echo "🚀 To run the image on any machine:"
        echo "   docker pull $IMAGE_NAME:latest"
        echo "   docker run -p 3000:3000 $IMAGE_NAME:latest"
        echo ""
        echo "📋 Or use the pull-and-run script:"
        echo "   ./pull-and-run.sh $GITHUB_USERNAME"
        echo ""
        echo "🌐 Image URL: https://ghcr.io/$GITHUB_USERNAME/stock-analysis"
    else
        echo "❌ Failed to push image!"
        echo "   Make sure you're logged in to GitHub Container Registry"
        exit 1
    fi
else
    echo ""
    echo "✅ Image built locally!"
    echo ""
    echo "🚀 To run the image locally:"
    echo "   docker run -p 3000:3000 $IMAGE_NAME:latest"
    echo ""
    echo "📤 To push later:"
    echo "   docker push $IMAGE_NAME:latest"
fi 