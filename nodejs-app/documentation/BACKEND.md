# Backend Documentation

## Overview

The backend is a Node.js/Express API server that scrapes stock data from Screener.in, analyzes it based on investment criteria, and generates AI-powered insights using Google Gemini.

## Technology Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| Node.js | 18+ | Runtime |
| Express | 4.18 | Web framework |
| Puppeteer-core | 23.x | Web scraping |
| @google/generative-ai | 0.2 | Gemini AI |
| dotenv | 16.3 | Environment variables |
| cors | 2.8 | Cross-origin requests |
| node-fetch | 2.7 | HTTP client |

---

## Directory Structure

```
nodejs-app/
├── src/
│   ├── server.js              # Entry point
│   ├── services/
│   │   ├── scraper.js         # Puppeteer scraping
│   │   ├── analyzer.js        # Stock analysis
│   │   └── aiService.js       # Gemini AI
│   ├── routes/
│   │   └── api.js             # API endpoints
│   └── utils/
│       └── cookies.js         # Cookie persistence
├── config/
│   └── index.js               # Configuration
├── scripts/
│   ├── analyze.js             # CLI tool
│   ├── build-and-push.sh      # Docker push
│   └── test-env.js            # Env test
└── public/                    # Frontend files
```

---

## Configuration (config/index.js)

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | 3000 | Server port |
| `NODE_ENV` | development | Environment |
| `SCREENER_EMAIL` | - | Screener.in login |
| `SCREENER_PASSWORD` | - | Screener.in password |
| `GEMINI_API_KEY` | - | Google AI API key |

### Investment Criteria

| Variable | Default | Description |
|----------|---------|-------------|
| `ROE_MIN` | 15 | Min Return on Equity (%) |
| `PE_MAX` | 20 | Max P/E Ratio |
| `DEBT_TO_EQUITY_MAX` | 0.5 | Max Debt/Equity |
| `ROCE_MIN` | 15 | Min Return on Capital (%) |
| `EPS_GROWTH_MIN` | 10 | Min EPS Growth (%) |
| `EPS_GROWTH_MAX` | 15 | Max EPS Growth (%) |
| `PEG_MAX` | 1 | Max PEG Ratio |
| `INTRINSIC_VALUE_MULTIPLIER` | 22.5 | IV calculation multiplier |

---

## Services

### 1. Scraper Service (src/services/scraper.js)

#### Main Function
```javascript
async function fetchStockData(stockName, directUrl = null)
```

**Parameters:**
- `stockName`: Stock symbol or company name
- `directUrl`: Optional direct URL to company page

**Returns:**
```javascript
{
  url: string,           // Company URL on Screener.in
  data: {
    roe: number | null,
    pe_ratio: number | null,
    debt_to_equity: number | null,
    roce: number | null,
    eps_growth: number | null,
    peg: number | null,
    eps: number | null,
    book_value: number | null,
    cash_flow: number | null
  },
  screenshotPath: string  // Path to screenshot
}
```

**Features:**
- Headless Chrome via Puppeteer
- Session cookie persistence
- Automatic login to Screener.in
- Anti-bot detection evasion
- Full-page screenshot capture

#### Internal Functions

| Function | Purpose |
|----------|---------|
| `validateCredentials()` | Check if login credentials exist |
| `checkIfLoggedIn(page)` | Check login status on page |
| `loginToScreener(page)` | Perform login flow |
| `getChromePath()` | Get Chrome executable path |

### 2. Analyzer Service (src/services/analyzer.js)

#### Main Function
```javascript
function analyzeStock(data)
```

**Parameters:**
- `data`: Stock data object from scraper

**Returns:**
```javascript
{
  verdict: 'BUY' | 'HOLD' | 'NA',
  score: number,      // Passed criteria count
  total: number,      // Total valid criteria
  percent: number,    // Score percentage
  analysis: {
    roe: 'PASS' | 'FAIL' | 'NA',
    pe_ratio: 'PASS' | 'FAIL' | 'NA',
    debt_to_equity: 'PASS' | 'FAIL' | 'NA',
    roce: 'PASS' | 'FAIL' | 'NA',
    cash_flow: 'PASS' | 'FAIL' | 'NA',
    eps_growth: 'PASS' | 'FAIL' | 'NA',
    peg: 'PASS' | 'FAIL' | 'NA',
    intrinsic_value: number | 'NA'
  }
}
```

**Investment Criteria:**

