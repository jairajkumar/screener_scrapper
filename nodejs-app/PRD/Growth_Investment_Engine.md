# Growth Investment Engine

## What is a Growth Stock

A growth stock is a company that is expected to grow its sales and profits much faster than the overall market. Instead of focusing on being "cheap," growth stocks focus on rapid expansion and future potential.

### Simple Definition

**A growth stock is a company that:**

- Increases revenue quickly every year
- Increases profits consistently
- Reinvests money to grow faster instead of paying high dividends
- Has strong demand for its products or services

---

## Key Characteristics of Growth Stocks

### 1. High Revenue Growth
- Sales increase every year
- Usually 15%–30%+ CAGR

### 2. High Profit Growth (EPS Growth)
- Earnings grow fast along with sales
- Company becomes more profitable over time

### 3. Strong Business Expansion
- Launching new products
- Entering new markets
- Increasing customer base

### 4. Reinvestment Instead of Dividends
- Money is used to grow the business
- Very little or no dividend payout

### 5. Strong Competitive Position
- Brand power or market leadership
- Hard for competitors to replace them

---

## Premium Growth Screener

```
Market Capitalization > 10000 AND
Sales growth 5Years > 20 AND
Profit growth 5Years > 20 AND
Return on capital employed > 20 AND
Return on equity > 18 AND
Debt to equity < 0.3 AND
Promoter holding > 50 AND
Pledged percentage = 0 AND
OPM > 15
```

---

## Growth Engine Workflow

```
Universe (NSE Stocks)
        ↓
Growth Screener
        ↓
Top 100 Stocks
        ↓
Growth Score
        ↓
PEG Valuation
        ↓
Risk Rules
        ↓
Final Decision
(STRONG_BUY / BUY / HOLD / AVOID)
```

> A good Growth Investing dashboard should allow a user to answer one question in a few seconds:
> **"Is this company capable of compounding earnings for the next 5–10 years, and is the current price reasonable?"**

---

## 📈 Growth Investing Dashboard UI Checklist

### 🟢 Growth Score Summary Card

Display at the top of the page.

**Example:**

| Field | Value |
|---|---|
| Growth Score | 92 / 130 |
| Decision | BUY |
| Confidence | HIGH |

| Factor | Status |
|---|---|
| Revenue Growth | ✅ |
| EPS Growth | ✅ |
| ROCE | ✅ |
| Moat | ✅ |
| Valuation | ⚠️ |

**Fields:**
- Growth Score
- Score Percentage
- Score Decision (BUY / HOLD / AVOID)
- Confidence Level
- Risk Flags Count

---

### 📊 Growth Score Breakdown

Show how each component contributes to the total score.

| Factor | Score | Max |
|---|---|---|
| Revenue Growth | 20 | 20 |
| EPS Growth | 18 | 20 |
| ROCE | 15 | 15 |
| Profit Consistency | 15 | 15 |
| Margin Trend | 8 | 10 |
| Debt Quality | 10 | 10 |
| Ownership | 8 | 10 |
| Moat | 8 | 10 |
| Sustainability | 7 | 10 |
| Valuation Normalization | 6 | 10 |

**Visual colour coding:**
- 🟢 Green = Strong
- 🟡 Yellow = Average
- 🔴 Red = Weak

---

### 🚀 Growth Metrics Section

#### Revenue Growth
- **5Y Sales CAGR:** 22.5% — Status: Excellent
- Display: 3-Year CAGR, 5-Year CAGR, Revenue Trend Chart

#### EPS Growth
- **5Y EPS CAGR:** 26.8% — Status: Excellent
- Display: 3Y EPS CAGR, 5Y EPS CAGR, EPS Trend Chart

#### Profit Consistency
- **Positive Growth Years:** 5 / 5

| Year | Status |
|---|---|
| 2020 | ✅ |
| 2021 | ✅ |
| 2022 | ✅ |
| 2023 | ✅ |
| 2024 | ✅ |

---

### 🏆 Quality Section

#### ROCE
- **Average ROCE:** 24%
- Display: Current ROCE, 5Y Average ROCE, ROCE Trend

#### Margin Trend

| Period | OPM |
|---|---|
| 5Y Ago | 18% |
| Current | 23% |
| Change | +5% ✅ Improving Margins |

---

### 🛡️ Moat Analysis

| Attribute | Value |
|---|---|
| Brand Strength | Strong |
| Market Position | Industry Rank #2 |
| Switching Cost | High |
| Overall Moat Score | 8 / 10 — Strong Moat |

