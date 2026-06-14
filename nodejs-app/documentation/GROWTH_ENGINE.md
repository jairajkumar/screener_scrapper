# Growth Investment Engine — Technical Documentation

## Overview

The Growth Investment Engine is a **complementary analysis system** that runs alongside the existing 4-score value-based analysis (Piotroski, Buffett, Graham, Lynch). While the value system focuses on financial health and undervaluation, the Growth Engine evaluates a company's ability to **compound earnings and revenue at high rates** over 5-10 years.

The system produces two independent perspectives on every stock:

```
┌──────────────────────┐    ┌──────────────────────┐
│   VALUE PERSPECTIVE  │    │  GROWTH PERSPECTIVE  │
│                      │    │                      │
│  Piotroski F-Score   │    │  Growth Score (100)   │
│  Buffett Score       │    │  PEG Valuation        │
│  Graham Score        │    │  Risk Rules           │
│  Lynch Score         │    │  PE Normalization     │
│                      │    │                      │
│  Decision: HOLD      │    │  Decision: BUY        │
└──────────────────────┘    └──────────────────────┘
```

---

## Architecture

### File Structure

```
src/services/
├── growthScore.js              # 100-point growth scoring module
├── growthValuationEngine.js    # PEG valuation + risk rules + decision matrix
├── yahooFinanceService.js      # Yahoo Finance historical prices for PE normalization
├── analyzer.js                 # Updated: calls growth modules alongside value scores
└── scraper.js                  # Updated: extracts shareholding + ROCE historical + pledge

public/
├── index.html                  # Updated: Growth Engine UI section
├── script.js                   # Updated: displayGrowthEngine() function
└── styles.css                  # Updated: Growth Engine CSS styles
```

### Data Flow

```
Screener.in Page
    │
    ├─ Scraper (scraper.js)
    │   ├── Top Card: ROCE, PE, EPS, D/E, Pledged %
    │   ├── #profit-loss: Sales, Net Profit, OPM, EPS (historical)
    │   ├── #shareholding: Promoter %, FII %, DII % (NEW)
    │   ├── #ratios: ROCE % historical (NEW)
    │   └── #balance-sheet, #cash-flow (unchanged)
    │
    ▼
Analyzer (analyzer.js — async)
    │
    ├── Existing 4 Scores → Value Decision (unchanged)
    │
    ├── growthScore.js → Growth Score (0-100)
    │
    ├── Yahoo Finance (yahooFinanceService.js)
    │   └── 5Y monthly prices → March close prices → Historical PE
    │
    └── growthValuationEngine.js
        ├── PEG Ratio + Zone classification
        ├── Growth Fair Value
        ├── Valuation Normalization (PE vs 5Y avg)
        ├── Risk Rules (5 rules)
        └── Final Decision Matrix
    │
    ▼
API Response
    ├── value perspective: { finalDecision, piotroski, buffett, graham, lynch, valuation }
    └── growth perspective: { growth, growthValuation, growthSummary }
```

---

## Growth Score — 100 Points

**File**: `src/services/growthScore.js`

The Growth Score evaluates 7 factors totaling 100 points. Each factor uses specific thresholds to award points.

### Factor 1: Revenue Growth (20 Points)

**Data Source**: `data.salesGrowth5Y` from Screener's Compounded Growth Table

| 5Y Sales CAGR | Points |
|----------------|--------|
| > 25%          | 20     |
| 20% - 25%     | 16     |
| 15% - 20%     | 12     |
| 10% - 15%     | 8      |
| < 10%          | 0      |

**Pass threshold**: ≥ 12 points (≥ 15% CAGR)

### Factor 2: EPS Growth (20 Points)

**Data Source**: True EPS CAGR calculated from `data.historical.eps` array

Unlike `profitGrowth5Y` which measures company-level net profit growth, this calculates **true EPS CAGR** which accounts for equity dilution (new shares issued):

```javascript
EPS CAGR = ((latestEPS / eps5YearsAgo) ^ (1/5) - 1) × 100
```

If the EPS array has > 12 values, the last value is treated as TTM (trailing twelve months) and skipped.

**Fallback**: Uses `profitGrowth5Y` if EPS CAGR cannot be calculated (insufficient data or negative EPS).

| 5Y EPS CAGR | Points |
|--------------|--------|
| > 25%        | 20     |
| 20% - 25%   | 16     |
| 15% - 20%   | 12     |
| 10% - 15%   | 8      |
| < 10%        | 0      |

**Pass threshold**: ≥ 12 points (≥ 15% CAGR)

### Factor 3: ROCE — Return on Capital Employed (15 Points)

