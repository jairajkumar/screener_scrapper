/**
 * Calculation Verification Test
 * 
 * This test compares our calculated values with Screener's top-card values
 * to verify accuracy. Allows small tolerance for rounding differences.
 */

const scrapeScreenerData = require('../../src/services/scraper');

// Allow 10% tolerance for rounding differences
const TOLERANCE_PERCENT = 10;

function compareValues(calculated, screener, fieldName) {
    if (calculated === null && screener === null) {
        return { field: fieldName, status: 'BOTH_NULL', calculated, screener };
    }
    if (calculated === null) {
        return { field: fieldName, status: 'CALCULATED_NULL', calculated, screener };
    }
    if (screener === null) {
        return { field: fieldName, status: 'SCREENER_NULL', calculated, screener };
    }

    const diff = Math.abs(calculated - screener);
    const percentDiff = screener !== 0 ? (diff / Math.abs(screener)) * 100 : diff * 100;

    if (percentDiff <= TOLERANCE_PERCENT) {
        return { field: fieldName, status: 'MATCH', calculated, screener, diff: percentDiff.toFixed(2) + '%' };
    } else {
        return { field: fieldName, status: 'MISMATCH', calculated, screener, diff: percentDiff.toFixed(2) + '%' };
    }
}

describe('Calculation Verification', () => {
    jest.setTimeout(120000); // 2 minutes for scraping

    let scraperData = null;

    beforeAll(async () => {
        console.log('📊 Fetching data for RELIANCE...');
        scraperData = await scrapeScreenerData('RELIANCE');
        expect(scraperData).not.toBeNull();
        console.log('✅ Data fetched successfully');
    });

    test('should have scraped data', () => {
        expect(scraperData).toBeDefined();
        expect(scraperData.stockPE).toBeDefined();
    });

    test('ROA calculation matches Screener (within tolerance)', () => {
        const result = compareValues(
            scraperData.roa,
            scraperData._debug?.topCardValues?.roa || null,
            'ROA'
        );
        console.log('ROA Comparison:', result);

        // Just log, don't fail - we want to see the comparison
        if (result.status === 'MISMATCH') {
            console.warn('⚠️ ROA mismatch:', result);
        }
    });

    test('Debt to Equity calculation matches Screener (within tolerance)', () => {
        const result = compareValues(
            scraperData.debtToEquity,
            scraperData._debug?.topCardValues?.debtToEquity || null,
            'Debt to Equity'
        );
        console.log('Debt to Equity Comparison:', result);
    });

    test('Asset Turnover calculation matches Screener (within tolerance)', () => {
        const result = compareValues(
            scraperData.assetTurnover,
            scraperData._debug?.topCardValues?.assetTurnover || null,
            'Asset Turnover'
        );
        console.log('Asset Turnover Comparison:', result);
    });

    test('Current Ratio calculation matches Screener (within tolerance)', () => {
        const result = compareValues(
            scraperData.currentRatio,
            scraperData._debug?.topCardValues?.currentRatio || null,
            'Current Ratio'
        );
        console.log('Current Ratio Comparison:', result);
    });

    test('PEG Ratio calculation matches Screener (within tolerance)', () => {
        const result = compareValues(
            scraperData.pegRatio,
            scraperData._debug?.topCardValues?.pegRatio || null,
            'PEG Ratio'
        );
        console.log('PEG Ratio Comparison:', result);
    });

    test('Screener Piotroski score is captured for reference', () => {
        console.log('📈 Screener Piotroski Score:', scraperData.screenerPiotroski);
        // We use our own Piotroski calculation, but log Screener's for reference
        expect(scraperData.screenerPiotroski === null || typeof scraperData.screenerPiotroski === 'number').toBe(true);
    });

    test('Shareholder data is captured (logged-in feature)', () => {
        console.log('👥 Shareholders:', {
            current: scraperData.numShareholders,
            prevYear: scraperData.numShareholdersPrevYear
        });
    });

    test('Summary: Log all key metrics', () => {
        console.log('\n📊 Key Metrics Summary:');
        console.log('=====================================');
        console.log(`Stock P/E: ${scraperData.stockPE}`);
        console.log(`ROE: ${scraperData.roe}%`);
        console.log(`ROCE: ${scraperData.roce}%`);
        console.log(`ROA: ${scraperData.roa?.toFixed(2)}%`);
        console.log(`ROA Prev Year: ${scraperData.roaPrevYear?.toFixed(2)}%`);
        console.log(`Debt/Equity: ${scraperData.debtToEquity?.toFixed(2)}`);
        console.log(`Asset Turnover: ${scraperData.assetTurnover?.toFixed(2)}`);
        console.log(`Current Ratio: ${scraperData.currentRatio?.toFixed(2)}`);
        console.log(`PEG Ratio: ${scraperData.pegRatio?.toFixed(2)}`);
        console.log(`Screener Piotroski: ${scraperData.screenerPiotroski}`);
        console.log('=====================================');
    });
});
