# Valuation & Decision Engine

A rule-based stock valuation system that calculates fair value using Graham and Lynch methodologies, determines investment recommendations by combining valuation with the 4-score system.

---

## Overview

The Valuation Engine provides:
1. **Fair Value Calculation** using two methods (Graham Number + Lynch Fair Value)
2. **Price Band Classification** with 5 zones
3. **Final Decision Matrix** combining score + valuation
4. **Risk Rule Enforcement** for safety overrides

---

## Core Calculations

### 1. Graham Number (Value Anchor)

The Graham Number represents the maximum price a defensive investor should pay for a stock.

```
Graham Number = √(22.5 × EPS × Book Value)
```

| Variable | Description | Source |
|----------|-------------|--------|
| `22.5` | Constant (15 P/E × 1.5 P/B) | Graham's formula |
| `EPS` | Earnings Per Share (TTM) | `data.latestEPS` |
| `Book Value` | Book Value Per Share | `data.bookValue` |

**Data Priority**: Uses Screener.in's Graham Number if available (more accurate), otherwise calculates using the formula above.

**Example**:
```
EPS = 197.47, Book Value = 1116
Graham Number = √(22.5 × 197.47 × 1116) = √4,958,506 = 2,227
```

---

### 2. Lynch Fair Value (Growth Anchor)

Peter Lynch's fair value focuses on growth at a reasonable price (GARP).

```
Lynch Fair Value = EPS × Growth PE
```

| Variable | Description | Constraint |
|----------|-------------|------------|
| `EPS` | Earnings Per Share (TTM) | Must be positive |
| `Growth PE` | 5-Year Profit Growth | **Capped at 25** |

**Cap Logic**: Lynch suggested that even the fastest growers shouldn't be valued above 25× PE.

**Fallback**: If growth is negative or zero, uses a conservative PE of 10.

**Example**:
```
EPS = 197.47, 5Y Profit Growth = 14%
Lynch Fair Value = 197.47 × 14 = 2,764.58
```

---

### 3. Composite Fair Value

The final fair value averages both methodologies:

```
Fair Value = (Graham Number + Lynch Fair Value) / 2
```

**Example**:
```
Fair Value = (2,227 + 2,764.58) / 2 = 2,495.79
```

---

## Price Bands

Price bands define buy/sell zones relative to Fair Value:

| Zone | Condition | Multiplier | Description |
|------|-----------|------------|-------------|
| **Strong Buy** | Price ≤ Fair Value × 0.75 | 75% | Deeply undervalued |
| **Buy** | Price ≤ Fair Value × 0.85 | 85% | Undervalued |
| **Hold** | Price ≤ Fair Value × 1.10 | 110% | Fairly valued |
| **Sell** | Price ≤ Fair Value × 1.25 | 125% | Overvalued |
| **Strong Sell** | Price > Fair Value × 1.25 | >125% | Highly overvalued |

**Example** (Fair Value = 2,495.79):
```
Strong Buy Below: 2,495.79 × 0.75 = ₹1,871.84
Buy Below: 2,495.79 × 0.85 = ₹2,121.42
Hold Above: 2,495.79 × 1.10 = ₹2,745.37
Sell Above: 2,495.79 × 1.25 = ₹3,119.74
```

---

## Decision Matrix

The final investment decision combines the **4-Score System** decision with the **Price Zone**.

### Score-Based Decision (All 4 Scores Considered)

The Score Decision is derived from **ALL 4 investment methodologies**:

| # | Score | Creator | Focus | Max Points |
|---|-------|---------|-------|------------|
| 1 | **Piotroski F-Score** | Joseph Piotroski | Financial Health | 9 |
| 2 | **Buffett Score** | Warren Buffett | Business Quality | 10 |
| 3 | **Graham Score** | Benjamin Graham | Value Investing | 10 |
| 4 | **Lynch Score** | Peter Lynch | GARP Strategy | 10 |

#### Calculation Logic

```javascript
// Each score is normalized to percentage (out of 100%)
// A score "passes" if it reaches 70% or higher

scoresAbove7 = [piotroski, buffett, graham, lynch]
                .filter(score => score.percent >= 70)
                .length;
```

| Condition | Score Decision |
|-----------|----------------|
| **3+ scores ≥ 70%** | BUY |
| **2 scores ≥ 70%** | HOLD |
| **< 2 scores ≥ 70%** | AVOID |

#### Example: ALKEM Laboratories

| Score | Value | Percent | ≥70%? |
|-------|-------|---------|-------|
| Piotroski | 6/9 | 67% | ❌ No |
| Buffett | 10/10 | 100% | ✅ Yes |
| Graham | 8/10 | 80% | ✅ Yes |
| Lynch | 7/10 | 70% | ✅ Yes |

**Result**: `scoresAbove7 = 3` → Score Decision = **BUY**

> [!IMPORTANT]
> All 4 scores contribute equally to the decision. Even if Piotroski and Buffett individually fail, a stock can still receive a BUY decision if the other scores compensate.

### Matrix Table

The Score Decision is then combined with the Price Zone:

| Score Decision | Strong Buy Zone | Buy Zone | Hold Zone | Sell Zone | Strong Sell Zone |
|----------------|-----------------|----------|-----------|-----------|-----------------|
| **BUY** | STRONG_BUY | BUY | HOLD | AVOID | AVOID |
| **HOLD** | ACCUMULATE | HOLD | HOLD | SELL | SELL |
| **AVOID** | AVOID | AVOID | AVOID | AVOID | AVOID |

