// aiInsights.js

// If you have Gemini API setup, you can import and use it here
// For now, we'll return a static message for demonstration

const { GoogleGenerativeAI } = require('@google/generative-ai');
const { GEMINI_API_KEY } = require('./config');

async function generateAIInsights(stockData, analysis) {
  // Check if Gemini API key is available
  if (!GEMINI_API_KEY) {
    return `AI Insights: Gemini API key not configured. Please set GEMINI_API_KEY in your .env file for AI-powered insights.`;
  }

  try {
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    const prompt = `
    Analyze this Indian stock data and provide investment insights:
    
    Stock Data:
    - ROE: ${stockData.roe || 'N/A'}
    - P/E Ratio: ${stockData.pe_ratio || 'N/A'}
    - Debt to Equity: ${stockData.debt_to_equity || 'N/A'}
    - ROCE: ${stockData.roce || 'N/A'}
    - EPS Growth: ${stockData.eps_growth || 'N/A'}%
    - PEG Ratio: ${stockData.peg || 'N/A'}
    - EPS: ${stockData.eps || 'N/A'}
    - Book Value: ${stockData.book_value || 'N/A'}
    - Cash Flow: ${stockData.cash_flow || 'N/A'}
    
    Analysis Verdict: ${analysis.verdict}
    Score: ${analysis.score}/${analysis.totalCriteria} (${analysis.percentage}%)
    
    Please provide:
    1. A brief analysis of the stock's financial health
    2. Key strengths and weaknesses
    3. Investment recommendation with reasoning
    4. Risk factors to consider
    
    Keep the response concise and professional.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error('Gemini AI error:', error);
    return `AI Insights: Error generating insights. Please check your Gemini API key and try again.`;
  }
}

module.exports = generateAIInsights; 