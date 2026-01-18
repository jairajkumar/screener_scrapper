# Docker Documentation

## Overview

The application is containerized using Docker and published to GitHub Container Registry (ghcr.io).

---

## Image Details

| Property | Value |
|----------|-------|
| Registry | `ghcr.io` |
| Image | `ghcr.io/jairajkumar/stock-analysis` |
| Base Image | `node:18-slim` |
| Exposed Port | 3000 |

---

## Quick Start

### Pull and Run

```bash
# Pull the pre-built image
docker pull ghcr.io/jairajkumar/stock-analysis:latest

# Create .env file
cp .env.example .env
# Edit .env with your credentials

# Run the container
docker run -p 3000:3000 --env-file .env ghcr.io/jairajkumar/stock-analysis:latest
```

### Using Docker Compose

```bash
# Start
docker compose up -d

# View logs
docker logs stock-analysis-app -f

# Stop
docker compose down
```

---

## Dockerfile Explained

```dockerfile
# Base image with Node.js 18 (Debian slim)
FROM node:18-slim

# Install Chromium and Puppeteer dependencies
RUN apt-get update \
    && apt-get install -y \
    chromium \
    ca-certificates \
    fonts-liberation \
    libasound2 \
    ...

# Set Puppeteer to use system Chromium
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

# Create app directory
WORKDIR /usr/src/app

# Install dependencies
COPY package*.json ./
RUN npm install --production

# Copy source code
COPY . .

# Create screenshots directory
RUN mkdir -p screenshots

# Create non-root user for security
RUN groupadd -r nodejs && useradd -r -g nodejs -G audio,video nodejs
RUN chown -R nodejs:nodejs /usr/src/app
USER nodejs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/health', ...)"

# Start application
CMD ["node", "src/server.js"]
```

### Key Design Decisions

| Feature | Reason |
|---------|--------|
| `node:18-slim` | Smaller image, Debian-based for apt-get |
| System Chromium | More reliable than Puppeteer's bundled Chrome |
| Non-root user | Security best practice |
| Health check | Container orchestration support |

---

## docker-compose.yml Explained

```yaml
services:
  stock-analysis:
    image: ghcr.io/jairajkumar/stock-analysis:latest
    # Uncomment to build locally:
    # build: .
    container_name: stock-analysis-app
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - PORT=3000
    env_file:
      - .env
    volumes:
      - ./screenshots:/usr/src/app/screenshots
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "node", "-e", "..."]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
```

### Volume Mounts

| Host Path | Container Path | Purpose |
|-----------|----------------|---------|
| `./screenshots` | `/usr/src/app/screenshots` | Persist debug screenshots |

---

## Environment Variables

Create a `.env` file with these variables:

```bash
# Required
SCREENER_EMAIL=your-email@example.com
SCREENER_PASSWORD=your-password
GEMINI_API_KEY=your-gemini-key

# Optional
PORT=3000
NODE_ENV=production

# Investment Criteria (Optional)
ROE_MIN=15
PE_MAX=20
DEBT_TO_EQUITY_MAX=0.5
ROCE_MIN=15
EPS_GROWTH_MIN=10
EPS_GROWTH_MAX=15
PEG_MAX=1
```

---

## Build & Push Script

### Location
`scripts/build-and-push.sh`

### Usage
```bash
./scripts/build-and-push.sh           # Build and push as 'latest'
./scripts/build-and-push.sh v1.0.0    # Build and push with version tag
```

### What It Does
1. Extracts GitHub token from git remote URL
2. Logs in to ghcr.io
3. Builds Docker image
4. Pushes to registry
5. Logs out from registry

### Making Images Public
After pushing, go to:
```
https://github.com/users/YOUR_USERNAME/packages/container/stock-analysis/settings
```
Change visibility to **Public**.

---

## Commands Reference

### Build

```bash
# Build with default tag
docker build -t stock-analysis:latest .

# Build with specific tag
docker build -t stock-analysis:v1.0.0 .

# Build with no cache
docker build --no-cache -t stock-analysis:latest .
```

### Run

```bash
# Basic run
docker run -p 3000:3000 --env-file .env stock-analysis:latest

# Run in background
docker run -d -p 3000:3000 --env-file .env stock-analysis:latest

# Run with name
docker run -d --name stock-app -p 3000:3000 --env-file .env stock-analysis:latest
```

### Manage

```bash
# View running containers
docker ps

# View logs
docker logs stock-analysis-app
docker logs -f stock-analysis-app  # Follow logs

# Stop container
docker stop stock-analysis-app

# Remove container
docker rm stock-analysis-app

# List images
docker images | grep stock-analysis

# Remove image
docker rmi ghcr.io/jairajkumar/stock-analysis:latest
```

### Registry

```bash
# Login to ghcr.io
echo "TOKEN" | docker login ghcr.io -u USERNAME --password-stdin

# Pull image
docker pull ghcr.io/jairajkumar/stock-analysis:latest

# Push image
docker push ghcr.io/jairajkumar/stock-analysis:latest

# Logout
docker logout ghcr.io
```

---

## Troubleshooting

### Container won't start

1. Check if port 3000 is in use:
   ```bash
   lsof -i :3000
   ```

2. Check logs:
   ```bash
   docker logs stock-analysis-app
   ```

3. Verify .env file exists and has correct values

### Puppeteer/Chrome issues

The container uses system Chromium (`/usr/bin/chromium`). If you see Chrome-related errors:

1. Verify Chromium is installed in the image
2. Check `PUPPETEER_EXECUTABLE_PATH` is set correctly
3. Ensure the container has enough memory (>512MB)

### Permission denied errors

The container runs as non-root user `nodejs`. Ensure:
- Screenshots directory is writable
- Cookie file can be created

---

## Files

| File | Purpose |
|------|---------|
| `Dockerfile` | Container build instructions |
| `docker-compose.yml` | Multi-container orchestration |
| `.dockerignore` | Files to exclude from build |
| `scripts/build-and-push.sh` | Build and push script |
| `.env.example` | Environment variable template |

---

## .dockerignore

```
node_modules
.git
.env
.env.local
*.log
*.md
screenshots/
.vscode/
.idea/
```
