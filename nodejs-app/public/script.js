// Global variables
let currentAnalysis = null;
let suggestions = [];
let verdictCache = {};
let isAnalyzing = false; // Add flag to prevent duplicate calls

// DOM elements
const searchInput = document.getElementById('searchInput');
const analyzeBtn = document.getElementById('analyzeBtn');
const loadingState = document.getElementById('loadingState');
const resultsSection = document.getElementById('resultsSection');
const errorSection = document.getElementById('errorSection');
const suggestionsDiv = document.getElementById('suggestions');

// Add enter key support
searchInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        e.preventDefault(); // Prevent form submission
        hideSuggestions();
        // Only analyze if not already analyzing
        if (!isAnalyzing) {
            analyzeStock();
        }
    }
});

// Hide suggestions when clicking outside
document.addEventListener('click', function(e) {
    if (!searchInput.contains(e.target) && !suggestionsDiv.contains(e.target)) {
        hideSuggestions();
    }
});

// Hide suggestions when input loses focus
searchInput.addEventListener('blur', function() {
    // Small delay to allow clicking on suggestions
    setTimeout(() => {
        hideSuggestions();
    }, 200);
});

// Hide suggestions function
function hideSuggestions() {
    suggestionsDiv.classList.add('hidden');
    suggestionsDiv.innerHTML = '';
}

// Add analyze button click handler
analyzeBtn.addEventListener('click', function(e) {
    e.preventDefault();
    if (!isAnalyzing) {
        analyzeStock();
    }
});

// Main analysis function
async function analyzeStock(companyNameOrSlug) {
    // Prevent duplicate calls
    if (isAnalyzing) {
        console.log('Analysis already in progress, skipping...');
        return;
    }
    
    const companyName = companyNameOrSlug || searchInput.value.trim();
    
    if (!companyName) {
        showError('Please enter a company name');
        return;
    }

    // Set analyzing flag
    isAnalyzing = true;

    // Show loading state
    showLoading(true);
    hideResults();
    hideError();

    try {
        // Call the API
        const response = await fetch(`/api/analyze/${encodeURIComponent(companyName)}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Analysis failed');
        }

        // Store the analysis data
        currentAnalysis = data;
        
        // Display results
        displayResults(data);
        
    } catch (error) {
        console.error('Analysis error:', error);
        showError(error.message || 'Failed to analyze stock');
    } finally {
        showLoading(false);
        isAnalyzing = false; // Reset flag
    }
}

// Display analysis results
function displayResults(data) {
    // Company info
    document.getElementById('companyName').textContent = data.company.name;
    document.getElementById('companyUrl').href = data.company.url;
    
    // Verdict and score
    const verdict = data.analysis.verdict;
    const score = data.analysis.score;
    const total = data.analysis.total;
    const percentage = data.analysis.percent;
    
    // Update verdict badge
    const verdictBadge = document.getElementById('verdictBadge');
    verdictBadge.textContent = verdict;
    verdictBadge.className = `px-4 py-2 rounded-full text-white font-semibold text-sm ${getVerdictClass(verdict)}`;
    
    // Update score display
    document.getElementById('scoreDisplay').textContent = `${score}/${total}`;
    document.getElementById('percentageDisplay').textContent = `${Math.round(percentage)}%`;
    
    // Update score bar
    const scoreBar = document.getElementById('scoreBar');
    scoreBar.style.width = `${percentage}%`;
    scoreBar.className = `h-2 rounded-full transition-all duration-500 ${getScoreBarClass(percentage)}`;
    
    // Update metrics
    updateMetric('roe', data.data.roe, data.analysis.analysis.roe);
    updateMetric('pe', data.data.pe_ratio, data.analysis.analysis.pe_ratio);
    updateMetric('debt', data.data.debt_to_equity, data.analysis.analysis.debt_to_equity);
    updateMetric('roce', data.data.roce, data.analysis.analysis.roce);
    updateMetric('cashFlow', data.data.cash_flow, data.analysis.analysis.cash_flow);
    updateMetric('peg', data.data.peg, data.analysis.analysis.peg);
    
    // Update AI insights
    const aiInsightsDiv = document.getElementById('aiInsights');
    if (data.aiInsights) {
        aiInsightsDiv.innerHTML = `
            <div class="bg-blue-50 border-l-4 border-blue-400 p-4 mb-4">
                <div class="flex">
                    <div class="flex-shrink-0">
                        <i class="fas fa-lightbulb text-blue-400"></i>
                    </div>
                    <div class="ml-3">
                        <p class="text-sm text-blue-700">
                            ${data.aiInsights}
                        </p>
                    </div>
                </div>
            </div>
        `;
    } else {
        aiInsightsDiv.innerHTML = '<p class="text-gray-600">AI insights not available</p>';
    }
    
    // Show results
    showResults();
}

// Update individual metric
function updateMetric(metricName, value, status) {
    const valueElement = document.getElementById(`${metricName}Value`);
    const statusElement = document.getElementById(`${metricName}Status`);
    const cardElement = document.querySelector(`#${metricName}Value`).closest('.metric-card');
    
    // Update value
    if (value !== null && value !== undefined) {
        valueElement.textContent = formatValue(metricName, value);
    } else {
        valueElement.textContent = 'N/A';
    }
    
    // Update status
    statusElement.textContent = status;
    statusElement.className = `px-2 py-1 rounded text-xs font-semibold ${getStatusClass(status)}`;
    
    // Update card background
    cardElement.className = `metric-card ${getStatusClass(status)} rounded-lg p-4 text-white`;
}

// Format values for display
function formatValue(metricName, value) {
    if (value === null || value === undefined) return 'N/A';
    
    switch (metricName) {
        case 'roe':
        case 'roce':
            return `${value.toFixed(2)}%`;
        case 'pe':
        case 'peg':
            return value.toFixed(1);
        case 'debt':
            return value.toFixed(2);
        case 'cashFlow':
            return value.toLocaleString();
        default:
            return value.toString();
    }
}

// Get CSS classes for verdict
function getVerdictClass(verdict) {
    switch (verdict) {
        case 'BUY':
            return 'bg-green-500';
        case 'HOLD':
            return 'bg-yellow-500';
        case 'SELL':
            return 'bg-red-500';
        case 'NA':
            return 'bg-gray-500';
        default:
            return 'bg-gray-500';
    }
}

// Get CSS classes for score bar
function getScoreBarClass(percentage) {
    if (percentage >= 70) return 'bg-green-500';
    if (percentage >= 50) return 'bg-yellow-500';
    return 'bg-red-500';
}

// Get CSS classes for status
function getStatusClass(status) {
    switch (status) {
        case 'PASS':
            return 'pass bg-green-100 text-green-800';
        case 'FAIL':
            return 'fail bg-red-100 text-red-800';
        case 'NA':
            return 'na bg-gray-100 text-gray-800';
        default:
            return 'bg-gray-100 text-gray-800';
    }
}

// Show/hide loading state
function showLoading(show) {
    if (show) {
        loadingState.classList.remove('hidden');
        analyzeBtn.disabled = true;
        analyzeBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Analyzing...';
    } else {
        loadingState.classList.add('hidden');
        analyzeBtn.disabled = false;
        analyzeBtn.innerHTML = '<i class="fas fa-chart-bar mr-2"></i>Analyze';
    }
}

// Show/hide results
function showResults() {
    resultsSection.classList.remove('hidden');
    resultsSection.scrollIntoView({ behavior: 'smooth' });
}

function hideResults() {
    resultsSection.classList.add('hidden');
}

// Show/hide error
function showError(message) {
    document.getElementById('errorMessage').textContent = message;
    errorSection.classList.remove('hidden');
    errorSection.scrollIntoView({ behavior: 'smooth' });
}

function hideError() {
    errorSection.classList.add('hidden');
}

// Export function for global access
window.analyzeStock = analyzeStock;

// Debounce helper
function debounce(fn, delay) {
    let timeout;
    return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => fn.apply(this, args), delay);
    };
}

