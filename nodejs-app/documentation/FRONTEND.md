# Frontend Documentation

## Overview
The Stock Analysis Tool frontend is a modern, responsive single-page application that displays investment analysis results with 4 scoring systems.

## File Structure

```
public/
├── index.html    # Main HTML structure
├── styles.css    # Separated CSS with design tokens
└── script.js     # JavaScript for dynamic updates
```

---

## HTML Structure (`index.html`)

### Sections
| Section ID | Purpose |
|------------|---------|
| `header` | App title and branding |
| `search-card` | Search input and analyze button |
| `loadingState` | Loading spinner during analysis |
| `resultsSection` | Main results display |
| `errorSection` | Error messages |
| `footer` | App footer |

### Score Cards
4 score cards with unique gradient backgrounds:
- `#piotroskiCard` - Purple gradient
- `#buffettCard` - Pink/red gradient
- `#grahamCard` - Blue/cyan gradient
- `#lynchCard` - Green gradient

### Factor Tabs
Interactive tabs to switch between scoring system details:
```html
<div class="factors-tabs">
    <button class="factor-tab active" data-tab="piotroski">Piotroski</button>
    <button class="factor-tab" data-tab="buffett">Buffett</button>
    <button class="factor-tab" data-tab="graham">Graham</button>
    <button class="factor-tab" data-tab="lynch">Lynch</button>
</div>
```

---

## CSS Design System (`styles.css`)

### CSS Variables (Design Tokens)
```css
:root {
    /* Colors */
    --primary: #6366f1;
    --success: #10b981;
    --warning: #f59e0b;
    --danger: #ef4444;
    
    /* Score Gradients */
    --score-piotroski: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    --score-buffett: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
    --score-graham: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
    --score-lynch: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
    
    /* Shadows */
    --shadow-lg: 0 20px 25px -5px rgb(0 0 0 / 0.1);
}
```

### Key Classes
| Class | Purpose |
|-------|---------|
| `.score-card` | Investment score card container |
| `.decision-badge` | BUY/HOLD/AVOID badge |
| `.factor-item` | Individual factor row |
| `.factor-item.pass` | Green left border for passing factors |
| `.factor-item.fail` | Red left border for failing factors |

---

## JavaScript (`script.js`)

### Main Functions

| Function | Purpose |
|----------|---------|
| `analyzeStock(name)` | Initiates stock analysis via API |
| `displayResults(data)` | Renders all results to DOM |
| `updateScoreCard(type, scoreData)` | Updates individual score card |
| `renderFactors(type)` | Renders factor details for selected tab |

### Event Handlers
```javascript
// Search input - Enter key
searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') analyzeStock();
});

// Factor tab switching
document.querySelectorAll('.factor-tab').forEach(tab => {
    tab.addEventListener('click', () => {
        currentFactorsTab = tab.dataset.tab;
        renderFactors(currentFactorsTab);
    });
});
```

---

## Color Encoding

### Decision Badge Colors
| Decision | Class | Color |
|----------|-------|-------|
| BUY | `.decision-badge.buy` | Green gradient |
| HOLD | `.decision-badge.hold` | Orange gradient |
| AVOID | `.decision-badge.avoid` | Red gradient |

### Factor Status Colors
| Status | Class | Visual |
|--------|-------|--------|
| Pass | `.factor-item.pass` | Green left border |
| Fail | `.factor-item.fail` | Red left border |

### Score Card Status
| Status | Display |
|--------|---------|
| ≥7 | Green "≥7 PASS" badge |
| <7 | Red "<7" badge |

---

## Responsive Design

Breakpoints handled in CSS:
```css
@media (max-width: 768px) {
    .scores-grid { grid-template-columns: 1fr; }
    .search-form { flex-direction: column; }
}
```

---

## External Dependencies

| Resource | Purpose |
|----------|---------|
| Google Fonts (Inter) | Typography |
| Font Awesome 6.4 | Icons |
