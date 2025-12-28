const puppeteer = require('puppeteer');
const { SCREENER_SEARCH_URL, LOGIN } = require('./config');
const fs = require('fs');
const path = require('path');

// Import the functions we need to test
const fetchStockData = require('./fetchData');

async function testFreshLogin() {
  console.log('🧪 Testing fresh login process...');
  
  // Remove cookies file to force fresh login
  const COOKIES_FILE = path.join(__dirname, 'screener_cookies.json');
  if (fs.existsSync(COOKIES_FILE)) {
    fs.unlinkSync(COOKIES_FILE);
    console.log('🗑️ Removed existing cookies');
  }
  
  // Clear any browser cache/data by using a fresh user data directory
  const browser = await puppeteer.launch({
    headless: true,
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
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
      '--single-process',
      '--incognito' // Use incognito mode to ensure fresh session
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
  
  try {
    console.log('🌐 Going to Screener.in without any cookies...');
    await page.goto('https://www.screener.in', { waitUntil: 'networkidle2', timeout: 30000 });
    await page.waitForTimeout(2000);
    
    // Check initial login status (should be false)
    const initialLoginStatus = await page.evaluate(() => {
      // Look for login indicators
      const hasLogoutLink = !!document.querySelector('a[href*="logout"]');
      const hasUserMenu = !!document.querySelector('.user-menu, .profile-menu');
      const hasSessionCookie = document.cookie.includes('sessionid=');
      
      console.log('Initial check - logout link:', hasLogoutLink);
      console.log('Initial check - user menu:', hasUserMenu);
      console.log('Initial check - session cookie:', hasSessionCookie);
      
      return hasLogoutLink || hasUserMenu || hasSessionCookie;
    });
    
    console.log(`🔍 Initial login status (should be false): ${initialLoginStatus}`);
    
    if (initialLoginStatus) {
      console.log('⚠️ Already appears to be logged in somehow');
    } else {
      console.log('✅ Confirmed not logged in initially');
    }
    
    await browser.close();
    
    // Now test our fetchStockData function which should handle login
    console.log('🔄 Testing fetchStockData with fresh state...');
    const result = await fetchStockData('TATAMOTORS');
    
    if (result && result.data) {
      console.log('✅ Fresh login test successful!');
      console.log('📊 Sample data retrieved:', {
        roe: result.data.roe,
        pe_ratio: result.data.pe_ratio,
        debt_to_equity: result.data.debt_to_equity
      });
      
      // Check if cookies were saved
      if (fs.existsSync(COOKIES_FILE)) {
        console.log('✅ Cookies were saved for future use');
        const cookies = JSON.parse(fs.readFileSync(COOKIES_FILE, 'utf8'));
        console.log(`💾 Saved ${cookies.length} cookies for session persistence`);
      } else {
        console.log('⚠️ No cookies were saved');
      }
      
    } else {
      console.log('❌ Fresh login test failed - no data retrieved');
    }
    
  } catch (error) {
    console.log(`❌ Test error: ${error.message}`);
    await browser.close();
  }
}

// Run the test
testFreshLogin();