**Data Source**: Average of last 5 values from `data.historical.roceHistorical` (scraped from `#ratios` table)

```javascript
avgRoce5Y = average(roceHistorical.slice(-5))
```

**Fallback**: Uses current ROCE from top card (`data.roce`) if historical data unavailable.

| 5Y Avg ROCE | Points |
|-------------|--------|
| > 25%       | 15     |
| 20% - 25%  | 12     |
| 15% - 20%  | 8      |
| 10% - 15%  | 4      |
| < 10%       | 0      |

**Pass threshold**: ≥ 8 points (≥ 15% ROCE)

### Factor 4: Profit Consistency (15 Points)

**Data Source**: `data.historical.netProfit` array (last 6 values to check 5 years of YoY growth)

Counts how many of the last 5 years showed **positive year-over-year profit growth**:

```javascript
// For each year: grew = netProfit[i] > netProfit[i-1]
// Count positive growth years out of 5
```

| Positive Growth Years | Points |
|-----------------------|--------|
| 5 out of 5            | 15     |
| 4 out of 5            | 10     |
| 3 out of 5            | 5      |
| < 3                   | 0      |

**Pass threshold**: ≥ 10 points (≥ 4/5 years)

### Factor 5: Operating Margin Trend (10 Points)

**Data Source**: `data.historical.opmPercent` array

Compares current OPM with OPM from 5 years ago:

```javascript
opmChange = opmPercent[latest] - opmPercent[latest - 5]
```

| OPM Change          | Points |
|---------------------|--------|
| > +3% improvement   | 10     |
| -3% to +3% (stable) | 6      |
| > -3% decline       | 0      |

**Pass threshold**: ≥ 6 points (stable or improving)

### Factor 6: Debt Quality (10 Points)

**Data Source**: `data.debtToEquity`

| Debt/Equity | Points |
|-------------|--------|
| < 0.3       | 10     |
| 0.3 - 0.5   | 8      |
| 0.5 - 1.0   | 4      |
| > 1.0        | 0      |

**Pass threshold**: ≥ 8 points (D/E < 0.5)

### Factor 7: Ownership Confidence (10 Points)

**Data Source**: Shareholding data from `#shareholding` table

This factor has two sub-components:

**Part A — Promoter Holding (5 Points)**:
- Promoter holding > 50%: ✓
- Promoter holding stable (≤ 2% drop from previous quarter): ✓
- Both conditions met = 5 points, otherwise 0

```javascript
promoterAbove50 = latestPromoterHolding > 50
promoterStable = latestPromoterHolding >= prevPromoterHolding - 2
```

**Part B — FII/DII Trend (5 Points)**:
- Combined FII + DII holding increasing vs previous quarter = 5 points

```javascript
fiiDiiIncreasing = (latestFII + latestDII) > (prevFII + prevDII)
```

**Total**: Part A (5) + Part B (5) = 10 points max

### Score Decision

| Growth Score | Decision |
|-------------|----------|
| ≥ 80        | **BUY**  |
| 65 - 79     | **HOLD** |
| < 65        | **AVOID** |

### Score Interpretation

| Growth Score | Interpretation            |
|-------------|---------------------------|
| ≥ 85        | Excellent Growth Stock    |
| 80 - 84     | Strong Growth Stock       |
| 70 - 79     | Moderate Growth Potential |
| 65 - 69     | Below Average Growth     |
| < 65        | Weak Growth Profile       |

---

## PEG Valuation Engine

**File**: `src/services/growthValuationEngine.js`

### Growth PE Calculation

```javascript
Growth PE = MIN(EPS_CAGR, 40)
```

The Growth PE is capped at 40 to prevent unrealistic valuations for hyper-growth companies.

### Growth Fair Value

```javascript
Growth Fair Value = Latest EPS × Growth PE
```

### PEG Ratio

```javascript
PEG = Current Stock PE / EPS CAGR (5Y)
```

### PEG Zone Classification

| PEG Ratio | Zone        | Meaning                                |
|-----------|-------------|----------------------------------------|
| < 0.8     | STRONG_BUY  | Growth significantly underpriced       |
| 0.8 - 1.2 | BUY         | Growth fairly priced, good opportunity |
| 1.2 - 1.5 | HOLD        | Fairly valued relative to growth       |
| 1.5 - 2.0 | SELL        | Premium pricing for growth             |
| > 2.0     | AVOID       | Significantly overpriced for growth    |

### Upside Calculation

```javascript
Upside = ((Growth Fair Value - Current Price) / Current Price) × 100
```

---

## Risk Rules

