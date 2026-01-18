/**
 * Sample financial data for testing scoring functions
 * Based on PETRONET LNG actual data
 */

const samplePetronetData = {
    // Top Card Ratios
    stockPE: 11.9,
    roe: 21.4,
    roce: 26.2,
    bookValue: 137,
    dividendYield: 3.51,
    marketCap: 42698,
    currentPrice: 285,
    industryPE: 8,

    // Calculated Ratios
    debtToEquity: 0.12,
    roa: 12.97,
    assetTurnover: 1.71,
    fcf: 1209,
    pegRatio: 1.70,
    priceToBook: 2.08,
    grahamNumber: 271.71,
    currentRatio: 3.54,

    // Growth Rates
    profitGrowth10Y: 17,
    profitGrowth5Y: 7,
    profitGrowth3Y: 5,
    salesGrowth10Y: 3,
    salesGrowth5Y: 8,
    salesGrowth3Y: 6,
    epsGrowth: 7,

    // Historical Data (last 5 years, most recent last)
    historical: {
        sales: [43169, 59899, 52728, 50980, 47432],
        netProfit: [3352, 3240, 3536, 3926, 3594],
        opmPercent: [12, 8, 10, 11, 11],
        eps: [22.35, 21.6, 23.57, 26.18, 23.95],
        dividendPayout: [51, 46, 42, 38, 38],
        borrowings: [3438, 3345, 3008, 2657, 2505],
        equityCapital: [1500, 1500, 1500, 1500, 1500],
        reserves: [11925, 13435, 15463, 17882, 19089],
        totalAssets: [21122, 22444, 25102, 26829, 27711],
        cfo: [3559, 3472, 2520, 4873, 4398],
        cfi: [-927, -1063, -1137, -1062, -3189],
        otherAssets: [10322, 11483, 15227, 15128, 16340],
        otherLiabilities: [4258, 4164, 5131, 4790, 4618]
    },

    // Latest values
    latestEPS: 23.95,
    latestNetProfit: 3594,
    latestCFO: 4398,
    latestBorrowings: 2505,
    latestEquity: 20589
};

// Data with poor financial health for testing failure cases
const sampleWeakData = {
    stockPE: 35,
    roe: 8,
    roce: 10,
    bookValue: 50,
    dividendYield: 0,
    marketCap: 1000,
    currentPrice: 100,
    industryPE: 15,

    debtToEquity: 2.5,
    roa: 3,
    assetTurnover: 0.5,
    fcf: -500,
    pegRatio: 5,
    priceToBook: 4,
    grahamNumber: 30,
    currentRatio: 0.8,

    profitGrowth5Y: 3,
    salesGrowth5Y: 2,
    epsGrowth: 3,

    historical: {
        sales: [1000, 900, 850, 800, 750],
        netProfit: [100, 80, -50, 30, 20],
        opmPercent: [10, 8, 6, 5, 4],
        eps: [5, 4, -2, 1.5, 1],
        dividendPayout: [0, 0, 0, 0, 0],
        borrowings: [500, 600, 700, 800, 900],
        equityCapital: [200, 200, 200, 200, 200],
        reserves: [100, 80, 50, 40, 30],
        totalAssets: [1000, 950, 900, 850, 800],
        cfo: [50, 30, -20, 10, -30],
        cfi: [-100, -80, -50, -30, -20],
        otherAssets: [200, 180, 150, 120, 100],
        otherLiabilities: [300, 350, 400, 450, 500]
    },

    latestEPS: 1,
    latestNetProfit: 20,
    latestCFO: -30,
    latestBorrowings: 900,
    latestEquity: 230
};

// Expected results for PETRONET
const expectedPetronetResults = {
    piotroski: {
        score: 6,
        total: 9,
        interpretation: 'Moderate Financial Health'
    },
    buffett: {
        score: 8,
        total: 10,
        interpretation: 'Excellent Long-Term Business'
    },
    graham: {
        score: 9,
        total: 10,
        interpretation: 'Strong Value Stock'
    },
    lynch: {
        score: 4,
        total: 10,
        interpretation: 'Not a GARP Stock'
    },
    finalDecision: 'HOLD',
    scoresAbove7: 2
};

// Critical HTML selectors that must exist on Screener.in
const criticalSelectors = {
    topRatios: '#top-ratios li',
    profitLossSection: '#profit-loss',
    profitLossTable: '#profit-loss table tbody tr',
    balanceSheetSection: '#balance-sheet',
    balanceSheetTable: '#balance-sheet table tbody tr',
    cashFlowSection: '#cash-flow',
    cashFlowTable: '#cash-flow table tbody tr',
    growthTable: 'table.ranges-table',
    peersSection: '#peers'
};

// Expected row labels in tables
const expectedRowLabels = {
    profitLoss: ['sales', 'net profit', 'opm', 'eps in rs', 'dividend payout'],
    balanceSheet: ['equity capital', 'reserves', 'borrowings', 'total assets', 'other assets', 'other liabilities'],
    cashFlow: ['cash from operating activity', 'cash from investing activity', 'cash from financing activity']
};

module.exports = {
    samplePetronetData,
    sampleWeakData,
    expectedPetronetResults,
    criticalSelectors,
    expectedRowLabels
};
