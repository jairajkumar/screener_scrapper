#!/bin/bash

# Convenience script to run Docker commands from any directory

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
NODEJS_APP_DIR="$SCRIPT_DIR/nodejs-app"

# Check if nodejs-app directory exists
if [ ! -d "$NODEJS_APP_DIR" ]; then
    echo "❌ Error: nodejs-app directory not found at $NODEJS_APP_DIR"
    exit 1
fi

# Change to the nodejs-app directory
cd "$NODEJS_APP_DIR"

# Parse command line arguments
case "$1" in
    "build")
        echo "🔨 Building Docker image..."
        ./build-docker.sh
        ;;
    "build-quick")
        echo "⚡ Quick building Docker image..."
        ./build-docker-quick.sh
        ;;
    "up")
        echo "🚀 Starting Docker Compose..."
        docker compose up
        ;;
    "up-d")
        echo "🚀 Starting Docker Compose in background..."
        docker compose up -d
        ;;
    "down")
        echo "🛑 Stopping Docker Compose..."
        docker compose down
        ;;
    "logs")
        echo "📋 Showing Docker Compose logs..."
        docker compose logs -f
        ;;
    "test")
        echo "🧪 Testing Docker container..."
        ./test-docker.sh
        ;;
    "run")
        echo "🏃 Running Docker container..."
        docker run -p 3000:3000 --env-file .env stock-analysis:latest
        ;;
    *)
        echo "🐳 Stock Analysis Tool Docker Helper"
        echo "===================================="
        echo ""
        echo "Usage: $0 [command]"
        echo ""
        echo "Commands:"
        echo "  build      - Build Docker image (optimized)"
        echo "  build-quick- Build Docker image (quick)"
        echo "  up         - Start with docker-compose"
        echo "  up-d       - Start with docker-compose (background)"
        echo "  down       - Stop docker-compose"
        echo "  logs       - Show docker-compose logs"
        echo "  test       - Test Docker container"
        echo "  run        - Run Docker container directly"
        echo ""
        echo "Examples:"
        echo "  $0 build"
        echo "  $0 up-d"
        echo "  $0 logs"
        ;;
esac 