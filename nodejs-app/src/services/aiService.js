const { GoogleGenerativeAI } = require('@google/generative-ai');
const { GEMINI_API_KEY } = require('../../config');
const fs = require('fs').promises;
const path = require('path');

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
        console.log("image is converting", imagePath);
        const base64String = imageBuffer.toString('base64');

        return {
            inlineData: {
                data: base64String,
                mimeType: mimeType,
            },
        };
    } catch (error) {
        console.error('Error converting file to generative part:', error);
        throw error;
    }
}

/**
 * Generate AI-powered insights for stock analysis
 * @param {Object} stockData - Stock data
 * @param {Object} analysis - Analysis results
 * @param {string|null} imagePath - Optional screenshot path
 * @returns {Promise<string>} AI-generated insights
 */
async function generateAIInsights(stockData, analysis, imagePath = null) {
    console.log("imagepath: ", imagePath);

    if (!GEMINI_API_KEY) {
        return `AI Insights: Gemini API key not configured. Please set GEMINI_API_KEY in your .env file for AI-powered insights.`;
    }

    try {
        const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

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
            } catch (imageError) {
                console.warn(`Could not process image at ${imagePath}:`, imageError.message);
            }
        }
        console.log("contents for LLM", contents);

        const result = await model.generateContent(contents);
        const response = await result.response;
        return response.text();
    } catch (error) {
        console.error('Gemini AI error:', error);
        return `AI Insights: Error generating insights. Please check your Gemini API key and try again.`;
    }
}

module.exports = generateAIInsights;
