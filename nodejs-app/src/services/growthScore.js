/**
 * Growth Investment Engine — Score Calculator
 * Total: 100 points across 7 factors
 * 
 * Focuses on identifying companies capable of compounding
 * earnings and revenue at high rates over 5-10 years.
 * 
 * Factors:
 *   1. Revenue Growth (20 pts) — 5Y Sales CAGR
 *   2. EPS Growth (20 pts) — True 5Y EPS CAGR from historical data
 *   3. ROCE (15 pts) — 5Y Average ROCE
 *   4. Profit Consistency (15 pts) — Positive profit growth years
 *   5. Operating Margin Trend (10 pts) — OPM improvement
 *   6. Debt Quality (10 pts) — Debt/Equity ratio
 *   7. Ownership Confidence (10 pts) — Promoter + FII/DII trends
 */

/**
 * Calculate true EPS CAGR from historical EPS array
 * More accurate than profitGrowth5Y when equity dilution occurs
 * @param {number[]} epsArray - Historical EPS values (oldest to newest)
 * @param {number} years - Number of years for CAGR
 * @returns {number|null} EPS CAGR as percentage, or null if insufficient data
 */
function calculateEpsCagr(epsArray, years = 5) {
    console.log(`\n   🔍 calculateEpsCagr DEBUG:`);
    console.log(`      Input array: [${(epsArray || []).join(', ')}]`);
    console.log(`      Array length: ${epsArray?.length || 0}, Need: ${years + 1}`);

    if (!epsArray || epsArray.length < years + 1) {
        console.log(`      ❌ RETURNED NULL: Array too short (${epsArray?.length || 0} < ${years + 1})`);
        return null;
    }

    // Skip TTM if present (last column in Screener P&L)
    // Use second-to-last if array has TTM, otherwise use last
    // Heuristic: if array length > 12, TTM is likely present
    const hasExtraColumn = epsArray.length > 12;
    const endIndex = hasExtraColumn ? epsArray.length - 2 : epsArray.length - 1;
    const startIndex = endIndex - years;

    console.log(`      hasExtraColumn (TTM): ${hasExtraColumn} (length ${epsArray.length} > 12)`);
    console.log(`      endIndex: ${endIndex}, startIndex: ${startIndex}`);

    if (startIndex < 0) {
        console.log(`      ❌ RETURNED NULL: startIndex < 0 (${startIndex})`);
        return null;
    }

    const endEps = epsArray[endIndex];
    const startEps = epsArray[startIndex];

    console.log(`      startEps (index ${startIndex}): ${startEps}`);
    console.log(`      endEps (index ${endIndex}): ${endEps}`);

    // Both values must be positive for meaningful CAGR
    if (startEps <= 0 || endEps <= 0) {
        console.log(`      ❌ RETURNED NULL: Negative/zero EPS → startEps=${startEps}, endEps=${endEps}`);
        return null;
    }

    const cagr = (Math.pow(endEps / startEps, 1 / years) - 1) * 100;
    console.log(`      ✅ CAGR calculated: (${endEps}/${startEps})^(1/${years}) - 1 = ${cagr.toFixed(2)}%`);
    return parseFloat(cagr.toFixed(2));
}

/**
 * Calculate average of last N values in an array
 * @param {number[]} arr - Array of numeric values
 * @param {number} n - Number of recent values to average
 * @returns {number|null} Average or null if insufficient data
 */
function averageLastN(arr, n = 5) {
    if (!arr || arr.length === 0) return null;
    const slice = arr.slice(-n);
    if (slice.length === 0) return null;
    const sum = slice.reduce((a, b) => a + b, 0);
    return parseFloat((sum / slice.length).toFixed(2));
}

/**
 * Calculate Growth Score
 * @param {Object} data - Scraped financial data from Screener
 * @returns {Object} Score breakdown with factors, decision, and interpretation
 */
