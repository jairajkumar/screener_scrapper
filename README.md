# 📈 Stock Analysis Tool

A comprehensive stock analysis tool for Indian stocks that automatically fetches data from Screener.in, applies investment criteria, and provides AI-powered insights using Google's Gemini.

## 🎯 Features

- **Automated Data Fetching**: Scrapes financial data from Screener.in using Puppeteer
- **Investment Criteria Analysis**: Applies your specific investment criteria
- **AI-Powered Insights**: Uses Gemini AI for additional analysis and recommendations
- **Simple Verdict**: Clear BUY/HOLD/NA recommendations
- **Web Interface**: Modern web-based interface for easy analysis
- **Login Support**: Authenticated access to additional financial data

## 📊 Investment Criteria

The tool analyzes stocks based on these criteria:

- **ROE** > 15%
- **P/E Ratio** < 20
- **Debt-to-Equity** < 0.5
- **ROCE** > 15%
- **Cash Flow** Positive
- **EPS Growth** 10-15%
- **PEG** < 1
- **Intrinsic Value** = 22.5 × EPS × BV

## 🌐 GitHub Container Registry (Recommended)

For the best cross-platform experience, use GitHub Container Registry (GHCR) to distribute your Docker image. This allows anyone to pull and run your application on Windows, Mac, or Linux with a single command.

### 🚀 Quick Start

#### For Developers (Build and Push)

```bash
# 1. Setup GitHub Container Registry (one-time)
# Follow the guide: ./setup-github-registry.md

# 2. Build and push to GitHub
./build-and-push.sh YOUR_GITHUB_USERNAME
```

#### For Users (Pull and Run)

**Linux/Mac:**
```bash
./pull-and-run.sh YOUR_GITHUB_USERNAME start
```

**Windows:**
```cmd
pull-and-run.bat YOUR_GITHUB_USERNAME start
```

### 📋 Complete Workflow

#### Step 1: Setup GitHub Container Registry

