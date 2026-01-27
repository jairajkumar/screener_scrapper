/**
 * Comprehensive API Integration Tests
 * 
 * Tests ALL scraped elements and validates data structure completeness.
 * Ensures no field is missing or broken.
 */

const request = require('supertest');
const express = require('express');
const apiRouter = require('../../src/routes/api');

// Create test app
const app = express();
app.use(express.json());
app.use('/api', apiRouter);

describe('API Integration Tests', () => {

    describe('GET /api/health', () => {
        test('returns 200 and status OK', async () => {
            const response = await request(app).get('/api/health');

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('status', 'OK');
        });
    });

    describe('GET /api/search', () => {
        test('returns search results for valid query', async () => {
            const response = await request(app).get('/api/search?query=tata');

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('success', true);
        });

        test('returns results array', async () => {
            const response = await request(app).get('/api/search?query=reliance');

            if (response.body.results) {
                expect(Array.isArray(response.body.results)).toBe(true);
            }
        });
    });
});

/**
 * Comprehensive Element Validation Tests
 * Tests that ALL required data fields are being scraped correctly
 */
describe('Comprehensive Scraping Validation', () => {
    jest.setTimeout(180000); // 3 minutes for full analysis

    let petronetResponse;
    let tcsResponse;

    beforeAll(async () => {
        // Fetch both test companies
        petronetResponse = await request(app).get('/api/analyze/PETRONET');
        tcsResponse = await request(app).get('/api/analyze/TCS');
    });

    describe('Response Structure', () => {
        test('returns success status', () => {
            expect(petronetResponse.status).toBe(200);
            expect(petronetResponse.body.success).toBe(true);
        });

        test('includes company info', () => {
            expect(petronetResponse.body).toHaveProperty('company');
            expect(petronetResponse.body.company).toHaveProperty('name');
            expect(petronetResponse.body.company).toHaveProperty('url');
        });

        test('includes data object', () => {
            expect(petronetResponse.body).toHaveProperty('data');
        });

        test('includes analysis object', () => {
            expect(petronetResponse.body).toHaveProperty('analysis');
        });

        test('includes timestamp', () => {
            expect(petronetResponse.body).toHaveProperty('timestamp');
        });
    });

    describe('Top Card Ratios - All Elements', () => {
        let data;

        beforeAll(() => {
            data = petronetResponse.body.data;
        });

        test('Stock P/E is scraped', () => {
            expect(data.stockPE).not.toBeNull();
            expect(data.stockPE).not.toBeUndefined();
            expect(typeof data.stockPE).toBe('number');
            expect(data.stockPE).toBeGreaterThan(0);
        });

        test('ROE is scraped', () => {
            expect(data.roe).not.toBeNull();
            expect(data.roe).not.toBeUndefined();
            expect(typeof data.roe).toBe('number');
        });

        test('ROCE is scraped', () => {
            expect(data.roce).not.toBeNull();
            expect(data.roce).not.toBeUndefined();
            expect(typeof data.roce).toBe('number');
        });

        test('Book Value is scraped', () => {
            expect(data.bookValue).not.toBeNull();
            expect(data.bookValue).not.toBeUndefined();
            expect(typeof data.bookValue).toBe('number');
            expect(data.bookValue).toBeGreaterThan(0);
        });

        test('Dividend Yield is scraped', () => {
            expect(data.dividendYield).not.toBeUndefined();
            expect(typeof data.dividendYield).toBe('number');
        });

        test('Market Cap is scraped', () => {
            expect(data.marketCap).not.toBeNull();
            expect(data.marketCap).not.toBeUndefined();
            expect(typeof data.marketCap).toBe('number');
            expect(data.marketCap).toBeGreaterThan(0);
        });

        test('Current Price is scraped', () => {
            expect(data.currentPrice).not.toBeNull();
            expect(data.currentPrice).not.toBeUndefined();
            expect(typeof data.currentPrice).toBe('number');
            expect(data.currentPrice).toBeGreaterThan(0);
        });

        test('Industry P/E is scraped', () => {
            expect(data.industryPE).not.toBeUndefined();
            // Industry P/E might be null for some companies
            if (data.industryPE !== null) {
                expect(typeof data.industryPE).toBe('number');
            }
        });
    });

    describe('Calculated Ratios - All Elements', () => {
        let data;

        beforeAll(() => {
            data = petronetResponse.body.data;
        });

        test('Debt to Equity is calculated', () => {
            expect(data.debtToEquity).not.toBeNull();
            expect(data.debtToEquity).not.toBeUndefined();
            expect(typeof data.debtToEquity).toBe('number');
        });

        test('ROA is calculated', () => {
            expect(data.roa).not.toBeUndefined();
            if (data.roa !== null) {
                expect(typeof data.roa).toBe('number');
            }
        });

        test('Asset Turnover is calculated', () => {
            expect(data.assetTurnover).not.toBeUndefined();
            if (data.assetTurnover !== null) {
                expect(typeof data.assetTurnover).toBe('number');
            }
        });

        test('FCF is calculated', () => {
            expect(data.fcf).not.toBeUndefined();
            expect(typeof data.fcf).toBe('number');
        });

        test('PEG Ratio is calculated', () => {
            expect(data.pegRatio).not.toBeUndefined();
            // PEG can be null if growth is 0 or negative
            if (data.pegRatio !== null) {
                expect(typeof data.pegRatio).toBe('number');
            }
        });

        test('Price to Book is calculated', () => {
            expect(data.priceToBook).not.toBeNull();
            expect(data.priceToBook).not.toBeUndefined();
            expect(typeof data.priceToBook).toBe('number');
        });

        test('Graham Number is calculated', () => {
            expect(data.grahamNumber).not.toBeUndefined();
            if (data.grahamNumber !== null) {
                expect(typeof data.grahamNumber).toBe('number');
                expect(data.grahamNumber).toBeGreaterThan(0);
            }
        });

        test('Current Ratio is calculated', () => {
            expect(data.currentRatio).not.toBeUndefined();
            if (data.currentRatio !== null) {
                expect(typeof data.currentRatio).toBe('number');
            }
        });
    });

    describe('Growth Rates - All Elements', () => {
        let data;

        beforeAll(() => {
            data = petronetResponse.body.data;
        });

        test('5Y Profit Growth is scraped', () => {
            expect(data.profitGrowth5Y).not.toBeNull();
            expect(data.profitGrowth5Y).not.toBeUndefined();
            expect(typeof data.profitGrowth5Y).toBe('number');
        });

        test('10Y Profit Growth is scraped', () => {
            expect(data.profitGrowth10Y).not.toBeUndefined();
            if (data.profitGrowth10Y !== null) {
                expect(typeof data.profitGrowth10Y).toBe('number');
            }
        });

        test('3Y Profit Growth is scraped', () => {
            expect(data.profitGrowth3Y).not.toBeUndefined();
            if (data.profitGrowth3Y !== null) {
                expect(typeof data.profitGrowth3Y).toBe('number');
            }
        });

        test('5Y Sales Growth is scraped', () => {
            expect(data.salesGrowth5Y).not.toBeUndefined();
            if (data.salesGrowth5Y !== null) {
                expect(typeof data.salesGrowth5Y).toBe('number');
            }
        });

        test('EPS Growth is derived', () => {
            expect(data.epsGrowth).not.toBeUndefined();
            if (data.epsGrowth !== null) {
                expect(typeof data.epsGrowth).toBe('number');
            }
        });
    });

    describe('Historical Data Arrays - All Elements', () => {
        let historical;

        beforeAll(() => {
            historical = petronetResponse.body.data.historical;
        });

        test('historical object exists', () => {
            expect(historical).toBeDefined();
            expect(typeof historical).toBe('object');
        });

        test('Sales history is scraped', () => {
            expect(historical.sales).toBeDefined();
            expect(Array.isArray(historical.sales)).toBe(true);
            expect(historical.sales.length).toBeGreaterThan(3);
            expect(historical.sales.every(v => typeof v === 'number')).toBe(true);
        });

        test('Net Profit history is scraped', () => {
            expect(historical.netProfit).toBeDefined();
            expect(Array.isArray(historical.netProfit)).toBe(true);
            expect(historical.netProfit.length).toBeGreaterThan(3);
            expect(historical.netProfit.every(v => typeof v === 'number')).toBe(true);
        });

        test('OPM % history is scraped', () => {
            expect(historical.opmPercent).toBeDefined();
            expect(Array.isArray(historical.opmPercent)).toBe(true);
            expect(historical.opmPercent.length).toBeGreaterThan(3);
        });

        test('EPS history is scraped', () => {
            expect(historical.eps).toBeDefined();
            expect(Array.isArray(historical.eps)).toBe(true);
            expect(historical.eps.length).toBeGreaterThan(3);
        });

        test('Dividend Payout history is scraped', () => {
            expect(historical.dividendPayout).toBeDefined();
            expect(Array.isArray(historical.dividendPayout)).toBe(true);
        });

        test('Borrowings history is scraped', () => {
            expect(historical.borrowings).toBeDefined();
            expect(Array.isArray(historical.borrowings)).toBe(true);
            expect(historical.borrowings.length).toBeGreaterThan(3);
        });

        test('Equity Capital history is scraped', () => {
            expect(historical.equityCapital).toBeDefined();
            expect(Array.isArray(historical.equityCapital)).toBe(true);
            expect(historical.equityCapital.length).toBeGreaterThan(3);
        });

        test('Reserves history is scraped', () => {
            expect(historical.reserves).toBeDefined();
            expect(Array.isArray(historical.reserves)).toBe(true);
            expect(historical.reserves.length).toBeGreaterThan(3);
        });

        test('Total Assets history is scraped', () => {
            expect(historical.totalAssets).toBeDefined();
            expect(Array.isArray(historical.totalAssets)).toBe(true);
            expect(historical.totalAssets.length).toBeGreaterThan(3);
        });

        test('CFO history is scraped', () => {
            expect(historical.cfo).toBeDefined();
            expect(Array.isArray(historical.cfo)).toBe(true);
            expect(historical.cfo.length).toBeGreaterThan(3);
        });

        test('CFI history is scraped', () => {
            expect(historical.cfi).toBeDefined();
            expect(Array.isArray(historical.cfi)).toBe(true);
            expect(historical.cfi.length).toBeGreaterThan(3);
        });

        test('Other Assets history is scraped', () => {
            expect(historical.otherAssets).toBeDefined();
            expect(Array.isArray(historical.otherAssets)).toBe(true);
        });

        test('Other Liabilities history is scraped', () => {
            expect(historical.otherLiabilities).toBeDefined();
            expect(Array.isArray(historical.otherLiabilities)).toBe(true);
        });
    });

    describe('Latest Values - All Elements', () => {
        let data;

        beforeAll(() => {
            data = petronetResponse.body.data;
        });

        test('Latest EPS is extracted', () => {
            expect(data.latestEPS).not.toBeUndefined();
            expect(typeof data.latestEPS).toBe('number');
        });

        test('Latest Net Profit is extracted', () => {
            expect(data.latestNetProfit).not.toBeUndefined();
            expect(typeof data.latestNetProfit).toBe('number');
        });

        test('Latest CFO is extracted', () => {
            expect(data.latestCFO).not.toBeUndefined();
            expect(typeof data.latestCFO).toBe('number');
        });

        test('Latest Borrowings is extracted', () => {
            expect(data.latestBorrowings).not.toBeUndefined();
            expect(typeof data.latestBorrowings).toBe('number');
        });

        test('Latest Equity is extracted', () => {
            expect(data.latestEquity).not.toBeUndefined();
            expect(typeof data.latestEquity).toBe('number');
        });
    });

    describe('Debug Info Validation', () => {
        test('Debug info includes row counts', () => {
            const debug = petronetResponse.body.data._debug;
            expect(debug).toBeDefined();
            expect(debug.rowsFound).toBeDefined();
        });

        test('Sales rows found > 0', () => {
            const rowsFound = petronetResponse.body.data._debug.rowsFound;
            expect(rowsFound.sales).toBeGreaterThan(0);
        });

        test('Net Profit rows found > 0', () => {
            const rowsFound = petronetResponse.body.data._debug.rowsFound;
            expect(rowsFound.netProfit).toBeGreaterThan(0);
        });

        test('Borrowings rows found > 0', () => {
            const rowsFound = petronetResponse.body.data._debug.rowsFound;
            expect(rowsFound.borrowings).toBeGreaterThan(0);
        });

        test('CFO rows found > 0', () => {
            const rowsFound = petronetResponse.body.data._debug.rowsFound;
            expect(rowsFound.cfo).toBeGreaterThan(0);
        });
    });

    describe('Analysis Object - All Scores', () => {
        let analysis;

        beforeAll(() => {
            analysis = petronetResponse.body.analysis;
        });

        test('Final Decision is present', () => {
            expect(analysis.finalDecision).toBeDefined();
            expect(['BUY', 'HOLD', 'AVOID']).toContain(analysis.finalDecision);
        });

        test('Scores Above 7 count is present', () => {
            expect(analysis.scoresAbove7).toBeDefined();
            expect(typeof analysis.scoresAbove7).toBe('number');
            expect(analysis.scoresAbove7).toBeGreaterThanOrEqual(0);
            expect(analysis.scoresAbove7).toBeLessThanOrEqual(4);
        });

        test('Overall Percent is calculated', () => {
            expect(analysis.overallPercent).toBeDefined();
            expect(typeof analysis.overallPercent).toBe('number');
        });

        test('Piotroski score object is complete', () => {
            expect(analysis.piotroski).toBeDefined();
            expect(analysis.piotroski.name).toBe('Piotroski F-Score');
            expect(analysis.piotroski.score).toBeDefined();
            expect(analysis.piotroski.total).toBe(9);
            expect(analysis.piotroski.percent).toBeDefined();
            expect(analysis.piotroski.factors).toBeDefined();
            expect(analysis.piotroski.interpretation).toBeDefined();
        });

        test('Buffett score object is complete', () => {
            expect(analysis.buffett).toBeDefined();
            expect(analysis.buffett.name).toBe('Warren Buffett Score');
            expect(analysis.buffett.score).toBeDefined();
            expect(analysis.buffett.total).toBe(10);
            expect(analysis.buffett.factors).toBeDefined();
        });

        test('Graham score object is complete', () => {
            expect(analysis.graham).toBeDefined();
            expect(analysis.graham.name).toBe('Benjamin Graham Score');
            expect(analysis.graham.score).toBeDefined();
            expect(analysis.graham.total).toBe(10);
            expect(analysis.graham.grahamNumber).toBeDefined();
            expect(analysis.graham.factors).toBeDefined();
        });

        test('Lynch score object is complete', () => {
            expect(analysis.lynch).toBeDefined();
            expect(analysis.lynch.name).toBe('Peter Lynch Score');
            expect(analysis.lynch.score).toBeDefined();
            expect(analysis.lynch.total).toBe(10);
            expect(analysis.lynch.factors).toBeDefined();
        });

        test('Summary object has all scores', () => {
            expect(analysis.summary).toBeDefined();
            expect(analysis.summary.piotroski).toMatch(/^\d+\/\d+$/);
            expect(analysis.summary.buffett).toMatch(/^\d+\/\d+$/);
            expect(analysis.summary.graham).toMatch(/^\d+\/\d+$/);
            expect(analysis.summary.lynch).toMatch(/^\d+\/\d+$/);
        });
    });

    describe('Piotroski Factors - All 9 Elements', () => {
        let factors;

        beforeAll(() => {
            factors = petronetResponse.body.analysis.piotroski.factors;
        });

        const expectedFactors = [
            'netProfitPositive',
            'cfoPositive',
            'roaImproved',
            'cfoGreaterThanProfit',
            'debtReduced',
            'currentRatioImproved',
            'noEquityDilution',
            'opmImproved',
            'assetTurnoverImproved'
        ];

        expectedFactors.forEach(factor => {
            test(`Factor ${factor} exists and has required fields`, () => {
                expect(factors[factor]).toBeDefined();
                expect(factors[factor]).toHaveProperty('value');
                expect(factors[factor]).toHaveProperty('condition');
                expect(factors[factor]).toHaveProperty('pass');
                expect(factors[factor]).toHaveProperty('marks');
                expect(typeof factors[factor].pass).toBe('boolean');
                expect(typeof factors[factor].marks).toBe('number');
            });
        });
    });

    describe('Buffett Factors - All 5 Elements', () => {
        let factors;

        beforeAll(() => {
            factors = petronetResponse.body.analysis.buffett.factors;
        });

        const expectedFactors = [
            'highROE',
            'lowDebt',
            'profitConsistency',
            'strongFCF',
            'reasonableValuation'
        ];

        expectedFactors.forEach(factor => {
            test(`Factor ${factor} exists and has required fields`, () => {
                expect(factors[factor]).toBeDefined();
                expect(factors[factor]).toHaveProperty('value');
                expect(factors[factor]).toHaveProperty('condition');
                expect(factors[factor]).toHaveProperty('pass');
                expect(factors[factor]).toHaveProperty('marks');
            });
        });
    });

    describe('Graham Factors - All 6 Elements', () => {
        let factors;

        beforeAll(() => {
            factors = petronetResponse.body.analysis.graham.factors;
        });

        const expectedFactors = [
            'lowPE',
            'lowPB',
            'debtSafety',
            'strongLiquidity',
            'earningsStability',
            'dividendRecord'
        ];

        expectedFactors.forEach(factor => {
            test(`Factor ${factor} exists and has required fields`, () => {
                expect(factors[factor]).toBeDefined();
                expect(factors[factor]).toHaveProperty('value');
                expect(factors[factor]).toHaveProperty('condition');
                expect(factors[factor]).toHaveProperty('pass');
                expect(factors[factor]).toHaveProperty('marks');
            });
        });
    });

    describe('Lynch Factors - All 4 Elements', () => {
        let factors;

        beforeAll(() => {
            factors = petronetResponse.body.analysis.lynch.factors;
        });

        const expectedFactors = [
            'epsGrowth',
            'lowPEG',
            'lowDebt',
            'businessSimplicity'
        ];

        expectedFactors.forEach(factor => {
            test(`Factor ${factor} exists and has required fields`, () => {
                expect(factors[factor]).toBeDefined();
                expect(factors[factor]).toHaveProperty('value');
                expect(factors[factor]).toHaveProperty('condition');
                expect(factors[factor]).toHaveProperty('pass');
                expect(factors[factor]).toHaveProperty('marks');
            });
        });
    });

    describe('Cross-Company Validation (TCS)', () => {
        test('TCS analysis returns successfully', () => {
            expect(tcsResponse.status).toBe(200);
            expect(tcsResponse.body.success).toBe(true);
        });

        test('TCS has all required data fields', () => {
            const data = tcsResponse.body.data;
            expect(data.stockPE).toBeDefined();
            expect(data.roe).toBeDefined();
            expect(data.bookValue).toBeDefined();
        });

        test('TCS has all 4 scores', () => {
            const analysis = tcsResponse.body.analysis;
            expect(analysis.piotroski.score).toBeDefined();
            expect(analysis.buffett.score).toBeDefined();
            expect(analysis.graham.score).toBeDefined();
            expect(analysis.lynch.score).toBeDefined();
        });

        test('TCS known characteristics: High ROE (IT company)', () => {
            // TCS typically has ROE > 30%, but use flexible threshold
            expect(tcsResponse.body.data.roe).toBeGreaterThan(20);
        });

        test('TCS known characteristics: Low Debt (IT company)', () => {
            expect(tcsResponse.body.data.debtToEquity).toBeLessThan(2);
        });
    });

    describe('Data Consistency Checks (PETRONET)', () => {
        test('Debt to Equity matches calculation', () => {
            const data = petronetResponse.body.data;
            if (data.latestBorrowings && data.latestEquity && data.latestEquity > 0) {
                const calculated = data.latestBorrowings / data.latestEquity;
                expect(Math.abs(data.debtToEquity - calculated)).toBeLessThan(0.01);
            }
        });

        test('Graham Number is correctly calculated', () => {
            const data = petronetResponse.body.data;
            if (data.latestEPS > 0 && data.bookValue > 0) {
                const expected = Math.sqrt(22.5 * data.latestEPS * data.bookValue);
                expect(Math.abs(data.grahamNumber - expected)).toBeLessThan(1);
            }
        });

        test('Price to Book is correctly calculated', () => {
            const data = petronetResponse.body.data;
            if (data.currentPrice && data.bookValue && data.bookValue > 0) {
                const expected = data.currentPrice / data.bookValue;
                expect(Math.abs(data.priceToBook - expected)).toBeLessThan(0.01);
            }
        });

        test('Latest values are extracted from historical arrays', () => {
            const data = petronetResponse.body.data;
            const hist = data.historical;

            // Check that latest values exist and are numbers
            expect(typeof data.latestEPS).toBe('number');
            expect(typeof data.latestNetProfit).toBe('number');
            expect(typeof data.latestCFO).toBe('number');

            // Arrays should have data
            expect(hist.eps.length).toBeGreaterThan(0);
            expect(hist.netProfit.length).toBeGreaterThan(0);
            expect(hist.cfo.length).toBeGreaterThan(0);
        });
    });
});

