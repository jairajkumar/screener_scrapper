# Investment Scoring Methodology

## Overview
This application uses 4 distinct investment scoring methodologies to analyze stocks. The final investment decision is based on how many scores achieve the threshold of ≥7.

---

## Decision Logic

| Scores ≥ 7 | Decision |
|------------|----------|
| 3 or more | **BUY** |
| 2 | **HOLD** |
| 0-1 | **AVOID** |

---

## 1. Piotroski F-Score (9 marks)

**Purpose**: Measures financial health through profitability, leverage, and efficiency.

| Factor | Condition | Marks |
|--------|-----------|-------|
| Net Profit Positive | Net Profit > 0 | 1 |
| CFO Positive | Cash from Operations > 0 | 1 |
| ROA Improved | Current ROA > Previous Year | 1 |
| CFO > Net Profit | Operating Cash > Reported Profit | 1 |
| Debt Reduced | Borrowings decreased YoY | 1 |
| Current Ratio Improved | Ratio > 1.5 | 1 |
| No Equity Dilution | No new shares issued | 1 |
| Gross Margin Improved | OPM % increased | 1 |
| Asset Turnover Improved | Sales/Assets ratio improved | 1 |

**Interpretation**:
- 7-9: Strong Financial Health
- 5-6: Moderate Financial Health
- 0-4: Weak Financial Health

---

## 2. Warren Buffett Score (10 marks)

**Purpose**: Identifies high-quality businesses with competitive advantages.

| Factor | Condition | Marks |
|--------|-----------|-------|
| High ROE | ROE > 15% | 2 |
| Low Debt | Debt/Equity < 0.5 | 2 |
| Profit Consistency | Positive profit for 5 years | 2 |
| Strong Free Cash Flow | FCF > 0 | 2 |
| Reasonable Valuation | Stock P/E < Industry P/E | 2 |

**Interpretation**:
- 8-10: Excellent Long-Term Business
- 6-7: Good Business Quality
- 0-5: Needs Improvement

---

## 3. Benjamin Graham Score (10 marks)

**Purpose**: Value investing with emphasis on margin of safety.

| Factor | Condition | Marks |
|--------|-----------|-------|
| Low P/E | P/E < 15 | 1 |
| Low P/B | Price/Book < 1.5 | 1 |
| Debt Safety | Debt/Equity < 1 | 2 |
| Strong Liquidity | Current Ratio > 2 | 2 |
| Earnings Stability | No loss in 5 years | 2 |
| Dividend Record | Regular dividends | 2 |

**Graham Number**: `√(22.5 × EPS × Book Value)`
- If Current Price < Graham Number → Undervalued

**Interpretation**:
- 7-10: Strong Value Stock
- 5-6: Moderate Value
- 0-4: Not a Value Stock

---

## 4. Peter Lynch Score (10 marks)

**Purpose**: Growth at a Reasonable Price (GARP) strategy.

| Factor | Condition | Marks |
|--------|-----------|-------|
| EPS Growth | 5Y Profit Growth > 10% | 3 |
| Low PEG Ratio | P/E ÷ Growth < 1.5 | 3 |
| Low Debt | Debt/Equity < 0.5 | 2 |
| Business Simplicity | Stable, understandable business | 2 |

**PEG Ratio**: `P/E ÷ 5Y Earnings Growth Rate`
- PEG < 1: Potentially undervalued growth stock
- PEG 1-1.5: Fairly valued
- PEG > 1.5: Potentially overvalued

**Interpretation**:
- 7-10: Great GARP Opportunity
- 5-6: Moderate Growth Opportunity
- 0-4: Not a GARP Stock

---

## Data Sources

All financial data is scraped from [Screener.in](https://www.screener.in):

| Data Point | Source Section |
|------------|----------------|
| P/E, ROE, ROCE, Book Value | Top Ratios Card |
| Sales, Net Profit, OPM | Profit & Loss |
| Borrowings, Equity, Assets | Balance Sheet |
| CFO, CFI | Cash Flow |
| 5Y/10Y Growth Rates | Compounded Growth Table |
| Industry P/E | Peers Section |

---

## Example: PETRONET LNG

| Score | Result | Status |
|-------|--------|--------|
| Piotroski | 6/9 (67%) | Below 7 |
| Buffett | 8/10 (80%) | ✅ ≥7 |
| Graham | 9/10 (90%) | ✅ ≥7 |
| Lynch | 4/10 (40%) | Below 7 |

**Scores ≥7**: 2 (Buffett, Graham)
**Decision**: **HOLD**
