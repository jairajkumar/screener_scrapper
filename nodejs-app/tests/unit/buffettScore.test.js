/**
 * Warren Buffett Score Unit Tests
 */

const calculateBuffettScore = require('../../src/services/buffettScore');
const { samplePetronetData, sampleWeakData } = require('../mocks/sampleData');

describe('Warren Buffett Score', () => {
    describe('with quality business data (PETRONET)', () => {
        let result;

        beforeAll(() => {
            result = calculateBuffettScore(samplePetronetData);
        });

        test('returns correct structure', () => {
            expect(result).toHaveProperty('name', 'Warren Buffett Score');
            expect(result).toHaveProperty('score');
            expect(result).toHaveProperty('total', 10);
            expect(result).toHaveProperty('factors');
        });

        test('calculates score between 0 and 10', () => {
            expect(result.score).toBeGreaterThanOrEqual(0);
            expect(result.score).toBeLessThanOrEqual(10);
        });

        // Factor tests (2 marks each)
        test('Factor 1: High ROE - passes for ROE > 15%', () => {
            expect(samplePetronetData.roe).toBeGreaterThan(15);
            expect(result.factors.highROE.pass).toBe(true);
            expect(result.factors.highROE.marks).toBe(2);
        });

        test('Factor 2: Low Debt - passes for D/E < 0.5', () => {
            expect(samplePetronetData.debtToEquity).toBeLessThan(0.5);
            expect(result.factors.lowDebt.pass).toBe(true);
            expect(result.factors.lowDebt.marks).toBe(2);
        });

        test('Factor 3: Profit Consistency - passes for all positive years', () => {
            const allPositive = samplePetronetData.historical.netProfit.every(p => p > 0);
            expect(allPositive).toBe(true);
            expect(result.factors.profitConsistency.pass).toBe(true);
            expect(result.factors.profitConsistency.marks).toBe(2);
        });

        test('Factor 4: Strong FCF - passes for positive FCF', () => {
            expect(samplePetronetData.fcf).toBeGreaterThan(0);
            expect(result.factors.strongFCF.pass).toBe(true);
            expect(result.factors.strongFCF.marks).toBe(2);
        });

        test('Factor 5: Reasonable Valuation - fails when Stock P/E > Industry P/E', () => {
            // PETRONET: Stock P/E 11.9 > Industry P/E 8, so this should fail
            expect(samplePetronetData.stockPE).toBeGreaterThan(samplePetronetData.industryPE);
            expect(result.factors.reasonableValuation.pass).toBe(false);
            expect(result.factors.reasonableValuation.marks).toBe(0);
        });
    });

    describe('with weak business data', () => {
        let result;

        beforeAll(() => {
            result = calculateBuffettScore(sampleWeakData);
        });

        test('returns lower score for weak business', () => {
            expect(result.score).toBeLessThan(6);
        });

        test('High ROE fails for ROE < 15%', () => {
            expect(sampleWeakData.roe).toBeLessThan(15);
            expect(result.factors.highROE.pass).toBe(false);
        });

        test('Low Debt fails for D/E > 0.5', () => {
            expect(sampleWeakData.debtToEquity).toBeGreaterThan(0.5);
            expect(result.factors.lowDebt.pass).toBe(false);
        });

        test('Strong FCF fails for negative FCF', () => {
            expect(sampleWeakData.fcf).toBeLessThan(0);
            expect(result.factors.strongFCF.pass).toBe(false);
        });
    });

    describe('interpretation', () => {
        test('returns "Excellent Long-Term Business" for score >= 8', () => {
            const result = calculateBuffettScore(samplePetronetData);
            if (result.score >= 8) {
                expect(result.interpretation).toBe('Excellent Long-Term Business');
            }
        });
    });
});
