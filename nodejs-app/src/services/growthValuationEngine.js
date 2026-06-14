/**
 * Growth Valuation Engine
 * 
 * PEG-based valuation system for growth stocks.
 * Combines Growth Score decision with PEG zone to produce final decision.
 * 
 * Components:
 *   - Growth PE & Fair Value (PEG-based)
 *   - PEG Zone classification
 *   - Valuation Normalization (5Y Avg PE from Yahoo Finance)
 *   - Risk Rules (5 rules that can override/downgrade decisions)
 *   - Final Decision Matrix
 */

const { calculateHistoricalPE } = require('./yahooFinanceService');

/**
 * Calculate Growth Valuation and Final Decision
 * @param {Object} data - Scraped financial data from Screener
 * @param {Object} growthScoreResult - Result from calculateGrowthScore()
 * @param {Object|null} yahooData - Historical price data from Yahoo Finance (optional)
 * @returns {Object} Complete growth valuation with decision
 */
function calculateGrowthValuation(data, growthScoreResult, yahooData = null) {
    const result = {
        // Growth Valuation
        growthPE: null,
        growthFairValue: null,
        currentPrice: null,
        upside: null,

        // PEG Analysis
        peg: null,
        pegZone: null,

        // Valuation Normalization (from Yahoo Finance)
        valuationNorm: null,

        // Decisions
        scoreDecision: null,
        pegDecision: null,
        finalDecision: null,

        // Risk
        riskFlags: [],
        confidence: null,

        // Debug
        _debug: {}
    };

    // ===== EXTRACT KEY DATA =====
    const currentPrice = data.currentPrice;
    const eps = data.latestEPS;
    const stockPE = data.stockPE;
    const debtToEquity = data.debtToEquity;
    const salesCagr5Y = data.salesGrowth5Y;
    const promoterPledge = data.promoterPledge;

    // Use computed EPS CAGR from growth score (true calculation, not profitGrowth5Y proxy)
    const epsCagr5Y = growthScoreResult._computed?.epsCagr5Y;

    result.currentPrice = currentPrice;
    result.scoreDecision = growthScoreResult.decision;

    // ===== RISK RULE 1: Loss-Making Company =====
    if (eps === null || eps === undefined || eps <= 0) {
        result.finalDecision = 'AVOID';
        result.riskFlags.push({
            rule: 'Rule 1: Loss-Making Company',
            detail: `EPS = ${eps ?? 'N/A'}`,
            action: 'Force AVOID'
        });
        result.confidence = 'HIGH';
        return result;
    }

    // ===== RISK RULE 2: Weak Revenue Growth =====
    if (salesCagr5Y !== null && salesCagr5Y < 10) {
        result.finalDecision = 'AVOID';
        result.riskFlags.push({
            rule: 'Rule 2: Weak Revenue Growth',
            detail: `5Y Sales CAGR = ${salesCagr5Y}% (< 10%)`,
            action: 'Force AVOID'
        });
        result.confidence = 'HIGH';
        return result;
    }

    // ===== RISK RULE 5: Promoter Pledge Risk =====
    if (promoterPledge !== null && promoterPledge > 10) {
        result.finalDecision = 'AVOID';
        result.riskFlags.push({
            rule: 'Rule 5: Promoter Pledge Risk',
            detail: `Promoter Pledge = ${promoterPledge}% (> 10%)`,
            action: 'Force AVOID'
        });
        result.confidence = 'HIGH';
        return result;
    }

    // ===== CALCULATE GROWTH PE =====
    // Growth PE = MIN(EPS_CAGR, 40)
    if (epsCagr5Y !== null && epsCagr5Y > 0) {
        result.growthPE = Math.min(epsCagr5Y, 40);
    } else {
        // Conservative fallback
        result.growthPE = 10;
        result._debug.growthPEFallback = true;
    }

    // ===== CALCULATE GROWTH FAIR VALUE =====
    // Fair Value = EPS × Growth PE
    result.growthFairValue = parseFloat((eps * result.growthPE).toFixed(2));

    // ===== CALCULATE UPSIDE =====
    if (currentPrice && result.growthFairValue) {
        result.upside = parseFloat((((result.growthFairValue - currentPrice) / currentPrice) * 100).toFixed(2));
    }

    // ===== CALCULATE PEG RATIO =====
    if (stockPE !== null && epsCagr5Y !== null && epsCagr5Y > 0) {
        result.peg = parseFloat((stockPE / epsCagr5Y).toFixed(2));
    }

    // ===== DETERMINE PEG ZONE =====
    if (result.peg !== null) {
        if (result.peg < 0.8) result.pegZone = 'STRONG_BUY';
        else if (result.peg <= 1.2) result.pegZone = 'BUY';
        else if (result.peg <= 1.5) result.pegZone = 'HOLD';
        else if (result.peg <= 2.0) result.pegZone = 'SELL';
        else result.pegZone = 'AVOID';
    } else {
        result.pegZone = 'UNKNOWN';
    }

    // ===== VALUATION NORMALIZATION (from Yahoo Finance) =====
    result.valuationNorm = calculateValuationNormalization(
        data, yahooData, stockPE
    );

    // ===== FINAL DECISION MATRIX (Growth Score × PEG Zone) =====
    result.pegDecision = result.pegZone;
    result.finalDecision = applyDecisionMatrix(result.scoreDecision, result.pegZone);

    result._debug.preRiskDecision = result.finalDecision;

    // ===== RISK RULE 3: Poor Capital Efficiency =====
    const effectiveRoce = growthScoreResult._computed?.avgRoce5Y;
    if (effectiveRoce !== null && effectiveRoce !== undefined && effectiveRoce < 15) {
        result.riskFlags.push({
            rule: 'Rule 3: Poor Capital Efficiency',
            detail: `ROCE = ${effectiveRoce}% (< 15%)`,
            action: 'Cap at HOLD'
        });
        const rank = getDecisionRank(result.finalDecision);
        if (rank > getDecisionRank('HOLD')) {
            result.finalDecision = 'HOLD';
        }
    }

    // ===== RISK RULE 4: High Debt =====
    if (debtToEquity !== null && debtToEquity > 1) {
        result.riskFlags.push({
            rule: 'Rule 4: High Debt',
            detail: `D/E = ${debtToEquity.toFixed(2)} (> 1.0)`,
            action: 'Downgrade one level'
        });
        result.finalDecision = downgradeDecision(result.finalDecision);
    }

    // ===== CONFIDENCE =====
    result.confidence = calculateConfidence(result, data, growthScoreResult, yahooData);

    return result;
}

