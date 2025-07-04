const puppeteer = require('puppeteer');
const { SCREENER_SEARCH_URL, LOGIN } = require('./config');
const fs = require('fs');
const path = require('path');

// Validate credentials on startup
function validateCredentials() {
  if (!LOGIN.email || !LOGIN.password) {
    console.log('⚠️  Warning: Screener.in credentials not found in environment variables');
    console.log('   Please set SCREENER_EMAIL and SCREENER_PASSWORD in your .env file');
    console.log('   Some data fields may be unavailable without login');
    return false;
  }
  return true;
}

// Path to store cookies for session persistence
const COOKIES_FILE = path.join(__dirname, 'screener_cookies.json');

// Create screenshots directory if it doesn't exist
const SCREENSHOTS_DIR = path.join(__dirname, 'screenshots');
if (!fs.existsSync(SCREENSHOTS_DIR)) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
  console.log('📁 Created screenshots directory');
}

async function saveCookies(page) {
  const cookies = await page.cookies();
  fs.writeFileSync(COOKIES_FILE, JSON.stringify(cookies, null, 2));
  console.log('💾 Cookies saved for session persistence');
}

async function loadCookies(page) {
  if (fs.existsSync(COOKIES_FILE)) {
    const cookies = JSON.parse(fs.readFileSync(COOKIES_FILE, 'utf8'));
    await page.setCookie(...cookies);
    console.log('📂 Cookies loaded from previous session');
    return true;
  }
  return false;
}

async function checkIfLoggedIn(page) {
  try {
    // Check if user is logged in by looking for logout button or user menu
    const isLoggedIn = await page.evaluate(() => {
      return !!document.querySelector('a[href*="logout"], .user-menu, .profile-menu, [data-testid="user-menu"]');
    });
    return isLoggedIn;
  } catch (error) {
    return false;
  }
}

async function loginToScreener(page) {
  console.log('🔐 Attempting to login to Screener.in...');
  
  // Check if credentials are available
  if (!validateCredentials()) {
    console.log('❌ Cannot login: Missing credentials in environment variables');
    return false;
  }
  
  try {
    // Go to login page
    await page.goto('https://www.screener.in/login/', { waitUntil: 'networkidle2', timeout: 30000 });
    console.log('📄 Login page loaded');
    
    // Wait for page to load using a proper selector instead of waitForTimeout
    try {
      await page.waitForSelector('body', { timeout: 5000 });
    } catch (e) {
      console.log('Page load timeout, continuing...');
    }
    
    // Debug: Print page title and URL
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
      'input[type="text"]' // Sometimes email fields are just text inputs
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
      // Debug: Take a screenshot to see what's on the page
      await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'login-page.png') });
      console.log('📸 Screenshot saved as screenshots/login-page.png');
      return false;
    }
    
    // Clear and type email
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
    
    // Clear and type password
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
    
    // Wait for login to complete - wait for redirect or success indicator
    try {
      // Wait for either redirect to main page or success message
      await Promise.race([
        page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 10000 }),
        page.waitForSelector('.success-message, .error-message, .alert', { timeout: 10000 })
      ]);
    } catch (e) {
      console.log('Navigation timeout, checking login status...');
    }
    
    // Additional wait for page to settle
    try {
      await page.waitForSelector('body', { timeout: 5000 });
    } catch (e) {
      // Continue anyway
    }
    
    // Check if login was successful
    const isLoggedIn = await checkIfLoggedIn(page);
    if (isLoggedIn) {
      console.log('✅ Login successful!');
      await saveCookies(page);
      return true;
    } else {
      console.log('❌ Login failed - check credentials');
      // Debug: Take a screenshot to see what happened
      await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'login-result.png') });
      console.log('📸 Login result screenshot saved as screenshots/login-result.png');
      return false;
    }
    
  } catch (error) {
    console.log(`❌ Login error: ${error.message}`);
    // Debug: Take a screenshot on error
    try {
      await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'login-error.png') });
      console.log('📸 Error screenshot saved as screenshots/login-error.png');
    } catch (e) {
      console.log('Could not save error screenshot');
    }
    return false;
  }
}

