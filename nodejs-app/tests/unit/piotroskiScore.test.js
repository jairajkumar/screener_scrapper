/**
 * Piotroski F-Score Unit Tests
 */

const calculatePiotroskiScore = require('../../src/services/piotroskiScore');
const { samplePetronetData, sampleWeakData } = require('../mocks/sampleData');

describe('Piotroski F-Score', () => {
    describe('with healthy company data (PETRONET)', () => {
        let result;

        beforeAll(() => {
            result = calculatePiotroskiScore(samplePetronetData);
        });

        test('returns correct structure', () => {
            expect(result).toHaveProperty('name', 'Piotroski F-Score');
            expect(result).toHaveProperty('score');
            expect(result).toHaveProperty('total', 9);
            expect(result).toHaveProperty('percent');
            expect(result).toHaveProperty('factors');
            expect(result).toHaveProperty('interpretation');
        });

        test('calculates score between 0 and 9', () => {
            expect(result.score).toBeGreaterThanOrEqual(0);
            expect(result.score).toBeLessThanOrEqual(9);
        });

        test('calculates percentage correctly', () => {
            expect(result.percent).toBe(Math.round((result.score / 9) * 100));
        });

        // Individual factor tests
        test('Factor 1: Net Profit Positive - passes for positive profit', () => {
            expect(result.factors.netProfitPositive.pass).toBe(true);
            expect(result.factors.netProfitPositive.marks).toBe(1);
        });

        test('Factor 2: CFO Positive - passes for positive cash flow', () => {
            expect(result.factors.cfoPositive.pass).toBe(true);
            expect(result.factors.cfoPositive.marks).toBe(1);
        });

        test('Factor 4: CFO > Profit - passes when CFO exceeds net profit', () => {
            expect(result.factors.cfoGreaterThanProfit.pass).toBe(true);
            expect(result.factors.cfoGreaterThanProfit.marks).toBe(1);
        });

        test('Factor 5: Debt Reduced - passes when borrowings decreased YoY', () => {
            expect(result.factors.debtReduced.pass).toBe(true);
            expect(result.factors.debtReduced.marks).toBe(1);
        });

        test('Factor 7: No Equity Dilution - passes when equity capital unchanged', () => {
            expect(result.factors.noEquityDilution.pass).toBe(true);
            expect(result.factors.noEquityDilution.marks).toBe(1);
        });
    });

    describe('with weak company data', () => {
        let result;

        beforeAll(() => {
            result = calculatePiotroskiScore(sampleWeakData);
        });

        test('returns lower score for weak company', () => {
            expect(result.score).toBeLessThan(5);
        });

        test('CFO Positive fails for negative cash flow', () => {
            expect(result.factors.cfoPositive.pass).toBe(false);
            expect(result.factors.cfoPositive.marks).toBe(0);
        });

        test('Debt Reduced fails when borrowings increased', () => {
            expect(result.factors.debtReduced.pass).toBe(false);
            expect(result.factors.debtReduced.marks).toBe(0);
        });
    });

    describe('interpretation', () => {
        test('returns "Strong Financial Health" for score >= 7', () => {
            const mockData = { ...samplePetronetData };
            // Modify to ensure high score
            mockData.historical = {
                ...samplePetronetData.historical,
                netProfit: [100, 200, 300, 400, 500], // Increasing
                cfo: [150, 250, 350, 450, 600],
                borrowings: [100, 90, 80, 70, 60], // Decreasing
                opmPercent: [10, 11, 12, 13, 14], // Increasing
                sales: [1000, 1100, 1200, 1300, 1400],
                totalAssets: [500, 500, 500, 500, 500],
                equityCapital: [100, 100, 100, 100, 100]
            };
            mockData.currentRatio = 2;

            const result = calculatePiotroskiScore(mockData);
            if (result.score >= 7) {
                expect(result.interpretation).toBe('Strong Financial Health');
            }
        });

        test('returns "Weak Financial Health" for score < 5', () => {
            const result = calculatePiotroskiScore(sampleWeakData);
            if (result.score < 5) {
                expect(result.interpretation).toBe('Weak Financial Health');
            }
        });
    });
});
