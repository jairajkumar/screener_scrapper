const puppeteer = require('puppeteer');

async function testConnection() {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  try {
    await page.goto('https://www.google.com');
    await page.waitForSelector('input[name="q"]', { timeout: 10000 });
    console.log('✅ Google loaded successfully!');
  } catch (e) {
    console.error('❌ Could not load Google:', e);
  }
  await browser.close();
}

testConnection(); 