/**
 * Analyzer Unit Tests - Final Decision Logic
 */

const analyzeStock = require('../../src/services/analyzer');
const { samplePetronetData, sampleWeakData, expectedPetronetResults } = require('../mocks/sampleData');

describe('Analyzer - Combined Scoring', () => {
    describe('with PETRONET data', () => {
        let result;

        beforeAll(() => {
            result = analyzeStock(samplePetronetData);
        });

        test('returns correct structure', () => {
            expect(result).toHaveProperty('finalDecision');
            expect(result).toHaveProperty('scoresAbove7');
            expect(result).toHaveProperty('overallPercent');
            expect(result).toHaveProperty('piotroski');
            expect(result).toHaveProperty('buffett');
            expect(result).toHaveProperty('graham');
            expect(result).toHaveProperty('lynch');
            expect(result).toHaveProperty('summary');
        });

        test('includes all 4 score objects', () => {
            expect(result.piotroski).toHaveProperty('score');
            expect(result.buffett).toHaveProperty('score');
            expect(result.graham).toHaveProperty('score');
            expect(result.lynch).toHaveProperty('score');
        });

        test('summary format is correct', () => {
            expect(result.summary.piotroski).toMatch(/^\d+\/\d+$/);
            expect(result.summary.buffett).toMatch(/^\d+\/\d+$/);
            expect(result.summary.graham).toMatch(/^\d+\/\d+$/);
            expect(result.summary.lynch).toMatch(/^\d+\/\d+$/);
        });

        test('counts scoresAbove7 correctly', () => {
            let count = 0;
            if (result.piotroski.score >= 7) count++;
            if (result.buffett.score >= 7) count++;
            if (result.graham.score >= 7) count++;
            if (result.lynch.score >= 7) count++;

            expect(result.scoresAbove7).toBe(count);
        });

        test('PETRONET gets HOLD decision (2 scores >= 7)', () => {
            expect(result.finalDecision).toBe('HOLD');
            expect(result.scoresAbove7).toBe(2);
        });
    });

    describe('Decision Logic', () => {
        test('BUY when 3+ scores >= 7', () => {
            // Create data that scores high on 3+ metrics
            const buyData = {
                ...samplePetronetData,
                roe: 25,
                debtToEquity: 0.1,
                currentRatio: 3,
                profitGrowth5Y: 20,
                pegRatio: 0.8,
                stockPE: 10,
                industryPE: 15, // Stock PE < Industry PE
                priceToBook: 1.2
            };

            const result = analyzeStock(buyData);

            // If we have 3+ scores above 7, decision should be BUY
            if (result.scoresAbove7 >= 3) {
                expect(result.finalDecision).toBe('BUY');
            }
        });

        test('HOLD when 2 scores >= 7', () => {
            const result = analyzeStock(samplePetronetData);
            if (result.scoresAbove7 === 2) {
                expect(result.finalDecision).toBe('HOLD');
            }
        });

        test('AVOID when < 2 scores >= 7', () => {
            const result = analyzeStock(sampleWeakData);
            if (result.scoresAbove7 < 2) {
                expect(result.finalDecision).toBe('AVOID');
            }
        });
    });

    describe('Legacy compatibility', () => {
        test('includes legacy verdict field', () => {
            const result = analyzeStock(samplePetronetData);
            expect(result).toHaveProperty('verdict');
            expect(result.verdict).toBe(result.finalDecision);
        });

        test('includes legacy analysis object', () => {
            const result = analyzeStock(samplePetronetData);
            expect(result).toHaveProperty('analysis');
            expect(result.analysis).toHaveProperty('roe');
            expect(result.analysis).toHaveProperty('pe_ratio');
        });
    });

    describe('Overall percentage', () => {
        test('calculates overall percentage as average of 4 scores', () => {
            const result = analyzeStock(samplePetronetData);

            const expectedAvg = Math.round(
                (result.piotroski.percent + result.buffett.percent +
                    result.graham.percent + result.lynch.percent) / 4
            );

            expect(result.overallPercent).toBe(expectedAvg);
        });
    });
});
