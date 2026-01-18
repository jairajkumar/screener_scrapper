const { CRITERIA } = require('../../config');

/**
 * Analyze stock data against investment criteria
 * @param {Object} data - Stock data to analyze
 * @returns {Object} Analysis result with verdict, score, and breakdown
 */
function analyzeStock(data) {
    let score = 0;
    let total = 8;
    const analysis = {};

    // 1. ROE > 15
    if (data.roe != null) {
        if (data.roe > CRITERIA.roe_min) { score++; analysis.roe = 'PASS'; } else { analysis.roe = 'FAIL'; }
    } else { analysis.roe = 'NA'; total--; }

    // 2. P/E < 20
    if (data.pe_ratio != null) {
        if (data.pe_ratio < CRITERIA.pe_max) { score++; analysis.pe_ratio = 'PASS'; } else { analysis.pe_ratio = 'FAIL'; }
    } else { analysis.pe_ratio = 'NA'; total--; }

    // 3. Debt-to-Equity < 0.5
    if (data.debt_to_equity != null) {
        if (data.debt_to_equity < CRITERIA.debt_to_equity_max) { score++; analysis.debt_to_equity = 'PASS'; } else { analysis.debt_to_equity = 'FAIL'; }
    } else { analysis.debt_to_equity = 'NA'; total--; }

    // 4. ROCE > 15
    if (data.roce != null) {
        if (data.roce > CRITERIA.roce_min) { score++; analysis.roce = 'PASS'; } else { analysis.roce = 'FAIL'; }
    } else { analysis.roce = 'NA'; total--; }

    // 5. Cash Flow Positive
    if (data.cash_flow != null) {
        if (data.cash_flow > 0) { score++; analysis.cash_flow = 'PASS'; } else { analysis.cash_flow = 'FAIL'; }
    } else { analysis.cash_flow = 'NA'; total--; }

    // 6. EPS Growth 10-15
    if (data.eps_growth != null) {
        if (data.eps_growth >= CRITERIA.eps_growth_min && data.eps_growth <= CRITERIA.eps_growth_max) { score++; analysis.eps_growth = 'PASS'; } else { analysis.eps_growth = 'FAIL'; }
    } else { analysis.eps_growth = 'NA'; total--; }

    // 7. PEG < 1
    if (data.peg != null) {
        if (data.peg < CRITERIA.peg_max) { score++; analysis.peg = 'PASS'; } else { analysis.peg = 'FAIL'; }
    } else { analysis.peg = 'NA'; total--; }

    // 8. Intrinsic Value
    if (data.eps != null && data.book_value != null) {
        analysis.intrinsic_value = CRITERIA.intrinsic_value_multiplier * data.eps * data.book_value;
    } else {
        analysis.intrinsic_value = 'NA'; total--;
    }

    let verdict = 'NA';
    let percent = (score / total) * 100;
    if (percent >= 70) verdict = 'BUY';
    else if (percent >= 50) verdict = 'HOLD';

    return { verdict, score, total, percent, analysis };
}

module.exports = analyzeStock;
