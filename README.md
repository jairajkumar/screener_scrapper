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