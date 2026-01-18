#!/usr/bin/env node
/**
 * CLI tool for analyzing stocks from command line
 * Usage: node scripts/analyze.js <STOCK_NAME>
 * Example: node scripts/analyze.js TCS
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const fetchStockData = require('../src/services/scraper');
const analyzeStock = require('../src/services/analyzer');

async function main() {
    const stockName = process.argv[2] || 'TCS';
    console.log(`\n📊 Analyzing ${stockName}...\n`);

    const stock = await fetchStockData(stockName);
    if (!stock) {
        console.log('❌ Stock not found!');
        process.exit(1);
    }

    const analysis = analyzeStock(stock.data);

    console.log('─'.repeat(50));
    console.log(`📈 Stock URL: ${stock.url}`);
    console.log('─'.repeat(50));
    console.log('\n📊 Data:');
    console.table(stock.data);
    console.log('\n📋 Analysis:');
    console.log(`   Verdict: ${analysis.verdict}`);
    console.log(`   Score: ${analysis.score}/${analysis.total} (${analysis.percent.toFixed(1)}%)`);
    console.log('\n📝 Breakdown:');
    Object.entries(analysis.analysis).forEach(([key, value]) => {
        console.log(`   ${key}: ${value}`);
    });
    console.log('');
}

main().catch(console.error);
