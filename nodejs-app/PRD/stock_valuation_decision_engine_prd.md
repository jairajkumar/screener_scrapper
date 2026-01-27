# 📄 Product Requirements Document (PRD)

## Product Name
**Stock Valuation & Decision Engine**

## Version
v1.0

## Owner
Product / Quant Engineering Team

## Status
Implementation Ready

---

## 1. 🎯 Objective

Build a **rule-based, explainable stock valuation and recommendation engine** that:
- Calculates fair value and price bands for any stock
- Combines valuation with multi-factor scoring models
- Outputs clear investment actions (STRONG BUY → AVOID)
- Is deterministic, auditable, and regulator-friendly

This system is designed for **retail investors**, **research platforms**, and **internal screening tools**.

---

## 2. 👤 Target Users

- Retail investors
- Financial research platforms
- Internal equity research teams
- Quant developers

---

## 3. 🧠 Core Philosophy

- No machine learning in v1
- No dynamic or hidden weights
- Fully explainable calculations
- Inspired by proven investment frameworks:
  - Benjamin Graham (Value & Safety)
  - Peter Lynch (Growth at Reasonable Price)
  - Piotroski (Financial Quality)
  - Warren Buffett (Business Quality)

---

## 4. 📥 Input Data Requirements

### Mandatory Fields

| Field | Source |
|------|-------|
| Current Price | Market Feed |
| EPS (TTM) | Screener |
| Book Value | Screener |
| PE Ratio | Screener |
| Industry PE | Screener |
| 5Y Profit Growth (%) | Screener |
| Debt to Equity | Screener |

### Validation Rules
- EPS must be numeric
- Growth can be negative
- Missing mandatory data → return `DATA_INSUFFICIENT`

---

## 5. 🧮 Fair Value Calculation Algorithm

### 5.1 Graham Fair Value (Value Anchor)

```text
GrahamNumber = sqrt(22.5 × EPS × BookValue)
```

Purpose:
- Downside protection
- Conservative intrinsic value

---

### 5.2 Lynch Fair Value (Growth Anchor)

**Step 1: Cap Growth PE**
```text
GrowthPE = min(ProfitGrowth5Y, 25)
```

**Step 2: Calculate Lynch Fair Value**
```text
LynchFairValue = EPS × GrowthPE
```

Purpose:
- Growth-aware valuation
- Prevents overpaying for high-growth stocks

---

### 5.3 Composite Fair Value (Final)

```text
FairValue = (GrahamNumber + LynchFairValue) / 2
```

Purpose:
- Balance between value and growth
- Reduces model bias

---

## 6. 💰 Price Band Calculation

Using FairValue:

```text
StrongBuyPrice = FairValue × 0.75
BuyPrice       = FairValue × 0.85
HoldUpperPrice = FairValue × 1.10
SellPrice      = FairValue × 1.25
```

### Price Zones

| Zone | Condition |
|----|----|
| STRONG BUY | Price ≤ 0.75 × FairValue |
| BUY | 0.75 – 0.85 × FairValue |
| HOLD | 0.85 – 1.10 × FairValue |
| SELL | 1.10 – 1.25 × FairValue |
| STRONG SELL | > 1.25 × FairValue |

---

## 7. 📊 Score-Based Decision Input

The system consumes an **existing scoring engine output**:

```json
{
  "piotroski": 0–9,
  "buffett": 0–10,
  "graham": 0–10,
  "lynch": 0–10
}
```

### Score Decision Rules

| Condition | Score Decision |
|---------|----------------|
| ≥ 3 scores ≥ 7 | BUY |
| Exactly 2 scores ≥ 7 | HOLD |
| Else | AVOID |

---

## 8. 🔀 Final Decision Logic (Score + Price)

| Score Decision | Price Zone | Final Decision |
|---------------|-----------|----------------|
| BUY | STRONG BUY | STRONG BUY |
| BUY | BUY | BUY |
| BUY | HOLD | HOLD (Overvalued) |
| BUY | SELL+ | AVOID |
| HOLD | STRONG BUY | ACCUMULATE |
| HOLD | BUY | HOLD |
| HOLD | SELL+ | SELL |
| AVOID | Any | AVOID |

---

## 9. 🚨 Risk & Safety Rules (Mandatory)

### Rule 1: Loss Making Company
```text
If EPS ≤ 0 → Final Decision = AVOID
```

### Rule 2: High Debt
```text
If DebtToEquity > 2 → Cap Final Decision at HOLD
```

### Rule 3: PEG Risk
```text
If (PE / ProfitGrowth5Y) > 2.5 → Downgrade one level
```

---

## 10. 📤 Output Schema (API Ready)

```json
{
  "currentPrice": 1458,
  "fairValue": 1680,
  "priceBands": {
    "strongBuyBelow": 1260,
    "buyBelow": 1428,
    "holdAbove": 1848,
    "sellAbove": 2100
  },
  "scoreDecision": "BUY",
  "priceZone": "BUY",
  "finalDecision": "BUY",
  "valuationStatus": "UNDERVALUED",
  "confidence": "HIGH"
}
```

---

## 11. 🧪 Testing & Validation

- Unit test each valuation formula
- Backtest on at least 5 years historical data
- Validate against known large-cap stocks
- Ensure deterministic output

---

## 12. 🚀 Future Enhancements (Out of Scope v1)

- Sector-specific PE caps
- Volatility-adjusted bands
- ML-based ranking layer
- Analyst override controls
- Portfolio-level optimization

---

## 13. ✅ Success Metrics

- 100% explainable outputs
- Zero hidden weights
- Consistent results across runs
- Positive backtest alpha vs index

---

**END OF PRD**

