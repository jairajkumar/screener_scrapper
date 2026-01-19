const puppeteer = require('puppeteer-core');
const { SCREENER_SEARCH_URL, LOGIN } = require('../../config');
const { saveCookies, loadCookies } = require('../utils/cookies');
const fs = require('fs');
const path = require('path');

// Create screenshots directory if it doesn't exist (in project root)
const SCREENSHOTS_DIR = path.join(__dirname, '..', '..', 'screenshots');
if (!fs.existsSync(SCREENSHOTS_DIR)) {
    fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
    console.log('📁 Created screenshots directory');
}

/**
 * Validate that screener credentials are configured
 * @returns {boolean} Whether credentials are valid
 */
function validateCredentials() {
    if (!LOGIN.email || !LOGIN.password) {
        console.log('⚠️  Warning: Screener.in credentials not found in environment variables');
        console.log('   Please set SCREENER_EMAIL and SCREENER_PASSWORD in your .env file');
        console.log('   Some data fields may be unavailable without login');
        return false;
    }
    return true;
}

/**
 * Check if user is logged in to Screener.in
 * @param {Object} page - Puppeteer page object
 * @returns {Promise<boolean>} Whether user is logged in
 */
async function checkIfLoggedIn(page) {
    try {
        const isLoggedIn = await page.evaluate(() => {
            // Check for logout link
            if (document.querySelector('a[href*="logout"]')) return true;
            // Check for user menu/profile elements
            if (document.querySelector('.user-menu, .profile-menu, .user-info, [data-testid="user-menu"]')) return true;
            // Check for "My Screens" or account-specific elements
            if (document.querySelector('a[href*="screens"], a[href*="watchlist"]')) return true;
            // Check if we're not on login page (means we navigated away successfully)
            const isOnLoginPage = window.location.href.includes('/login/');
            if (!isOnLoginPage && document.querySelector('.company-name, #top-ratios')) return true;
            return false;
        });
        return isLoggedIn;
    } catch (error) {
        return false;
    }
}

/**
 * Login to Screener.in
 * @param {Object} page - Puppeteer page object
 * @returns {Promise<boolean>} Whether login was successful
 */
async function loginToScreener(page) {
    console.log('🔐 Attempting to login to Screener.in...');

    if (!validateCredentials()) {
        console.log('❌ Cannot login: Missing credentials in environment variables');
        return false;
    }

    try {
        await page.goto('https://www.screener.in/login/', { waitUntil: 'networkidle2', timeout: 30000 });
        console.log('📄 Login page loaded');

        try {
            await page.waitForSelector('body', { timeout: 5000 });
        } catch (e) {
            console.log('Page load timeout, continuing...');
        }

        console.log('Page title:', await page.title());
        console.log('Page URL:', page.url());

        // Try multiple possible selectors for email field
        const emailSelectors = [
            'input[type="email"]',
            'input[name="email"]',
            'input[placeholder*="email"]',
            'input[placeholder*="Email"]',
            'input[id*="email"]',
            'input[data-testid*="email"]',
            'input[type="text"]'
        ];

        let emailField = null;
        for (const selector of emailSelectors) {
            try {
                emailField = await page.$(selector);
                if (emailField) {
                    console.log(`✅ Found email field with selector: ${selector}`);
                    break;
                }
            } catch (e) {
                // Continue to next selector
            }
        }

        if (!emailField) {
            console.log('❌ Could not find email field');
            await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'login-page.png') });
            console.log('📸 Screenshot saved as screenshots/login-page.png');
            return false;
        }

        await emailField.click();
        await emailField.type(LOGIN.email);
        console.log('📧 Email entered');

        // Try multiple possible selectors for password field
        const passwordSelectors = [
            'input[type="password"]',
            'input[name="password"]',
            'input[placeholder*="password"]',
            'input[placeholder*="Password"]',
            'input[id*="password"]',
            'input[data-testid*="password"]'
        ];

        let passwordField = null;
        for (const selector of passwordSelectors) {
            try {
                passwordField = await page.$(selector);
                if (passwordField) {
                    console.log(`✅ Found password field with selector: ${selector}`);
                    break;
                }
            } catch (e) {
                // Continue to next selector
            }
        }

        if (!passwordField) {
            console.log('❌ Could not find password field');
            return false;
        }

        await passwordField.click();
        await passwordField.type(LOGIN.password);
        console.log('🔑 Password entered');

        // Try multiple possible selectors for submit button
        const submitSelectors = [
            'button[type="submit"]',
            'input[type="submit"]',
            'button:contains("Login")',
            'button:contains("Sign In")',
            '.login-button',
            '.submit-button',
            'button[data-testid*="login"]',
            'button[data-testid*="submit"]'
        ];

        let submitButton = null;
        for (const selector of submitSelectors) {
            try {
                submitButton = await page.$(selector);
                if (submitButton) {
                    console.log(`✅ Found submit button with selector: ${selector}`);
                    break;
                }
            } catch (e) {
                // Continue to next selector
            }
        }

        if (!submitButton) {
            console.log('❌ Could not find submit button, trying Enter key');
            await page.keyboard.press('Enter');
        } else {
            await submitButton.click();
        }

        console.log('🔄 Submitting login form...');

        try {
            await Promise.race([
                page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 10000 }),
                page.waitForSelector('.success-message, .error-message, .alert', { timeout: 10000 })
            ]);
        } catch (e) {
            console.log('Navigation timeout, checking login status...');
        }

        try {
            await page.waitForSelector('body', { timeout: 5000 });
        } catch (e) {
            // Continue anyway
        }

        const isLoggedIn = await checkIfLoggedIn(page);
        if (isLoggedIn) {
            console.log('✅ Login successful!');
            await saveCookies(page);
            return true;
        } else {
            console.log('❌ Login failed - check credentials');
            await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'login-result.png') });
            console.log('📸 Login result screenshot saved as screenshots/login-result.png');
            return false;
        }

    } catch (error) {
        console.log(`❌ Login error: ${error.message}`);
        try {
            await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'login-error.png') });
            console.log('📸 Error screenshot saved as screenshots/login-error.png');
        } catch (e) {
            console.log('Could not save error screenshot');
        }
        return false;
    }
}

