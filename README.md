# 📈 Stock Analysis Tool

A comprehensive stock analysis tool for Indian stocks that automatically fetches data from Screener.in, applies investment criteria, and provides AI-powered insights using Google's Gemini.

## 🎯 Features

- **Automated Data Fetching**: Scrapes financial data from Screener.in
- **Investment Criteria Analysis**: Applies your specific investment criteria
- **AI-Powered Insights**: Uses Gemini AI for additional analysis and recommendations
- **Simple Verdict**: Clear BUY/HOLD/NA recommendations
- **Multiple Interfaces**: Command-line and web interface options

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
cd companyAnalysis

# Install dependencies
pip install -r requirements.txt
```

### 2. Setup API Key (Optional)

For AI insights, you'll need a Gemini API key:

1. Get your API key from [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a `.env` file in the project root:
```bash
cp env_example.txt .env
```
3. Add your API key to the `.env` file:
```
GEMINI_API_KEY=your_actual_api_key_here
```

### 3. Usage

#### Command Line Interface

```bash
# Analyze a specific stock
python main.py TCS

# Interactive mode
python main.py
```

#### Web Interface

```bash
# Start the Streamlit web app
streamlit run web_app.py
```

Then open your browser to `http://localhost:8501`

## 📁 Project Structure

```
companyAnalysis/
├── main.py              # Command-line interface
├── web_app.py           # Streamlit web interface
├── data_fetcher.py      # Web scraping from Screener.in
├── stock_analyzer.py    # Investment criteria analysis
├── ai_advisor.py        # Gemini AI integration
├── config.py            # Configuration and settings
├── requirements.txt     # Python dependencies
├── env_example.txt      # Environment variables example
└── README.md           # This file
```

## 🔧 How It Works

1. **Data Fetching**: Uses Selenium to scrape financial data from Screener.in
2. **Analysis**: Applies your investment criteria to calculate a score
3. **Verdict**: Provides BUY/HOLD/NA recommendation based on score
4. **AI Insights**: Uses Gemini to provide additional analysis and recommendations

## 💡 Example Usage

```bash
$ python main.py TCS

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
- **Web Scraping**: May be affected by website changes
- **Investment Advice**: This tool is for educational purposes only

## 🛠️ Troubleshooting

### Common Issues

1. **Chrome Driver Issues**: The tool automatically downloads ChromeDriver
2. **API Key Errors**: Check your `.env` file and API key validity
3. **Data Fetching Errors**: Try different stock names or check internet connection

### Dependencies

- Python 3.8+
- Chrome browser (for Selenium)
- Internet connection

## 🤝 Contributing

Feel free to submit issues and enhancement requests!

## 📄 License

This project is for educational purposes. Please use responsibly.

## ⚖️ Disclaimer

This tool is for educational and informational purposes only. It does not constitute investment advice. Always do your own research and consult with financial advisors before making investment decisions. 