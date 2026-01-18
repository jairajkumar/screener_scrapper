const fs = require('fs');
const path = require('path');

// Path to store cookies for session persistence (in project root)
const COOKIES_FILE = path.join(__dirname, '..', '..', 'screener_cookies.json');

/**
 * Save cookies to file for session persistence
 * @param {Object} page - Puppeteer page object
 */
async function saveCookies(page) {
    const cookies = await page.cookies();
    fs.writeFileSync(COOKIES_FILE, JSON.stringify(cookies, null, 2));
    console.log('💾 Cookies saved for session persistence');
}

/**
 * Load cookies from file if it exists and is a valid file
 * @param {Object} page - Puppeteer page object
 * @returns {Promise<boolean>} Whether cookies were loaded
 */
async function loadCookies(page) {
    if (fs.existsSync(COOKIES_FILE)) {
        // Check if it's actually a file (not a directory)
        const stat = fs.statSync(COOKIES_FILE);
        if (!stat.isFile()) {
            console.log('⚠️  Warning: Cookie path exists but is not a file, removing...');
            fs.rmSync(COOKIES_FILE, { recursive: true, force: true });
            return false;
        }
        const cookies = JSON.parse(fs.readFileSync(COOKIES_FILE, 'utf8'));
        await page.setCookie(...cookies);
        console.log('📂 Cookies loaded from previous session');
        return true;
    }
    return false;
}

module.exports = {
    saveCookies,
    loadCookies,
    COOKIES_FILE
};
