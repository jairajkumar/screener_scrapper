const puppeteer = require('puppeteer');

async function debugCookies() {
  console.log('🍪 Debugging cookie situation...');
  
  const browser = await puppeteer.launch({
    headless: true,
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  
  console.log('🌐 Going to Screener.in...');
  await page.goto('https://www.screener.in', { waitUntil: 'networkidle2' });
  await page.waitForTimeout(2000);
  
  // Get all cookies
  const allCookies = await page.cookies();
  console.log(`📊 Total cookies found: ${allCookies.length}`);
  
  if (allCookies.length > 0) {
    console.log('🍪 All cookies:');
    allCookies.forEach(cookie => {
      console.log(`  - ${cookie.name}: ${cookie.value.substring(0, 20)}... (domain: ${cookie.domain})`);
    });
  } else {
    console.log('⚠️ No cookies found');
  }
  
  // Check what our current filter would select
  const relevantCookies = allCookies.filter(cookie => {
    const isRelevant = cookie.name.includes('session') || 
                      cookie.name.includes('csrf') || 
                      cookie.name.includes('auth') ||
                      cookie.name.includes('login') ||
                      cookie.domain.includes('screener.in');
    return isRelevant;
  });
  
  console.log(`🎯 Relevant cookies (our filter): ${relevantCookies.length}`);
  relevantCookies.forEach(cookie => {
    console.log(`  - ${cookie.name}: ${cookie.value.substring(0, 20)}... (domain: ${cookie.domain})`);
  });
  
  // Check login status
  const loginStatus = await page.evaluate(() => {
    const indicators = {
      hasLogoutLink: !!document.querySelector('a[href*="logout"], button[onclick*="logout"]'),
      hasUserMenu: !!document.querySelector('.user-menu, .profile-menu, [data-testid="user-menu"], .navbar-user, .user-profile'),
      hasAuthSections: !!document.querySelector('.authenticated, .user-section, .account-menu, .premium-user'),
      notOnLoginPage: !window.location.href.includes('/login'),
      noLoginForm: !document.querySelector('form[action*="login"], input[name="password"][type="password"]'),
      hasUserContent: !!document.querySelector('.watchlist, .portfolio, .my-stocks, [data-user]'),
      hasSessionCookie: document.cookie.includes('sessionid=') && document.cookie.includes('csrftoken='),
      premiumFeatures: !!document.querySelector('.premium, .pro-user, .authenticated-user, [data-premium="true"]'),
      titleCheck: !document.title.toLowerCase().includes('login') && !document.title.toLowerCase().includes('sign in')
    };
    
    return {
      indicators,
      title: document.title,
      url: window.location.href,
      cookies: document.cookie
    };
  });
  
  console.log('🔍 Login status analysis:');
  console.log('  Title:', loginStatus.title);
  console.log('  URL:', loginStatus.url);
  console.log('  Browser cookies:', loginStatus.cookies);
  console.log('  Indicators:', loginStatus.indicators);
  
  await browser.close();
}

debugCookies();
