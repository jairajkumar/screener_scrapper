/**
 * Stock Valuation & Decision Engine
 * 
 * Implements rule-based valuation combining:
 * - Graham Number (Value Anchor)
 * - Lynch Fair Value (Growth Anchor)
 * - Price Band calculations
 * - Score-based decision integration
 * - Risk rule enforcement
 */

/**
 * Calculate stock valuation and final investment decision
 * @param {Object} data - Scraped financial data from Screener
 * @param {Object} scores - Existing 4-score system results { piotroski, buffett, graham, lynch }
 * @returns {Object} Complete valuation with fair value, bands, and decision
 */
function calculateValuation(data, scores) {
    const result = {
        currentPrice: null,
        fairValue: null,
        grahamNumber: null,
        lynchFairValue: null,
        priceBands: {
            strongBuyBelow: null,
            buyBelow: null,
            holdAbove: null,
            sellAbove: null
        },
        priceZone: null,
        scoreDecision: null,
        finalDecision: null,
        valuationStatus: null,
        confidence: null,
        riskFlags: [],
        dataSource: {
            grahamNumber: null
        },
        _debug: {}
    };

    // ===== VALIDATE MANDATORY DATA =====
    const currentPrice = data.currentPrice;
    const eps = data.latestEPS;
    const bookValue = data.bookValue;
    const stockPE = data.stockPE;
    const profitGrowth5Y = data.profitGrowth5Y;
    const debtToEquity = data.debtToEquity;

    // Check for mandatory fields
    if (eps === null || eps === undefined) {
        result.finalDecision = 'DATA_INSUFFICIENT';
        result.riskFlags.push('Missing EPS data');
        return result;
    }

    if (bookValue === null || bookValue === undefined) {
        result.finalDecision = 'DATA_INSUFFICIENT';
        result.riskFlags.push('Missing Book Value data');
        return result;
    }

    result.currentPrice = currentPrice;

    // ===== RISK RULE 1: Loss Making Company =====
    if (eps <= 0) {
        result.finalDecision = 'AVOID';
        result.riskFlags.push('Loss-making company (EPS ≤ 0)');
        result.valuationStatus = 'NOT_APPLICABLE';
        result.confidence = 'HIGH';
        return result;
    }

    // ===== CALCULATE GRAHAM NUMBER =====
    // Use Screener's value if available (more accurate), calculate otherwise
    let grahamNumber;
    if (data.grahamNumber !== null && data.grahamNumber !== undefined && data.grahamNumber > 0) {
        grahamNumber = data.grahamNumber;
        result.dataSource.grahamNumber = 'screener';
    } else {
        // Formula: sqrt(22.5 × EPS × BookValue)
        grahamNumber = Math.sqrt(22.5 * eps * bookValue);
        result.dataSource.grahamNumber = 'calculated';
    }
    result.grahamNumber = parseFloat(grahamNumber.toFixed(2));

    // ===== CALCULATE LYNCH FAIR VALUE =====
    // Step 1: Cap Growth PE at 25
    const cappedGrowthPE = Math.min(profitGrowth5Y || 0, 25);

    // Step 2: Lynch Fair Value = EPS × GrowthPE
    // If growth is negative or zero, use a conservative PE of 10
    const effectiveGrowthPE = cappedGrowthPE > 0 ? cappedGrowthPE : 10;
    const lynchFairValue = eps * effectiveGrowthPE;
    result.lynchFairValue = parseFloat(lynchFairValue.toFixed(2));

    result._debug.cappedGrowthPE = cappedGrowthPE;
    result._debug.effectiveGrowthPE = effectiveGrowthPE;

    // ===== CALCULATE COMPOSITE FAIR VALUE =====
    const fairValue = (grahamNumber + lynchFairValue) / 2;
    result.fairValue = parseFloat(fairValue.toFixed(2));

    // ===== CALCULATE PRICE BANDS =====
    result.priceBands = {
        strongBuyBelow: parseFloat((fairValue * 0.75).toFixed(2)),
        buyBelow: parseFloat((fairValue * 0.85).toFixed(2)),
        holdAbove: parseFloat((fairValue * 1.10).toFixed(2)),
        sellAbove: parseFloat((fairValue * 1.25).toFixed(2))
    };

    // ===== DETERMINE PRICE ZONE =====
    if (currentPrice === null || currentPrice === undefined) {
        result.priceZone = 'UNKNOWN';
    } else if (currentPrice <= result.priceBands.strongBuyBelow) {
        result.priceZone = 'STRONG_BUY';
        result.valuationStatus = 'DEEPLY_UNDERVALUED';
    } else if (currentPrice <= result.priceBands.buyBelow) {
        result.priceZone = 'BUY';
        result.valuationStatus = 'UNDERVALUED';
    } else if (currentPrice <= result.priceBands.holdAbove) {
        result.priceZone = 'HOLD';
        result.valuationStatus = 'FAIRLY_VALUED';
    } else if (currentPrice <= result.priceBands.sellAbove) {
        result.priceZone = 'SELL';
        result.valuationStatus = 'OVERVALUED';
    } else {
        result.priceZone = 'STRONG_SELL';
        result.valuationStatus = 'HIGHLY_OVERVALUED';
    }

    // ===== SCORE-BASED DECISION =====
    // Count how many of the 4 scores are >= 7
    const scoreValues = [
        scores.piotroski || 0,
        scores.buffett || 0,
        scores.graham || 0,
        scores.lynch || 0
    ];
    const scoresAbove7 = scoreValues.filter(s => s >= 7).length;

    if (scoresAbove7 >= 3) {
        result.scoreDecision = 'BUY';
    } else if (scoresAbove7 === 2) {
        result.scoreDecision = 'HOLD';
    } else {
        result.scoreDecision = 'AVOID';
    }

    result._debug.scoresAbove7 = scoresAbove7;

    // ===== FINAL DECISION MATRIX (Score + Price Zone) =====
    result.finalDecision = calculateFinalDecision(result.scoreDecision, result.priceZone);

    // ===== RISK RULE 2: High Debt - Cap at HOLD =====
    if (debtToEquity !== null && debtToEquity > 2) {
        result.riskFlags.push(`High Debt (D/E: ${debtToEquity.toFixed(2)} > 2)`);
        const decisionRank = getDecisionRank(result.finalDecision);
        if (decisionRank > getDecisionRank('HOLD')) {
            result.finalDecision = 'HOLD';
            result.riskFlags.push('Decision capped at HOLD due to high debt');
        }
    }

    // ===== RISK RULE 3: PEG Risk - Downgrade one level =====
    if (stockPE !== null && profitGrowth5Y !== null && profitGrowth5Y > 0) {
        const pegRatio = stockPE / profitGrowth5Y;
        if (pegRatio > 2.5) {
            result.riskFlags.push(`High PEG Ratio (${pegRatio.toFixed(2)} > 2.5)`);
            result.finalDecision = downgradeDecision(result.finalDecision);
        }
        result._debug.pegRatio = parseFloat(pegRatio.toFixed(2));
    }

    // ===== DETERMINE CONFIDENCE =====
    result.confidence = calculateConfidence(result, data);

    return result;
}