async function fetchStockData(stockName, directUrl = null) {
  console.log(`🔍 Searching for stock: ${stockName}`);
  
  // Validate credentials at startup
  validateCredentials();
  
  // Advanced anti-bot evasion setup for Docker environment
  const browser = await puppeteer.launch({
    headless: true, // Use headless mode in Docker
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
  
  // Set modern user-agent and viewport
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36');
  await page.setViewport({ width: 1280, height: 800 });
  
  // Hide webdriver property
  await page.evaluateOnNewDocument(() => {
    Object.defineProperty(navigator, 'webdriver', { get: () => false });
    Object.defineProperty(navigator, 'plugins', { get: () => [1, 2, 3, 4, 5] });
    Object.defineProperty(navigator, 'languages', { get: () => ['en-US', 'en'] });
  });
  
  // Load cookies and check login status
  const hasCookies = await loadCookies(page);
  
  // Go to main page to check login status
  await page.goto('https://www.screener.in', { waitUntil: 'networkidle2', timeout: 30000 });
  
  let isLoggedIn = await checkIfLoggedIn(page);
  
  // If not logged in, attempt login
  if (!isLoggedIn) {
    console.log('🔐 User not logged in, attempting login...');
    isLoggedIn = await loginToScreener(page);
    
    // If login was successful, go back to main page to verify
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
  
  // Use direct URL if provided, otherwise build URL using company name
  let companyUrl = null;
  
  if (directUrl) {
    // Use the direct URL provided from frontend
    companyUrl = `https://www.screener.in/${directUrl}`;
    console.log(`📊 Using direct URL: ${companyUrl}`);
  } else {
    // Build company URL using Screener.in format
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
  
  // Wait for the company page to load
  try {
    await page.waitForSelector('body', { timeout: 15000 });
  } catch (error) {
    console.log('❌ Company page did not load properly');
    await browser.close();
    return null;
  }

  // Extract financial data from summary cards and fallback to table
  const data = await page.evaluate((isLoggedIn) => {
    function getSummaryValue(label) {
      // Try to find in summary cards
      const summaryCards = Array.from(document.querySelectorAll('.company-ratios li, .company-ratios__item, .flex.flex-column.gap-8 li'));
      for (const card of summaryCards) {
        const name = card.querySelector('.name, .company-ratios__label, span')?.textContent?.trim();
        if (name && name.toLowerCase().includes(label.toLowerCase())) {
          const value = card.querySelector('.value, .company-ratios__value, span:last-child')?.textContent?.replace(/[^0-9.\-]/g, '');
          if (value) return value;
        }
      }
      return null;
    }
    
    function getTableValue(label) {
      // Fallback to table cells
      const el = Array.from(document.querySelectorAll('td')).find(td => td.textContent.includes(label));
      return el ? el.nextElementSibling.textContent.replace(/[^0-9.\-]/g, '') : null;
    }
    
    function getAuthenticatedValue(label) {
      // For authenticated users, try to find values in premium sections
      if (!isLoggedIn) return null;
      
      // Look for premium data sections
      const premiumSections = Array.from(document.querySelectorAll('.premium-data, .authenticated-data, [data-premium="true"]'));
      for (const section of premiumSections) {
        const items = section.querySelectorAll('li, .data-item, .metric-item');
        for (const item of items) {
          const name = item.querySelector('.name, .label, .metric-name')?.textContent?.trim();
          if (name && name.toLowerCase().includes(label.toLowerCase())) {
            const value = item.querySelector('.value, .metric-value')?.textContent?.replace(/[^0-9.\-]/g, '');
            if (value) return value;
          }
        }
      }
      return null;
    }
    
    return {
      roe: parseFloat(getAuthenticatedValue('ROE') || getSummaryValue('ROE') || getTableValue('ROE')),
      pe_ratio: parseFloat(getAuthenticatedValue('P/E') || getSummaryValue('P/E') || getTableValue('P/E')),
      debt_to_equity: parseFloat(getAuthenticatedValue('Debt to equity') || getSummaryValue('Debt to equity') || getTableValue('Debt to equity')),
      roce: parseFloat(getAuthenticatedValue('ROCE') || getSummaryValue('ROCE') || getTableValue('ROCE')),
      eps_growth: parseFloat(getAuthenticatedValue('EPS Growth') || getSummaryValue('EPS Growth') || getTableValue('EPS Growth')),
      peg: parseFloat(getAuthenticatedValue('PEG Ratio') || getSummaryValue('PEG') || getTableValue('PEG')),
      eps: parseFloat(getAuthenticatedValue('EPS') || getSummaryValue('EPS') || getTableValue('EPS')),
      book_value: parseFloat(getAuthenticatedValue('Book Value') || getSummaryValue('Book Value') || getTableValue('Book Value')),
      cash_flow: parseFloat(getAuthenticatedValue('Cash Flow') || getSummaryValue('Cash Flow') || getTableValue('Cash Flow'))
    };
  }, isLoggedIn);

  console.log(`📊 Extracted data:`, data);
  
  // Take screenshot of the company page for debugging
  try {
    const screenshotPath = path.join(SCREENSHOTS_DIR, `company-page-${stockName.toLowerCase()}.png`);
    await page.screenshot({ 
      path: screenshotPath, 
      fullPage: true
    });
    console.log(`📸 Company page screenshot saved as: screenshots/company-page-${stockName.toLowerCase()}.png`);
  } catch (error) {
    console.log(`❌ Could not save screenshot: ${error.message}`);
  }
  
  await browser.close();
  return { url: companyUrl, data };
}

module.exports = fetchStockData; 