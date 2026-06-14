describe('Yahoo Finance service', () => {
    beforeEach(() => {
        jest.resetModules();
    });

    test('instantiates the yahoo-finance2 v3 CommonJS default export', async () => {
        const chart = jest.fn().mockResolvedValue({ quotes: [] });
        const YahooFinance = jest.fn().mockImplementation(() => ({ chart }));

        jest.doMock('yahoo-finance2', () => ({ default: YahooFinance }));

        const { fetchHistoricalPrices } = require('../../src/services/yahooFinanceService');
        const result = await fetchHistoricalPrices('TCS');

        expect(YahooFinance).toHaveBeenCalledTimes(1);
        expect(chart).toHaveBeenCalledWith('TCS.NS', expect.objectContaining({
            interval: '1mo'
        }));
        expect(result.error).toBe('No historical data returned for TCS.NS');
    });
});
