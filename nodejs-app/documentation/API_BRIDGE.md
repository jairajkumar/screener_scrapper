# API Bridge Documentation

## Overview

This document describes how the frontend and backend communicate, including all API contracts, data flows, and the complete request/response lifecycle.

---

## Architecture

```
┌──────────────────┐         HTTP/JSON         ┌──────────────────┐
│                  │ ◄────────────────────────► │                  │
│    FRONTEND      │                            │     BACKEND      │
│   (Browser)      │                            │   (Node.js)      │
│                  │                            │                  │
│  public/         │         /api/*             │  src/            │
│  ├── index.html  │ ─────────────────────────► │  ├── routes/     │
│  └── script.js   │                            │  ├── services/   │
│                  │ ◄───────────────────────── │  └── server.js   │
│                  │         JSON Response      │                  │
└──────────────────┘                            └──────────────────┘
```

---

## API Endpoints Summary

| Method | Endpoint | Frontend Function | Purpose |
|--------|----------|-------------------|---------|
| GET | `/api/health` | - | Health check |
| GET | `/api/search?query=X` | `fetchSuggestions()` | Autocomplete |
| GET | `/api/analyze/:name` | `analyzeStock()` | Analyze by name |
| POST | `/api/analyze` | `analyzeStockWithUrl()` | Analyze with URL |

---

## Data Flow Diagrams

### 1. Search Flow

```
User Types → Debounce (300ms) → fetchSuggestions()
                                      │
                                      ▼
                          GET /api/search?query=TCS
                                      │
                                      ▼
                    Backend proxies to Screener.in API
                                      │
                                      ▼
                              Returns results
                                      │
                                      ▼
                         renderSuggestions() → UI Update
```

### 2. Analysis Flow (GET)

```
User clicks "Analyze" → analyzeStock()
                              │
                              ▼
                  GET /api/analyze/TCS
                              │
                              ▼
             ┌────────────────┴────────────────┐
             │                                 │
             ▼                                 ▼
    scraper.js                         analyzer.js
    fetchStockData()                   analyzeStock()
             │                                 │
             ▼                                 ▼
    Puppeteer scrape                  Apply criteria
             │                                 │
             └────────────────┬────────────────┘
                              │
                              ▼
                        aiService.js
                    generateAIInsights()
                              │
                              ▼
                       Return JSON
                              │
                              ▼
                    displayResults() → UI Update
```

### 3. Analysis Flow (POST with URL)

```
User clicks suggestion → analyzeStockWithUrl()
                              │
                              ▼
                    POST /api/analyze
                    Body: { companyUrl, companyName }
                              │
                              ▼
                      (Same backend flow)
```

---

## API Contracts

### 1. Health Check

**Request:**
```http
GET /api/health
```

**Response:**
```json
{
  "status": "OK",
  "message": "Stock Analysis API is running"
}
```

---

### 2. Company Search

**Request:**
```http
GET /api/search?query=Reliance
```

**Response:**
```json
{
  "success": true,
  "results": [
    {
      "id": "RELIANCE",
      "name": "Reliance Industries Ltd",
      "url": "/company/RELIANCE/consolidated/"
    },
    {
      "id": "RELIANCEPOW",
      "name": "Reliance Power Ltd",
      "url": "/company/RELIANCEPOW/"
    }
  ],
  "query": "Reliance"
}
```

**Frontend Usage:**
```javascript
const res = await fetch(`/api/search?query=${encodeURIComponent(query)}`);
const data = await res.json();
suggestions = data.results;
renderSuggestions();
```

---

### 3. Stock Analysis (GET)

**Request:**
```http
GET /api/analyze/TCS
```

**Response:**
```json
{
  "success": true,
  "company": {
    "name": "TCS",
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
  "aiInsights": "<h3>Analysis</h3><p>TCS shows strong fundamentals...</p>",
  "timestamp": "2026-01-18T10:30:00.000Z"
}
```

**Frontend Usage:**
```javascript
const response = await fetch(`/api/analyze/${encodeURIComponent(companyName)}`);
const data = await response.json();
displayResults(data);
```

---

### 4. Stock Analysis (POST)

**Request:**
```http
POST /api/analyze
Content-Type: application/json

{
  "companyName": "Reliance Industries Ltd",
  "companyUrl": "/company/RELIANCE/consolidated/",
  "slug": "RELIANCE"
}
```

**Response:** Same as GET endpoint.

