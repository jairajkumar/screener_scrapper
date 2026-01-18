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

    // Enable AI action buttons
    enableAIButtons();
}

// ===== Update Score Card =====
function updateScoreCard(type, scoreData) {
    const cardEl = document.getElementById(`${type}Card`);
    const scoreEl = document.getElementById(`${type}Score`);
    const barEl = document.getElementById(`${type}Bar`);
    const interpretationEl = document.getElementById(`${type}Interpretation`);
    const statusEl = document.getElementById(`${type}Status`);

    scoreEl.textContent = scoreData.score;
    barEl.style.width = `${scoreData.percent}%`;
    interpretationEl.textContent = scoreData.interpretation;

    // Determine pass/fail
    const isPass = scoreData.score >= 7;

    // Add passing/failing class to card for visual effect
    cardEl.classList.remove('passing', 'failing');
    cardEl.classList.add(isPass ? 'passing' : 'failing');

    // Status badge with clear text
    statusEl.className = `score-card-status ${isPass ? 'pass' : 'fail'}`;
    statusEl.innerHTML = isPass
        ? `<i class="fas fa-check-circle"></i> PASSING (≥7)`
        : `<i class="fas fa-times-circle"></i> NEEDS WORK`;
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

// ===== AI Chat Feature =====
const copyAnalysisBtn = document.getElementById('copyAnalysisBtn');
const continueAIBtn = document.getElementById('continueAIBtn');
const aiChatModal = document.getElementById('aiChatModal');
const closeModalBtn = document.getElementById('closeModalBtn');

// Enable buttons when analysis is complete
function enableAIButtons() {
    if (copyAnalysisBtn) copyAnalysisBtn.disabled = false;
    if (continueAIBtn) continueAIBtn.disabled = false;
}

// Generate analysis text for copying
function generateAnalysisText() {
    if (!currentAnalysis) return '';

    const { company, data, analysis } = currentAnalysis;

    return `You are a stock analysis assistant. I'm sharing a screenshot from Screener.in along with analyzed data for ${company.name}. Please help me understand this stock better.

📊 COMPANY: ${company.name}
🔗 Source: Screener.in

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📈 KEY FINANCIAL METRICS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Stock P/E: ${data.stockPE} | Industry P/E: ${data.industryPE || 'N/A'}
• ROE: ${data.roe}% | ROCE: ${data.roce}%
• Debt/Equity: ${data.debtToEquity?.toFixed(2)}
• Current Ratio: ${data.currentRatio?.toFixed(2)}
• Book Value: ₹${data.bookValue}
• Current Price: ₹${data.currentPrice}
• Market Cap: ₹${data.marketCap} Cr

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 GROWTH RATES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• 5Y Profit Growth: ${data.profitGrowth5Y}%
• 5Y Sales Growth: ${data.salesGrowth5Y}%
• EPS Growth: ${data.epsGrowth}%
• PEG Ratio: ${data.pegRatio?.toFixed(2) || 'N/A'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎯 INVESTMENT SCORES (Analyzed)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Piotroski F-Score: ${analysis.piotroski.score}/9 → ${analysis.piotroski.interpretation}
• Warren Buffett Score: ${analysis.buffett.score}/10 → ${analysis.buffett.interpretation}
• Benjamin Graham Score: ${analysis.graham.score}/10 → ${analysis.graham.interpretation}
• Peter Lynch Score: ${analysis.lynch.score}/10 → ${analysis.lynch.interpretation}

✅ FINAL DECISION: ${analysis.finalDecision}
(${analysis.scoresAbove7} out of 4 scores ≥ 7)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💬 I've attached a screenshot from Screener.in for visual reference.
Based on this data, please answer any questions I have about this stock.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;
}

// Generate URL with pre-filled prompt for different AI services
function getAIUrlWithPrompt(service, promptText) {
    const encodedPrompt = encodeURIComponent(promptText);

    switch (service) {
        case 'gemini':
            // Gemini doesn't support direct prompt in URL, but we'll try
            return `https://gemini.google.com/app`;
        case 'chatgpt':
            // ChatGPT doesn't support direct prompt in free tier
            return `https://chat.openai.com`;
        case 'claude':
            return `https://claude.ai`;
        default:
            return service;
    }
}

