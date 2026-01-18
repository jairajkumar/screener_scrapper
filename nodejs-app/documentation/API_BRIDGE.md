# API Bridge Documentation

## Overview
This document describes the data flow between the frontend and backend, including request/response formats and field mappings.

---

## API Endpoints

### 1. Analyze by Company Name
```
GET /api/analyze/:companyName
```

**Example**: `GET /api/analyze/TCS`

### 2. Analyze by URL
```
POST /api/analyze
Content-Type: application/json

{
    "companyUrl": "company/PETRONET/",
    "companyName": "Petronet LNG"
}
```

### 3. Search Companies
```
GET /api/search?query=tata
```

---

## Response Format

### Success Response
```json
{
    "success": true,
    "company": {
        "name": "PETRONET",
        "url": "https://www.screener.in/company/PETRONET/"
    },
    "data": {
        "stockPE": 11.9,
        "roe": 21.4,
        "roce": 26.2,
        "bookValue": 137,
        "dividendYield": 3.51,
        "marketCap": 42698,
        "currentPrice": 285,
        "industryPE": 8,
        "debtToEquity": 0.12,
        "pegRatio": 1.70,
        "priceToBook": 2.08,
        "grahamNumber": 271.71,
        "currentRatio": 3.54,
        "profitGrowth5Y": 7,
        "profitGrowth10Y": 17,
        "salesGrowth5Y": 8,
        "historical": {
            "sales": [37748, 39501, ...],
            "netProfit": [712, 883, ...],
            "cfo": [964, 830, ...]
        },
        "_debug": {
            "rowsFound": { "sales": 13, "netProfit": 13 }
        }
    },
    "analysis": {
        "finalDecision": "HOLD",
        "scoresAbove7": 2,
        "overallPercent": 69,
        "piotroski": { ... },
        "buffett": { ... },
        "graham": { ... },
        "lynch": { ... },
        "summary": {
            "piotroski": "6/9",
            "buffett": "8/10",
            "graham": "9/10",
            "lynch": "4/10"
        }
    },
    "aiInsights": "AI-generated analysis text...",
    "timestamp": "2026-01-18T17:44:37.880Z"
}
```

---

## Score Object Format

Each score (piotroski, buffett, graham, lynch) follows this structure:

```json
{
    "name": "Piotroski F-Score",
    "score": 6,
    "total": 9,
    "percent": 67,
    "factors": {
        "netProfitPositive": {
            "value": 3594,
            "condition": "Net Profit > 0",
            "pass": true,
            "marks": 1
        },
        ...
    },
    "interpretation": "Moderate Financial Health"
}
```

---

## Frontend Data Mapping

### Score Card Mapping
| API Field | DOM Element | Update Function |
|-----------|-------------|-----------------|
| `analysis.piotroski.score` | `#piotroskiScore` | `updateScoreCard()` |
| `analysis.piotroski.percent` | `#piotroskiBar` width | `updateScoreCard()` |
| `analysis.piotroski.interpretation` | `#piotroskiInterpretation` | `updateScoreCard()` |

### Decision Badge Mapping
| API Field | DOM Element | CSS Class |
|-----------|-------------|-----------|
| `analysis.finalDecision` | `#verdictText` | `.buy` / `.hold` / `.avoid` |
| `analysis.scoresAbove7` | `#verdictSubtitle` | - |

### Factor List Mapping
```javascript
// Rendered dynamically from analysis[currentTab].factors
Object.entries(factors).map(([key, factor]) => {
    return `<div class="factor-item ${factor.pass ? 'pass' : 'fail'}">
        <div class="factor-name">${formatFactorName(key)}</div>
        <div class="factor-value">${factor.value}</div>
        <span class="factor-badge">${factor.marks} marks</span>
    </div>`;
});
```

---

## Error Response

```json
{
    "success": false,
    "message": "Company not found",
    "error": "No data available for the requested company"
}
```

---

## Data Flow Diagram

```
┌─────────────┐     GET /api/analyze/:name      ┌─────────────┐
│   Frontend  │ ─────────────────────────────▶  │   Backend   │
│  script.js  │                                 │   api.js    │
└─────────────┘                                 └──────┬──────┘
                                                       │
                                                       ▼
                                                ┌─────────────┐
                                                │  scraper.js │
                                                │ (Puppeteer) │
                                                └──────┬──────┘
                                                       │
                                                       ▼
                                                ┌─────────────┐
                                                │ Screener.in │
                                                └──────┬──────┘
                                                       │
                              ┌────────────────────────┼────────────────────────┐
                              ▼                        ▼                        ▼
                    ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
                    │ piotroskiScore  │    │  buffettScore   │    │   grahamScore   │
                    └────────┬────────┘    └────────┬────────┘    └────────┬────────┘
                             │                      │                      │
                             └──────────────────────┼──────────────────────┘
                                                    ▼
                                            ┌─────────────┐
                                            │ analyzer.js │
                                            │  (Combine)  │
                                            └──────┬──────┘
                                                   │
                                                   ▼
                                           JSON Response
```