| Metric | Condition | Pass If |
|--------|-----------|---------|
| ROE | > ROE_MIN | > 15% |
| P/E Ratio | < PE_MAX | < 20 |
| Debt/Equity | < DEBT_TO_EQUITY_MAX | < 0.5 |
| ROCE | > ROCE_MIN | > 15% |
| Cash Flow | > 0 | Positive |
| EPS Growth | Between MIN and MAX | 10-15% |
| PEG | < PEG_MAX | < 1 |

**Verdict Logic:**
```javascript
if (percent >= 70) verdict = 'BUY';
else if (percent >= 50) verdict = 'HOLD';
else verdict = 'NA';  // Consider selling
```

### 3. AI Service (src/services/aiService.js)

#### Main Function
```javascript
async function generateAIInsights(stockData, analysis, imagePath = null)
```

**Parameters:**
- `stockData`: Raw stock metrics
- `analysis`: Analysis results
- `imagePath`: Optional screenshot path

**Returns:**
- HTML-formatted investment insights string

**Features:**
- Uses Gemini 2.5 Flash model
- Supports image input (screenshot)
- Returns HTML for direct rendering

---

## Routes (src/routes/api.js)

### Endpoints

#### GET /api/health
Health check endpoint.

**Response:**
```json
{
  "status": "OK",
  "message": "Stock Analysis API is running"
}
```

#### GET /api/search
Search for companies.

**Query Parameters:**
- `query`: Search term (required)

**Response:**
```json
{
  "success": true,
  "results": [
    { "id": "TCS", "name": "Tata Consultancy Services Ltd", "url": "/company/TCS/" }
  ],
  "query": "TCS"
}
```

#### GET /api/analyze/:companyName
Analyze stock by name/symbol.

**Parameters:**
- `companyName`: Stock symbol (e.g., "TCS")

**Response:** See Analysis Response Format below.

#### POST /api/analyze
Analyze stock with additional options.

**Body:**
```json
{
  "companyName": "TCS",
  "companyUrl": "/company/TCS/",
  "slug": "TCS"
}
```

**Response:** See Analysis Response Format below.

### Analysis Response Format

```json
{
  "success": true,
  "company": {
    "name": "Tata Consultancy Services Ltd",
    "slug": "TCS",
    "url": "https://www.screener.in/company/TCS/"
  },
  "data": {
    "roe": 45.2,
    "pe_ratio": 28.5,
    "debt_to_equity": 0.05,
    "roce": 55.3,
    "eps_growth": null,
    "peg": 2.1,
    "eps": 115.5,
    "book_value": 280.0,
    "cash_flow": 35000
  },
  "analysis": {
    "verdict": "HOLD",
    "score": 4,
    "total": 7,
    "percent": 57.14,
    "analysis": {
      "roe": "PASS",
      "pe_ratio": "FAIL",
      "debt_to_equity": "PASS",
      "roce": "PASS",
      "cash_flow": "PASS",
      "eps_growth": "NA",
      "peg": "FAIL",
      "intrinsic_value": 729337.5
    }
  },
  "aiInsights": "<h3>Analysis</h3>...",
  "timestamp": "2026-01-18T10:30:00.000Z"
}
```

---

## Server (src/server.js)

### Middleware Stack

```javascript
app.use(cors());                    // Enable CORS
app.use(express.json());            // Parse JSON bodies
app.use(express.static('public'));  // Serve frontend
```

### Route Mounting

```javascript
app.use('/api', apiRoutes);         // API routes
app.get('/', serveIndex);           // Frontend
```

---

## Utils

### Cookie Management (src/utils/cookies.js)

| Function | Purpose |
|----------|---------|
| `saveCookies(page)` | Save cookies to file |
| `loadCookies(page)` | Load cookies from file |
| `COOKIES_FILE` | Cookie file path |

**Cookie File Location:** `screener_cookies.json` (project root)

---

## Scripts

### CLI Analyze (scripts/analyze.js)
```bash
node scripts/analyze.js TCS
```

### Build & Push (scripts/build-and-push.sh)
```bash
./scripts/build-and-push.sh         # Push as 'latest'
./scripts/build-and-push.sh v1.0.0  # Push with version
```

### Test Environment (scripts/test-env.js)
```bash
node scripts/test-env.js
```

---

## Error Handling

All endpoints return errors in this format:
```json
{
  "error": "Error type",
  "message": "Detailed error message"
}
```

**HTTP Status Codes:**
- `200`: Success
- `400`: Bad request (missing parameters)
- `404`: Stock not found
- `500`: Server error
