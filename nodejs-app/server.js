const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();
const fetch = require('node-fetch');
const { PORT } = require('./config');

const fetchStockData = require('./fetchData');
const analyzeStock = require('./analyzeStock');
const generateAIInsights = require('./aiInsights');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// API Routes

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Stock Analysis API is running' });
});

// Search companies endpoint (proxies to screener.in search API)
app.get('/api/search', async (req, res) => {
  try {
    const { query } = req.query;
    if (!query) {
      return res.status(400).json({ error: 'Query parameter is required' });
    }

    // Proxy to Screener.in's real search API
    const screenerRes = await fetch(`https://www.screener.in/api/company/search/?q=${encodeURIComponent(query)}`);
    if (!screenerRes.ok) {
      return res.status(500).json({ error: 'Failed to fetch from Screener.in' });
    }
    const screenerResults = await screenerRes.json();

    // Return results as-is (or map if needed)
    console.log("screenerResults",screenerResults);
    res.json({
      success: true,
      results: screenerResults,
      query: query
    });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Search failed', message: error.message });
  }
});

// Analyze stock endpoint
app.post('/api/analyze', async (req, res) => {
  try {
    const { companyName, companyUrl, slug } = req.body;
    
    if (!companyName && !companyUrl && !slug) {
      return res.status(400).json({ error: 'Company name, URL, or slug is required' });
    }

    // If companyUrl is provided from frontend, use it directly
    let targetCompany = companyName;
    let useDirectUrl = false;
    
    if (companyUrl) {
      // Extract slug from the URL for logging and fallback
      const urlMatch = companyUrl.match(/\/company\/([^\/]+)/);
      if (urlMatch) {
        targetCompany = urlMatch[1];
        useDirectUrl = true;
      }
    } else if (slug) {
      targetCompany = slug;
    }

    console.log(`🔍 API: Analyzing stock: ${targetCompany}${useDirectUrl ? ' (using direct URL)' : ''}`);
    
    // Fetch stock data using existing function
    const stockData = await fetchStockData(targetCompany, useDirectUrl ? companyUrl : null);
    
    if (!stockData) {
      return res.status(404).json({ 
        error: 'Stock not found', 
        message: `Could not find data for ${targetCompany}` 
      });
    }

    // Analyze the stock using existing function
    const analysis = analyzeStock(stockData.data);
    
    // Generate AI insights
    const aiInsights = await generateAIInsights(stockData.data, analysis, stockData.screenshotPath);
    const result = {
      success: true,
      company: {
        name: companyName || targetCompany,
        slug: slug || targetCompany,
        url: stockData.url
      },
      data: stockData.data,
      analysis: analysis,
      aiInsights: aiInsights,
      timestamp: new Date().toISOString()
    };
    console.log("result",result);

    res.json(result);

  } catch (error) {
    console.error('Analysis error:', error);
    res.status(500).json({ 
      error: 'Analysis failed', 
      message: error.message 
    });
  }
});

// Get analysis by company name (GET endpoint for convenience)
app.get('/api/analyze/:companyName', async (req, res) => {
  try {
    const { companyName } = req.params;
    
    console.log(`🔍 API: Analyzing stock: ${companyName}`);
    
    // Fetch stock data using existing function
    const stockData = await fetchStockData(companyName);
    
    if (!stockData) {
      return res.status(404).json({ 
        error: 'Stock not found', 
        message: `Could not find data for ${companyName}` 
      });
    }

    // Analyze the stock using existing function
    const analysis = analyzeStock(stockData.data);
    
    // Generate AI insights
    const aiInsights = await generateAIInsights(stockData.data, analysis, analysis.screenshotPath);
    
    const result = {
      success: true,
      company: {
        name: companyName,
        url: stockData.url
      },
      data: stockData.data,
      analysis: analysis,
      aiInsights: aiInsights,
      timestamp: new Date().toISOString()
    };

    res.json(result);

  } catch (error) {
    console.error('Analysis error:', error);
    res.status(500).json({ 
      error: 'Analysis failed', 
      message: error.message 
    });
  }
});

// Serve the frontend
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Stock Analysis API running on http://localhost:${PORT}`);
  console.log(`📊 API endpoints:`);
  console.log(`   GET  /api/health - Health check`);
  console.log(`   GET  /api/search?query=COMPANY - Search companies`);
  console.log(`   GET  /api/analyze/:companyName - Analyze stock`);
  console.log(`   POST /api/analyze - Analyze stock with body`);
  console.log(`🌐 Frontend available at http://localhost:${PORT}`);
}); 