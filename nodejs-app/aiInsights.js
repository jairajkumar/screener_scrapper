// aiInsights.js

const { GoogleGenerativeAI } = require('@google/generative-ai');
const { GEMINI_API_KEY } = require('./config');
const fs = require('fs').promises; // For reading local files in Node.js
const path = require('path'); // For path manipulation

/**
 * Converts a local image file to a GoogleGenerativeAI.Part object.
 * @param {string} imagePath - The path to the local image file.
 * @returns {Promise<Object>} A Promise that resolves to a GoogleGenerativeAI.Part object.
 */
async function fileToGenerativePart(imagePath) {
  try {
    const fileExtension = path.extname(imagePath).toLowerCase();
    let mimeType;

    switch (fileExtension) {
      case '.png':
        mimeType = 'image/png';
        break;
      case '.jpeg':
      case '.jpg':
        mimeType = 'image/jpeg';
        break;
      case '.webp':
        mimeType = 'image/webp';
        break;
      default:
        throw new Error(`Unsupported image file type: ${fileExtension}`);
    }

    const imageBuffer = await fs.readFile(imagePath);
    console.log("image is converting", imagePath)
    const base64String = imageBuffer.toString('base64');

    return {
      inlineData: {
        data: base64String,
        mimeType: mimeType,
      },
    };
  } catch (error) {
    console.error('Error converting file to generative part:', error);
    throw error; // Re-throw to be caught by the main generateAIInsights function
  }
}

async function generateAIInsights(stockData, analysis, imagePath = null) {
  // Check if Gemini API key is available
  console.log("imagepath: ", imagePath)
  if (!GEMINI_API_KEY) {
    return `AI Insights: Gemini API key not configured. Please set GEMINI_API_KEY in your .env file for AI-powered insights.`;
  }

  try {
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    // Analyze this Indian stock data and provide investment insights:
    
    // Stock Data:
    // - ROE: ${stockData.roe || 'N/A'}
    // - P/E Ratio: ${stockData.pe_ratio || 'N/A'}
    // - Debt to Equity: ${stockData.debt_to_equity || 'N/A'}
    // - ROCE: ${stockData.roce || 'N/A'}
    // - EPS Growth: ${stockData.eps_growth || 'N/A'}%
    // - PEG Ratio: ${stockData.peg || 'N/A'}
    // - EPS: ${stockData.eps || 'N/A'}
    // - Book Value: ${stockData.book_value || 'N/A'}
    // - Cash Flow: ${stockData.cash_flow || 'N/A'}
    
    // Analysis Verdict: ${analysis.verdict}
    // Score: ${analysis.score}/${analysis.totalCriteria} (${analysis.percentage}%)
    
    const promptText = `
    
    Please provide:
    1. A brief analysis of the stock's financial health
    2. Key strengths and weaknesses
    3. Investment recommendation with reasoning
    4. Risk factors to consider
    
    Keep the response concise and professional and give in Html format so that it can render.
    `;

    const contents = [{ text: promptText }];

    // If an image path is provided, convert it and add to contents
    if (imagePath) {
      try {
        const imagePart = await fileToGenerativePart(imagePath);
        contents.push(imagePart);
        // You might want to update the prompt text to indicate an image is present
        // For example:
        // promptText = `Analyze this Indian stock data and the provided image (e.g., chart, company logo) and provide investment insights: ...`;
        // Or keep it separate as shown above and rely on the model's multi-modal understanding.
      } catch (imageError) {
        console.warn(`Could not process image at ${imagePath}:`, imageError.message);
        // Continue without the image if there's an error with it
      }
    }
    console.log("contents for LLM", contents)

    const result = await model.generateContent(contents);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error('Gemini AI error:', error);
    return `AI Insights: Error generating insights. Please check your Gemini API key and try again.`;
  }
}

module.exports = generateAIInsights;