/**
 * Final Decision Matrix - Combines score decision with price zone
 * Based on PRD Section 8
 */
function calculateFinalDecision(scoreDecision, priceZone) {
    const matrix = {
        'BUY': {
            'STRONG_BUY': 'STRONG_BUY',
            'BUY': 'BUY',
            'HOLD': 'HOLD',           // Overvalued
            'SELL': 'AVOID',
            'STRONG_SELL': 'AVOID',
            'UNKNOWN': 'BUY'          // Trust score when price unknown
        },
        'HOLD': {
            'STRONG_BUY': 'ACCUMULATE',
            'BUY': 'HOLD',
            'HOLD': 'HOLD',
            'SELL': 'SELL',
            'STRONG_SELL': 'SELL',
            'UNKNOWN': 'HOLD'
        },
        'AVOID': {
            'STRONG_BUY': 'AVOID',
            'BUY': 'AVOID',
            'HOLD': 'AVOID',
            'SELL': 'AVOID',
            'STRONG_SELL': 'AVOID',
            'UNKNOWN': 'AVOID'
        }
    };

    return matrix[scoreDecision]?.[priceZone] || 'HOLD';
}

/**
 * Get numeric rank for decision (higher = better)
 */
function getDecisionRank(decision) {
    const ranks = {
        'AVOID': 0,
        'SELL': 1,
        'HOLD': 2,
        'ACCUMULATE': 3,
        'BUY': 4,
        'STRONG_BUY': 5
    };
    return ranks[decision] || 2;
}

/**
 * Downgrade decision by one level
 */
function downgradeDecision(decision) {
    const downgradeMap = {
        'STRONG_BUY': 'BUY',
        'BUY': 'HOLD',
        'ACCUMULATE': 'HOLD',
        'HOLD': 'SELL',
        'SELL': 'AVOID',
        'AVOID': 'AVOID'
    };
    return downgradeMap[decision] || decision;
}

/**
 * Calculate confidence level based on data quality
 */
function calculateConfidence(result, data) {
    let confidenceScore = 0;
    const maxScore = 5;

    // Has current price
    if (data.currentPrice !== null) confidenceScore++;

    // Has Screener's Graham Number (more reliable)
    if (result.dataSource.grahamNumber === 'screener') confidenceScore++;

    // Has positive growth data
    if (data.profitGrowth5Y !== null && data.profitGrowth5Y > 0) confidenceScore++;

    // Has debt data
    if (data.debtToEquity !== null) confidenceScore++;

    // No risk flags
    if (result.riskFlags.length === 0) confidenceScore++;

    if (confidenceScore >= 4) return 'HIGH';
    if (confidenceScore >= 2) return 'MEDIUM';
    return 'LOW';
}

module.exports = calculateValuation;
