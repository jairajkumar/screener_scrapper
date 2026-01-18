/**
 * Scraper E2E Tests
 * 
 * Tests the scraper against live Screener.in data.
 * Validates that extracted data matches expected format.
 * 
 * Run with: npm run test:e2e
 */

const fetchStockData = require('../../src/services/scraper');

describe('Scraper E2E Tests', () => {
    jest.setTimeout(120000); // 2 minutes for scraping

    describe('PETRONET LNG Data Extraction', () => {
        let result;

        beforeAll(async () => {
            result = await fetchStockData('PETRONET');
        });

        test('returns data object', () => {
            expect(result).not.toBeNull();
            expect(result).toHaveProperty('data');
            expect(result).toHaveProperty('url');
        });

        describe('Top Card Ratios', () => {
            test('extracts Stock P/E', () => {
                expect(result.data.stockPE).not.toBeNull();
                expect(typeof result.data.stockPE).toBe('number');
                expect(result.data.stockPE).toBeGreaterThan(0);
            });

            test('extracts ROE', () => {
                expect(result.data.roe).not.toBeNull();
                expect(typeof result.data.roe).toBe('number');
            });

            test('extracts ROCE', () => {
                expect(result.data.roce).not.toBeNull();
                expect(typeof result.data.roce).toBe('number');
            });

            test('extracts Book Value', () => {
                expect(result.data.bookValue).not.toBeNull();
                expect(typeof result.data.bookValue).toBe('number');
                expect(result.data.bookValue).toBeGreaterThan(0);
            });

            test('extracts Current Price', () => {
                expect(result.data.currentPrice).not.toBeNull();
                expect(typeof result.data.currentPrice).toBe('number');
            });
        });

        describe('Calculated Ratios', () => {
            test('calculates Debt to Equity', () => {
                expect(result.data.debtToEquity).not.toBeNull();
                expect(typeof result.data.debtToEquity).toBe('number');
            });

            test('calculates Price to Book', () => {
                expect(result.data.priceToBook).not.toBeNull();
                expect(typeof result.data.priceToBook).toBe('number');
            });

            test('calculates Graham Number', () => {
                expect(result.data.grahamNumber).not.toBeNull();
                expect(typeof result.data.grahamNumber).toBe('number');
            });

            test('calculates Current Ratio', () => {
                expect(result.data.currentRatio).not.toBeNull();
                expect(typeof result.data.currentRatio).toBe('number');
            });
        });

        describe('Growth Rates', () => {
            test('extracts 5Y Profit Growth', () => {
                expect(result.data.profitGrowth5Y).not.toBeNull();
                expect(typeof result.data.profitGrowth5Y).toBe('number');
            });

            test('extracts 5Y Sales Growth', () => {
                expect(result.data.salesGrowth5Y).not.toBeNull();
                expect(typeof result.data.salesGrowth5Y).toBe('number');
            });

            test('calculates PEG Ratio', () => {
                if (result.data.profitGrowth5Y > 0) {
                    expect(result.data.pegRatio).not.toBeNull();
                    expect(typeof result.data.pegRatio).toBe('number');
                }
            });
        });

        describe('Historical Data', () => {
            test('extracts sales history', () => {
                expect(result.data.historical.sales).toBeInstanceOf(Array);
                expect(result.data.historical.sales.length).toBeGreaterThan(3);
            });

            test('extracts net profit history', () => {
                expect(result.data.historical.netProfit).toBeInstanceOf(Array);
                expect(result.data.historical.netProfit.length).toBeGreaterThan(3);
            });

            test('extracts borrowings history', () => {
                expect(result.data.historical.borrowings).toBeInstanceOf(Array);
                expect(result.data.historical.borrowings.length).toBeGreaterThan(3);
            });

            test('extracts CFO history', () => {
                expect(result.data.historical.cfo).toBeInstanceOf(Array);
                expect(result.data.historical.cfo.length).toBeGreaterThan(3);
            });
        });

        describe('Debug Info', () => {
            test('includes debug row counts', () => {
                expect(result.data._debug).toBeDefined();
                expect(result.data._debug.rowsFound).toBeDefined();
                expect(result.data._debug.rowsFound.sales).toBeGreaterThan(0);
                expect(result.data._debug.rowsFound.netProfit).toBeGreaterThan(0);
            });
        });
    });

    describe('TCS Data Extraction', () => {
        let result;

        beforeAll(async () => {
            result = await fetchStockData('TCS');
        });

        test('extracts data for TCS', () => {
            expect(result).not.toBeNull();
            expect(result.data.stockPE).toBeDefined();
            expect(result.data.roe).toBeDefined();
        });

        test('TCS has high ROE (IT company)', () => {
            // TCS typically has ROE > 30%, use flexible threshold
            expect(result.data.roe).toBeGreaterThan(20);
        });

        test('TCS has manageable debt', () => {
            expect(result.data.debtToEquity).toBeLessThan(2);
        });
    });

    describe('Error Handling', () => {
        test('handles non-existent company gracefully', async () => {
            const result = await fetchStockData('NONEXISTENTCOMPANY123');
            // Result should be null or have error indication
            expect(result === null || result.error || !result.data).toBe(true);
        });
    });
});

