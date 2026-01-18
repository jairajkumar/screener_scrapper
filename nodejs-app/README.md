# Stock Analysis Tool

A comprehensive investment analysis tool that scrapes financial data from Screener.in and evaluates stocks using **4 renowned investment scoring methodologies**.

## 📊 Investment Scoring Systems

| Score | Creator | Focus |
|-------|---------|-------|
| **Piotroski F-Score** | Joseph Piotroski | Financial Health (9 marks) |
| **Buffett Score** | Warren Buffett | Business Quality (10 marks) |
| **Graham Score** | Benjamin Graham | Value Investing (10 marks) |
| **Lynch Score** | Peter Lynch | GARP Strategy (10 marks) |

### Decision Logic
- **3+ scores ≥ 7** → BUY
- **2 scores ≥ 7** → HOLD
- **< 2 scores ≥ 7** → AVOID

---

## 🚀 Quick Start

### Option 1: Docker (Recommended)

```bash
# Pull pre-built image
docker pull ghcr.io/jairajkumar/stock-analysis:latest

# Create environment file
cp .env.example .env

# Run
docker run -p 3000:3000 --env-file .env ghcr.io/jairajkumar/stock-analysis:latest
```

### Option 2: Docker Compose

```bash
docker compose up -d
```

**Access at**: http://localhost:3000

---

## 💻 Local Development

```bash
# Install dependencies
npm install

# Configure environment
cp .env.example .env

# Start server
npm start       # Production
npm run dev     # Development with auto-reload
```

---

## 📁 Project Structure

```
nodejs-app/
├── src/
│   ├── server.js           # Express entry point
│   ├── routes/api.js       # API endpoints
│   └── services/
│       ├── scraper.js      # Screener.in data extraction
│       ├── analyzer.js     # Combines all 4 scores
│       ├── piotroskiScore.js
│       ├── buffettScore.js
│       ├── grahamScore.js
│       └── lynchScore.js
├── public/
│   ├── index.html          # Modern UI
│   ├── styles.css          # Design system
│   └── script.js           # Frontend logic
└── documentation/
    ├── BACKEND.md          # Backend services
    ├── FRONTEND.md         # UI components
    ├── API_BRIDGE.md       # API reference
    ├── SCORING.md          # Scoring methodologies
    └── DOCKER.md           # Docker setup
```

---

## 🌐 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/analyze/:name` | Analyze stock by name |
| POST | `/api/analyze` | Analyze by Screener URL |
| GET | `/api/search?query=...` | Search companies |
| GET | `/api/health` | Health check |

### Example Response

```json
{
  "success": true,
  "company": { "name": "TCS", "url": "..." },
  "analysis": {
    "finalDecision": "HOLD",
    "scoresAbove7": 2,
    "summary": {
      "piotroski": "6/9",
      "buffett": "8/10",
      "graham": "7/10",
      "lynch": "4/10"
    }
  }
}
```

---

## ⚙️ Environment Variables

```bash
# Optional - Screener.in authentication
SCREENER_EMAIL=your-email
SCREENER_PASSWORD=your-password

# Optional - AI insights
GEMINI_API_KEY=your-api-key

# Optional
PORT=3000
```

---

## 📚 Documentation

See the `/documentation` folder for detailed guides:
- [Backend Services](documentation/BACKEND.md)
- [Frontend Components](documentation/FRONTEND.md)
- [API Reference](documentation/API_BRIDGE.md)
- [Scoring Methodology](documentation/SCORING.md)
- [Docker Setup](documentation/DOCKER.md)

---

## 🤝 Credits

- Data source: [Screener.in](https://www.screener.in)
- AI insights: Google Gemini API