1. **Create Personal Access Token:**
   - Go to [GitHub Settings > Tokens](https://github.com/settings/tokens)
   - Generate token with `write:packages` and `read:packages` scopes

2. **Login to GHCR:**
   ```bash
   echo YOUR_TOKEN | docker login ghcr.io -u YOUR_USERNAME --password-stdin
   ```

3. **Build and Push:**
   ```bash
   ./build-and-push.sh YOUR_USERNAME
   ```

#### Step 2: Share with Users

Just share your GitHub username! Users can run:

```bash
# Linux/Mac
./pull-and-run.sh YOUR_USERNAME start

# Windows
pull-and-run.bat YOUR_USERNAME start
```

### 🎯 Benefits

- ✅ **Cross-platform**: Works on Windows, Mac, Linux
- ✅ **Zero build time**: Users just pull and run
- ✅ **Version control**: Images are tracked and versioned
- ✅ **Easy sharing**: Just share your GitHub username
- ✅ **Free hosting**: GitHub provides free container registry
- ✅ **Automatic updates**: Users can pull latest version anytime
- ✅ **Security**: Private images supported

### 🔧 Advanced Usage

```bash
# Run in background
./pull-and-run.sh YOUR_USERNAME background

# View logs
./pull-and-run.sh YOUR_USERNAME logs

# Stop application
./pull-and-run.sh YOUR_USERNAME stop

# Update to latest version
./pull-and-run.sh YOUR_USERNAME update
```

### 📦 Image URLs

Your image will be available at:
- **Registry**: `ghcr.io/YOUR_USERNAME/stock-analysis`
- **Web URL**: `https://ghcr.io/YOUR_USERNAME/stock-analysis`

## 🚀 Portable Docker Image (Run Anywhere)

For the ultimate portability, you can create a pre-built Docker image that runs instantly from anywhere without any build process.

### Step 1: Build Once, Use Everywhere

```bash
# Build and save the image (do this once)
./build-and-save-image.sh
```

This creates `stock-analysis.tar` - a portable image file (~500MB) that contains everything needed.

### Step 2: Run from Any Directory

```bash
# Simple start
./start.sh

# Or use the full control script
./run-anywhere.sh start          # Start in foreground
./run-anywhere.sh background     # Start in background
./run-anywhere.sh stop           # Stop the application
./run-anywhere.sh logs           # View logs
./run-anywhere.sh status         # Check status
./run-anywhere.sh restart        # Restart the application
```

### Step 3: Share and Deploy

The `stock-analysis.tar` file can be:
- **Shared** with team members
- **Copied** to any machine
- **Deployed** to servers
- **Run** without internet connection

### Quick Commands

```bash
# Load and run in one command
docker load -i stock-analysis.tar && docker run -p 3000:3000 stock-analysis:latest

# Run with environment variables
docker load -i stock-analysis.tar && docker run -p 3000:3000 --env-file .env stock-analysis:latest
```

### Benefits

- ✅ **Zero build time** - Runs instantly
- ✅ **No dependencies** - Everything included
- ✅ **Portable** - Works on any machine with Docker
- ✅ **Offline capable** - No internet needed to run
- ✅ **Consistent** - Same image everywhere

## 🚀 Docker Deployment

The application can be deployed using Docker for consistent operation across Windows, Mac, and Linux.

### Quick Start with Docker

1. **Build the Docker image:**
   ```bash
   # Using the build script (recommended)
   ./build-docker.sh
   
   # Or manually
   docker build -t stock-analysis:latest .
   ```

2. **Run with Docker:**
   ```bash
   # Simple run
   docker run -p 3000:3000 --env-file .env stock-analysis:latest
   
   # Or with docker-compose (recommended)
   docker-compose up -d
   ```

3. **Access the application:**
   - Web Interface: http://localhost:3000
   - API Health Check: http://localhost:3000/api/health

### Docker Features

- **Self-contained**: Includes Puppeteer's Chrome installation (~170MB)
- **Cross-platform**: Works on Windows, Mac, and Linux
- **Security**: Runs as non-root user
- **Health checks**: Automatic health monitoring
- **Volume mounts**: Screenshots and cookies persist across restarts
- **Environment variables**: Full support for .env configuration

### Docker Commands

```bash
# Build image
docker build -t stock-analysis:latest .

# Run container
docker run -p 3000:3000 --env-file .env stock-analysis:latest

# Run in background
docker run -d -p 3000:3000 --env-file .env --name stock-analysis stock-analysis:latest

# View logs
docker logs stock-analysis

# Stop container
docker stop stock-analysis

# Remove container
docker rm stock-analysis

# Using docker-compose
docker-compose up -d          # Start in background
docker-compose down           # Stop and remove
docker-compose logs -f        # View logs
```

### Docker Compose

The `docker-compose.yml` file provides easy deployment with:
- Automatic restart on failure
- Volume mounts for screenshots and cookies
- Health checks
- Environment variable support

```bash
# Start the application
docker-compose up -d

# View logs
docker-compose logs -f

# Stop the application
docker-compose down
```

### Environment Variables in Docker

Create a `.env` file in the `nodejs-app` directory:

```bash
# Required for full functionality
SCREENER_EMAIL=your_email@example.com
SCREENER_PASSWORD=your_password_here

# Optional for AI insights
GEMINI_API_KEY=your_gemini_api_key_here

# Optional server configuration
PORT=3000
NODE_ENV=production
```

### Troubleshooting Docker

1. **Build fails**: Ensure you have sufficient disk space (~500MB)
2. **Chrome issues**: The image includes all necessary dependencies
3. **Permission errors**: The container runs as non-root user
4. **Port conflicts**: Change the port mapping in docker-compose.yml
5. **Environment variables**: Ensure .env file is in the correct location

## 🚀 Quick Start

### 1. Installation

```bash
# Clone the repository
git clone <repository-url>
cd companyAnalysis/nodejs-app

# Install dependencies
npm install
```

### 2. Setup Environment Variables

For AI insights and login functionality, you'll need to configure environment variables:

1. Copy the example environment file:
```bash
cp .env.example .env
```

2. Edit the `.env` file and add your credentials:
```bash
# Screener.in Login Credentials (Required for full data access)
SCREENER_EMAIL=your_email@example.com
SCREENER_PASSWORD=your_password_here

# Google Gemini AI API Key (Optional - for AI insights)
GEMINI_API_KEY=your_gemini_api_key_here

# Server Configuration (Optional - defaults provided)
PORT=3000
NODE_ENV=development
```

**Important Notes:**
- **Screener.in Credentials**: Required for accessing additional financial data fields
- **Gemini API Key**: Optional but recommended for AI-powered insights
- **Investment Criteria**: Can be customized via environment variables (see `.env.example` for all options)

### 3. Usage

#### Web Interface (Recommended)

```bash
# Start the web server
npm start

# Or for development with auto-restart
npm run dev
```

Then open your browser to `http://localhost:3000`

#### Command Line Interface

```bash
# Test environment variable configuration
npm run test-env

# Analyze a specific stock
npm run analyze "TCS"

# Or directly
node index.js "TCS"
```

## 📁 Project Structure

```
nodejs-app/
├── server.js              # Express web server
├── index.js               # Command-line interface
├── fetchData.js           # Web scraping from Screener.in
├── analyzeStock.js        # Investment criteria analysis
├── aiInsights.js          # Gemini AI integration
├── config.js              # Configuration and settings
├── package.json           # Node.js dependencies
├── public/                # Web interface files
│   ├── index.html         # Main web page
│   └── script.js          # Frontend JavaScript
├── screenshots/           # Debug screenshots (auto-created)
└── README.md             # Node.js app documentation
```

## 🔧 How It Works

1. **Data Fetching**: Uses Puppeteer to scrape financial data from Screener.in
2. **Login Support**: Authenticates with Screener.in for access to additional data
3. **Analysis**: Applies your investment criteria to calculate a score
4. **Verdict**: Provides BUY/HOLD/NA recommendation based on score
5. **AI Insights**: Uses Gemini to provide additional analysis and recommendations

## 💡 Example Usage

### Web Interface
1. Start the server: `npm start`
2. Open `http://localhost:3000`
3. Enter a stock name (e.g., "TCS", "RELIANCE")
4. Click "Analyze Stock"
5. View results with detailed analysis and AI insights

### Command Line
```bash
$ npm run analyze "TCS"

🔍 Analyzing TCS...
Fetching data from screener.in...
✅ Data fetched successfully!
📊 Stock URL: https://www.screener.in/company/TCS/

📈 Analyzing financial metrics...

==================================================
📋 ANALYSIS RESULTS FOR TCS
==================================================
🎯 VERDICT: BUY
📊 Score: 7/8 (87.5%)
💡 Reason: Stock meets 7/8 criteria (87.5%)

📊 DETAILED ANALYSIS:
  ✅ ROE: 45.2 (Target: 15)
  ✅ P/E RATIO: 18.5 (Target: 20)
  ✅ DEBT TO EQUITY: 0.1 (Target: 0.5)
  ✅ ROCE: 52.3 (Target: 15)
  ✅ CASH FLOW: 12500 (Target: 0)
  ✅ EPS GROWTH: 12.5 (Target: 10-15%)
  ✅ PEG: 0.8 (Target: 1)
  📊 INTRINSIC VALUE: 1250.50 (22.5 × EPS × BV)

🤖 AI INSIGHTS:
💭 Insights: TCS shows strong financial fundamentals with excellent ROE and ROCE...
```

## ⚠️ Important Notes

- **Data Source**: All financial data is sourced from Screener.in
- **AI Features**: Require a valid Gemini API key
- **Web Scraping**: Uses Puppeteer with anti-bot evasion techniques
- **Login Required**: Some data fields require Screener.in login
- **Investment Advice**: This tool is for educational purposes only

## 🛠️ Troubleshooting

### Common Issues

1. **Missing Credentials**: Check your `.env` file and ensure `SCREENER_EMAIL` and `SCREENER_PASSWORD` are set
2. **Connection Errors**: The app includes anti-bot evasion techniques
3. **Login Failures**: Check screenshots in the `screenshots/` folder for debugging
4. **API Key Errors**: Check your `.env` file and API key validity
5. **Data Fetching Errors**: Try different stock names or check internet connection
6. **Environment Variables**: Ensure `.env` file is in the `nodejs-app` directory and properly formatted

### Dependencies

- Node.js 16+
- Chrome browser (for Puppeteer)
- Internet connection

## 🔍 Debug Features

- **Credential Validation**: Automatic checking for required environment variables
- **Screenshots**: Automatically saves screenshots to `screenshots/` folder for debugging
- **Login Status**: Verifies login success and provides detailed error messages
- **Network Logs**: Detailed logging for troubleshooting connection issues
- **Environment Variables**: Validates configuration on startup with helpful error messages

## 🤝 Contributing

Feel free to submit issues and enhancement requests!

## 📄 License

This project is for educational purposes. Please use responsibly.

## ⚖️ Disclaimer

This tool is for educational and informational purposes only. It does not constitute investment advice. Always do your own research and consult with financial advisors before making investment decisions. 