---

### 🔮 Growth Sustainability

| Factor | Detail |
|---|---|
| Industry Tailwind | Electronics Manufacturing — Industry Growth: High |
| Market Opportunity | Large Addressable Market — India + Export Opportunity |
| Innovation Score | Product Expansion — Strong |
| Sustainability Score | 9 / 10 — Long Growth Runway |

---

### 💰 Growth Valuation Section

#### PEG Ratio *(most important valuation metric)*
- **PEG = 0.95** → Badge: **BUY ZONE**

#### Fair Value
| Field | Value |
|---|---|
| Current Price | ₹950 |
| Growth Fair Value | ₹1,100 |
| Upside | 15.8% |

#### PE Normalization
| Field | Value |
|---|---|
| Current PE | 32 |
| 5Y Avg PE | 28 |
| Premium | +14% → Fair Valuation |

---

### 🚨 Risk Monitor

Display all triggered risk flags. Example:

- ⚠️ Debt/Equity > 0.8
- ⚠️ PEG approaching 1.5
- ⚠️ Margin growth slowing

If none: **No major risks detected**

---

### 📈 Growth Dashboard Meter

```
0----25----50----75----100----130
               ▲
            92 Score

0–69    → AVOID       🔴
70–84   → HOLD        🟡
85–104  → BUY         🟢
105–130 → STRONG BUY  🟢⭐
```

---

### 🎯 Final Decision Card

**FINAL DECISION: BUY**

Reasons:
- Revenue CAGR above 20%
- EPS CAGR above 25%
- Strong ROCE
- Strong moat
- Reasonable PEG

---

### 📋 Investment Checklist

| Check | Status |
|---|---|
| Revenue CAGR > 15% | ✅ |
| EPS CAGR > 15% | ✅ |
| ROCE > 15% | ✅ |
| Debt Low | ✅ |
| Margin Improving | ✅ |
| Strong Moat | ✅ |
| PEG < 1.2 | ✅ |
| Positive Cash Flow | ✅ |

**Summary:** Passed 8 / 8 Checks — Growth Stock Quality: **Excellent**

---

## Recommended Dashboard Layout

```
--------------------------------------------------
Growth Score Card
--------------------------------------------------
Growth Meter
--------------------------------------------------
Growth Metrics
  Revenue | EPS | Profit Consistency
--------------------------------------------------
Quality Metrics
  ROCE | Margin | Debt
--------------------------------------------------
Moat Analysis
--------------------------------------------------
Growth Sustainability
--------------------------------------------------
Valuation
  PEG | Fair Value | PE Normalization
--------------------------------------------------
Risk Monitor
--------------------------------------------------
Final Decision
--------------------------------------------------
```

This layout gives users a clear flow: **Growth → Quality → Moat → Sustainability → Valuation → Risks → Final Decision**, which mirrors how professional growth investors evaluate stocks.

---

## Growth Investment Engine — Functional Specification

### Objective

Create a separate Growth Investment Engine that identifies companies capable of compounding earnings and revenue at high rates over the next 5–10 years.

Unlike the Value Engine (which focuses on undervaluation), the Growth Engine focuses on:
- Revenue Growth
- Earnings Growth
- Capital Efficiency
- Business Quality
- Growth Valuation (PEG)

---

## Growth Score (100 Points)

### 1. Revenue Growth Score (20 Points)

**Purpose:** Measure business expansion.

**Data Required:** 5-Year Sales CAGR (%)

| Sales CAGR | Points |
|---|---|
| > 25% | 20 |
| 20–25% | 16 |
| 15–20% | 12 |
| 10–15% | 8 |
| < 10% | 0 |

---

### 2. EPS Growth Score (20 Points)

**Purpose:** Measure shareholder earnings growth.

**Data Required:** 5-Year EPS CAGR (%)

| EPS CAGR | Points |
|---|---|
| > 25% | 20 |
| 20–25% | 16 |
| 15–20% | 12 |
| 10–15% | 8 |
| < 10% | 0 |

---

### 3. ROCE Score (15 Points)

**Purpose:** Measure capital efficiency.

**Data Required:** Average ROCE for last 5 years

| ROCE | Points |
|---|---|
| > 25% | 15 |
| 20–25% | 12 |
| 15–20% | 8 |
| 10–15% | 4 |
| < 10% | 0 |

---

### 4. Profit Consistency Score (15 Points)

**Purpose:** Reward stable earnings growth.

**Data Required:** Profit growth for last 5 years