// Fetch suggestions from backend
const fetchSuggestions = debounce(async function() {
    const query = searchInput.value.trim();
    if (!query || query.length < 2) {
        hideSuggestions();
        return;
    }
    
    try {
        const res = await fetch(`/api/search?query=${encodeURIComponent(query)}`);
        const data = await res.json();
        if (data.success && data.results && data.results.length > 0) {
            suggestions = data.results;
            renderSuggestions();
        } else {
            hideSuggestions();
        }
    } catch (e) {
        hideSuggestions();
    }
}, 300);

searchInput.addEventListener('input', fetchSuggestions);

// Render suggestions dropdown
function renderSuggestions() {
    suggestionsDiv.innerHTML = suggestions.map((s, idx) => {
        const verdict = verdictCache[s.url] || '';
        return `<div class="px-4 py-2 cursor-pointer hover:bg-blue-50 flex justify-between items-center" data-idx="${idx}" data-url="${s.url}">
            <span>${s.name} <span class="text-xs text-gray-400 ml-2">(${s.id})</span></span>
            <span class="ml-2 text-xs font-bold">${verdict ? verdictBadgeHtml(verdict) : ''}</span>
        </div>`;
    }).join('');
    suggestionsDiv.classList.remove('hidden');

    // Add click listeners
    Array.from(suggestionsDiv.children).forEach(child => {
        child.onclick = async function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            const idx = this.getAttribute('data-idx');
            const companyUrl = this.getAttribute('data-url');
            const company = suggestions[idx];
            
            // Update input and hide suggestions immediately
            searchInput.value = company.name;
            hideSuggestions();
            
            // Prevent any other event handlers from firing
            setTimeout(() => {
                // Trigger analysis with companyUrl (this will also get the verdict)
                analyzeStockWithUrl(companyUrl, company.name);
            }, 10);
        };
    });
}

// Analyze stock with companyUrl using POST endpoint
async function analyzeStockWithUrl(companyUrl, companyName) {
    // Prevent duplicate calls
    if (isAnalyzing) {
        console.log('Analysis already in progress, skipping...');
        return;
    }
    
    if (!companyUrl) {
        showError('Please enter a company name');
        return;
    }

    // Set analyzing flag
    isAnalyzing = true;

    showLoading(true);
    hideResults();
    hideError();

    try {
        const response = await fetch('/api/analyze', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ 
                companyUrl: companyUrl,
                companyName: companyName 
            })
        });

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
        isAnalyzing = false; // Reset flag
    }
}

// Verdict badge HTML
function verdictBadgeHtml(verdict) {
    let color = 'bg-gray-400';
    if (verdict === 'BUY') color = 'bg-green-500';
    else if (verdict === 'HOLD') color = 'bg-yellow-500';
    else if (verdict === 'SELL') color = 'bg-red-500';
    return `<span class="px-2 py-1 rounded text-white ${color}">${verdict}</span>`;
} 