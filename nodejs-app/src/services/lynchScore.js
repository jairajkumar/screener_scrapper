/**
 * Peter Lynch Score Calculator
 * Total: 10 marks
 * 
 * Focuses on growth at a reasonable price (GARP)
 */

/**
 * Calculate Peter Lynch Score
 * @param {Object} data - Scraped financial data
 * @returns {Object} Score breakdown with factors
 */
function calculateLynchScore(data) {
    const factors = {};
    let score = 0;

    // 1. EPS Growth > 10% (3 marks)
    const epsGrowth = data.profitGrowth5Y || data.epsGrowth;
    factors.epsGrowth = {
        value: epsGrowth,
        condition: 'EPS/Profit Growth > 10%',
        pass: epsGrowth !== null && epsGrowth > 10,
        marks: epsGrowth !== null && epsGrowth > 10 ? 3 : 0
    };
    score += factors.epsGrowth.marks;

    // 2. PEG Ratio < 1.5 (3 marks)
    factors.lowPEG = {
        value: data.pegRatio?.toFixed(2),
        condition: 'PEG < 1.5',
        pass: data.pegRatio !== null && data.pegRatio < 1.5,
        marks: data.pegRatio !== null && data.pegRatio < 1.5 ? 3 : 0
    };
    score += factors.lowPEG.marks;

    // 3. Low Debt (2 marks)
    factors.lowDebt = {
        value: data.debtToEquity?.toFixed(2),
        condition: 'Debt/Equity < 0.5',
        pass: data.debtToEquity !== null && data.debtToEquity < 0.5,
        marks: data.debtToEquity !== null && data.debtToEquity < 0.5 ? 2 : 0
    };
    score += factors.lowDebt.marks;

    // 4. Business Simplicity (2 marks)
    // Default to 2 marks unless we can determine it's a complex business
    // This would require industry classification which we don't have
    factors.businessSimplicity = {
        value: 'Assumed Simple',
        condition: 'Stable & simple business',
        pass: true, // Default assumption
        marks: 2
    };
    score += factors.businessSimplicity.marks;

    return {
        name: 'Peter Lynch Score',
        score,
        total: 10,
        percent: Math.round((score / 10) * 100),
        factors,
        interpretation: score >= 7 ? 'Great Growth at Reasonable Price' :
            score >= 5 ? 'Moderate Growth Opportunity' :
                'Not a GARP Stock'
    };
}

module.exports = calculateLynchScore;
