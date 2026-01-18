require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

module.exports = {
    // Screener.in URLs
    SCREENER_BASE_URL: process.env.SCREENER_BASE_URL || "https://www.screener.in",
    SCREENER_SEARCH_URL: process.env.SCREENER_SEARCH_URL || "https://www.screener.in/search/",

    // Investment Criteria - load from environment variables with defaults
    CRITERIA: {
        roe_min: parseFloat(process.env.ROE_MIN) || 15,
        pe_max: parseFloat(process.env.PE_MAX) || 20,
        debt_to_equity_max: parseFloat(process.env.DEBT_TO_EQUITY_MAX) || 0.5,
        roce_min: parseFloat(process.env.ROCE_MIN) || 15,
        eps_growth_min: parseFloat(process.env.EPS_GROWTH_MIN) || 10,
        eps_growth_max: parseFloat(process.env.EPS_GROWTH_MAX) || 15,
        peg_max: parseFloat(process.env.PEG_MAX) || 1,
        intrinsic_value_multiplier: parseFloat(process.env.INTRINSIC_VALUE_MULTIPLIER) || 22.5
    },

    // Login credentials from environment variables
    LOGIN: {
        email: process.env.SCREENER_EMAIL || "",
        password: process.env.SCREENER_PASSWORD || ""
    },

    // Server configuration
    PORT: process.env.PORT || 3000,
    NODE_ENV: process.env.NODE_ENV || 'development',

    // Gemini AI API Key
    GEMINI_API_KEY: process.env.GEMINI_API_KEY || ""
};
