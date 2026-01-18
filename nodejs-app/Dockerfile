# Use Node.js 18 Debian slim as base image (better for Puppeteer)
FROM node:18-slim

# Install Chromium and dependencies required for Puppeteer in headless mode
RUN apt-get update \
  && apt-get install -y \
  chromium \
  ca-certificates \
  fonts-liberation \
  libasound2 \
  libatk-bridge2.0-0 \
  libgtk-3-0 \
  libnspr4 \
  libnss3 \
  libxcomposite1 \
  libxdamage1 \
  libxrandr2 \
  libxss1 \
  libxtst6 \
  xdg-utils \
  --no-install-recommends \
  && rm -rf /var/lib/apt/lists/*

# Set Chromium path for puppeteer-core
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

# Create app directory
WORKDIR /usr/src/app

# Copy package files first for better caching
COPY package*.json ./

# Install dependencies (faster than npm ci)
RUN npm install --production

# Copy app source
COPY . .

# Create screenshots directory
RUN mkdir -p screenshots

# Create non-root user for security
RUN groupadd -r nodejs && useradd -r -g nodejs -G audio,video nodejs

# Change ownership of the app directory
RUN chown -R nodejs:nodejs /usr/src/app

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Start the application
CMD ["node", "src/server.js"] 