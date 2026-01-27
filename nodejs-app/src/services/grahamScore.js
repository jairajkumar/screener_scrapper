/**
 * Benjamin Graham Score Calculator
 * Total: 10 marks (1-2 marks per factor)
 * 
 * Focuses on value investing and margin of safety
 */

/**
 * Calculate Benjamin Graham Score
 * @param {Object} data - Scraped financial data
 * @returns {Object} Score breakdown with factors
 */
function calculateGrahamScore(data) {
    const factors = {};
    let score = 0;

    const { historical } = data;

    // 1. Low P/E (1 mark)
    factors.lowPE = {
        value: data.stockPE,
        condition: 'P/E < 15',
        pass: data.stockPE !== null && data.stockPE < 15,
        marks: data.stockPE !== null && data.stockPE < 15 ? 1 : 0
    };
    score += factors.lowPE.marks;

    // 2. Low P/B - Price to Book (1 mark)
    factors.lowPB = {
        value: data.priceToBook?.toFixed(2),
        condition: 'P/B < 1.5',
        pass: data.priceToBook !== null && data.priceToBook < 1.5,
        marks: data.priceToBook !== null && data.priceToBook < 1.5 ? 1 : 0
    };
    score += factors.lowPB.marks;

    // 3. Debt Safety (2 marks)
    factors.debtSafety = {
        value: data.debtToEquity?.toFixed(2),
        condition: 'Debt/Equity < 1',
        pass: data.debtToEquity !== null && data.debtToEquity < 1,
        marks: data.debtToEquity !== null && data.debtToEquity < 1 ? 2 : 0
    };
    score += factors.debtSafety.marks;

    // 4. Strong Liquidity - Current Ratio (2 marks)
    factors.strongLiquidity = {
        value: data.currentRatio?.toFixed(2),
        condition: 'Current Ratio > 2',
        pass: data.currentRatio !== null && data.currentRatio > 2,
        marks: data.currentRatio !== null && data.currentRatio > 2 ? 2 : 0
    };
    score += factors.strongLiquidity.marks;

    // 5. Earnings Stability - No loss year in 5 years (2 marks)
    const netProfits = historical.netProfit || [];
    const recentProfits = netProfits.slice(-5);
    const noLossYear = recentProfits.length >= 3 && recentProfits.every(p => p >= 0);

    factors.earningsStability = {
        value: recentProfits,
        condition: 'No loss year in 5 years',
        pass: noLossYear,
        marks: noLossYear ? 2 : 0
    };
    score += factors.earningsStability.marks;

    // 6. Dividend Record - Dividend paid regularly (2 marks)
    const dividends = historical.dividendPayout || [];
    const recentDividends = dividends.slice(-5);
    const paidDividends = recentDividends.length >= 3 &&
        recentDividends.filter(d => d > 0).length >= Math.ceil(recentDividends.length * 0.6);

    factors.dividendRecord = {
        value: recentDividends,
        condition: 'Dividend paid regularly',
        pass: paidDividends,
        marks: paidDividends ? 2 : 0
    };
    score += factors.dividendRecord.marks;

    // Calculate Graham Number
    const grahamNumber = data.grahamNumber;

    return {
        name: 'Benjamin Graham Score',
        score,
        total: 10,
        percent: Math.round((score / 10) * 100),
        factors,
        grahamNumber: grahamNumber ? grahamNumber.toFixed(2) : null,
        interpretation: score >= 7 ? 'Strong Value Stock' :
            score >= 5 ? 'Moderate Value' :
                'Not a Value Stock'
    };
}

module.exports = calculateGrahamScore;