// Copy analysis text to clipboard
if (copyAnalysisBtn) {
    copyAnalysisBtn.addEventListener('click', async () => {
        const text = generateAnalysisText();

        try {
            await navigator.clipboard.writeText(text);

            // Visual feedback
            const originalHTML = copyAnalysisBtn.innerHTML;
            copyAnalysisBtn.innerHTML = '<i class="fas fa-check"></i> Copied!';
            copyAnalysisBtn.classList.add('copied');

            setTimeout(() => {
                copyAnalysisBtn.innerHTML = originalHTML;
                copyAnalysisBtn.classList.remove('copied');
            }, 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
            alert('Failed to copy to clipboard. Please try again.');
        }
    });
}

// Fetch Puppeteer screenshot and copy as HTML with embedded image + text
async function captureAndCopyScreenshot() {
    try {
        // Check if we have a screenshot URL from the analysis
        if (!currentAnalysis || !currentAnalysis.screenshotUrl) {
            console.warn('No screenshot URL available');
            return { success: false, method: 'none' };
        }

        // Fetch the Puppeteer screenshot from the API
        const response = await fetch(currentAnalysis.screenshotUrl);
        if (!response.ok) {
            throw new Error('Failed to fetch screenshot');
        }

        const imageBlob = await response.blob();

        // Convert image to base64 for HTML embedding
        const base64Image = await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.readAsDataURL(imageBlob);
        });

        // Generate the prompt text
        const promptText = generateAnalysisText();

        // Create HTML with embedded image + text
        const htmlContent = `
<div>
<img src="${base64Image}" alt="Screener.in Screenshot" style="max-width: 100%; margin-bottom: 20px;">
<pre style="white-space: pre-wrap; font-family: monospace; background: #f5f5f5; padding: 15px; border-radius: 8px;">
${promptText}
</pre>
</div>`;

        const htmlBlob = new Blob([htmlContent], { type: 'text/html' });
        const textBlob = new Blob([promptText], { type: 'text/plain' });

        // Copy with multiple formats: HTML (with image), plain text (fallback), and raw image
        if (navigator.clipboard && navigator.clipboard.write) {
            try {
                // Try with all three formats
                const clipboardItem = new ClipboardItem({
                    'text/html': htmlBlob,
                    'text/plain': textBlob,
                    'image/png': imageBlob
                });

                await navigator.clipboard.write([clipboardItem]);
                console.log('HTML with image + text + raw image copied to clipboard!');
                return { success: true, method: 'clipboard' };
            } catch (clipboardError) {
                console.warn('Multi-type clipboard write failed:', clipboardError);

                // Fallback: Try just image + text
                try {
                    const clipboardItem = new ClipboardItem({
                        'image/png': imageBlob,
                        'text/plain': textBlob
                    });
                    await navigator.clipboard.write([clipboardItem]);
                    console.log('Image + text copied');
                    return { success: true, method: 'image-text' };
                } catch (e) {
                    // Fallback: Try just the image
                    try {
                        await navigator.clipboard.write([
                            new ClipboardItem({ 'image/png': imageBlob })
                        ]);
                        return { success: true, method: 'image-only' };
                    } catch (e2) {
                        console.warn('All clipboard methods failed:', e2);
                    }
                }
            }
        }

        // Final fallback: download the image
        const url = URL.createObjectURL(imageBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${currentAnalysis.company.name}_screener_screenshot.png`;
        a.click();
        URL.revokeObjectURL(url);
        return { success: true, method: 'download' };

    } catch (err) {
        console.error('Screenshot fetch/copy failed:', err);
        return { success: false, method: 'error', error: err.message };
    }
}

// Continue in AI button - capture screenshot and show modal
if (continueAIBtn) {
    continueAIBtn.addEventListener('click', async () => {
        // Show loading state
        continueAIBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Getting screenshot...';
        continueAIBtn.disabled = true;

        // Fetch and copy Puppeteer screenshot
        const result = await captureAndCopyScreenshot();

        // Reset button
        continueAIBtn.innerHTML = '<i class="fas fa-comments"></i> Continue in AI Chat';
        continueAIBtn.disabled = false;

        // Show modal with appropriate message
        if (aiChatModal) {
            const modalSubtitle = aiChatModal.querySelector('.modal-subtitle');
            if (modalSubtitle) {
                if (result.method === 'clipboard') {
                    modalSubtitle.textContent = '✓ Screenshot + Prompt copied! Just paste (Ctrl+V) in chat.';
                    modalSubtitle.style.color = 'var(--success)';
                } else if (result.method === 'image-only') {
                    modalSubtitle.textContent = '✓ Screenshot copied! Paste it, then use Copy Analysis for text.';
                    modalSubtitle.style.color = 'var(--success)';
                } else if (result.method === 'download') {
                    modalSubtitle.textContent = 'Screenshot downloaded. Upload it after opening.';
                    modalSubtitle.style.color = 'var(--warning)';
                } else {
                    modalSubtitle.textContent = 'Screenshot not available. Use Copy Analysis button for text.';
                    modalSubtitle.style.color = 'var(--danger)';
                }
            }
            aiChatModal.classList.remove('hidden');
        }
    });
}

// Modal close button
if (closeModalBtn) {
    closeModalBtn.addEventListener('click', () => {
        aiChatModal.classList.add('hidden');
    });
}

// Close modal on backdrop click
if (aiChatModal) {
    aiChatModal.addEventListener('click', (e) => {
        if (e.target === aiChatModal) {
            aiChatModal.classList.add('hidden');
        }
    });
}

// AI option buttons - just open the AI service (clipboard already has both image + text)
document.querySelectorAll('.ai-option').forEach(btn => {
    btn.addEventListener('click', async () => {
        const url = btn.dataset.url;
        if (url) {
            // Open the AI service
            window.open(url, '_blank');

            // Hide modal
            aiChatModal.classList.add('hidden');

            // Show toast notification
            showToast('🎉 Clipboard ready! Paste with Ctrl+V');
        }
    });
});

// Copy Prompt button in modal - for Gemini users who need text separately
const copyPromptBtn = document.getElementById('copyPromptBtn');
if (copyPromptBtn) {
    copyPromptBtn.addEventListener('click', async () => {
        const promptText = generateAnalysisText();

        try {
            await navigator.clipboard.writeText(promptText);

            // Visual feedback
            const originalHTML = copyPromptBtn.innerHTML;
            copyPromptBtn.innerHTML = '<i class="fas fa-check"></i> Prompt Copied!';
            copyPromptBtn.classList.add('copied');

            setTimeout(() => {
                copyPromptBtn.innerHTML = originalHTML;
                copyPromptBtn.classList.remove('copied');
            }, 2000);

            showToast('📋 Prompt text copied! Now paste in your AI chat.');
        } catch (err) {
            console.error('Failed to copy prompt:', err);
            showToast('❌ Failed to copy. Please try again.');
        }
    });
}

// Toast notification for user feedback
function showToast(message) {
    // Create toast element if it doesn't exist
    let toast = document.getElementById('toast-notification');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'toast-notification';
        toast.style.cssText = `
            position: fixed;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
            color: white;
            padding: 12px 24px;
            border-radius: 50px;
            font-weight: 600;
            box-shadow: 0 10px 30px rgba(99, 102, 241, 0.3);
            z-index: 10000;
            opacity: 0;
            transition: opacity 0.3s ease, transform 0.3s ease;
            font-size: 14px;
        `;
        document.body.appendChild(toast);
    }

    // Show toast
    toast.textContent = message;
    toast.style.opacity = '1';
    toast.style.transform = 'translateX(-50%) translateY(0)';

    // Hide after 4 seconds
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(-50%) translateY(20px)';
    }, 4000);
}

// Export for global access
window.analyzeStock = analyzeStock;