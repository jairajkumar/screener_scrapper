/**
 * Warren Buffett Score Calculator
 * Total: 10 marks (2 marks each for 5 factors)
 * 
 * Measures long-term business quality and value investing principles
 */

/**
 * Calculate Warren Buffett Score
 * @param {Object} data - Scraped financial data
 * @returns {Object} Score breakdown with factors
 */
function calculateBuffettScore(data) {
    const factors = {};
    let score = 0;

    const { historical } = data;

    // 1. High ROE (2 marks)
    factors.highROE = {
        value: data.roe,
        condition: 'ROE > 15%',
        pass: data.roe !== null && data.roe > 15,
        marks: data.roe !== null && data.roe > 15 ? 2 : 0
    };
    score += factors.highROE.marks;

    // 2. Low Debt (2 marks)
    factors.lowDebt = {
        value: data.debtToEquity?.toFixed(2),
        condition: 'Debt/Equity < 0.5',
        pass: data.debtToEquity !== null && data.debtToEquity < 0.5,
        marks: data.debtToEquity !== null && data.debtToEquity < 0.5 ? 2 : 0
    };
    score += factors.lowDebt.marks;

    // 3. Profit Consistency - Positive every year for 5 years (2 marks)
    const netProfits = historical.netProfit || [];
    const recentProfits = netProfits.slice(-5); // Last 5 years
    const allPositive = recentProfits.length >= 3 && recentProfits.every(p => p > 0);

    factors.profitConsistency = {
        value: recentProfits,
        condition: 'Net Profit positive every year (5 years)',
        pass: allPositive,
        marks: allPositive ? 2 : 0
    };
    score += factors.profitConsistency.marks;

    // 4. Strong Free Cash Flow (2 marks)
    factors.strongFCF = {
        value: data.fcf,
        condition: 'Free Cash Flow positive',
        pass: data.fcf !== null && data.fcf > 0,
        marks: data.fcf !== null && data.fcf > 0 ? 2 : 0
    };
    score += factors.strongFCF.marks;

    // 5. Reasonable Valuation - Stock P/E < Industry P/E (2 marks)
    const peComparison = data.stockPE !== null && data.industryPE !== null
        ? data.stockPE < data.industryPE : null;

    factors.reasonableValuation = {
        value: { stockPE: data.stockPE, industryPE: data.industryPE },
        condition: 'Stock P/E < Industry P/E',
        pass: peComparison === true,
        marks: peComparison === true ? 2 : 0
    };
    score += factors.reasonableValuation.marks;

    return {
        name: 'Warren Buffett Score',
        score,
        total: 10,
        percent: Math.round((score / 10) * 100),
        factors,
        interpretation: score >= 8 ? 'Excellent Long-Term Business' :
            score >= 6 ? 'Good Business Quality' :
                'Needs Improvement'
    };
}

module.exports = calculateBuffettScore;
