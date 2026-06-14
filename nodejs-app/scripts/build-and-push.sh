#!/bin/bash

# Stock Analysis - Docker Build and Push Script
# Builds and pushes multi-platform Docker image to GitHub Container Registry (ghcr.io)
# Supports both AMD64 (Windows/Linux) and ARM64 (Mac M1/M2)

set -e

# Configuration
REPO_OWNER="jairajkumar"
IMAGE_NAME="stock-analysis"
REGISTRY="ghcr.io"
FULL_IMAGE_NAME="${REGISTRY}/${REPO_OWNER}/${IMAGE_NAME}"

# Get version tag from argument or use 'latest'
VERSION="${1:-latest}"
# Get description from second argument (optional)
DESCRIPTION="${2:-Stock Analysis Tool}"

echo "🐳 Stock Analysis - Multi-Platform Docker Build and Push"
echo "========================================================="
echo "📦 Image: ${FULL_IMAGE_NAME}:${VERSION}"
echo "📝 Description: ${DESCRIPTION}"
echo "🏗️  Platforms: linux/amd64, linux/arm64"
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

# Setup buildx for multi-platform builds
echo ""
echo "🔧 Setting up Docker Buildx..."
BUILDER_NAME="multiarch-builder"

# Check if builder exists, create if not
if ! docker buildx inspect ${BUILDER_NAME} > /dev/null 2>&1; then
    echo "   Creating new buildx builder..."
    docker buildx create --name ${BUILDER_NAME} --driver docker-container --bootstrap
fi

# Use the builder
docker buildx use ${BUILDER_NAME}
echo "✅ Buildx ready"

# Build and push multi-platform image
echo ""
echo "🔨 Building and pushing multi-platform Docker image..."
docker buildx build \
    --platform linux/amd64,linux/arm64 \
    --tag ${FULL_IMAGE_NAME}:${VERSION} \
    --label "org.opencontainers.image.description=${DESCRIPTION}" \
    --label "org.opencontainers.image.version=${VERSION}" \
    --annotation "index:org.opencontainers.image.description=${DESCRIPTION}" \
    --annotation "index:org.opencontainers.image.version=${VERSION}" \
    --push \
    .

if [ $? -ne 0 ]; then
    echo "❌ Docker build failed"
    docker logout ${REGISTRY}
    exit 1
fi

echo "✅ Image built and pushed: ${FULL_IMAGE_NAME}:${VERSION}"

# Also tag as latest if a specific version was provided
if [ "${VERSION}" != "latest" ]; then
    echo "🏷️  Also pushing 'latest' tag..."
    docker buildx build \
        --platform linux/amd64,linux/arm64 \
        --tag ${FULL_IMAGE_NAME}:latest \
        --label "org.opencontainers.image.description=${DESCRIPTION}" \
        --label "org.opencontainers.image.version=${VERSION}" \
        --annotation "index:org.opencontainers.image.description=${DESCRIPTION}" \
        --annotation "index:org.opencontainers.image.version=${VERSION}" \
        --push \
        .
fi

echo ""
echo "✅ Successfully pushed to GitHub Container Registry!"

# Logout from registry for security
echo ""
echo "🔐 Logging out from ${REGISTRY}..."
docker logout ${REGISTRY}

echo ""
echo "🚀 Others can now run (on Windows, Mac, or Linux):"
echo "   docker pull ${FULL_IMAGE_NAME}:${VERSION}"
echo "   docker run -p 3000:3000 --env-file .env ${FULL_IMAGE_NAME}:${VERSION}"
echo ""
echo "📄 Or use docker-compose with:"
echo "   image: ${FULL_IMAGE_NAME}:${VERSION}"
