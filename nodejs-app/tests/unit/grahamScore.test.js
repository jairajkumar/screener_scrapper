/**
 * Benjamin Graham Score Unit Tests
 */

const calculateGrahamScore = require('../../src/services/grahamScore');
const { samplePetronetData, sampleWeakData } = require('../mocks/sampleData');

describe('Benjamin Graham Score', () => {
    describe('with value stock data (PETRONET)', () => {
        let result;

        beforeAll(() => {
            result = calculateGrahamScore(samplePetronetData);
        });

        test('returns correct structure', () => {
            expect(result).toHaveProperty('name', 'Benjamin Graham Score');
            expect(result).toHaveProperty('score');
            expect(result).toHaveProperty('total', 10);
            expect(result).toHaveProperty('grahamNumber');
            expect(result).toHaveProperty('factors');
        });

        test('calculates score between 0 and 10', () => {
            expect(result.score).toBeGreaterThanOrEqual(0);
            expect(result.score).toBeLessThanOrEqual(10);
        });

        test('calculates Graham Number correctly', () => {
            const expected = Math.sqrt(22.5 * samplePetronetData.latestEPS * samplePetronetData.bookValue);
            expect(parseFloat(result.grahamNumber)).toBeCloseTo(expected, 0);
        });

        // Factor tests
        test('Factor 1: Low P/E - passes for P/E < 15', () => {
            expect(samplePetronetData.stockPE).toBeLessThan(15);
            expect(result.factors.lowPE.pass).toBe(true);
            expect(result.factors.lowPE.marks).toBe(1);
        });

        test('Factor 2: Low P/B - fails for P/B > 1.5', () => {
            expect(samplePetronetData.priceToBook).toBeGreaterThan(1.5);
            expect(result.factors.lowPB.pass).toBe(false);
            expect(result.factors.lowPB.marks).toBe(0);
        });

        test('Factor 3: Debt Safety - passes for D/E < 1', () => {
            expect(samplePetronetData.debtToEquity).toBeLessThan(1);
            expect(result.factors.debtSafety.pass).toBe(true);
            expect(result.factors.debtSafety.marks).toBe(2);
        });

        test('Factor 4: Strong Liquidity - passes for Current Ratio > 2', () => {
            expect(samplePetronetData.currentRatio).toBeGreaterThan(2);
            expect(result.factors.strongLiquidity.pass).toBe(true);
            expect(result.factors.strongLiquidity.marks).toBe(2);
        });

        test('Factor 5: Earnings Stability - passes when no loss years', () => {
            const allPositive = samplePetronetData.historical.netProfit.every(p => p >= 0);
            expect(allPositive).toBe(true);
            expect(result.factors.earningsStability.pass).toBe(true);
            expect(result.factors.earningsStability.marks).toBe(2);
        });

        test('Factor 6: Dividend Record - passes for regular dividends', () => {
            expect(result.factors.dividendRecord.pass).toBe(true);
            expect(result.factors.dividendRecord.marks).toBe(2);
        });
    });

    describe('with non-value stock data', () => {
        let result;

        beforeAll(() => {
            result = calculateGrahamScore(sampleWeakData);
        });

        test('returns lower score for non-value stock', () => {
            expect(result.score).toBeLessThan(5);
        });

        test('Low P/E fails for P/E > 15', () => {
            expect(sampleWeakData.stockPE).toBeGreaterThan(15);
            expect(result.factors.lowPE.pass).toBe(false);
        });

        test('Strong Liquidity fails for Current Ratio < 2', () => {
            expect(sampleWeakData.currentRatio).toBeLessThan(2);
            expect(result.factors.strongLiquidity.pass).toBe(false);
        });
    });

    describe('interpretation', () => {
        test('returns "Strong Value Stock" for score >= 7', () => {
            const result = calculateGrahamScore(samplePetronetData);
            if (result.score >= 7) {
                expect(result.interpretation).toBe('Strong Value Stock');
            }
        });

        test('returns "Not a Value Stock" for score < 5', () => {
            const result = calculateGrahamScore(sampleWeakData);
            if (result.score < 5) {
                expect(result.interpretation).toBe('Not a Value Stock');
            }
        });
    });
});
