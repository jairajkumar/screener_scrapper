require('dotenv').config();
const fetchStockData = require('./fetchData');
const analyzeStock = require('./analyzeStock');
// const getAIInsights = require('./aiAdvisor'); // To be implemented

async function main() {
  const stockName = process.argv[2] || 'TCS';
  const stock = await fetchStockData(stockName);
  if (!stock) {
    console.log('Stock not found!');
    return;
  }
  const analysis = analyzeStock(stock.data);
  console.log('Stock URL:', stock.url);
  console.log('Analysis:', analysis);
  // const ai = await getAIInsights(stockName, stock.data, analysis);
  // console.log('AI Insights:', ai);
}

main(); 