#!/bin/bash

# Build and Save Docker Image Script
# This creates a portable image that can run anywhere

set -e

echo "🏗️ Building and Saving Stock Analysis Docker Image"
echo "=================================================="
echo "📦 Creating portable image that can run anywhere..."
echo ""

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

# Navigate to nodejs-app directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
NODEJS_APP_DIR="$SCRIPT_DIR/nodejs-app"

if [ ! -d "$NODEJS_APP_DIR" ]; then
    echo "❌ Error: nodejs-app directory not found"
    exit 1
fi

cd "$NODEJS_APP_DIR"

# Build the Docker image
echo "🔨 Building Docker image..."
docker build -t stock-analysis:latest .

if [ $? -ne 0 ]; then
    echo "❌ Docker build failed!"
    exit 1
fi

# Save the image to a tar file
echo "💾 Saving image to stock-analysis.tar..."
docker save stock-analysis:latest -o stock-analysis.tar

# Move the tar file to the root directory
mv stock-analysis.tar "$SCRIPT_DIR/"

echo ""
echo "✅ Image built and saved successfully!"
echo "📁 Image saved as: $SCRIPT_DIR/stock-analysis.tar"
echo ""
echo "🚀 To run the image from anywhere:"
echo "   docker load -i stock-analysis.tar"
echo "   docker run -p 3000:3000 --env-file .env stock-analysis:latest"
echo ""
echo "💡 The image is now portable and can be shared/run on any machine!" 