/**
 * Calculate Valuation Normalization using Yahoo Finance historical PE data
 * @param {Object} data - Scraped financial data
 * @param {Object|null} yahooData - Yahoo Finance historical price data
 * @param {number|null} currentPE - Current stock PE
 * @returns {Object|null} Valuation normalization result or null if unavailable
 */
function calculateValuationNormalization(data, yahooData, currentPE) {
    if (!yahooData || !yahooData.success) {
        return {
            available: false,
            reason: yahooData?.error || 'Yahoo Finance data not available',
            score: null,
            maxScore: 10
        };
    }

    const epsArray = data.historical?.eps || [];
    if (epsArray.length === 0 || currentPE === null) {
        return {
            available: false,
            reason: 'Insufficient EPS or PE data for normalization',
            score: null,
            maxScore: 10
        };
    }

    // Determine latest full fiscal year
    // Screener P&L tables go up to "Mar 2025" typically
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth(); // 0-indexed
    // If we're past March, the latest full fiscal year is currentYear
    // If before March, it's currentYear - 1
    const latestFiscalYear = currentMonth >= 2 ? currentYear : currentYear - 1;

    // Calculate historical PE using Yahoo prices + Screener EPS
    const peData = calculateHistoricalPE(
        yahooData.yearEndPrices,
        epsArray,
        latestFiscalYear
    );

    if (peData.avgPE5Y === null) {
        return {
            available: false,
            reason: `Insufficient historical PE data (got ${peData.dataYears} years, need 3+)`,
            score: null,
            maxScore: 10
        };
    }

    // Calculate PE premium/discount
    const premiumPercent = parseFloat(
        (((currentPE - peData.avgPE5Y) / peData.avgPE5Y) * 100).toFixed(2)
    );

    // Score based on premium (lower premium = better for buying)
    let normScore = 0;
    if (premiumPercent < -20) normScore = 10;       // Deeply discounted vs own history
    else if (premiumPercent < -5) normScore = 8;     // Discounted
    else if (premiumPercent <= 10) normScore = 6;    // Fairly valued
    else if (premiumPercent <= 25) normScore = 4;    // Slight premium
    else if (premiumPercent <= 50) normScore = 2;    // Expensive
    else normScore = 0;                               // Very expensive vs own history

    let status;
    if (premiumPercent < -10) status = 'Trading Below Historical Average';
    else if (premiumPercent <= 10) status = 'Fair Valuation';
    else if (premiumPercent <= 30) status = 'Slight Premium to History';
    else status = 'Expensive vs Historical Average';

    return {
        available: true,
        currentPE,
        avgPE5Y: peData.avgPE5Y,
        premiumPercent,
        status,
        historicalPEs: peData.historicalPEs,
        dataYears: peData.dataYears,
        score: normScore,
        maxScore: 10,
        _debug: peData._debug
    };
}

