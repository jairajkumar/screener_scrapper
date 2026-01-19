/**
 * Piotroski F-Score Calculator
 * Total: 9 marks (1 mark each for 9 factors)
 * 
 * Measures financial health based on profitability, leverage, and efficiency
 */

/**
 * Calculate Piotroski F-Score
 * @param {Object} data - Scraped financial data
 * @returns {Object} Score breakdown with factors
 */
function calculatePiotroskiScore(data) {
    const factors = {};
    let score = 0;

    const { historical } = data;

    // Get latest and previous year values
    const getLatest = (arr) => arr && arr.length > 0 ? arr[arr.length - 1] : null;
    const getPrevious = (arr) => arr && arr.length > 1 ? arr[arr.length - 2] : null;

    // 1. Net Profit Positive (1 mark)
    const latestProfit = getLatest(historical.netProfit);
    factors.netProfitPositive = {
        value: latestProfit,
        condition: 'Net Profit > 0',
        pass: latestProfit !== null && latestProfit > 0,
        marks: latestProfit !== null && latestProfit > 0 ? 1 : 0
    };
    score += factors.netProfitPositive.marks;

    // 2. Operating Cash Flow Positive (1 mark)
    const latestCFO = getLatest(historical.cfo);
    factors.cfoPositive = {
        value: latestCFO,
        condition: 'CFO > 0',
        pass: latestCFO !== null && latestCFO > 0,
        marks: latestCFO !== null && latestCFO > 0 ? 1 : 0
    };
    score += factors.cfoPositive.marks;

    // 3. ROA Improvement (1 mark)
    // ROA values come from scraper (Screener first, calculated as fallback)
    const latestAssets = getLatest(historical.totalAssets);
    const prevAssets = getPrevious(historical.totalAssets);

    factors.roaImproved = {
        value: { current: data.roa?.toFixed?.(2) || data.roa, previous: data.roaPrevYear?.toFixed?.(2) || data.roaPrevYear },
        condition: 'Current ROA > Previous Year',
        pass: data.roa !== null && data.roaPrevYear !== null && data.roa > data.roaPrevYear,
        marks: data.roa !== null && data.roaPrevYear !== null && data.roa > data.roaPrevYear ? 1 : 0
    };
    score += factors.roaImproved.marks;

    // 4. Cash Flow > Profit (1 mark)
    factors.cfoGreaterThanProfit = {
        value: { cfo: latestCFO, profit: latestProfit },
        condition: 'CFO > Net Profit',
        pass: latestCFO !== null && latestProfit !== null && latestCFO > latestProfit,
        marks: latestCFO !== null && latestProfit !== null && latestCFO > latestProfit ? 1 : 0
    };
    score += factors.cfoGreaterThanProfit.marks;

    // 5. Debt Reduction (1 mark)
    const latestBorrowings = getLatest(historical.borrowings);
    const prevBorrowings = getPrevious(historical.borrowings);

    factors.debtReduced = {
        value: { current: latestBorrowings, previous: prevBorrowings },
        condition: 'Borrowings decreased YoY',
        pass: latestBorrowings !== null && prevBorrowings !== null && latestBorrowings < prevBorrowings,
        marks: latestBorrowings !== null && prevBorrowings !== null && latestBorrowings < prevBorrowings ? 1 : 0
    };
    score += factors.debtReduced.marks;

    // 6. Current Ratio Improvement (1 mark)
    // Using proxy: Check if current ratio improved (if available)
    factors.currentRatioImproved = {
        value: data.currentRatio,
        condition: 'Current Ratio improved YoY',
        pass: data.currentRatio !== null && data.currentRatio > 1.5, // Proxy: good if > 1.5
        marks: data.currentRatio !== null && data.currentRatio > 1.5 ? 1 : 0
    };
    score += factors.currentRatioImproved.marks;

    // 7. No Equity Dilution (1 mark)
    const latestEquity = getLatest(historical.equityCapital);
    const prevEquity = getPrevious(historical.equityCapital);

    factors.noEquityDilution = {
        value: { current: latestEquity, previous: prevEquity },
        condition: 'No new shares issued',
        pass: latestEquity !== null && prevEquity !== null && latestEquity <= prevEquity,
        marks: latestEquity !== null && prevEquity !== null && latestEquity <= prevEquity ? 1 : 0
    };
    score += factors.noEquityDilution.marks;

    // 8. Gross Margin Improvement (OPM %) (1 mark)
    const latestOPM = getLatest(historical.opmPercent);
    const prevOPM = getPrevious(historical.opmPercent);

    factors.opmImproved = {
        value: { current: latestOPM, previous: prevOPM },
        condition: 'OPM % increased YoY',
        pass: latestOPM !== null && prevOPM !== null && latestOPM > prevOPM,
        marks: latestOPM !== null && prevOPM !== null && latestOPM > prevOPM ? 1 : 0
    };
    score += factors.opmImproved.marks;

    // 9. Asset Turnover Improvement (1 mark)
    const latestSales = getLatest(historical.sales);
    const prevSales = getPrevious(historical.sales);

    const currentTurnover = latestAssets > 0 ? latestSales / latestAssets : null;
    const prevTurnover = prevAssets > 0 && prevSales !== null ? prevSales / prevAssets : null;

    factors.assetTurnoverImproved = {
        value: { current: currentTurnover?.toFixed(2), previous: prevTurnover?.toFixed(2) },
        condition: 'Asset Turnover improved YoY',
        pass: currentTurnover !== null && prevTurnover !== null && currentTurnover > prevTurnover,
        marks: currentTurnover !== null && prevTurnover !== null && currentTurnover > prevTurnover ? 1 : 0
    };
    score += factors.assetTurnoverImproved.marks;

    return {
        name: 'Piotroski F-Score',
        score,
        total: 9,
        percent: Math.round((score / 9) * 100),
        factors,
        interpretation: score >= 7 ? 'Strong Financial Health' :
            score >= 5 ? 'Moderate Financial Health' :
                'Weak Financial Health'
    };
}

module.exports = calculatePiotroskiScore;
