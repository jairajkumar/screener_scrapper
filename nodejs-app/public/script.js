// Stock Analysis Tool - Modern Frontend Script
// Handles 4-Score Investment Analysis Display

// ===== Global State =====
let currentAnalysis = null;
let currentFactorsTab = 'piotroski';
let isAnalyzing = false;

// ===== DOM Elements =====
const searchInput = document.getElementById('searchInput');
const analyzeBtn = document.getElementById('analyzeBtn');
const loadingState = document.getElementById('loadingState');
const resultsSection = document.getElementById('resultsSection');
const errorSection = document.getElementById('errorSection');
const suggestionsDiv = document.getElementById('suggestions');

// ===== Event Listeners =====
searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        hideSuggestions();
        if (!isAnalyzing) analyzeStock();
    }
});

analyzeBtn.addEventListener('click', (e) => {
    e.preventDefault();
    if (!isAnalyzing) analyzeStock();
});

document.addEventListener('click', (e) => {
    if (!searchInput.contains(e.target) && !suggestionsDiv.contains(e.target)) {
        hideSuggestions();
    }
});

// Factor tabs
document.querySelectorAll('.factor-tab').forEach(tab => {
    tab.addEventListener('click', () => {
        document.querySelectorAll('.factor-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        currentFactorsTab = tab.dataset.tab;
        if (currentAnalysis) {
            renderFactors(currentFactorsTab);
        }
    });
});

// ===== Main Analysis Function =====
async function analyzeStock(companyNameOrSlug) {
    if (isAnalyzing) return;

    const companyName = companyNameOrSlug || searchInput.value.trim();
    if (!companyName) {
        showError('Please enter a company name');
        return;
    }

    isAnalyzing = true;
    showLoading(true);
    hideResults();
    hideError();

    try {
        const response = await fetch(`/api/analyze/${encodeURIComponent(companyName)}`);
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Analysis failed');
        }

        currentAnalysis = data;
        displayResults(data);

    } catch (error) {
        console.error('Analysis error:', error);
        showError(error.message || 'Failed to analyze stock');
    } finally {
        showLoading(false);
        isAnalyzing = false;
    }
}

// ===== Display Results =====
function displayResults(data) {
    // Company info
    document.getElementById('companyName').textContent = data.company.name;
    document.getElementById('companyUrl').href = data.company.url;

    const analysis = data.analysis;

    // Final Decision Badge
    const verdictBadge = document.getElementById('verdictBadge');
    const verdictText = document.getElementById('verdictText');
    const verdictSubtitle = document.getElementById('verdictSubtitle');

    verdictText.textContent = analysis.finalDecision;
    verdictSubtitle.textContent = `${analysis.scoresAbove7} out of 4 scores ≥ 7`;

    verdictBadge.className = 'decision-badge ' + analysis.finalDecision.toLowerCase();

    // Update each score card
    updateScoreCard('piotroski', analysis.piotroski);
    updateScoreCard('buffett', analysis.buffett);
    updateScoreCard('graham', analysis.graham);
    updateScoreCard('lynch', analysis.lynch);

    // Render factors for current tab
    renderFactors(currentFactorsTab);

    // AI Insights
    const aiInsightsDiv = document.getElementById('aiInsights');
    if (data.aiInsights && !data.aiInsights.includes('Error')) {
        aiInsightsDiv.innerHTML = formatAIInsights(data.aiInsights);
    } else {
        aiInsightsDiv.innerHTML = '<p>AI insights are currently unavailable. Please check your Gemini API key.</p>';
    }

    // Show results
    showResults();
}

// ===== Update Score Card =====
function updateScoreCard(type, scoreData) {
    const scoreEl = document.getElementById(`${type}Score`);
    const barEl = document.getElementById(`${type}Bar`);
    const interpretationEl = document.getElementById(`${type}Interpretation`);
    const statusEl = document.getElementById(`${type}Status`);

    scoreEl.textContent = scoreData.score;
    barEl.style.width = `${scoreData.percent}%`;
    interpretationEl.textContent = scoreData.interpretation;

    // Status badge
    const isPass = scoreData.score >= 7;
    statusEl.className = `score-card-status ${isPass ? 'pass' : 'fail'}`;
    statusEl.innerHTML = `<i class="fas fa-${isPass ? 'check' : 'times'}"></i> ${isPass ? '≥7 PASS' : '<7'}`;
}

