import os
from dotenv import load_dotenv

load_dotenv()

# API Configuration
GEMINI_API_KEY = os.getenv('GEMINI_API_KEY')

# Screener.in Configuration
SCREENER_BASE_URL = "https://www.screener.in"
SCREENER_SEARCH_URL = "https://www.screener.in/search/"

# Stock Analysis Criteria
STOCK_CRITERIA = {
    'roe_min': 15,
    'pe_max': 20,
    'debt_to_equity_max': 0.5,
    'roce_min': 15,
    'eps_growth_min': 10,
    'eps_growth_max': 15,
    'peg_max': 1,
    'intrinsic_value_multiplier': 22.5
}

# User Agent for web scraping
USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36" 