/**
 * Get Chrome/Chromium executable path based on platform
 * @returns {string} Path to Chrome executable
 */
function getChromePath() {
    return process.env.PUPPETEER_EXECUTABLE_PATH ||
        (process.platform === 'darwin' ? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' :
            process.platform === 'win32' ? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe' :
                '/usr/bin/chromium');
}

/**
 * Fetch stock data from Screener.in
 * @param {string} stockName - Stock name or symbol
 * @param {string|null} directUrl - Optional direct URL to stock page
 * @returns {Promise<Object|null>} Stock data or null if not found
 */
async function fetchStockData(stockName, directUrl = null) {
    console.log(`🔍 Searching for stock: ${stockName}`);

    validateCredentials();

    const browser = await puppeteer.launch({
        headless: true,
        executablePath: getChromePath(),
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-blink-features=AutomationControlled',
            '--disable-web-security',
            '--disable-features=VizDisplayCompositor',
            '--disable-dev-shm-usage',
            '--disable-gpu',
            '--no-first-run',
            '--no-zygote',
            '--single-process'
        ]
    });

    const page = await browser.newPage();

    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36');
    await page.setViewport({ width: 1280, height: 800 });

    await page.evaluateOnNewDocument(() => {
        Object.defineProperty(navigator, 'webdriver', { get: () => false });
        Object.defineProperty(navigator, 'plugins', { get: () => [1, 2, 3, 4, 5] });
        Object.defineProperty(navigator, 'languages', { get: () => ['en-US', 'en'] });
    });

    await loadCookies(page);

    await page.goto('https://www.screener.in', { waitUntil: 'networkidle2', timeout: 30000 });

    let isLoggedIn = await checkIfLoggedIn(page);

    if (!isLoggedIn) {
        console.log('🔐 User not logged in, attempting login...');
        isLoggedIn = await loginToScreener(page);

        if (isLoggedIn) {
            await page.goto('https://www.screener.in', { waitUntil: 'networkidle2', timeout: 30000 });
            isLoggedIn = await checkIfLoggedIn(page);
        }
    }

    if (isLoggedIn) {
        console.log('✅ User is logged in - will extract additional data');
    } else {
        console.log('⚠️ User not logged in - some data may be limited');
    }

    let companyUrl = null;

    if (directUrl) {
        companyUrl = `https://www.screener.in/${directUrl}`;
        console.log(`📊 Using direct URL: ${companyUrl}`);
    } else {
        const companySlug = stockName.toUpperCase();
        const builtUrl = `https://www.screener.in/company/${companySlug}/`;
        console.log(`📊 Going to: ${builtUrl}`);

        try {
            await page.goto(builtUrl, { waitUntil: 'networkidle2', timeout: 30000 });
            const pageTitle = await page.title();
            console.log(`Page title: ${pageTitle}`);
            if (!pageTitle.includes('404') && !pageTitle.includes('Not Found')) {
                companyUrl = builtUrl;
            }
        } catch (directError) {
            console.log(`❌ Direct URL failed: ${directError.message}`);
            await browser.close();
            return null;
        }
    }

    if (!companyUrl) {
        console.log('❌ No company URL found');
        await browser.close();
        return null;
    }

    console.log(`📈 Going to company page: ${companyUrl}`);
    try {
        await page.goto(companyUrl, { waitUntil: 'networkidle2', timeout: 30000 });
    } catch (error) {
        console.log(`❌ Error loading company page: ${error.message}`);
        await browser.close();
        return null;
    }

    try {
        await page.waitForSelector('body', { timeout: 15000 });
    } catch (error) {
        console.log('❌ Company page did not load properly');
        await browser.close();
        return null;
    }

    // Extract comprehensive financial data for all scoring systems
    const data = await page.evaluate(() => {
        // ===== HELPER FUNCTIONS =====

        // Clean numeric value from text (removes currency symbols, commas, whitespace)
        function cleanNumber(text) {
            if (!text) return null;
            const cleaned = text.replace(/[₹,%\s]/g, '').replace(/,/g, '').trim();
            const num = parseFloat(cleaned);
            return isNaN(num) ? null : num;
        }

        // Get value from Top Card ratios (#top-ratios)
        function getTopCardValue(label) {
            const items = document.querySelectorAll('#top-ratios li');
            for (const item of items) {
                const nameEl = item.querySelector('.name');
                const valueEl = item.querySelector('.value, .number');
                if (nameEl && nameEl.textContent.trim().toLowerCase() === label.toLowerCase()) {
                    return cleanNumber(valueEl?.textContent);
                }
            }
            return null;
        }

        // Get row data from financial tables by EXACT label match
        // Returns array of yearly values (numbers only)
        function getTableRowData(sectionId, rowLabel) {
            const section = document.querySelector(sectionId);
            if (!section) return [];

            const rows = section.querySelectorAll('table tbody tr');
            for (const row of rows) {
                const labelCell = row.querySelector('td.text, td:first-child');
                if (!labelCell) continue;

                const labelText = labelCell.textContent.trim().toLowerCase();
                const searchLabel = rowLabel.toLowerCase();

                // Match if label starts with our search term (handles "Sales +" matching "sales")
                if (labelText.startsWith(searchLabel) || labelText === searchLabel) {
                    const cells = Array.from(row.querySelectorAll('td'));
                    const values = [];

                    // Skip first cell (label), get numeric values from remaining cells
                    for (let i = 1; i < cells.length; i++) {
                        const num = cleanNumber(cells[i].textContent);
                        if (num !== null) values.push(num);
                    }
                    return values;
                }
            }
            return [];
        }

        // Get Compounded Growth Rate from ranges-table
        // Structure: table.ranges-table > tbody > tr with th header, then td pairs
        function getGrowthRate(type, period) {
            const tables = document.querySelectorAll('table.ranges-table');
            for (const table of tables) {
                const header = table.querySelector('th');
                if (!header) continue;

                const headerText = header.textContent.toLowerCase();
                if (!headerText.includes(type.toLowerCase())) continue;

                // Found the right growth table, now find the period
                const rows = table.querySelectorAll('tbody tr');
                for (const row of rows) {
                    const cells = row.querySelectorAll('td');
                    if (cells.length >= 2) {
                        const periodText = cells[0].textContent.toLowerCase();
                        if (periodText.includes(period.toLowerCase())) {
                            return cleanNumber(cells[1].textContent);
                        }
                    }
                }
            }
            return null;
        }

        // Get Industry P/E from Peers section
        function getIndustryPE() {
            const peersSection = document.querySelector('#peers');
            if (!peersSection) return null;

            // Look for sub-heading with Median P/E
            const subHeading = peersSection.querySelector('.sub-heading');
            if (subHeading) {
                const text = subHeading.textContent;
                const match = text.match(/Median.*?(\d+\.?\d*)/i);
                if (match) return parseFloat(match[1]);
            }

            // Fallback: search all text
            const text = peersSection.textContent;
            const match = text.match(/Median.*?:?\s*(\d+\.?\d*)/i);
            if (match) return parseFloat(match[1]);

            return null;
        }

        // Get Current Ratio from Ratios section
        function getCurrentRatio() {
            const ratios = document.querySelector('#ratios');
            if (!ratios) return null;

            const rows = ratios.querySelectorAll('table tbody tr');
            for (const row of rows) {
                const label = row.querySelector('td:first-child');
                if (label && label.textContent.toLowerCase().includes('current ratio')) {
                    // Get latest value (last numeric cell)
                    const cells = Array.from(row.querySelectorAll('td'));
                    for (let i = cells.length - 1; i >= 1; i--) {
                        const num = cleanNumber(cells[i].textContent);
                        if (num !== null) return num;
                    }
                }
            }
            return null;
        }

        // ===== EXTRACT ALL DATA =====

        // Top Card Ratios
        const stockPE = getTopCardValue('Stock P/E');
        const roe = getTopCardValue('ROE');
        const roce = getTopCardValue('ROCE');
        const bookValue = getTopCardValue('Book Value');
        const dividendYield = getTopCardValue('Dividend Yield');
        const faceValue = getTopCardValue('Face Value');
        const marketCap = getTopCardValue('Market Cap');
        const currentPrice = getTopCardValue('Current Price');

        // Top Card - for fallback values (logged-in users get these)
        // Field names must match EXACTLY what Screener shows
        const topCardROA = getTopCardValue('Return on assets');
        const topCardROAPrevYear = getTopCardValue('ROA Prev Yr');
        const topCardAssetTurnover = getTopCardValue('Asset Turnover');
        const topCardDebtToEquity = getTopCardValue('Debt to equity');
        const topCardCurrentRatio = getTopCardValue('Current ratio');
        const topCardPEGRatio = getTopCardValue('PEG Ratio');

        // Top Card - shareholder data (logged-in feature)
        const numShareholders = getTopCardValue('No. of Share Holders');
        const numShareholdersPrevYear = getTopCardValue('No. of Share Holders 1Yr');

        // Screener's Piotroski (for verification - we use our own calculation)
        const screenerPiotroski = getTopCardValue('Piotroski score');

        // ===== CUSTOM SCREENER RATIOS (logged-in users only) =====
        // These provide more accurate values than our calculations
        // Non-logged-in users will get calculated fallbacks

        // Interest Coverage (hard to calculate - needs EBIT)
        const topCardInterestCoverage = getTopCardValue('Interest Coverage');

        // Free Cash Flow data
        const topCardFCF = getTopCardValue('Free Cash Flow');
        const topCardFCFPrevYear = getTopCardValue('FCF Prev Ann');
        const topCardPriceToFCF = getTopCardValue('CMP / FCF');

        // ROIC - Return on Invested Capital (better than ROE)
        const topCardROIC = getTopCardValue('ROIC');

        // Graham Number (for Graham score verification)
        const topCardGrahamNumber = getTopCardValue('Graham Number');

        // P&L Data (historical years)
        const sales = getTableRowData('#profit-loss', 'sales');
        const netProfit = getTableRowData('#profit-loss', 'net profit');
        const opmPercent = getTableRowData('#profit-loss', 'opm');
        const eps = getTableRowData('#profit-loss', 'eps in rs');
        const dividendPayout = getTableRowData('#profit-loss', 'dividend payout');

        // Balance Sheet Data
        const borrowings = getTableRowData('#balance-sheet', 'borrowings');
        const equityCapital = getTableRowData('#balance-sheet', 'equity capital');
        const reserves = getTableRowData('#balance-sheet', 'reserves');
        const totalAssets = getTableRowData('#balance-sheet', 'total assets');
        const totalLiabilities = getTableRowData('#balance-sheet', 'total liabilities');
        const otherAssets = getTableRowData('#balance-sheet', 'other assets');
        const otherLiabilities = getTableRowData('#balance-sheet', 'other liabilities');

        // Cash Flow Data
        const cfo = getTableRowData('#cash-flow', 'cash from operating activity');
        const cfi = getTableRowData('#cash-flow', 'cash from investing activity');
        const cff = getTableRowData('#cash-flow', 'cash from financing activity');

        // Growth Rates from ranges-table
        const profitGrowth10Y = getGrowthRate('profit', '10 years');
        const profitGrowth5Y = getGrowthRate('profit', '5 years');
        const profitGrowth3Y = getGrowthRate('profit', '3 years');
        const salesGrowth10Y = getGrowthRate('sales', '10 years');
        const salesGrowth5Y = getGrowthRate('sales', '5 years');
        const salesGrowth3Y = getGrowthRate('sales', '3 years');

        // Industry P/E
        const industryPE = getIndustryPE();

        // Current Ratio from Ratios section
        const currentRatioFromRatios = getCurrentRatio();

        // ===== CALCULATE DERIVED METRICS =====
        // Strategy: Calculate first, fallback to top-ratios if calculation fails

        // Use totalAssets or totalLiabilities (they should be equal)
        const assets = totalAssets.length > 0 ? totalAssets : totalLiabilities;

        const latestBorrowings = borrowings[borrowings.length - 1] || 0;
        const latestEquityCapital = equityCapital[equityCapital.length - 1] || 0;
        const latestReserves = reserves[reserves.length - 1] || 0;
        const latestEquity = latestEquityCapital + latestReserves;

        // Debt to Equity: Screener first, calculate as fallback
        const calculatedDebtToEquity = latestEquity > 0 ? latestBorrowings / latestEquity : null;
        const debtToEquity = topCardDebtToEquity !== null ? topCardDebtToEquity : calculatedDebtToEquity;

        const latestAssets = assets[assets.length - 1] || 0;
        const latestProfit = netProfit[netProfit.length - 1] || 0;
        const prevProfit = netProfit[netProfit.length - 2] || 0;
        const prevAssets = assets[assets.length - 2] || 0;

        // ROA: Screener first, calculate as fallback
        const calculatedROA = latestAssets > 0 ? (latestProfit / latestAssets) * 100 : null;
        const roa = topCardROA !== null ? topCardROA : calculatedROA;

        // ROA Previous Year: Screener first, calculate as fallback
        const calculatedROAPrevYear = prevAssets > 0 ? (prevProfit / prevAssets) * 100 : null;
        const roaPrevYear = topCardROAPrevYear !== null ? topCardROAPrevYear : calculatedROAPrevYear;

        const latestSales = sales[sales.length - 1] || 0;

        // Asset Turnover: Screener first, calculate as fallback
        const calculatedAssetTurnover = latestAssets > 0 ? latestSales / latestAssets : null;
        const assetTurnover = topCardAssetTurnover !== null ? topCardAssetTurnover : calculatedAssetTurnover;

        const latestCFO = cfo[cfo.length - 1] || 0;
        const latestCFI = cfi[cfi.length - 1] || 0;

        // ===== FCF and related (Screener first, calculate as fallback) =====
        // FCF = CFO - CapEx (CapEx is usually part of CFI, which is negative)
        const calculatedFCF = latestCFO + latestCFI; // Our calculation
        const fcf = topCardFCF !== null ? topCardFCF : calculatedFCF;
        const fcfPrevYear = topCardFCFPrevYear; // Only available from Screener

        // Price to FCF: Screener first, calculate as fallback
        const calculatedPriceToFCF = (marketCap && fcf && fcf > 0) ? marketCap / fcf : null;
        const priceToFCF = topCardPriceToFCF !== null ? topCardPriceToFCF : calculatedPriceToFCF;

        const latestEPS = eps[eps.length - 1] || 0;

        // PEG Ratio: Screener first, calculate as fallback
        // Use 5Y profit growth as proxy for EPS growth
        const calculatedPegRatio = (stockPE && profitGrowth5Y && profitGrowth5Y > 0)
            ? stockPE / profitGrowth5Y : null;
        const pegRatio = topCardPEGRatio !== null ? topCardPEGRatio : calculatedPegRatio;

        const priceToBook = (currentPrice && bookValue && bookValue > 0)
            ? currentPrice / bookValue : null;

        // Graham Number: Screener first, calculate as fallback
        // Formula: sqrt(22.5 * EPS * Book Value)
        const calculatedGrahamNumber = (latestEPS > 0 && bookValue > 0)
            ? Math.sqrt(22.5 * latestEPS * bookValue) : null;
        const grahamNumber = topCardGrahamNumber !== null ? topCardGrahamNumber : calculatedGrahamNumber;

        // ROIC: Screener only (hard to calculate accurately without invested capital)
        // Fallback: Use ROCE as proxy
        const roic = topCardROIC !== null ? topCardROIC : roce;

        // Interest Coverage: Screener only (needs EBIT which we don't have directly)
        // Fallback: Approximate using Operating Profit / Interest
        const latestInterest = getTableRowData('#profit-loss', 'interest');
        const latestOPM = opmPercent[opmPercent.length - 1] || 0;
        const operatingProfit = latestSales * (latestOPM / 100);
        const latestInterestValue = latestInterest[latestInterest.length - 1] || 0;
        const calculatedInterestCoverage = latestInterestValue > 0 ? operatingProfit / latestInterestValue : null;
        const interestCoverage = topCardInterestCoverage !== null ? topCardInterestCoverage : calculatedInterestCoverage;

        // Current Ratio: Screener/Ratios first, calculate as fallback
        const latestOtherAssets = otherAssets[otherAssets.length - 1] || 0;
        const latestOtherLiabilities = otherLiabilities[otherLiabilities.length - 1] || 0;
        const calculatedCurrentRatio = latestOtherLiabilities > 0
            ? latestOtherAssets / latestOtherLiabilities : null;
        const currentRatio = topCardCurrentRatio !== null ? topCardCurrentRatio : (currentRatioFromRatios || calculatedCurrentRatio);

        return {
            // Basic Info from Top Card
            stockPE,
            roe,
            roce,
            bookValue,
            dividendYield,
            marketCap,
            currentPrice,
            industryPE,

            // Calculated Ratios (Screener first, calculation fallback)
            debtToEquity,
            roa,
            roaPrevYear,  // For Piotroski YoY comparison
            assetTurnover,
            currentRatio,
            pegRatio,
            priceToBook,

            // Custom Screener Ratios (logged-in: Screener values, else: calculated)
            fcf,                 // Free Cash Flow
            fcfPrevYear,         // FCF previous year (Screener only)
            priceToFCF,          // Price to Free Cash Flow
            grahamNumber,        // Graham Number
            roic,                // Return on Invested Capital
            interestCoverage,    // Interest Coverage Ratio

            // Growth Rates (from ranges-table)
            profitGrowth10Y,
            profitGrowth5Y,
            profitGrowth3Y,
            salesGrowth10Y,
            salesGrowth5Y,
            salesGrowth3Y,
            epsGrowth: profitGrowth5Y, // Use profit growth as proxy

            // Shareholder data (logged-in feature)
            numShareholders,
            numShareholdersPrevYear,

            // Screener's Piotroski (for verification - we use our own calculation)
            screenerPiotroski,

            // Historical Data (arrays - oldest to newest)
            historical: {
                sales,
                netProfit,
                opmPercent,
                eps,
                dividendPayout,
                borrowings,
                equityCapital,
                reserves,
                totalAssets: assets,
                cfo,
                cfi,
                cff,
                otherAssets,
                otherLiabilities
            },

            // Latest values for quick access
            latestEPS,
            latestNetProfit: latestProfit,
            latestCFO,
            latestBorrowings,
            latestEquity,

            // Debug info
            _debug: {
                rowsFound: {
                    sales: sales.length,
                    netProfit: netProfit.length,
                    borrowings: borrowings.length,
                    cfo: cfo.length
                },
                // Top-card values for verification (compare with calculated)
                topCardValues: {
                    roa: topCardROA,
                    roaPrevYear: topCardROAPrevYear,
                    assetTurnover: topCardAssetTurnover,
                    debtToEquity: topCardDebtToEquity,
                    currentRatio: topCardCurrentRatio,
                    pegRatio: topCardPEGRatio
                },
                // Our calculated values (for comparison)
                calculatedValues: {
                    roa: calculatedROA,
                    roaPrevYear: calculatedROAPrevYear,
                    assetTurnover: calculatedAssetTurnover,
                    debtToEquity: calculatedDebtToEquity,
                    currentRatio: calculatedCurrentRatio,
                    pegRatio: calculatedPegRatio
                }
            }
        };
    });

    console.log(`📊 Extracted comprehensive data:`, JSON.stringify(data, null, 2));

    // Take screenshot
    let screenshotPath = "";
    try {
        screenshotPath = path.join(SCREENSHOTS_DIR, `company-page-${stockName.toLowerCase()}.png`);
        await page.screenshot({
            path: screenshotPath,
            fullPage: true
        });
        console.log(`📸 Company page screenshot saved as: screenshots/company-page-${stockName.toLowerCase()}.png`);
    } catch (error) {
        console.log(`❌ Could not save screenshot: ${error.message}`);
    }

    await browser.close();
    return { url: companyUrl, data, screenshotPath: screenshotPath };
}

module.exports = fetchStockData;
