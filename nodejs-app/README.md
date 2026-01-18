# Node.js Stock Analysis Tool

A stock analysis tool that scrapes Screener.in using Puppeteer, analyzes stocks based on investment criteria, and uses Gemini AI for insights.

## Quick Start with Docker 🐳

### Option 1: Pull Pre-built Image (Recommended)

```bash
# Pull the image from GitHub Container Registry
docker pull ghcr.io/jairajkumar/stock-analysis:latest

# Create your .env file
cp .env.example .env  # Edit with your credentials

# Run the container
docker run -p 3000:3000 --env-file .env ghcr.io/jairajkumar/stock-analysis:latest
```

### Option 2: Build Locally

```bash
cd nodejs-app
cp .env.example .env    # Edit with your credentials
docker compose up -d
```

Access at: **http://localhost:3000**

# View logs
docker logs stock-analysis-app -f

# Stop the container
docker compose down
```

## Local Development Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Copy `.env.example` to `.env` and add your credentials.

3. Run the server:
   ```bash
   npm start       # Production
   npm run dev     # Development with auto-reload
   ```

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/health` | GET | Health check |
| `/api/search?query=COMPANY` | GET | Search companies |
| `/api/analyze/:companyName` | GET | Analyze stock |
| `/api/analyze` | POST | Analyze stock with body |

## Features

- Scrapes Screener.in using Puppeteer
- Analyzes stock based on investment criteria
- Uses Gemini AI for insights
- Web UI at http://localhost:3000

## For Maintainers: Push New Versions

```bash
./build-and-push.sh           # Push with 'latest' tag
./build-and-push.sh v1.0.0    # Push with version tag
```