**Logic:** Count years with positive profit growth.

| Positive Years | Points |
|---|---|
| 5/5 | 15 |
| 4/5 | 10 |
| 3/5 | 5 |
| < 3 | 0 |

---

### 5. Operating Margin Trend Score (10 Points)

**Purpose:** Check if profitability is improving.

**Data Required:** OPM 5 years ago, Current OPM

**Calculation:** `OPM Change = Current OPM − OPM (5 Years Ago)`

| OPM Change | Points |
|---|---|
| > 3% Improvement | 10 |
| Stable (−3% to +3%) | 6 |
| Declining > 3% | 0 |

---

### 6. Debt Quality Score (10 Points)

**Purpose:** Avoid growth funded by excessive debt.

**Data Required:** Debt/Equity Ratio

| Debt/Equity | Points |
|---|---|
| < 0.3 | 10 |
| 0.3–0.5 | 8 |
| 0.5–1 | 4 |
| > 1 | 0 |

---

### 7. Ownership Confidence Score (10 Points)

**Purpose:** Measure management and institutional confidence.

**Promoter Holding (5 Points)**

| Condition | Points |
|---|---|
| > 50% and stable | 5 |
| Otherwise | 0 |

**FII/DII Trend (5 Points)**

| Condition | Points |
|---|---|
| Increasing over last year | 5 |
| Otherwise | 0 |

---

### Total Growth Score

```
growthScore =
  Revenue Score +
  EPS Score +
  ROCE Score +
  Profit Consistency +
  Margin Score +
  Debt Score +
  Ownership Score

Maximum Score = 100
```

### Growth Score Decision

| Score | Decision |
|---|---|
| >= 80 | BUY |
| 65–79 | HOLD |
| < 65 | AVOID |

---

## Growth Valuation Model

Use PEG-based valuation instead of Graham Number.

### Growth PE

```
growthPE = MIN(EPS_CAGR, 40)

Example:
  EPS CAGR = 22%
  growthPE = 22
```

### Growth Fair Value

```
fairValue = EPS × growthPE

Example:
  EPS = 50
  growthPE = 22
  fairValue = 50 × 22 = ₹1,100
```

### PEG Ratio

```
PEG = Current PE / EPS CAGR

Example:
  PE = 35
  EPS CAGR = 20
  PEG = 35 / 20 = 1.75
```

### PEG Zones

| PEG | Zone |
|---|---|
| < 0.8 | STRONG_BUY |
| 0.8–1.2 | BUY |
| 1.2–1.5 | HOLD |
| 1.5–2.0 | SELL |
| > 2.0 | AVOID |

---

## Final Decision Matrix

| Growth Score Decision | STRONG_BUY Zone | BUY Zone | HOLD Zone | SELL Zone | AVOID Zone |
|---|---|---|---|---|---|
| BUY | STRONG_BUY | BUY | HOLD | SELL | AVOID |
| HOLD | BUY | HOLD | HOLD | SELL | AVOID |
| AVOID | AVOID | AVOID | AVOID | AVOID | AVOID |

---

## Risk Rules

### Rule 1: Loss-Making Company
```
IF EPS <= 0
  Final Decision = AVOID
```

### Rule 2: Weak Revenue Growth
```
IF Sales CAGR < 10%
  Final Decision = AVOID
```

### Rule 3: Poor Capital Efficiency
```
IF ROCE < 15%
  Maximum Decision = HOLD
```

### Rule 4: High Debt
```
IF Debt/Equity > 1
  Downgrade Decision By One Level

  STRONG_BUY → BUY
  BUY → HOLD
  HOLD → SELL
  SELL → AVOID
```

### Rule 5: Promoter Pledge Risk
```
IF Promoter Pledge > 10%
  Final Decision = AVOID
```

---

## Additional Filters (Optional)

| Filter | Criteria |
|---|---|
| Market Leadership | Industry Rank <= 3 |
| Size Filter | Market Cap > ₹5,000 Cr |
| Quarterly Earnings Momentum | Last 4 Quarters Profit Growth > 15% |
| Cash Flow Quality | Operating Cash Flow > Net Profit |

---

## API Output

```json
{
  "growthValuation": {
    "growthScore": 84,
    "scoreDecision": "BUY",
    "fairValue": 1100,
    "growthPE": 22,
    "peg": 0.95,
    "pegZone": "BUY",
    "finalDecision": "BUY",
    "riskFlags": [],
    "confidence": "HIGH"
  }
}
```
