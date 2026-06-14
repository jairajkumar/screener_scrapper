const { CRITERIA } = require('../../config');
const calculatePiotroskiScore = require('./piotroskiScore');
const calculateBuffettScore = require('./buffettScore');
const calculateGrahamScore = require('./grahamScore');
const calculateLynchScore = require('./lynchScore');
const calculateValuation = require('./valuationEngine');
const calculateGrowthScore = require('./growthScore');
const calculateGrowthValuation = require('./growthValuationEngine');
const { fetchHistoricalPrices } = require('./yahooFinanceService');

/**
 * Analyze stock data using all scoring systems + Growth Engine
 * @param {Object} data - Comprehensive stock data from scraper
 * @param {string|null} ticker - Stock ticker/slug for Yahoo Finance (e.g., "TCS", "RELIANCE")
 * @returns {Promise<Object>} Complete analysis with all scores, valuations, and growth engine
 */
async function analyzeStock(data, ticker = null) {
    // ===== EXISTING 4-SCORE SYSTEM (unchanged) =====
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

    // Calculate valuation using the 4-score results (existing Value engine)
    const valuation = calculateValuation(data, {
        piotroski: piotroski.score,
        buffett: buffett.score,
        graham: graham.score,
        lynch: lynch.score
    });

    // ===== GROWTH INVESTMENT ENGINE (new) =====
    let growth = null;
    let growthValuation = null;

    try {
        // === DEBUG: Log all input data flowing into Growth Engine ===
        console.log('\n══════════════════════════════════════════════════════════════');
        console.log('🌱 GROWTH ENGINE — INPUT DATA DUMP');
        console.log('══════════════════════════════════════════════════════════════');
        console.log(`📌 Ticker received: "${ticker}" (type: ${typeof ticker})`);
        console.log(`📌 Current Price: ${data.currentPrice}`);
        console.log(`📌 Stock PE: ${data.stockPE}`);
        console.log(`📌 Latest EPS: ${data.latestEPS}`);
        console.log(`📌 ROCE: ${data.roce}`);
        console.log(`📌 D/E: ${data.debtToEquity}`);
        console.log(`📌 5Y Sales CAGR: ${data.salesGrowth5Y}`);
        console.log(`📌 5Y Profit CAGR: ${data.profitGrowth5Y}`);
        console.log(`📌 Promoter Pledge: ${data.promoterPledge}`);
        console.log(`📌 Promoter Holding: latest=${data.latestPromoterHolding}, prev=${data.prevPromoterHolding}`);
        console.log(`📌 FII Holding: latest=${data.latestFIIHolding}, prev=${data.prevFIIHolding}`);
        console.log(`📌 DII Holding: latest=${data.latestDIIHolding}, prev=${data.prevDIIHolding}`);
        console.log(`📌 Historical EPS array: [${(data.historical?.eps || []).join(', ')}] (${(data.historical?.eps || []).length} values)`);
        console.log(`📌 Historical ROCE array: [${(data.historical?.roceHistorical || []).join(', ')}] (${(data.historical?.roceHistorical || []).length} values)`);
        console.log(`📌 Historical NetProfit array length: ${(data.historical?.netProfit || []).length}`);
        console.log(`📌 Historical OPM% array length: ${(data.historical?.opmPercent || []).length}`);
        console.log(`📌 Promoter Holding array: [${(data.historical?.promoterHolding || []).join(', ')}]`);
        console.log(`📌 FII Holding array: [${(data.historical?.fiiHolding || []).join(', ')}]`);
        console.log(`📌 DII Holding array: [${(data.historical?.diiHolding || []).join(', ')}]`);
        console.log('──────────────────────────────────────────────────────────────');

        // Step 1: Calculate Growth Score (synchronous — no external calls)
        growth = calculateGrowthScore(data);
        console.log(`\n📈 GROWTH SCORE RESULT: ${growth.score}/${growth.total} — ${growth.decision} (${growth.interpretation})`);
        console.log('   Factor breakdown:');
        Object.entries(growth.factors).forEach(([name, f]) => {
            const fallback = f.fallbackUsed ? ' ⚠️FALLBACK' : '';
            console.log(`   • ${name}: ${f.marks}/${f.maxMarks} | value=${JSON.stringify(f.value)} | pass=${f.pass}${fallback}`);
        });
        console.log(`   Computed: epsCagr5Y=${growth._computed?.epsCagr5Y}, salesCagr5Y=${growth._computed?.salesCagr5Y}, avgRoce5Y=${growth._computed?.avgRoce5Y}`);
        console.log('──────────────────────────────────────────────────────────────');

        // Step 2: Fetch Yahoo Finance data for Valuation Normalization (async)
        let yahooData = null;
        if (ticker) {
            console.log(`\n📊 YAHOO FINANCE — Attempting fetch for ticker: "${ticker}"`);
            try {
                yahooData = await fetchHistoricalPrices(ticker);
                if (yahooData.success) {
                    console.log(`✅ Yahoo Finance: SUCCESS for ${yahooData.yahooTicker}`);
                    console.log(`   Year-end prices: ${JSON.stringify(yahooData.yearEndPrices)}`);
                    console.log(`   Latest price from Yahoo: ${yahooData.currentPrice}`);
                    console.log(`   Data points received: ${yahooData._debug?.totalDataPoints}`);
                } else {
                    console.warn(`⚠️  Yahoo Finance: FAILED — ${yahooData.error}`);
                    console.warn(`   Yahoo ticker used: ${yahooData.yahooTicker}`);
                    console.warn(`   Debug info: ${JSON.stringify(yahooData._debug)}`);
                }
            } catch (yahooError) {
                console.error(`❌ Yahoo Finance EXCEPTION (non-fatal): ${yahooError.message}`);
                console.error(`   Stack: ${yahooError.stack?.split('\n').slice(0,3).join('\n   ')}`);
                yahooData = { success: false, error: yahooError.message };
            }
        } else {
            console.log('\nℹ️  YAHOO FINANCE — SKIPPED: No ticker provided');
            console.log(`   ticker param was: "${ticker}" (type: ${typeof ticker})`);
        }
        console.log('──────────────────────────────────────────────────────────────');

        // Step 3: Calculate Growth Valuation (PEG + risk rules + normalization)
        growthValuation = calculateGrowthValuation(data, growth, yahooData);
        console.log(`\n📈 GROWTH VALUATION RESULT:`);
        console.log(`   Growth PE: ${growthValuation.growthPE}`);
        console.log(`   Growth Fair Value: ${growthValuation.growthFairValue}`);
        console.log(`   PEG: ${growthValuation.peg} | PEG Zone: ${growthValuation.pegZone}`);
        console.log(`   Score Decision: ${growthValuation.scoreDecision} | PEG Decision: ${growthValuation.pegDecision}`);
        console.log(`   Final Decision: ${growthValuation.finalDecision}`);
        console.log(`   Upside: ${growthValuation.upside}%`);
        console.log(`   Confidence: ${growthValuation.confidence}`);
        console.log(`   Risk Flags: ${growthValuation.riskFlags.length > 0 ? growthValuation.riskFlags.map(f => f.rule).join(', ') : 'NONE'}`);
        if (growthValuation.valuationNorm) {
            console.log(`   Valuation Norm: available=${growthValuation.valuationNorm.available}`);
            if (growthValuation.valuationNorm.available) {
                console.log(`     Current PE: ${growthValuation.valuationNorm.currentPE}`);
                console.log(`     5Y Avg PE: ${growthValuation.valuationNorm.avgPE5Y}`);
                console.log(`     Premium: ${growthValuation.valuationNorm.premiumPercent}%`);
                console.log(`     Score: ${growthValuation.valuationNorm.score}/10`);
            } else {
                console.log(`     Reason: ${growthValuation.valuationNorm.reason}`);
            }
        }
        console.log(`   Debug: ${JSON.stringify(growthValuation._debug)}`);
        console.log('══════════════════════════════════════════════════════════════\n');

    } catch (growthError) {
        console.error(`❌ Growth Engine FATAL error (non-fatal to system): ${growthError.message}`);
        console.error(growthError.stack);
        // Growth Engine failure is non-fatal — the existing 4-score system still works
        growth = { error: growthError.message };
        growthValuation = { error: growthError.message };
    }

    return {
        // ===== VALUE PERSPECTIVE (existing — unchanged) =====
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

        // Value Valuation Engine Results
        valuation,

        // ===== GROWTH PERSPECTIVE (new) =====
        growth,
        growthValuation,

        // Growth summary for quick view
        growthSummary: growth && !growth.error ? {
            score: `${growth.score}/${growth.total}`,
            decision: growth.decision,
            peg: growthValuation?.peg,
            pegZone: growthValuation?.pegZone,
            finalDecision: growthValuation?.finalDecision,
            confidence: growthValuation?.confidence,
            riskFlags: growthValuation?.riskFlags?.length || 0,
            valuationNormAvailable: growthValuation?.valuationNorm?.available || false
        } : null,

        // Legacy format for backward compatibility
        verdict: finalDecision,
        score: scoresAbove7,
        total: 4,
        percent: overallPercent,
        analysis: legacyAnalysis
    };
}

module.exports = analyzeStock;
