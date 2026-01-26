#!/bin/bash

# Pull and Run Stock Analysis Tool from GitHub Container Registry
# This script works on Windows, Mac, and Linux

set -e

echo "🚀 Stock Analysis Tool - Pull and Run"
echo "====================================="

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    echo ""
    echo "Installation guides:"
    echo "  Windows: https://docs.docker.com/desktop/install/windows/"
    echo "  Mac: https://docs.docker.com/desktop/install/mac/"
    echo "  Linux: https://docs.docker.com/engine/install/"
    exit 1
fi

# Get GitHub username from command line or prompt
if [ -z "$1" ]; then
    echo "Enter your GitHub username:"
    read -r GITHUB_USERNAME
else
    GITHUB_USERNAME="$1"
fi

IMAGE_NAME="ghcr.io/$GITHUB_USERNAME/stock-analysis"
TAG="latest"

echo "🔧 Configuration:"
echo "  GitHub Username: $GITHUB_USERNAME"
echo "  Image: $IMAGE_NAME:$TAG"
echo ""

# Check if image is already pulled
if docker image inspect "$IMAGE_NAME:$TAG" &> /dev/null; then
    echo "✅ Image already available locally!"
else
    echo "📥 Pulling image from GitHub Container Registry..."
    docker pull "$IMAGE_NAME:$TAG"
    
    if [ $? -ne 0 ]; then
        echo "❌ Failed to pull image!"
        echo ""
        echo "Possible issues:"
        echo "  1. Image doesn't exist: https://ghcr.io/$GITHUB_USERNAME/stock-analysis"
        echo "  2. Image is private and you need to login"
        echo "  3. Network connectivity issues"
        echo ""
        echo "To login to GitHub Container Registry:"
        echo "  echo \$GITHUB_TOKEN | docker login ghcr.io -u $GITHUB_USERNAME --password-stdin"
        exit 1
    fi
    
    echo "✅ Image pulled successfully!"
fi

# Check for .env file
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="$SCRIPT_DIR/nodejs-app/.env"

if [ ! -f "$ENV_FILE" ]; then
    echo "⚠️  Warning: .env file not found!"
    echo "   Some features may not work without proper credentials."
    echo "   Create .env file in nodejs-app directory with your credentials."
    echo ""
    read -p "Continue without .env file? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
    ENV_FILE=""
fi

# Parse command line arguments
case "$2" in
    "start"|"")
        echo "🚀 Starting Stock Analysis Tool..."
        if [ -n "$ENV_FILE" ]; then
            docker run -p 3000:3000 --env-file "$ENV_FILE" "$IMAGE_NAME:$TAG"
        else
            docker run -p 3000:3000 "$IMAGE_NAME:$TAG"
        fi
        ;;
    "background"|"bg")
        echo "🚀 Starting Stock Analysis Tool in background..."
        if [ -n "$ENV_FILE" ]; then
            docker run -d -p 3000:3000 --env-file "$ENV_FILE" --name stock-analysis "$IMAGE_NAME:$TAG"
        else
            docker run -d -p 3000:3000 --name stock-analysis "$IMAGE_NAME:$TAG"
        fi
        echo "✅ Container started in background!"
        echo "🌐 Access at: http://localhost:3000"
        echo "📋 View logs: $0 $GITHUB_USERNAME logs"
        echo "🛑 Stop: $0 $GITHUB_USERNAME stop"
        ;;
    "stop")
        echo "🛑 Stopping Stock Analysis Tool..."
        docker stop stock-analysis 2>/dev/null || echo "Container not running"
        docker rm stock-analysis 2>/dev/null || echo "Container not found"
        echo "✅ Stopped!"
        ;;
    "logs")
        echo "📋 Showing logs..."
        docker logs -f stock-analysis
        ;;
    "status")
        echo "📊 Container status:"
        docker ps -a --filter name=stock-analysis
        ;;
    "restart")
        echo "🔄 Restarting Stock Analysis Tool..."
        $0 "$GITHUB_USERNAME" stop
        $0 "$GITHUB_USERNAME" background
        ;;
    "update")
        echo "🔄 Updating image..."
        docker pull "$IMAGE_NAME:$TAG"
        echo "✅ Image updated!"
        ;;
    *)
        echo "Usage: $0 <github-username> [command]"
        echo ""
        echo "Commands:"
        echo "  start     - Start the application (foreground)"
        echo "  background- Start the application (background)"
        echo "  stop      - Stop the application"
        echo "  logs      - Show application logs"
        echo "  status    - Show container status"
        echo "  restart   - Restart the application"
        echo "  update    - Update the image from GitHub"
        echo ""
        echo "Examples:"
        echo "  $0 johndoe start"
        echo "  $0 johndoe background"
        echo "  $0 johndoe logs"
        echo ""
        echo "🌐 Access the application at: http://localhost:3000"
        echo "📦 Image: https://ghcr.io/$GITHUB_USERNAME/stock-analysis"
        ;;
esac 