const puppeteer = require('puppeteer');
const { LOGIN } = require('./config');
const fs = require('fs');
const path = require('path');

async function testActualLogin() {
  console.log('🧪 Testing actual login process...');
  
  // Remove any existing cookies
  const COOKIES_FILE = path.join(__dirname, 'screener_cookies.json');
  if (fs.existsSync(COOKIES_FILE)) {
    fs.unlinkSync(COOKIES_FILE);
    console.log('🗑️ Removed existing cookies');
  }
  
  const browser = await puppeteer.launch({
    headless: true,
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36');
  
  try {
    // First check main page without login
    console.log('🌐 Checking main page without login...');
    await page.goto('https://www.screener.in', { waitUntil: 'networkidle2' });
    await page.waitForTimeout(2000);
    
    let loginStatus = await page.evaluate(() => {
      const indicators = {
        logoutLink: !!document.querySelector('a[href*="logout"], button[onclick*="logout"]'),
        userMenu: !!document.querySelector('.user-menu, .profile-menu, [data-testid="user-menu"]'),
        hasSessionCookie: document.cookie.includes('sessionid='),
        hasLoginButtons: !!document.querySelector('a[href*="login"], a[href*="sign"]')
      };
      
      console.log('Main page indicators:', indicators);
      return indicators.logoutLink || indicators.userMenu || indicators.hasSessionCookie;
    });
    
    console.log(`📊 Main page login status: ${loginStatus}`);
    
    if (loginStatus) {
      console.log('✅ Already logged in on main page');
    } else {
      console.log('❌ Not logged in, attempting login...');
      
      // Go to login page
      console.log('🔐 Going to login page...');
      await page.goto('https://www.screener.in/login/', { waitUntil: 'networkidle2' });
      await page.waitForTimeout(3000);
      
      console.log('📄 Current URL:', page.url());
      console.log('📄 Page title:', await page.title());
      
      // Find and fill login form
      const emailField = await page.$('input[name="username"]') || await page.$('input[type="email"]') || await page.$('input[type="text"]');
      const passwordField = await page.$('input[name="password"]') || await page.$('input[type="password"]');
      
      if (emailField && passwordField) {
        console.log('📝 Found login form, filling credentials...');
        
        await emailField.click();
        await emailField.type(LOGIN.email);
        console.log('📧 Email entered');
        
        await passwordField.click();
        await passwordField.type(LOGIN.password);
        console.log('🔑 Password entered');
        
        // Submit form
        const submitButton = await page.$('button[type="submit"]');
        if (submitButton) {
          console.log('🔄 Clicking submit button...');
          await submitButton.click();
        } else {
          console.log('🔄 Pressing Enter...');
          await page.keyboard.press('Enter');
        }
        
        // Wait for response
        console.log('⏳ Waiting for login response...');
        await page.waitForTimeout(5000);
        
        // Check cookies after login
        const cookies = await page.cookies();
        console.log(`🍪 Cookies after login: ${cookies.length}`);
        cookies.forEach(cookie => {
          console.log(`  - ${cookie.name}: ${cookie.value.substring(0, 20)}...`);
        });
        
        // Check final login status
        const finalStatus = await page.evaluate(() => {
          const indicators = {
            logoutLink: !!document.querySelector('a[href*="logout"], button[onclick*="logout"]'),
            userMenu: !!document.querySelector('.user-menu, .profile-menu'),
            hasSessionCookie: document.cookie.includes('sessionid='),
            currentUrl: window.location.href,
            title: document.title
          };
          return indicators;
        });
        
        console.log('🔍 Final status:', finalStatus);
        
        if (finalStatus.logoutLink || finalStatus.userMenu || finalStatus.hasSessionCookie) {
          console.log('✅ Login successful!');
          
          // Save cookies
          if (cookies.length > 0) {
            fs.writeFileSync(COOKIES_FILE, JSON.stringify(cookies, null, 2));
            console.log('💾 Cookies saved');
          }
        } else {
          console.log('❌ Login may have failed');
        }
        
      } else {
        console.log('❌ Could not find login form fields');
        console.log('Available inputs:', await page.$$eval('input', inputs => 
          inputs.map(input => ({ type: input.type, name: input.name, placeholder: input.placeholder }))
        ));
      }
    }
    
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
  }
  
  await browser.close();
}

testActualLogin();
