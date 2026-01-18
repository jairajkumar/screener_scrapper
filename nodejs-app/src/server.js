const express = require('express');
const cors = require('cors');
const path = require('path');

const { PORT } = require('../config');
const apiRoutes = require('./routes/api');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));

// API Routes
app.use('/api', apiRoutes);

// Serve the frontend
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
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
