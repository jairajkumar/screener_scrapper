const { CRITERIA } = require('../../config');
const calculatePiotroskiScore = require('./piotroskiScore');
const calculateBuffettScore = require('./buffettScore');
const calculateGrahamScore = require('./grahamScore');
const calculateLynchScore = require('./lynchScore');
const calculateValuation = require('./valuationEngine');

/**
 * Analyze stock data using all 4 scoring systems
 * @param {Object} data - Comprehensive stock data from scraper
 * @returns {Object} Complete analysis with all 4 scores and final decision
 */
function analyzeStock(data) {
    // Calculate all 4 scores
    const piotroski = calculatePiotroskiScore(data);
    const buffett = calculateBuffettScore(data);
    const graham = calculateGrahamScore(data);
    const lynch = calculateLynchScore(data);

    // Count how many scores are >= 7 (or equivalent for different totals)
    const scores = [
        { name: 'Piotroski', score: piotroski.score, total: piotroski.total, threshold: 7 },
        { name: 'Buffett', score: buffett.score, total: buffett.total, threshold: 7 },
        { name: 'Graham', score: graham.score, total: graham.total, threshold: 7 },
        { name: 'Lynch', score: lynch.score, total: lynch.total, threshold: 7 }
    ];

    const scoresAbove7 = scores.filter(s => s.score >= s.threshold).length;

    // Final Decision Logic from PDF
    let finalDecision;
    if (scoresAbove7 >= 3) {
        finalDecision = 'BUY';
    } else if (scoresAbove7 === 2) {
        finalDecision = 'HOLD';
    } else {
        finalDecision = 'AVOID';
    }

    // Calculate overall score (average percentage)
    const overallPercent = Math.round(
        (piotroski.percent + buffett.percent + graham.percent + lynch.percent) / 4
    );

    // Legacy compatibility - basic analysis
    const legacyAnalysis = {
        roe: data.roe > CRITERIA.roe_min ? 'PASS' : (data.roe !== null ? 'FAIL' : 'NA'),
        pe_ratio: data.stockPE < CRITERIA.pe_max ? 'PASS' : (data.stockPE !== null ? 'FAIL' : 'NA'),
        debt_to_equity: data.debtToEquity < CRITERIA.debt_to_equity_max ? 'PASS' : (data.debtToEquity !== null ? 'FAIL' : 'NA'),
        roce: data.roce > CRITERIA.roce_min ? 'PASS' : (data.roce !== null ? 'FAIL' : 'NA'),
        cash_flow: data.fcf > 0 ? 'PASS' : (data.fcf !== null ? 'FAIL' : 'NA'),
        intrinsic_value: data.grahamNumber
    };

    // Calculate valuation using the 4-score results
    const valuation = calculateValuation(data, {
        piotroski: piotroski.score,
        buffett: buffett.score,
        graham: graham.score,
        lynch: lynch.score
    });

    return {
        // Final Decision
        finalDecision,
        scoresAbove7,
        overallPercent,

        // All 4 Scores
        piotroski,
        buffett,
        graham,
        lynch,

        // Summary for quick view
        summary: {
            piotroski: `${piotroski.score}/${piotroski.total}`,
            buffett: `${buffett.score}/${buffett.total}`,
            graham: `${graham.score}/${graham.total}`,
            lynch: `${lynch.score}/${lynch.total}`
        },

        // Valuation Engine Results
        valuation,

        // Legacy format for backward compatibility
        verdict: finalDecision,
        score: scoresAbove7,
        total: 4,
        percent: overallPercent,
        analysis: legacyAnalysis
    };
}

module.exports = analyzeStock;