/**
 * Final Decision Matrix — Combines Growth Score decision with PEG zone
 * From PRD Section: Final Decision Matrix
 */
function applyDecisionMatrix(scoreDecision, pegZone) {
    const matrix = {
        'BUY': {
            'STRONG_BUY': 'STRONG_BUY',
            'BUY': 'BUY',
            'HOLD': 'HOLD',
            'SELL': 'SELL',
            'AVOID': 'AVOID',
            'UNKNOWN': 'BUY'        // Trust score when PEG unknown
        },
        'HOLD': {
            'STRONG_BUY': 'BUY',
            'BUY': 'HOLD',
            'HOLD': 'HOLD',
            'SELL': 'SELL',
            'AVOID': 'AVOID',
            'UNKNOWN': 'HOLD'
        },
        'AVOID': {
            'STRONG_BUY': 'AVOID',
            'BUY': 'AVOID',
            'HOLD': 'AVOID',
            'SELL': 'AVOID',
            'AVOID': 'AVOID',
            'UNKNOWN': 'AVOID'
        }
    };

    return matrix[scoreDecision]?.[pegZone] || 'HOLD';
}

/**
 * Get numeric rank for decision (higher = better)
 */
function getDecisionRank(decision) {
    const ranks = {
        'AVOID': 0,
        'SELL': 1,
        'HOLD': 2,
        'BUY': 3,
        'STRONG_BUY': 4
    };
    return ranks[decision] ?? 2;
}

/**
 * Downgrade decision by one level
 */
function downgradeDecision(decision) {
    const downgradeMap = {
        'STRONG_BUY': 'BUY',
        'BUY': 'HOLD',
        'HOLD': 'SELL',
        'SELL': 'AVOID',
        'AVOID': 'AVOID'
    };
    return downgradeMap[decision] || decision;
}

/**
 * Calculate confidence level based on data quality and consistency
 */
function calculateConfidence(result, data, growthScore, yahooData) {
    let confidenceScore = 0;
    const maxScore = 7;

    // 1. Has current price
    if (data.currentPrice !== null) confidenceScore++;

    // 2. Has true EPS CAGR (not fallback)
    if (growthScore._computed?.epsCagr5Y !== null) confidenceScore++;

    // 3. Has PEG calculation
    if (result.peg !== null) confidenceScore++;

    // 4. Has Yahoo Finance data for PE normalization
    if (yahooData?.success) confidenceScore++;

    // 5. Has ownership data
    if (data.latestPromoterHolding !== null) confidenceScore++;

    // 6. Growth score and PEG agree on direction
    const scorePositive = growthScore.decision === 'BUY';
    const pegPositive = result.pegZone === 'STRONG_BUY' || result.pegZone === 'BUY';
    if (scorePositive === pegPositive) confidenceScore++;

    // 7. No risk flags
    if (result.riskFlags.length === 0) confidenceScore++;

    if (confidenceScore >= 6) return 'HIGH';
    if (confidenceScore >= 4) return 'MEDIUM';
    return 'LOW';
}

module.exports = calculateGrowthValuation;
