# Frontend Documentation

## Overview

The frontend is a single-page application (SPA) built with vanilla HTML, CSS, and JavaScript. It provides a user interface for searching and analyzing Indian stocks.

## Technology Stack

| Technology | Purpose |
|------------|---------|
| HTML5 | Structure |
| TailwindCSS 2.2.19 | Styling (via CDN) |
| Font Awesome 6.0 | Icons |
| Vanilla JavaScript | Logic & API calls |

## File Structure

```
public/
├── index.html      # Main HTML page
└── script.js       # JavaScript logic
```

---

## index.html

### Page Sections

| Section | Element ID | Purpose |
|---------|------------|---------|
| Header | - | Branding with gradient background |
| Search | `searchInput`, `analyzeBtn` | Company search input with autocomplete |
| Loading | `loadingState` | Spinner during API calls |
| Results | `resultsSection` | Analysis results display |
| Error | `errorSection` | Error message display |
| Footer | - | Attribution |

### Custom CSS Classes

#### Gradient Backgrounds
```css
.gradient-bg {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}
```
- Used for header
- Colors: Purple gradient (#667eea → #764ba2)

#### Metric Card Status Colors

| Class | Gradient | Usage |
|-------|----------|-------|
| `.metric-card.pass` | `#4facfe → #00f2fe` | Blue - Passing metrics |
| `.metric-card.fail` | `#fa709a → #fee140` | Pink/Yellow - Failing metrics |
| `.metric-card.na` | `#a8edea → #fed6e3` | Light teal/pink - N/A metrics |

#### Loading Spinner
```css
.loading-spinner {
    border: 3px solid #f3f3f3;
    border-top: 3px solid #3498db;
    animation: spin 1s linear infinite;
}
```

### HTML Element IDs

| ID | Type | Purpose |
|----|------|---------|
| `searchInput` | input | Company search |
| `analyzeBtn` | button | Trigger analysis |
| `loadingState` | div | Loading spinner container |
| `resultsSection` | div | Results container |
| `companyName` | h3 | Display company name |
| `companyUrl` | a | Link to Screener.in |
| `verdictBadge` | span | BUY/HOLD/SELL badge |
| `scoreDisplay` | div | Score X/Y |
| `scoreBar` | div | Progress bar |
| `percentageDisplay` | div | Score percentage |
| `roeValue`, `roeStatus` | p, span | ROE metric |
| `peValue`, `peStatus` | p, span | P/E metric |
| `debtValue`, `debtStatus` | p, span | Debt/Equity metric |
| `roceValue`, `roceStatus` | p, span | ROCE metric |
| `cashFlowValue`, `cashFlowStatus` | p, span | Cash Flow metric |
| `pegValue`, `pegStatus` | p, span | PEG metric |
| `aiInsights` | div | AI-generated insights |
| `errorMessage` | p | Error text |
| `suggestions` | div | Autocomplete dropdown |

---

## script.js

### Global Variables

```javascript
let currentAnalysis = null;   // Stores current analysis data
let suggestions = [];         // Autocomplete suggestions
let verdictCache = {};        // Cache for verdict colors
let isAnalyzing = false;      // Prevents duplicate API calls
```

### Core Functions

#### 1. `analyzeStock(companyNameOrSlug)`
Main analysis function using GET endpoint.
```javascript
// API call
GET /api/analyze/{companyName}
```

#### 2. `analyzeStockWithUrl(companyUrl, companyName)`
Analysis using POST endpoint (for autocomplete selections).
```javascript
// API call
POST /api/analyze
Body: { companyUrl, companyName }
```

#### 3. `displayResults(data)`
Populates the UI with analysis data.

#### 4. `updateMetric(metricName, value, status)`
Updates individual metric cards.

#### 5. `fetchSuggestions()` (debounced, 300ms)
Fetches autocomplete suggestions.
```javascript
GET /api/search?query={query}
```

### Helper Functions

| Function | Purpose |
|----------|---------|
| `formatValue(metricName, value)` | Formats metric values for display |
| `getVerdictClass(verdict)` | Returns CSS class for verdict badge |
| `getScoreBarClass(percentage)` | Returns CSS class for score bar |
| `getStatusClass(status)` | Returns CSS class for metric status |
| `showLoading(show)` | Toggles loading state |
| `showResults()` / `hideResults()` | Toggle results visibility |
| `showError(message)` / `hideError()` | Toggle error section |
| `hideSuggestions()` | Hides autocomplete dropdown |
| `renderSuggestions()` | Renders autocomplete options |
| `verdictBadgeHtml(verdict)` | Returns HTML for verdict badge |
| `debounce(fn, delay)` | Debounce utility |

### Color Encoding Logic

#### Verdict Badge Colors
```javascript
function getVerdictClass(verdict) {
    switch (verdict) {
        case 'BUY':  return 'bg-green-500';   // Green
        case 'HOLD': return 'bg-yellow-500';  // Yellow
        case 'SELL': return 'bg-red-500';     // Red
        case 'NA':   return 'bg-gray-500';    // Gray
    }
}
```

#### Score Bar Colors
```javascript
function getScoreBarClass(percentage) {
    if (percentage >= 70) return 'bg-green-500';  // Green
    if (percentage >= 50) return 'bg-yellow-500'; // Yellow
    return 'bg-red-500';                          // Red
}
```

#### Metric Status Colors
```javascript
function getStatusClass(status) {
    switch (status) {
        case 'PASS': return 'pass bg-green-100 text-green-800';
        case 'FAIL': return 'fail bg-red-100 text-red-800';
        case 'NA':   return 'na bg-gray-100 text-gray-800';
    }
}
```

### Value Formatting

```javascript
function formatValue(metricName, value) {
    switch (metricName) {
        case 'roe':
        case 'roce':
            return `${value.toFixed(2)}%`;    // 15.25%
        case 'pe':
        case 'peg':
            return value.toFixed(1);          // 18.5
        case 'debt':
            return value.toFixed(2);          // 0.45
        case 'cashFlow':
            return value.toLocaleString();    // 1,234,567
    }
}
```

### Event Listeners

| Event | Element | Action |
|-------|---------|--------|
| `keypress` (Enter) | `searchInput` | Trigger analysis |
| `click` | `analyzeBtn` | Trigger analysis |
| `input` | `searchInput` | Fetch suggestions (debounced) |
| `click` | document | Hide suggestions if clicking outside |
| `blur` | `searchInput` | Hide suggestions (200ms delay) |

---

## UI Components

### 1. Search Box
- Full-width input with rounded corners
- Blue border on focus
- Autocomplete dropdown appears after 2 characters

### 2. Metric Cards
- 6 cards in responsive grid (1/2/3 column)
- Gradient backgrounds change based on PASS/FAIL/NA
- Display value and status badge

### 3. Score Bar
- Horizontal progress bar
- Color changes based on percentage threshold
- Animated width transition

### 4. AI Insights Section
- Renders HTML content from AI
- Blue-bordered info box style

### 5. Error Section
- Red-themed error display
- Shows error message with icon
