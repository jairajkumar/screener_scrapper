# Docker Documentation

## Overview

The application is containerized using Docker and published to GitHub Container Registry (ghcr.io). Multi-platform images are built for both AMD64 (Windows/Linux) and ARM64 (Mac M1/M2).

---

## Image Details

| Property | Value |
|----------|-------|
| Registry | `ghcr.io` |
| Image | `ghcr.io/jairajkumar/stock-analysis` |
| Base Image | `node:18-bookworm` |
| Exposed Port | 3000 |
| Platforms | `linux/amd64`, `linux/arm64` |

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
# Base image - Bookworm for better Chromium support
FROM node:18-bookworm

# Install Chromium and all dependencies
RUN apt-get update \
    && apt-get install -y \
    chromium \
    ca-certificates \
    fonts-liberation \
    fonts-noto-color-emoji \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libcups2 \
    libdbus-1-3 \
    libdrm2 \
    libgbm1 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libx11-xcb1 \
    libxcomposite1 \
    libxdamage1 \
    libxfixes3 \
    libxrandr2 \
    libxss1 \
    libxtst6 \
    xdg-utils \
    dbus \
    --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

# Set Puppeteer to use system Chromium
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium
ENV CHROME_PATH=/usr/bin/chromium

# Create app directory
WORKDIR /usr/src/app

# Install dependencies
COPY package*.json ./
RUN npm install --production

# Copy source code
COPY . .

# Create necessary directories
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
| `node:18-bookworm` | Full Debian with better library support for Chromium |
| System Chromium | More reliable than Puppeteer's bundled Chrome |
| Crashpad disabled | Flags in scraper.js prevent `chrome_crashpad_handler` errors |
| Non-root user | Security best practice |
| Multi-platform | Works on both AMD64 (Windows/Linux) and ARM64 (Mac) |

---

## Chromium Configuration

The scraper uses these flags to ensure Chromium runs correctly in Docker:

```javascript
const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: '/usr/bin/chromium',
    dumpio: true,
    handleSIGINT: false,
    handleSIGTERM: false,
    handleSIGHUP: false,
    args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--no-first-run',
        '--no-zygote',
        '--single-process',
        '--disable-extensions',
        '--disable-breakpad',           // Prevents crashpad errors
        '--disable-crash-reporter',      // Prevents crashpad errors
        '--disable-features=Crashpad'    // Prevents crashpad errors
    ]
});
```

---

## docker-compose.yml

```yaml
services:
  stock-analysis:
    image: ghcr.io/jairajkumar/stock-analysis:latest
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
      test: ["CMD", "node", "-e", "require('http').get('http://localhost:3000/api/health', ...)"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
```

---

## Environment Variables

```bash
# Optional - For authenticated Screener.in access
SCREENER_EMAIL=your-email@example.com
SCREENER_PASSWORD=your-password

# Optional - For AI insights
GEMINI_API_KEY=your-gemini-key

# Optional
PORT=3000
NODE_ENV=production
```

---

## Multi-Platform Build

The build script uses `docker buildx` to create images for both platforms:

```bash
./scripts/build-and-push.sh           # Build and push as 'latest'
./scripts/build-and-push.sh v1.0.0    # Build and push with version tag
```

### Build Steps
1. Creates/uses `multiplatform` buildx builder
2. Builds for `linux/amd64` and `linux/arm64`
3. Pushes to ghcr.io with platform manifest

---

## Troubleshooting

### `chrome_crashpad_handler: --database is required`

This error was fixed by:
1. Switching from `node:18-slim` to `node:18-bookworm`
2. Adding crashpad-disabling flags in `scraper.js`

### Container won't start

1. Check if port 3000 is in use:
   ```bash
   lsof -i :3000
   ```

2. Check logs:
   ```bash
   docker logs stock-analysis-app
   ```

### Permission denied errors

The container runs as non-root user `nodejs`. Ensure:
- Screenshots directory is writable
- Volume mounts have correct permissions

---

## Files Reference

| File | Purpose |
|------|---------|
| `Dockerfile` | Container build instructions |
| `docker-compose.yml` | Multi-container orchestration |
| `.dockerignore` | Files to exclude from build |
| `scripts/build-and-push.sh` | Multi-platform build script |
| `.env.example` | Environment variable template |
