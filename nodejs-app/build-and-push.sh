#!/bin/bash

# Stock Analysis - Docker Build and Push Script
# Builds and pushes Docker image to GitHub Container Registry (ghcr.io)

set -e

# Configuration
REPO_OWNER="jairajkumar"
IMAGE_NAME="stock-analysis"
REGISTRY="ghcr.io"
FULL_IMAGE_NAME="${REGISTRY}/${REPO_OWNER}/${IMAGE_NAME}"

# Get version tag from argument or use 'latest'
VERSION="${1:-latest}"

echo "🐳 Stock Analysis - Docker Build and Push"
echo "=========================================="
echo "📦 Image: ${FULL_IMAGE_NAME}:${VERSION}"
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker Desktop."
    exit 1
fi

# Extract GitHub token from git remote URL
echo "🔑 Extracting GitHub token from git remote..."
GITHUB_TOKEN=$(git remote get-url origin | sed -n 's/.*:\(ghp_[^@]*\)@.*/\1/p')

if [ -z "$GITHUB_TOKEN" ]; then
    echo "❌ Could not extract GitHub token from git remote URL."
    echo "   Please ensure your remote URL has the format:"
    echo "   https://username:TOKEN@github.com/..."
    exit 1
fi

echo "✅ Token found"

# Login to GitHub Container Registry
echo ""
echo "🔐 Logging into GitHub Container Registry..."
echo "$GITHUB_TOKEN" | docker login ${REGISTRY} -u ${REPO_OWNER} --password-stdin

if [ $? -ne 0 ]; then
    echo "❌ Failed to login to GitHub Container Registry"
    exit 1
fi

echo "✅ Logged in to ${REGISTRY}"

# Build the Docker image
echo ""
echo "🔨 Building Docker image..."
docker build -t ${FULL_IMAGE_NAME}:${VERSION} .

if [ $? -ne 0 ]; then
    echo "❌ Docker build failed"
    exit 1
fi

echo "✅ Image built: ${FULL_IMAGE_NAME}:${VERSION}"

# Also tag as latest if a specific version was provided
if [ "${VERSION}" != "latest" ]; then
    echo "🏷️  Also tagging as 'latest'..."
    docker tag ${FULL_IMAGE_NAME}:${VERSION} ${FULL_IMAGE_NAME}:latest
fi

# Push the image
echo ""
echo "📤 Pushing image to ${REGISTRY}..."
docker push ${FULL_IMAGE_NAME}:${VERSION}

if [ "${VERSION}" != "latest" ]; then
    docker push ${FULL_IMAGE_NAME}:latest
fi

echo ""
echo "✅ Successfully pushed to GitHub Container Registry!"

# Logout from registry for security
echo ""
echo "🔐 Logging out from ${REGISTRY}..."
docker logout ${REGISTRY}

echo ""
echo "🚀 Others can now run:"
echo "   docker pull ${FULL_IMAGE_NAME}:${VERSION}"
echo "   docker run -p 3000:3000 --env-file .env ${FULL_IMAGE_NAME}:${VERSION}"
echo ""
echo "📄 Or use docker-compose with:"
echo "   image: ${FULL_IMAGE_NAME}:${VERSION}"