function calculateGrowthScore(data) {
    const factors = {};
    let score = 0;

    const { historical } = data;

    // ===== 1. REVENUE GROWTH SCORE (20 Points) =====
    // Uses 5Y Sales CAGR from Screener's ranges-table
    const salesCagr5Y = data.salesGrowth5Y;

    let revenuePoints = 0;
    if (salesCagr5Y !== null && salesCagr5Y !== undefined) {
        if (salesCagr5Y > 25) revenuePoints = 20;
        else if (salesCagr5Y >= 20) revenuePoints = 16;
        else if (salesCagr5Y >= 15) revenuePoints = 12;
        else if (salesCagr5Y >= 10) revenuePoints = 8;
        else revenuePoints = 0;
    }

    factors.revenueGrowth = {
        value: salesCagr5Y,
        condition: '5Y Sales CAGR scoring (>25%=20, 20-25%=16, 15-20%=12, 10-15%=8, <10%=0)',
        pass: revenuePoints >= 12,
        marks: revenuePoints,
        maxMarks: 20
    };
    score += revenuePoints;

    // ===== 2. EPS GROWTH SCORE (20 Points) =====
    // True EPS CAGR calculated from historical EPS array
    // Try 5Y first, then 4Y, then 3Y if start EPS is negative (turnaround companies)
    let epsCagr5Y = calculateEpsCagr(historical?.eps, 5);
    let epsCagrYears = 5;

    if (epsCagr5Y === null && historical?.eps?.length >= 5) {
        console.log('   ↪ 5Y EPS CAGR failed, trying 4Y...');
        epsCagr5Y = calculateEpsCagr(historical.eps, 4);
        if (epsCagr5Y !== null) epsCagrYears = 4;
    }
    if (epsCagr5Y === null && historical?.eps?.length >= 4) {
        console.log('   ↪ 4Y EPS CAGR failed, trying 3Y...');
        epsCagr5Y = calculateEpsCagr(historical.eps, 3);
        if (epsCagr5Y !== null) epsCagrYears = 3;
    }

    // Fallback to profitGrowth5Y if all EPS CAGR windows fail
    const effectiveEpsGrowth = epsCagr5Y !== null ? epsCagr5Y : data.profitGrowth5Y;

    if (epsCagr5Y !== null && epsCagrYears !== 5) {
        console.log(`   ✅ Used ${epsCagrYears}Y EPS CAGR = ${epsCagr5Y}% (5Y had negative start EPS)`);
    }

    let epsPoints = 0;
    if (effectiveEpsGrowth !== null && effectiveEpsGrowth !== undefined) {
        if (effectiveEpsGrowth > 25) epsPoints = 20;
        else if (effectiveEpsGrowth >= 20) epsPoints = 16;
        else if (effectiveEpsGrowth >= 15) epsPoints = 12;
        else if (effectiveEpsGrowth >= 10) epsPoints = 8;
        else epsPoints = 0;
    }

    factors.epsGrowth = {
        value: effectiveEpsGrowth,
        calculatedEpsCagr: epsCagr5Y,
        cagrYearsUsed: epsCagr5Y !== null ? epsCagrYears : null,
        fallbackUsed: epsCagr5Y === null,
        condition: '5Y EPS CAGR scoring (>25%=20, 20-25%=16, 15-20%=12, 10-15%=8, <10%=0)',
        pass: epsPoints >= 12,
        marks: epsPoints,
        maxMarks: 20
    };
    score += epsPoints;

    // ===== 3. ROCE SCORE (15 Points) =====
    // Average ROCE over last 5 years from #ratios table
    const roceHistory = historical?.roceHistorical || [];
    const avgRoce5Y = averageLastN(roceHistory, 5);
    // Fallback: use current ROCE from top card
    const effectiveRoce = avgRoce5Y !== null ? avgRoce5Y : data.roce;

    let rocePoints = 0;
    if (effectiveRoce !== null && effectiveRoce !== undefined) {
        if (effectiveRoce > 25) rocePoints = 15;
        else if (effectiveRoce >= 20) rocePoints = 12;
        else if (effectiveRoce >= 15) rocePoints = 8;
        else if (effectiveRoce >= 10) rocePoints = 4;
        else rocePoints = 0;
    }

    factors.roce = {
        value: effectiveRoce,
        avgRoce5Y: avgRoce5Y,
        currentRoce: data.roce,
        roceHistory: roceHistory.slice(-5),
        fallbackUsed: avgRoce5Y === null,
        condition: '5Y Avg ROCE scoring (>25%=15, 20-25%=12, 15-20%=8, 10-15%=4, <10%=0)',
        pass: rocePoints >= 8,
        marks: rocePoints,
        maxMarks: 15
    };
    score += rocePoints;

    // ===== 4. PROFIT CONSISTENCY SCORE (15 Points) =====
    // Count years with positive profit growth in last 5 years
    const netProfits = historical?.netProfit || [];
    const recentProfits = netProfits.slice(-6); // Need 6 values to check 5 years of growth

    let positiveGrowthYears = 0;
    const yearDetails = [];
    if (recentProfits.length >= 2) {
        for (let i = 1; i < recentProfits.length && i <= 5; i++) {
            const grew = recentProfits[i] > recentProfits[i - 1];
            if (grew) positiveGrowthYears++;
            yearDetails.push({
                year: `Y-${recentProfits.length - 1 - i}`,
                previous: recentProfits[i - 1],
                current: recentProfits[i],
                grew
            });
        }
    }

    // Limit to max 5 years
    const effectivePositiveYears = Math.min(positiveGrowthYears, 5);
    const totalYearsChecked = Math.min(yearDetails.length, 5);

    let consistencyPoints = 0;
    if (totalYearsChecked >= 3) {
        if (effectivePositiveYears >= 5) consistencyPoints = 15;
        else if (effectivePositiveYears >= 4) consistencyPoints = 10;
        else if (effectivePositiveYears >= 3) consistencyPoints = 5;
        else consistencyPoints = 0;
    }

    factors.profitConsistency = {
        value: `${effectivePositiveYears}/${totalYearsChecked}`,
        positiveGrowthYears: effectivePositiveYears,
        totalYearsChecked,
        yearDetails,
        condition: 'Positive profit growth years (5/5=15, 4/5=10, 3/5=5, <3=0)',
        pass: consistencyPoints >= 10,
        marks: consistencyPoints,
        maxMarks: 15
    };
    score += consistencyPoints;

    // ===== 5. OPERATING MARGIN TREND SCORE (10 Points) =====
    // Compare current OPM vs OPM 5 years ago
    const opmArray = historical?.opmPercent || [];
    let opmChange = null;
    let currentOPM = null;
    let oldOPM = null;

    if (opmArray.length >= 6) {
        currentOPM = opmArray[opmArray.length - 1];
        oldOPM = opmArray[opmArray.length - 6]; // 5 years back
        opmChange = currentOPM - oldOPM;
    } else if (opmArray.length >= 2) {
        currentOPM = opmArray[opmArray.length - 1];
        oldOPM = opmArray[0];
        opmChange = currentOPM - oldOPM;
    }

    let marginPoints = 0;
    if (opmChange !== null) {
        if (opmChange > 3) marginPoints = 10;
        else if (opmChange >= -3) marginPoints = 6;
        else marginPoints = 0;
    }

    factors.marginTrend = {
        value: opmChange !== null ? `${opmChange > 0 ? '+' : ''}${opmChange.toFixed(1)}%` : null,
        currentOPM,
        oldOPM,
        opmChange,
        condition: 'OPM change (>+3%=10, -3% to +3%=6, <-3%=0)',
        pass: marginPoints >= 6,
        marks: marginPoints,
        maxMarks: 10
    };
    score += marginPoints;

    // ===== 6. DEBT QUALITY SCORE (10 Points) =====
    const debtToEquity = data.debtToEquity;

    let debtPoints = 0;
    if (debtToEquity !== null && debtToEquity !== undefined) {
        if (debtToEquity < 0.3) debtPoints = 10;
        else if (debtToEquity <= 0.5) debtPoints = 8;
        else if (debtToEquity <= 1) debtPoints = 4;
        else debtPoints = 0;
    }

    factors.debtQuality = {
        value: debtToEquity !== null ? debtToEquity.toFixed(2) : null,
        condition: 'D/E ratio (<0.3=10, 0.3-0.5=8, 0.5-1=4, >1=0)',
        pass: debtPoints >= 8,
        marks: debtPoints,
        maxMarks: 10
    };
    score += debtPoints;

    // ===== 7. OWNERSHIP CONFIDENCE SCORE (10 Points) =====
    // Part A: Promoter Holding > 50% and stable (5 pts)
    const latestPromoter = data.latestPromoterHolding;
    const prevPromoter = data.prevPromoterHolding;

    const promoterAbove50 = latestPromoter !== null && latestPromoter > 50;
    const promoterStable = latestPromoter !== null && prevPromoter !== null &&
        (latestPromoter >= prevPromoter - 2); // Allow 2% drop tolerance
    const promoterPass = promoterAbove50 && promoterStable;

    const promoterPoints = promoterPass ? 5 : 0;

    // Part B: FII/DII trend increasing (5 pts)
    const latestFII = data.latestFIIHolding;
    const prevFII = data.prevFIIHolding;
    const latestDII = data.latestDIIHolding;
    const prevDII = data.prevDIIHolding;

    let fiiDiiIncreasing = false;
    if (latestFII !== null && prevFII !== null && latestDII !== null && prevDII !== null) {
        const totalLatest = latestFII + latestDII;
        const totalPrev = prevFII + prevDII;
        fiiDiiIncreasing = totalLatest > totalPrev;
    }

    const fiiDiiPoints = fiiDiiIncreasing ? 5 : 0;
    const ownershipPoints = promoterPoints + fiiDiiPoints;

    factors.ownershipConfidence = {
        value: {
            promoterHolding: latestPromoter,
            prevPromoterHolding: prevPromoter,
            fiiHolding: latestFII,
            diiHolding: latestDII,
            fiiDiiCombined: latestFII !== null && latestDII !== null ? latestFII + latestDII : null
        },
        promoterScore: promoterPoints,
        fiiDiiScore: fiiDiiPoints,
        condition: 'Promoter >50% & stable (5pts) + FII/DII increasing (5pts)',
        pass: ownershipPoints >= 5,
        marks: ownershipPoints,
        maxMarks: 10
    };
    score += ownershipPoints;

    // ===== GROWTH SCORE DECISION =====
    let decision;
    if (score >= 80) decision = 'BUY';
    else if (score >= 65) decision = 'HOLD';
    else decision = 'AVOID';

    // ===== INTERPRETATION =====
    let interpretation;
    if (score >= 85) interpretation = 'Excellent Growth Stock';
    else if (score >= 80) interpretation = 'Strong Growth Stock';
    else if (score >= 70) interpretation = 'Moderate Growth Potential';
    else if (score >= 65) interpretation = 'Below Average Growth';
    else interpretation = 'Weak Growth Profile';

    return {
        name: 'Growth Score',
        score,
        total: 100,
        percent: score, // Already out of 100
        factors,
        decision,
        interpretation,
        // Computed values useful for valuation engine
        _computed: {
            epsCagr5Y: effectiveEpsGrowth,
            salesCagr5Y,
            avgRoce5Y: effectiveRoce
        },
        // Deferred fields for future AI integration
        moat: null,
        sustainability: null,
        potentialMaxScore: 130
    };
}

module.exports = calculateGrowthScore;
