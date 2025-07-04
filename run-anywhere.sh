#!/bin/bash

# Run Stock Analysis Tool from Anywhere
# This script loads and runs the pre-built Docker image

set -e

echo "🚀 Stock Analysis Tool - Run Anywhere"
echo "====================================="

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
IMAGE_TAR="$SCRIPT_DIR/stock-analysis.tar"

# Check if image tar file exists
if [ ! -f "$IMAGE_TAR" ]; then
    echo "❌ Image file not found: $IMAGE_TAR"
    echo ""
    echo "💡 To create the image, run:"
    echo "   ./build-and-save-image.sh"
    exit 1
fi

# Check if image is already loaded
if ! docker image inspect stock-analysis:latest &> /dev/null; then
    echo "📦 Loading Docker image..."
    docker load -i "$IMAGE_TAR"
    echo "✅ Image loaded successfully!"
else
    echo "✅ Image already loaded!"
fi

# Check for .env file
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
case "$1" in
    "start"|"")
        echo "🚀 Starting Stock Analysis Tool..."
        if [ -n "$ENV_FILE" ]; then
            docker run -p 3000:3000 --env-file "$ENV_FILE" stock-analysis:latest
        else
            docker run -p 3000:3000 stock-analysis:latest
        fi
        ;;
    "background"|"bg")
        echo "🚀 Starting Stock Analysis Tool in background..."
        if [ -n "$ENV_FILE" ]; then
            docker run -d -p 3000:3000 --env-file "$ENV_FILE" --name stock-analysis stock-analysis:latest
        else
            docker run -d -p 3000:3000 --name stock-analysis stock-analysis:latest
        fi
        echo "✅ Container started in background!"
        echo "🌐 Access at: http://localhost:3000"
        echo "📋 View logs: $0 logs"
        echo "🛑 Stop: $0 stop"
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
        $0 stop
        $0 background
        ;;
    *)
        echo "Usage: $0 [command]"
        echo ""
        echo "Commands:"
        echo "  start     - Start the application (foreground)"
        echo "  background- Start the application (background)"
        echo "  stop      - Stop the application"
        echo "  logs      - Show application logs"
        echo "  status    - Show container status"
        echo "  restart   - Restart the application"
        echo ""
        echo "Examples:"
        echo "  $0 start"
        echo "  $0 background"
        echo "  $0 logs"
        echo ""
        echo "🌐 Access the application at: http://localhost:3000"
        ;;
esac 