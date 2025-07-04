#!/bin/bash

# Simple one-liner to start Stock Analysis Tool
# Usage: ./start.sh

# Load image if not already loaded
if ! docker image inspect stock-analysis:latest &> /dev/null; then
    echo "📦 Loading Docker image..."
    docker load -i stock-analysis.tar
fi

# Start the application
echo "🚀 Starting Stock Analysis Tool..."
docker run -p 3000:3000 --env-file nodejs-app/.env stock-analysis:latest 