### Complete Example: ALKEM

```
Step 1: Calculate Score Decision
  - Piotroski: 6/9 (67%) ❌
  - Buffett: 10/10 (100%) ✅
  - Graham: 8/10 (80%) ✅
  - Lynch: 7/10 (70%) ✅
  - scoresAbove7 = 3 → Score Decision: BUY

Step 2: Determine Price Zone
  - Current Price: ₹5,750
  - Fair Value: ₹2,495.79
  - Sell Threshold: ₹3,119.74
  - 5,750 > 3,119.74 → Price Zone: STRONG_SELL

Step 3: Apply Matrix
  - BUY + STRONG_SELL → Final Decision: AVOID

Interpretation: Quality stock (3 scores pass), but too expensive (>125% of fair value)
```

---

## Risk/Safety Rules

Three safety rules can override or modify the final decision:

### Rule 1: Loss-Making Company

```
IF EPS ≤ 0 → Final Decision = AVOID
```

**Rationale**: Cannot calculate fair value for unprofitable companies.

### Rule 2: High Debt Override

```
IF Debt/Equity > 2 → Cap decision at HOLD
```

**Example**: Even if valuation says BUY, high debt caps it to HOLD.

### Rule 3: PEG Risk Downgrade

```
IF PEG Ratio > 2.5 → Downgrade decision by one level
```

| Original | Downgraded To |
|----------|---------------|
| STRONG_BUY | BUY |
| BUY | HOLD |
| HOLD | SELL |
| SELL | AVOID |

---

## API Response Fields

### Valuation Object

```json
{
  "valuation": {
    "currentPrice": 5750,
    "fairValue": 2495.79,
    "grahamNumber": 2227,
    "lynchFairValue": 2764.58,
    "priceBands": {
      "strongBuyBelow": 1871.84,
      "buyBelow": 2121.42,
      "holdAbove": 2745.37,
      "sellAbove": 3119.74
    },
    "priceZone": "STRONG_SELL",
    "scoreDecision": "BUY",
    "finalDecision": "AVOID",
    "valuationStatus": "HIGHLY_OVERVALUED",
    "confidence": "HIGH",
    "riskFlags": ["High Debt (D/E: 2.5 > 2)"],
    "dataSource": {
      "grahamNumber": "screener"
    }
  }
}
```

### Field Reference

| Field | Type | Description |
|-------|------|-------------|
| `currentPrice` | number | Current market price |
| `fairValue` | number | Composite fair value (avg of Graham + Lynch) |
| `grahamNumber` | number | Graham Number value |
| `lynchFairValue` | number | Lynch Fair Value |
| `priceBands.strongBuyBelow` | number | Maximum price for Strong Buy zone |
| `priceBands.buyBelow` | number | Maximum price for Buy zone |
| `priceBands.holdAbove` | number | Minimum price for Hold zone |
| `priceBands.sellAbove` | number | Minimum price for Sell zone |
| `priceZone` | string | Current zone: STRONG_BUY, BUY, HOLD, SELL, STRONG_SELL |
| `scoreDecision` | string | Decision from 4-score system: BUY, HOLD, AVOID |
| `finalDecision` | string | Final combined decision |
| `valuationStatus` | string | Human-readable status |
| `confidence` | string | HIGH, MEDIUM, or LOW based on data quality |
| `riskFlags` | array | List of triggered risk rules |
| `dataSource.grahamNumber` | string | "screener" or "calculated" |

### Valuation Status Values

| Status | Description |
|--------|-------------|
| `DEEPLY_UNDERVALUED` | Price in Strong Buy zone |
| `UNDERVALUED` | Price in Buy zone |
| `FAIRLY_VALUED` | Price in Hold zone |
| `OVERVALUED` | Price in Sell zone |
| `HIGHLY_OVERVALUED` | Price in Strong Sell zone |
| `NOT_APPLICABLE` | Cannot calculate (e.g., loss-making) |

### Final Decision Values

| Decision | Meaning |
|----------|---------|
| `STRONG_BUY` | Excellent quality + deeply undervalued |
| `BUY` | Good quality at reasonable price |
| `ACCUMULATE` | Moderate quality but price attractive enough |
| `HOLD` | Either fairly valued or quality concerns |
| `SELL` | Overvalued or quality issues |
| `AVOID` | Either poor quality or severely overvalued |
| `DATA_INSUFFICIENT` | Missing required data for calculation |

---

## UI Components

### Price Meter

The visual meter shows 5 color-coded zones:
- **Green** (Strong Buy) → **Light Green** (Buy) → **Yellow** (Hold) → **Orange** (Sell) → **Red** (Strong Sell)

### Interactive Features

| Feature | Behavior |
|---------|----------|
| **Hover** | Shows threshold prices with connecting lines |
| **Price Labels** | Staggered at 2 heights to prevent overlap |
| **Current Price Marker** | Purple indicator with always-visible line |
| **Glass Effect** | iOS-style backdrop blur on all labels |

---

## Source Files

| File | Purpose |
|------|---------|
| `src/services/valuationEngine.js` | Core calculation logic |
| `src/services/analyzer.js` | Integration point |
| `public/index.html` | Valuation section HTML |
| `public/styles.css` | Meter and label styling |
| `public/script.js` | Dynamic rendering functions |

---

## Related Documentation

- [Scoring Methodology](SCORING.md) - Details on the 4-score system
- [API Reference](API_BRIDGE.md) - Full API documentation
- [Backend Services](BACKEND.md) - Service architecture
