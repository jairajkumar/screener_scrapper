/**
 * Peter Lynch Score Unit Tests
 */

const calculateLynchScore = require('../../src/services/lynchScore');
const { samplePetronetData, sampleWeakData } = require('../mocks/sampleData');

describe('Peter Lynch Score', () => {
    describe('with GARP candidate data', () => {
        // Create ideal GARP data
        const garpData = {
            ...samplePetronetData,
            profitGrowth5Y: 15, // High growth
            stockPE: 12,
            pegRatio: 0.8, // Low PEG
            debtToEquity: 0.3,
            epsGrowth: 15
        };

        let result;

        beforeAll(() => {
            result = calculateLynchScore(garpData);
        });

        test('returns correct structure', () => {
            expect(result).toHaveProperty('name', 'Peter Lynch Score');
            expect(result).toHaveProperty('score');
            expect(result).toHaveProperty('total', 10);
            expect(result).toHaveProperty('factors');
        });

        test('calculates score between 0 and 10', () => {
            expect(result.score).toBeGreaterThanOrEqual(0);
            expect(result.score).toBeLessThanOrEqual(10);
        });

        test('Factor 1: EPS Growth - passes for growth > 10%', () => {
            expect(garpData.profitGrowth5Y).toBeGreaterThan(10);
            expect(result.factors.epsGrowth.pass).toBe(true);
            expect(result.factors.epsGrowth.marks).toBe(3);
        });

        test('Factor 2: Low PEG - passes for PEG < 1.5', () => {
            expect(garpData.pegRatio).toBeLessThan(1.5);
            expect(result.factors.lowPEG.pass).toBe(true);
            expect(result.factors.lowPEG.marks).toBe(3);
        });

        test('Factor 3: Low Debt - passes for D/E < 0.5', () => {
            expect(garpData.debtToEquity).toBeLessThan(0.5);
            expect(result.factors.lowDebt.pass).toBe(true);
            expect(result.factors.lowDebt.marks).toBe(2);
        });

        test('Factor 4: Business Simplicity - always passes (assumed)', () => {
            expect(result.factors.businessSimplicity.pass).toBe(true);
            expect(result.factors.businessSimplicity.marks).toBe(2);
        });

        test('GARP stock should score >= 7', () => {
            expect(result.score).toBeGreaterThanOrEqual(7);
        });
    });

    describe('with PETRONET data (moderate growth)', () => {
        let result;

        beforeAll(() => {
            result = calculateLynchScore(samplePetronetData);
        });

        test('Factor 1: EPS Growth - fails for growth < 10%', () => {
            expect(samplePetronetData.profitGrowth5Y).toBeLessThan(10);
            expect(result.factors.epsGrowth.pass).toBe(false);
            expect(result.factors.epsGrowth.marks).toBe(0);
        });

        test('Factor 2: Low PEG - fails for PEG > 1.5', () => {
            expect(samplePetronetData.pegRatio).toBeGreaterThan(1.5);
            expect(result.factors.lowPEG.pass).toBe(false);
            expect(result.factors.lowPEG.marks).toBe(0);
        });

        test('returns "Not a GARP Stock" interpretation', () => {
            expect(result.interpretation).toBe('Not a GARP Stock');
        });
    });

    describe('with weak data', () => {
        let result;

        beforeAll(() => {
            result = calculateLynchScore(sampleWeakData);
        });

        test('returns low score for high debt company', () => {
            expect(result.factors.lowDebt.pass).toBe(false);
        });
    });

    describe('PEG Ratio calculation', () => {
        test('handles null PEG ratio gracefully', () => {
            const nullPegData = { ...samplePetronetData, pegRatio: null };
            const result = calculateLynchScore(nullPegData);
            expect(result.factors.lowPEG.pass).toBe(false);
            expect(result.factors.lowPEG.marks).toBe(0);
        });

        test('handles zero growth rate gracefully', () => {
            const zeroGrowthData = { ...samplePetronetData, profitGrowth5Y: 0, epsGrowth: 0 };
            const result = calculateLynchScore(zeroGrowthData);
            expect(result.factors.epsGrowth.pass).toBe(false);
        });
    });
});
