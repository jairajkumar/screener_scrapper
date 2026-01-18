const express = require('express');
const fetch = require('node-fetch');
const router = express.Router();

const fetchStockData = require('../services/scraper');
const analyzeStock = require('../services/analyzer');
const generateAIInsights = require('../services/aiService');

// Health check endpoint
router.get('/health', (req, res) => {
    res.json({ status: 'OK', message: 'Stock Analysis API is running' });
});

// Search companies endpoint (proxies to screener.in search API)
router.get('/search', async (req, res) => {
    try {
        const { query } = req.query;
        if (!query) {
            return res.status(400).json({ error: 'Query parameter is required' });
        }

        const screenerRes = await fetch(`https://www.screener.in/api/company/search/?q=${encodeURIComponent(query)}`);
        if (!screenerRes.ok) {
            return res.status(500).json({ error: 'Failed to fetch from Screener.in' });
        }
        const screenerResults = await screenerRes.json();

        console.log("screenerResults", screenerResults);
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

// Analyze stock endpoint (POST)
router.post('/analyze', async (req, res) => {
    try {
        const { companyName, companyUrl, slug } = req.body;

        if (!companyName && !companyUrl && !slug) {
            return res.status(400).json({ error: 'Company name, URL, or slug is required' });
        }

        let targetCompany = companyName;
        let useDirectUrl = false;

        if (companyUrl) {
            const urlMatch = companyUrl.match(/\/company\/([^\/]+)/);
            if (urlMatch) {
                targetCompany = urlMatch[1];
                useDirectUrl = true;
            }
        } else if (slug) {
            targetCompany = slug;
        }

        console.log(`🔍 API: Analyzing stock: ${targetCompany}${useDirectUrl ? ' (using direct URL)' : ''}`);

        const stockData = await fetchStockData(targetCompany, useDirectUrl ? companyUrl : null);

        if (!stockData) {
            return res.status(404).json({
                error: 'Stock not found',
                message: `Could not find data for ${targetCompany}`
            });
        }

        const analysis = analyzeStock(stockData.data);
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
        console.log("result", result);

        res.json(result);

    } catch (error) {
        console.error('Analysis error:', error);
        res.status(500).json({
            error: 'Analysis failed',
            message: error.message
        });
    }
});

// Get analysis by company name (GET endpoint)
router.get('/analyze/:companyName', async (req, res) => {
    try {
        const { companyName } = req.params;

        console.log(`🔍 API: Analyzing stock: ${companyName}`);

        const stockData = await fetchStockData(companyName);

        if (!stockData) {
            return res.status(404).json({
                error: 'Stock not found',
                message: `Could not find data for ${companyName}`
            });
        }

        const analysis = analyzeStock(stockData.data);
        const aiInsights = await generateAIInsights(stockData.data, analysis, stockData.screenshotPath);

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

module.exports = router;