Five risk rules can **override or downgrade** the Growth Engine's decision. Rules 1, 2, and 5 immediately force AVOID (checked first). Rules 3 and 4 are applied after the decision matrix.

### Rule 1: Loss-Making Company

```
IF EPS ≤ 0 → FORCE AVOID
```

A company with negative earnings cannot be growth-scored. Exits immediately.

### Rule 2: Weak Revenue Growth

```
IF 5Y Sales CAGR < 10% → FORCE AVOID
```

A growth stock must demonstrate at least 10% revenue growth over 5 years.

### Rule 3: Poor Capital Efficiency

```
IF ROCE < 15% → CAP AT HOLD
```

Applied after decision matrix. If the decision is BUY or STRONG_BUY, it's downgraded to HOLD. If already HOLD or lower, no change.

### Rule 4: High Debt

```
IF Debt/Equity > 1.0 → DOWNGRADE ONE LEVEL
```

Applied after decision matrix:
- STRONG_BUY → BUY
- BUY → HOLD
- HOLD → SELL
- SELL → AVOID
- AVOID → AVOID

### Rule 5: Promoter Pledge Risk

```
IF Promoter Pledge > 10% → FORCE AVOID
```

High promoter pledging indicates risk of forced selling and governance issues.

**Data Source**: `Pledged percentage` custom ratio on Screener.in (added by user)

---

## Final Decision Matrix

The final Growth Engine decision combines the **Growth Score decision** with the **PEG Zone**:

|               | PEG: STRONG_BUY | PEG: BUY | PEG: HOLD | PEG: SELL | PEG: AVOID |
|---------------|------------------|----------|-----------|-----------|------------|
| Score: BUY    | STRONG_BUY       | BUY      | HOLD      | SELL      | AVOID      |
| Score: HOLD   | BUY              | HOLD     | HOLD      | SELL      | AVOID      |
| Score: AVOID  | AVOID            | AVOID    | AVOID     | AVOID     | AVOID      |

When PEG is UNKNOWN (cannot be calculated), the Score decision is used directly.

After the matrix produces a decision, **Risk Rules 3 and 4** are applied to potentially downgrade it.

---

## Valuation Normalization (Yahoo Finance)

**File**: `src/services/yahooFinanceService.js`

### Purpose

Compares a stock's **current PE** against its own **5-year average PE** to determine if it's historically expensive or cheap. This provides context beyond absolute PE comparisons.

### How It Works

1. **Ticker Mapping**: The Screener company slug (e.g., `TCS` from `/company/TCS/`) is mapped to Yahoo Finance: `TCS.NS`

2. **Historical Data**: Fetches 6 years of monthly close prices via `yahoo-finance2` npm package

3. **March Close Extraction**: Extracts March closing prices (Indian fiscal year end) for each year. Falls back to December if March data unavailable.

4. **Historical PE Calculation**: For each year:
   ```javascript
   PE[year] = yearEndPrice[year] / EPS[year]
   ```
   EPS comes from Screener's `historical.eps` array.

5. **5Y Average PE**: Average of available historical PEs (needs at least 3 years of data).

6. **Premium Calculation**:
   ```javascript
   Premium = ((Current PE - 5Y Avg PE) / 5Y Avg PE) × 100
   ```

### Normalization Scoring

| Premium %         | Score (out of 10) | Meaning                    |
|-------------------|-------------------|----------------------------|
| < -20%            | 10                | Deeply discounted vs history |
| -20% to -5%       | 8                 | Discounted                  |
| -5% to +10%       | 6                 | Fairly valued               |
| +10% to +25%      | 4                 | Slight premium              |
| +25% to +50%      | 2                 | Expensive                   |
| > +50%            | 0                 | Very expensive vs history   |

### Error Handling

Yahoo Finance is optional. If it fails:
- Growth Score still works (full 100 points)
- PEG Valuation still works
- Risk Rules still work
- Only Valuation Normalization is skipped
- `valuationNorm.available` = `false` in the response

Common failure scenarios:
- Network error → graceful fallback
- Ticker not found (BSE-only stocks) → descriptive error message
- Insufficient data (< 3 years) → skipped
- `yahoo-finance2` not installed → lazy-load warning, no crash

---

## Confidence Score

The Growth Engine calculates a confidence level (HIGH / MEDIUM / LOW) based on data quality:

| Check | Points |
|-------|--------|
| Has current price | 1 |
| Has true EPS CAGR (not fallback) | 1 |
| Has PEG calculation | 1 |
| Has Yahoo Finance data | 1 |
| Has ownership data | 1 |
| Score and PEG agree on direction | 1 |
| No risk flags triggered | 1 |

