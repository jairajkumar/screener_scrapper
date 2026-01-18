# Testing Documentation

## Overview

Comprehensive test suite for the Stock Analysis Tool covering:
- **Unit Tests**: Scoring function validation
- **Integration Tests**: API endpoint testing
- **E2E Tests**: Live scraper validation
- **HTML Structure Monitoring**: Detect Screener.in changes

---

## Test Structure

```
tests/
├── setup.js                     # Jest setup configuration
├── mocks/
│   └── sampleData.js           # Mock data & expected results
├── unit/
│   ├── piotroskiScore.test.js  # Piotroski F-Score tests
│   ├── buffettScore.test.js    # Warren Buffett Score tests
│   ├── grahamScore.test.js     # Benjamin Graham Score tests
│   ├── lynchScore.test.js      # Peter Lynch Score tests
│   └── analyzer.test.js        # Decision logic tests
├── integration/
│   └── api.test.js             # API endpoint tests
└── e2e/
    ├── htmlStructure.test.js   # HTML structure monitoring
    └── scraper.test.js         # Live scraper validation
```

---

## Running Tests

### Quick Commands

| Command | Description |
|---------|-------------|
| `npm test` | Run unit tests only |
| `npm run test:unit` | Run unit tests with verbose output |
| `npm run test:integration` | Run API tests |
| `npm run test:e2e` | Run all E2E tests |
| `npm run test:html` | Check Screener.in HTML structure |
| `npm run test:all` | Run all tests |
| `npm run test:coverage` | Generate coverage report |

### Recommended Workflow

```bash
# During development - run unit tests
npm test

# Before commit - run unit + integration
npm run test:unit && npm run test:integration

# Weekly/CI - run all including E2E
npm run test:all
```

---

## Unit Tests

### What They Test
- Each scoring function (9 Piotroski, 5 Buffett, 6 Graham, 4 Lynch factors)
- Score calculation accuracy
- Interpretation strings
- Edge cases (null values, zero growth, etc.)

### Sample Data
Tests use mock data in `tests/mocks/sampleData.js`:
- `samplePetronetData`: Based on actual PETRONET financials
- `sampleWeakData`: Poor financial health for failure cases
- `expectedPetronetResults`: Known correct outputs

### Example Output
```
PASS  tests/unit/piotroskiScore.test.js
  Piotroski F-Score
    with healthy company data (PETRONET)
      ✓ returns correct structure (2 ms)
      ✓ calculates score between 0 and 9
      ✓ Factor 1: Net Profit Positive - passes for positive profit
      ...
```

---

## HTML Structure Monitoring

### Purpose
Detect when Screener.in changes their HTML structure, which would break the scraper.

### Critical Selectors Monitored

| Selector | Purpose |
|----------|---------|
| `#top-ratios li` | Stock ratios (P/E, ROE, etc.) |
| `#profit-loss table tbody tr` | P&L statement rows |
| `#balance-sheet table tbody tr` | Balance sheet rows |
| `#cash-flow table tbody tr` | Cash flow rows |
| `table.ranges-table` | Growth rates (5Y, 10Y) |
| `#peers` | Industry P/E |

### What It Checks
1. Section elements exist
2. Table structure is intact
3. Required row labels are present
4. Data can be extracted

### Alert Trigger
If any test fails, it means:
- Screener.in changed their HTML
- Selectors in `scraper.js` need updating

### Run Command
```bash
npm run test:html
```

---

## E2E Scraper Tests

### Purpose
Validate that the scraper correctly extracts data from live Screener.in.

### Test Stocks
- **PETRONET**: Primary test case (matches PDF example)
- **TCS**: High-quality business validation
- **Invalid company**: Error handling

### Validations
- All required fields are extracted
- Data types are correct (numbers, arrays)
- Historical data has sufficient years
- Calculated ratios are computed

### Run Command
```bash
npm run test:scraper
```

---

## Integration Tests

### Purpose
Comprehensive tests validating **every scraped element** and all scoring factors.

### Test Coverage (100+ tests)

| Category | Tests |
|----------|-------|
| Response Structure | 5 tests |
| Top Card Ratios | 8 tests |
| Calculated Ratios | 8 tests |
| Growth Rates | 5 tests |
| Historical Data Arrays | 14 tests |
| Latest Values | 5 tests |
| Debug Info | 4 tests |
| Analysis Object | 10 tests |
| Piotroski Factors | 9 tests |
| Buffett Factors | 5 tests |
| Graham Factors | 6 tests |
| Lynch Factors | 4 tests |
| Cross-Company (TCS) | 5 tests |
| Data Consistency | 4 tests |

### What Gets Validated

**Top Card Ratios:**
- Stock P/E, ROE, ROCE, Book Value
- Dividend Yield, Market Cap, Current Price
- Industry P/E

**Calculated Ratios:**
- Debt to Equity, ROA, Asset Turnover
- FCF, PEG Ratio, Price to Book
- Graham Number, Current Ratio

**Historical Data (all 14 arrays):**
- Sales, Net Profit, OPM %
- EPS, Dividend Payout
- Borrowings, Equity Capital, Reserves
- Total Assets, CFO, CFI, CFF
- Other Assets, Other Liabilities

**All 24 Scoring Factors:**
- 9 Piotroski factors
- 5 Buffett factors
- 6 Graham factors
- 4 Lynch factors

**Data Consistency:**
- Debt/Equity matches calculation
- Graham Number matches formula
- Latest values match array ends

### Run Command
```bash
npm run test:integration
```

---

## CI/CD Integration

### GitHub Actions Workflow

Create `.github/workflows/tests.yml`:

```yaml
name: Run Tests

on:
  push:
    branches: [master, feature/*]
  pull_request:
    branches: [master]
  schedule:
    - cron: '0 0 * * *'  # Daily at midnight

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run test:unit

  html-structure-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: |
          sudo apt-get install -y chromium-browser
          npm run test:html
      - name: Create Issue on Failure
        if: failure()
        uses: actions/github-script@v6
        with:
          script: |
            github.rest.issues.create({
              owner: context.repo.owner,
              repo: context.repo.repo,
              title: '🚨 Screener.in HTML Structure Changed',
              body: 'The HTML structure tests failed. Scraper selectors may need updating.'
            })
```

---

## Troubleshooting

### Tests Timeout
```bash
# Increase timeout for slow network
npm run test:e2e -- --testTimeout=180000
```

### Chrome/Puppeteer Issues
```bash
# Install Chrome dependencies (Linux)
sudo apt-get install -y chromium-browser

# Set Chrome path (Mac)
export CHROME_PATH="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
```

### Mock Data Mismatch
Update `tests/mocks/sampleData.js` with current values from Screener.in.

---

## Coverage Report

Generate HTML coverage report:
```bash
npm run test:coverage
```

View at: `coverage/lcov-report/index.html`

### Coverage Targets
| Category | Target |
|----------|--------|
| Statements | > 80% |
| Branches | > 75% |
| Functions | > 85% |
| Lines | > 80% |