**Frontend Usage:**
```javascript
const response = await fetch('/api/analyze', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ companyUrl, companyName })
});
const data = await response.json();
displayResults(data);
```

---

## Data Mapping: Backend → Frontend

### Analysis Object Mapping

| Backend Field | Frontend Element | Transformation |
|---------------|------------------|----------------|
| `company.name` | `#companyName` | Direct |
| `company.url` | `#companyUrl` href | Direct |
| `analysis.verdict` | `#verdictBadge` | + CSS class |
| `analysis.score` | `#scoreDisplay` | `{score}/{total}` |
| `analysis.percent` | `#percentageDisplay` | `Math.round()%` |
| `analysis.percent` | `#scoreBar` width | CSS width% |

### Metric Data Mapping

| Backend Field | Frontend Value | Frontend Status | Card ID |
|---------------|----------------|-----------------|---------|
| `data.roe` | `#roeValue` | `#roeStatus` | roe |
| `data.pe_ratio` | `#peValue` | `#peStatus` | pe |
| `data.debt_to_equity` | `#debtValue` | `#debtStatus` | debt |
| `data.roce` | `#roceValue` | `#roceStatus` | roce |
| `data.cash_flow` | `#cashFlowValue` | `#cashFlowStatus` | cashFlow |
| `data.peg` | `#pegValue` | `#pegStatus` | peg |

---

## Color Encoding

### Verdict Colors

| Verdict | Backend | Frontend CSS | Visual |
|---------|---------|--------------|--------|
| BUY | `"BUY"` | `bg-green-500` | 🟢 Green |
| HOLD | `"HOLD"` | `bg-yellow-500` | 🟡 Yellow |
| SELL | `"SELL"` | `bg-red-500` | 🔴 Red |
| N/A | `"NA"` | `bg-gray-500` | ⚪ Gray |

### Score Bar Colors

| Percentage | Frontend CSS | Visual |
|------------|--------------|--------|
| ≥70% | `bg-green-500` | 🟢 Green |
| 50-69% | `bg-yellow-500` | 🟡 Yellow |
| <50% | `bg-red-500` | 🔴 Red |

### Metric Card Colors

| Status | Backend | Card Gradient | Badge CSS |
|--------|---------|---------------|-----------|
| PASS | `"PASS"` | Blue (`#4facfe → #00f2fe`) | `bg-green-100 text-green-800` |
| FAIL | `"FAIL"` | Pink/Yellow (`#fa709a → #fee140`) | `bg-red-100 text-red-800` |
| N/A | `"NA"` | Light (`#a8edea → #fed6e3`) | `bg-gray-100 text-gray-800` |

---

## Error Handling

### Backend Error Response
```json
{
  "error": "Stock not found",
  "message": "Could not find data for INVALID"
}
```

### Frontend Error Handling
```javascript
if (!response.ok) {
  throw new Error(data.message || 'Analysis failed');
}
// Caught in catch block:
showError(error.message);
```

### Error Display
- Error section becomes visible
- Red-themed container with icon
- Error message displayed in `#errorMessage`

---

## Request Headers

### Frontend → Backend
```
Content-Type: application/json
```

### Backend → Frontend
```
Content-Type: application/json
Access-Control-Allow-Origin: * (CORS)
```

---

## State Management

### Frontend State
```javascript
let currentAnalysis = null;  // Current analysis data
let suggestions = [];        // Autocomplete results
let verdictCache = {};       // Cached verdicts
let isAnalyzing = false;     // Prevents duplicate calls
```

### Duplicate Call Prevention
```javascript
if (isAnalyzing) {
  console.log('Analysis already in progress, skipping...');
  return;
}
isAnalyzing = true;
// ... API call ...
isAnalyzing = false;
```

---

## Timing & Debouncing

| Action | Delay | Purpose |
|--------|-------|---------|
| Search suggestions | 300ms | Prevent API spam |
| Hide suggestions on blur | 200ms | Allow click selection |
| Loading spinner | 0ms | Immediate feedback |

---

## URL Structure

### Frontend Routes
- `/` - Main application (served by Express static)

### API Routes
- `/api/health` - Health check
- `/api/search` - Company search
- `/api/analyze/:companyName` - GET analysis
- `/api/analyze` - POST analysis

### External URLs
- `https://www.screener.in/company/{SLUG}/` - Screener.in company page
- `https://www.screener.in/api/company/search/` - Screener.in search API