| Total Points | Confidence |
|-------------|------------|
| ≥ 6         | HIGH       |
| 4 - 5       | MEDIUM     |
| < 4         | LOW        |

---

## Data Sources

### Already Available (from existing scraper)

| Data Point | Source Section | Field in `data` |
|------------|---------------|-----------------|
| 5Y Sales CAGR | Compounded Growth Table | `salesGrowth5Y` |
| 5Y Profit CAGR | Compounded Growth Table | `profitGrowth5Y` |
| Current ROCE | Top Ratios Card | `roce` |
| Debt/Equity | Top Card or calculated | `debtToEquity` |
| Stock P/E | Top Ratios Card | `stockPE` |
| Current Price | Top Ratios Card | `currentPrice` |
| EPS (historical) | Profit & Loss table | `historical.eps` |
| Net Profit (historical) | Profit & Loss table | `historical.netProfit` |
| OPM % (historical) | Profit & Loss table | `historical.opmPercent` |

### Added for Growth Engine (new scraper extractions)

| Data Point | Source Section | Field in `data` |
|------------|---------------|-----------------|
| Promoter Holding % | `#shareholding` → "Promoters +" row | `historical.promoterHolding` |
| FII Holding % | `#shareholding` → "FIIs +" row | `historical.fiiHolding` |
| DII Holding % | `#shareholding` → "DIIs +" row | `historical.diiHolding` |
| ROCE Historical | `#ratios` → "ROCE %" row | `historical.roceHistorical` |
| Pledged Percentage | Top Card custom ratio | `promoterPledge` |

### Quick Access Fields (derived from historical arrays)

| Field | Derivation |
|-------|------------|
| `latestPromoterHolding` | Last value of `historical.promoterHolding` |
| `prevPromoterHolding` | Second-to-last value |
| `latestFIIHolding` | Last value of `historical.fiiHolding` |
| `prevFIIHolding` | Second-to-last value |
| `latestDIIHolding` | Last value of `historical.diiHolding` |
| `prevDIIHolding` | Second-to-last value |

### External Data (Yahoo Finance)

| Data Point | Source | Purpose |
|------------|--------|---------|
| 5Y Monthly Close Prices | Yahoo Finance API (`yahoo-finance2`) | Historical PE calculation |
| March Close Prices | Extracted from monthly data | Fiscal year-end prices |

---

## Screener.in Custom Ratio Setup

For the Growth Engine, one custom ratio must be added to Screener.in:

| Ratio Name | Purpose | Notes |
|------------|---------|-------|
| `Pledged percentage` | Risk Rule 5 | Replaces `No. Eq. Shares PY` (unused) |

All other data comes from standard Screener.in tables (available to all users, no premium needed):
- Shareholding pattern → `#shareholding` section
- ROCE historical → `#ratios` section

---

## API Response Format

The Growth Engine adds three fields to the analysis response:

### `growth` Object

```json
{
    "name": "Growth Score",
    "score": 84,
    "total": 100,
    "percent": 84,
    "decision": "BUY",
    "interpretation": "Strong Growth Stock",
    "factors": {
        "revenueGrowth": {
            "value": 22,
            "condition": "5Y Sales CAGR scoring (>25%=20, 20-25%=16, ...)",
            "pass": true,
            "marks": 16,
            "maxMarks": 20
        },
        "epsGrowth": { ... },
        "roce": { ... },
        "profitConsistency": { ... },
        "marginTrend": { ... },
        "debtQuality": { ... },
        "ownershipConfidence": { ... }
    },
    "_computed": {
        "epsCagr5Y": 17.43,
        "salesCagr5Y": 22,
        "avgRoce5Y": 23.8
    },
    "moat": null,
    "sustainability": null,
    "potentialMaxScore": 130
}
```

### `growthValuation` Object

```json
{
    "growthPE": 17.43,
    "growthFairValue": 871.50,
    "currentPrice": 950,
    "upside": -8.26,
    "peg": 1.84,
    "pegZone": "SELL",
    "scoreDecision": "BUY",
    "pegDecision": "SELL",
    "finalDecision": "SELL",
    "confidence": "HIGH",
    "riskFlags": [],
    "valuationNorm": {
        "available": true,
        "currentPE": 32,
        "avgPE5Y": 16.8,
        "premiumPercent": 90.48,
        "status": "Expensive vs Historical Average",
        "historicalPEs": { "2022": 16.67, "2023": 17.14, ... },
        "score": 0,
        "maxScore": 10
    }
}
```

### `growthSummary` Object (quick view)

