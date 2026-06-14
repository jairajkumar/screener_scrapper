/**
 * Yahoo Finance Service
 * 
 * Fetches historical stock prices from Yahoo Finance
 * for Valuation Normalization (5Y Average PE calculation).
 * 
 * Uses the stock ticker extracted from Screener.in URLs
 * with .NS suffix for NSE-listed stocks.
 * 
 * Gracefully degrades: if Yahoo Finance is unavailable,
 * the Growth Engine still works — just without PE normalization.
 */

let yahooFinance;

/**
 * Lazily load yahoo-finance2 to avoid startup failures
 * Supports both v2 (.default) and v3 (new YahooFinance()) APIs
 * @returns {Object|null} yahoo-finance2 instance or null
 */
function getYahooFinance() {
    if (yahooFinance !== undefined) return yahooFinance;

    try {
        const YFModule = require('yahoo-finance2');

        // v3 CommonJS exposes the YahooFinance constructor as .default.
        const exportedClient = YFModule.default || YFModule;
        if (typeof exportedClient === 'function') {
            yahooFinance = new exportedClient();
            console.log('✅ yahoo-finance2 loaded (instantiated)');
        }
        // v2 exposes an already-created client object.
        else if (exportedClient && typeof exportedClient.chart === 'function') {
            yahooFinance = exportedClient;
            console.log('✅ yahoo-finance2 loaded (client object)');
        }
        else {
            throw new TypeError('Unsupported yahoo-finance2 module export');
        }

        return yahooFinance;
    } catch (error) {
        console.warn('⚠️  yahoo-finance2 not available:', error.message);
        console.warn('   Valuation Normalization will be skipped.');
        console.warn('   Install with: npm install yahoo-finance2');
        yahooFinance = null;
        return null;
    }
}

/**
 * Convert Screener stock slug to Yahoo Finance ticker
 * Handles special characters in NSE tickers
 * @param {string} screenerSlug - Stock slug from Screener URL (e.g., "TCS", "M&M", "BAJAJ-AUTO")
 * @returns {string} Yahoo Finance ticker (e.g., "TCS.NS")
 */
function toYahooTicker(screenerSlug) {
    if (!screenerSlug) return null;

    // Clean the slug — Screener uses the NSE code directly in most cases
    let ticker = screenerSlug.trim().toUpperCase();

    // Special handling for tickers with & (e.g., M&M)
    // Yahoo Finance uses the same format, but URL-encoded
    // Actually Yahoo Finance handles M&M.NS directly

    return `${ticker}.NS`;
}

/**
 * Fetch historical stock prices from Yahoo Finance
 * Gets monthly closing prices for the last 5+ years
 * 
 * @param {string} ticker - Stock ticker/slug from Screener (e.g., "TCS", "RELIANCE")
 * @returns {Promise<Object>} Historical price data or error info
 */