// ===== Render Factor Details =====
function renderFactors(type) {
    const factorsList = document.getElementById('factorsList');

    if (!currentAnalysis || !currentAnalysis.analysis || !currentAnalysis.analysis[type]) {
        factorsList.innerHTML = '<p>No factor data available</p>';
        return;
    }

    const factors = currentAnalysis.analysis[type].factors;

    factorsList.innerHTML = Object.entries(factors).map(([key, factor]) => {
        const displayValue = formatFactorValue(factor.value);
        return `
            <div class="factor-item ${factor.pass ? 'pass' : 'fail'}">
                <div class="factor-info">
                    <div class="factor-name">${formatFactorName(key)}</div>
                    <div class="factor-condition">${factor.condition}</div>
                </div>
                <div class="factor-value">${displayValue}</div>
                <span class="factor-badge ${factor.pass ? 'pass' : 'fail'}">
                    ${factor.marks} mark${factor.marks !== 1 ? 's' : ''}
                </span>
            </div>
        `;
    }).join('');
}

// ===== Format Helpers =====
function formatFactorName(key) {
    return key
        .replace(/([A-Z])/g, ' $1')
        .replace(/^./, str => str.toUpperCase())
        .trim();
}

function formatFactorValue(value) {
    if (value === null || value === undefined) return 'N/A';
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    if (typeof value === 'object') {
        if (Array.isArray(value)) {
            return value.slice(-3).join(' → ');
        }
        return Object.entries(value)
            .map(([k, v]) => `${k}: ${typeof v === 'number' ? v.toFixed?.(2) ?? v : v}`)
            .join(', ');
    }
    if (typeof value === 'number') {
        return value.toFixed(2);
    }
    return value.toString();
}

function formatAIInsights(text) {
    // Convert markdown-like text to HTML
    return text
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\n/g, '<br>')
        .replace(/• /g, '&bull; ');
}

// ===== Suggestions =====
function hideSuggestions() {
    suggestionsDiv.classList.add('hidden');
    suggestionsDiv.innerHTML = '';
}

const fetchSuggestions = debounce(async function () {
    const query = searchInput.value.trim();
    if (!query || query.length < 2) {
        hideSuggestions();
        return;
    }

    try {
        const res = await fetch(`/api/search?query=${encodeURIComponent(query)}`);
        const data = await res.json();
        if (data.success && data.results && data.results.length > 0) {
            renderSuggestions(data.results);
        } else {
            hideSuggestions();
        }
    } catch (e) {
        hideSuggestions();
    }
}, 300);

searchInput.addEventListener('input', fetchSuggestions);

function renderSuggestions(suggestions) {
    suggestionsDiv.innerHTML = suggestions.map((s, idx) => `
        <div class="suggestion-item" data-idx="${idx}" data-url="${s.url}" data-name="${s.name}">
            <strong>${s.name}</strong>
            <span style="color: #9ca3af; margin-left: 8px; font-size: 0.875rem">${s.id}</span>
        </div>
    `).join('');
    suggestionsDiv.classList.remove('hidden');

    suggestionsDiv.querySelectorAll('.suggestion-item').forEach(item => {
        item.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            const name = item.dataset.name;
            const url = item.dataset.url;
            searchInput.value = name;
            hideSuggestions();
            analyzeStockWithUrl(url, name);
        };
    });
}

async function analyzeStockWithUrl(companyUrl, companyName) {
    if (isAnalyzing) return;

    isAnalyzing = true;
    showLoading(true);
    hideResults();
    hideError();

    try {
        const response = await fetch('/api/analyze', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ companyUrl, companyName })
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Analysis failed');

        currentAnalysis = data;
        displayResults(data);

    } catch (error) {
        console.error('Analysis error:', error);
        showError(error.message || 'Failed to analyze stock');
    } finally {
        showLoading(false);
        isAnalyzing = false;
    }
}

// ===== UI State Functions =====
function showLoading(show) {
    if (show) {
        loadingState.classList.remove('hidden');
        analyzeBtn.disabled = true;
        analyzeBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Analyzing...';
    } else {
        loadingState.classList.add('hidden');
        analyzeBtn.disabled = false;
        analyzeBtn.innerHTML = '<i class="fas fa-chart-bar"></i> Analyze';
    }
}

function showResults() {
    resultsSection.classList.remove('hidden');
    resultsSection.scrollIntoView({ behavior: 'smooth' });
}

function hideResults() {
    resultsSection.classList.add('hidden');
}

function showError(message) {
    document.getElementById('errorMessage').textContent = message;
    errorSection.classList.remove('hidden');
    errorSection.scrollIntoView({ behavior: 'smooth' });
}

function hideError() {
    errorSection.classList.add('hidden');
}

// ===== Utilities =====
function debounce(fn, delay) {
    let timeout;
    return function (...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => fn.apply(this, args), delay);
    };
}

// Export for global access
window.analyzeStock = analyzeStock;