```json
{
    "score": "84/100",
    "decision": "BUY",
    "peg": 1.84,
    "pegZone": "SELL",
    "finalDecision": "SELL",
    "confidence": "HIGH",
    "riskFlags": 0,
    "valuationNormAvailable": true
}
```

---

## Deferred Fields — Future AI Integration

The following fields are reserved for future AI integration (Moat & Sustainability from the PRD's 130-point version). Currently returned as `null`.

### Moat Analysis (10 Points — Deferred)

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `moat.brandStrength` | string | Brand power assessment | "Strong" / "Moderate" / "Weak" |
| `moat.marketPosition` | string | Industry rank | "Market Leader" |
| `moat.switchingCost` | string | Customer lock-in | "High" / "Medium" / "Low" |
| `moat.score` | number | Overall moat score (0-10) | 8 |
| `moat.reasoning` | string | AI explanation | Free text |

### Growth Sustainability (10 Points — Deferred)

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `sustainability.industryTailwind` | string | Sector outlook | "High" / "Medium" / "Low" |
| `sustainability.marketOpportunity` | string | Market size | "Large" / "Small" |
| `sustainability.innovationScore` | string | Product expansion | "Strong" / "Weak" |
| `sustainability.score` | number | Overall score (0-10) | 9 |
| `sustainability.reasoning` | string | AI explanation | Free text |

### Valuation Normalization (10 Points — Active)

This section is **already automated** using Yahoo Finance data (not deferred).

---

## Frontend UI

The Growth Engine renders a dedicated section in the results page with the following components:

### 1. Dual Perspective Banner
Shows Value Perspective vs Growth Perspective decisions side by side.

### 2. Growth Score Ring
Animated SVG circular progress ring showing 0-100 score with color coding:
- ≥ 80: Green (BUY)
- 65-79: Orange (HOLD)
- < 65: Red (AVOID)

### 3. Factor Bars (7 items)
Each factor displayed with:
- Name and marks (e.g., "16/20")
- Colored progress bar (green/orange/red)
- Detail value (e.g., "22%")
- Pass/fail border indicator

### 4. PEG Valuation Cards (5 cards)
Grid of: Growth PE | Growth Fair Value | PEG Ratio (with zone badge) | Upside | Confidence

### 5. Valuation Normalization
PE vs Historical Average section showing Current PE, 5Y Avg PE, Premium %, and Score.

### 6. Risk Flags
Visual alerts for any triggered risk rules with rule name, detail, and action taken.

---

## Testing

### Unit Test Validation

All Growth Engine modules were validated:

```bash
# Run all unit tests (including async analyzer tests)
npx jest tests/unit/ --verbose

# Results: 63/63 tests passed, 0 regressions
```

### Mock Data Test — Growth Score

```bash
node -e "
const calc = require('./src/services/growthScore');
const result = calc({
    salesGrowth5Y: 22,
    profitGrowth5Y: 25,
    roce: 24,
    debtToEquity: 0.2,
    latestPromoterHolding: 52,
    prevPromoterHolding: 51,
    latestFIIHolding: 20,
    prevFIIHolding: 18,
    latestDIIHolding: 15,
    prevDIIHolding: 14,
    historical: {
        eps: [10, 12, 15, 18, 22, 25, 30, 36, 42, 50, 58, 67, 70],
        netProfit: [100, 120, 150, 180, 220, 250, 300, 360, 420, 500, 580, 670, 700],
        opmPercent: [15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27],
        roceHistorical: [18, 20, 22, 24, 26, 28, 26, 25, 24, 23, 22, 25],
        promoterHolding: [52, 52, 52, 51, 52],
        fiiHolding: [18, 19, 19, 20, 20],
        diiHolding: [14, 14, 15, 15, 15]
    }
});
console.log('Score:', result.score + '/100');
console.log('Decision:', result.decision);
"
# Expected: Score: 85/100, Decision: BUY
```

### Risk Rules Verification

All 5 risk rules tested individually:
- Rule 1 (EPS ≤ 0): Correctly forces AVOID
- Rule 2 (Sales CAGR < 10%): Correctly forces AVOID
- Rule 3 (ROCE < 15%): Correctly caps at HOLD
- Rule 4 (D/E > 1): Correctly downgrades one level
- Rule 5 (Pledge > 10%): Correctly forces AVOID

---

## Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `yahoo-finance2` | latest | Historical stock price data for PE normalization |

**Installation**: Already included in `package.json`. Install with:
```bash
npm install
```

---

## Configuration

No additional environment variables required. The Growth Engine uses the same Screener.in credentials already configured in `.env`.

The stock ticker for Yahoo Finance is automatically derived from the Screener company URL slug — no mapping configuration needed.