async function fetchHistoricalPrices(ticker) {
    const result = {
        success: false,
        ticker: null,
        yahooTicker: null,
        yearEndPrices: {},     // { 2020: 3150.5, 2021: 3625.8, ... }
        currentPrice: null,
        error: null,
        _debug: {}
    };

    if (!ticker) {
        result.error = 'No ticker provided';
        return result;
    }

    const yf = getYahooFinance();
    if (!yf) {
        result.error = 'yahoo-finance2 module not available';
        return result;
    }

    const yahooTicker = toYahooTicker(ticker);
    result.ticker = ticker;
    result.yahooTicker = yahooTicker;

    try {
        // Fetch 6 years of monthly data (need 5 full years of March closes)
        const endDate = new Date();
        const startDate = new Date();
        startDate.setFullYear(startDate.getFullYear() - 6);

        console.log(`📊 Yahoo Finance: Fetching historical prices for ${yahooTicker}...`);

        const chartData = await yf.chart(yahooTicker, {
            period1: startDate.toISOString().split('T')[0],
            period2: endDate.toISOString().split('T')[0],
            interval: '1mo'
        });
        const historicalData = chartData?.quotes || [];

        if (!historicalData || historicalData.length === 0) {
            result.error = `No historical data returned for ${yahooTicker}`;
            return result;
        }

        result._debug.totalDataPoints = historicalData.length;
        result._debug.dateRange = {
            first: historicalData[0]?.date,
            last: historicalData[historicalData.length - 1]?.date
        };

        // Extract March-end closing prices (Indian fiscal year ends in March)
        // Also collect year-end (December) as fallback
        const marchPrices = {};
        const decemberPrices = {};

        for (const entry of historicalData) {
            if (!entry.date || !entry.close) continue;

            const date = new Date(entry.date);
            const month = date.getMonth(); // 0-indexed
            const year = date.getFullYear();

            if (month === 2) { // March (0-indexed)
                marchPrices[year] = entry.close;
            }
            if (month === 11) { // December
                decemberPrices[year] = entry.close;
            }
        }

        // Prefer March prices (fiscal year), fallback to December
        const yearEndPrices = {};
        const currentYear = new Date().getFullYear();

        for (let y = currentYear - 5; y <= currentYear; y++) {
            if (marchPrices[y]) {
                yearEndPrices[y] = parseFloat(marchPrices[y].toFixed(2));
            } else if (decemberPrices[y]) {
                yearEndPrices[y] = parseFloat(decemberPrices[y].toFixed(2));
            }
        }

        // Get most recent close as current price
        const latestEntry = historicalData[historicalData.length - 1];
        result.currentPrice = latestEntry?.close ? parseFloat(latestEntry.close.toFixed(2)) : null;

        result.yearEndPrices = yearEndPrices;
        result.success = Object.keys(yearEndPrices).length >= 3; // Need at least 3 years

        if (result.success) {
            console.log(`✅ Yahoo Finance: Got ${Object.keys(yearEndPrices).length} year-end prices for ${yahooTicker}`);
        } else {
            result.error = `Insufficient year-end price data (got ${Object.keys(yearEndPrices).length}, need 3+)`;
            console.warn(`⚠️  Yahoo Finance: ${result.error}`);
        }

        result._debug.marchPrices = marchPrices;
        result._debug.decemberPrices = decemberPrices;

    } catch (error) {
        result.error = `Yahoo Finance API error: ${error.message}`;
        console.error(`❌ Yahoo Finance error for ${yahooTicker}:`, error.message);

        // Check for common errors and provide helpful messages
        if (error.message.includes('Not Found') || error.message.includes('404')) {
            result.error = `Ticker ${yahooTicker} not found on Yahoo Finance. The stock may be listed on BSE only.`;
        } else if (error.message.includes('network') || error.message.includes('ECONNREFUSED')) {
            result.error = 'Network error connecting to Yahoo Finance. Check internet connection.';
        }
    }

    return result;
}

/**
 * Calculate historical PE ratios using Yahoo prices and Screener EPS data
 * 
 * @param {Object} yearEndPrices - { 2020: 3150, 2021: 3625, ... } from Yahoo
 * @param {number[]} epsArray - Historical EPS from Screener (oldest to newest)
 * @param {number} latestFullYear - Most recent full fiscal year (e.g., 2025)
 * @returns {Object} Historical PE data with 5Y average
 */
function calculateHistoricalPE(yearEndPrices, epsArray, latestFullYear) {
    const result = {
        historicalPEs: {},     // { 2020: 45.2, 2021: 38.6, ... }
        avgPE5Y: null,
        dataYears: 0,
        _debug: {}
    };

    if (!yearEndPrices || !epsArray || epsArray.length === 0) {
        return result;
    }

    // Map EPS array positions to fiscal years
    // Screener P&L has columns like: Mar 2014, Mar 2015, ..., Mar 2025, TTM
    // The EPS array contains values for each of these
    // We need to figure out which index corresponds to which year
    
    // Assumption: the last value in epsArray (or second-to-last if TTM) is latestFullYear
    const hasExtraColumn = epsArray.length > 12;
    const lastFullYearIndex = hasExtraColumn ? epsArray.length - 2 : epsArray.length - 1;

    const yearPEs = {};
    let peSum = 0;
    let peCount = 0;

    for (let yearOffset = 0; yearOffset < 5; yearOffset++) {
        const year = latestFullYear - yearOffset;
        const epsIndex = lastFullYearIndex - yearOffset;

        if (epsIndex < 0) continue;

        const price = yearEndPrices[year];
        const eps = epsArray[epsIndex];

        if (price && eps && eps > 0) {
            const pe = parseFloat((price / eps).toFixed(2));
            yearPEs[year] = pe;
            peSum += pe;
            peCount++;
        }

        result._debug[year] = { price, eps, epsIndex };
    }

    result.historicalPEs = yearPEs;
    result.dataYears = peCount;

    if (peCount >= 3) {
        result.avgPE5Y = parseFloat((peSum / peCount).toFixed(2));
    }

    return result;
}

module.exports = {
    fetchHistoricalPrices,
    calculateHistoricalPE,
    toYahooTicker
};
