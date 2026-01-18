# Backend Documentation

## Overview
The Stock Analysis Tool backend is a Node.js/Express application that scrapes financial data from Screener.in and applies four investment scoring methodologies to analyze stocks.

## Architecture

```
src/
├── server.js          # Express app entry point
├── routes/
│   └── api.js         # API endpoints
└── services/
    ├── scraper.js       # Screener.in data extraction
    ├── analyzer.js      # Combines 4 scoring systems
    ├── piotroskiScore.js # Piotroski F-Score (9 marks)
    ├── buffettScore.js   # Warren Buffett Score (10 marks)
    ├── grahamScore.js    # Benjamin Graham Score (10 marks)
    ├── lynchScore.js     # Peter Lynch Score (10 marks)
    └── aiService.js      # Gemini AI insights
```

---

## Scoring Services

### Piotroski F-Score (`piotroskiScore.js`)
**Total: 9 marks** - Measures financial health

| Factor | Condition | Marks |
|--------|-----------|-------|
| Net Profit Positive | Net Profit > 0 | 1 |
| CFO Positive | Cash Flow from Operations > 0 | 1 |
| ROA Improved | Current ROA > Previous Year | 1 |
| CFO > Profit | CFO > Net Profit | 1 |
| Debt Reduced | Borrowings decreased YoY | 1 |
| Current Ratio Improved | Current Ratio > 1.5 | 1 |
| No Equity Dilution | No new shares issued | 1 |
| OPM Improved | OPM % increased YoY | 1 |
| Asset Turnover Improved | Asset Turnover improved YoY | 1 |

### Warren Buffett Score (`buffettScore.js`)
**Total: 10 marks** - Measures long-term business quality

| Factor | Condition | Marks |
|--------|-----------|-------|
| High ROE | ROE > 15% | 2 |
| Low Debt | Debt/Equity < 0.5 | 2 |
| Profit Consistency | Net Profit positive for 5 years | 2 |
| Strong FCF | Free Cash Flow positive | 2 |
| Reasonable Valuation | Stock P/E < Industry P/E | 2 |

### Benjamin Graham Score (`grahamScore.js`)
**Total: 10 marks** - Value investing with margin of safety

| Factor | Condition | Marks |
|--------|-----------|-------|
| Low P/E | P/E < 15 | 1 |
| Low P/B | Price/Book < 1.5 | 1 |
| Debt Safety | Debt/Equity < 1 | 2 |
| Strong Liquidity | Current Ratio > 2 | 2 |
| Earnings Stability | No loss year in 5 years | 2 |
| Dividend Record | Dividend paid regularly | 2 |

**Graham Number**: `sqrt(22.5 × EPS × Book Value)`

### Peter Lynch Score (`lynchScore.js`)
**Total: 10 marks** - Growth at Reasonable Price (GARP)

| Factor | Condition | Marks |
|--------|-----------|-------|
| EPS Growth | 5Y Profit Growth > 10% | 3 |
| Low PEG | PEG Ratio < 1.5 | 3 |
| Low Debt | Debt/Equity < 0.5 | 2 |
| Business Simplicity | Stable business | 2 |

---

## Scraper Service (`scraper.js`)

### Data Extraction
The scraper uses Puppeteer to extract data from Screener.in company pages.

#### Selectors Used
| Section | Selector | Data |
|---------|----------|------|
| Top Ratios | `#top-ratios li` | P/E, ROE, ROCE, Book Value |
| P&L | `#profit-loss table tbody tr` | Sales, Net Profit, OPM, EPS |
| Balance Sheet | `#balance-sheet table tbody tr` | Borrowings, Equity, Assets |
| Cash Flow | `#cash-flow table tbody tr` | CFO, CFI, CFF |
| Growth Rates | `table.ranges-table` | 5Y/10Y Profit & Sales Growth |
| Peers | `#peers` | Industry P/E |

#### Extracted Fields
```javascript
{
  // Top Card Ratios
  stockPE, roe, roce, bookValue, dividendYield, marketCap, currentPrice, industryPE,
  
  // Calculated Ratios
  debtToEquity, roa, assetTurnover, fcf, pegRatio, priceToBook, grahamNumber, currentRatio,
  
  // Growth Rates
  profitGrowth5Y, profitGrowth10Y, profitGrowth3Y, salesGrowth5Y, salesGrowth10Y, salesGrowth3Y,
  
  // Historical Data (arrays)
  historical: { sales, netProfit, opmPercent, eps, dividendPayout, borrowings, equityCapital, reserves, totalAssets, cfo, cfi, cff }
}
```

---

## Analyzer Service (`analyzer.js`)

### Final Decision Logic
```javascript
const scoresAbove7 = [piotroski, buffett, graham, lynch].filter(s => s.score >= 7).length;

if (scoresAbove7 >= 3) finalDecision = 'BUY';
else if (scoresAbove7 === 2) finalDecision = 'HOLD';
else finalDecision = 'AVOID';
```

---

## API Endpoints

### `GET /api/analyze/:companyName`
Analyze a stock by name or symbol.

### `POST /api/analyze`
Analyze using direct Screener.in URL.
```json
{ "companyUrl": "company/TCS/", "companyName": "TCS" }
```

### `GET /api/search?query=...`
Search for companies by name.

### `GET /api/health`
Health check endpoint.

---

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `PORT` | Server port (default: 3000) | No |
| `GEMINI_API_KEY` | Google Gemini API key for AI insights | No |
| `SCREENER_SESSION` | Screener.in session cookie for authenticated data | No |

---

## Dependencies

| Package | Purpose |
|---------|---------|
| `express` | Web framework |
| `puppeteer-core` | Browser automation |
| `@google/generative-ai` | Gemini AI integration |
| `cors` | Cross-origin requests |
| `dotenv` | Environment variables |
