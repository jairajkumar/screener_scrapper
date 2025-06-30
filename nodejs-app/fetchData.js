const puppeteer = require('puppeteer');
const { SCREENER_SEARCH_URL } = require('./config');

async function fetchStockData(stockName) {
  console.log(`🔍 Searching for stock: ${stockName}`);
  
  // Advanced anti-bot evasion setup
  const browser = await puppeteer.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-blink-features=AutomationControlled',
      '--disable-web-security',
      '--disable-features=VizDisplayCompositor'
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
  
  // Try direct company URL
  const directUrl = `https://www.screener.in/company/${stockName.toUpperCase()}/`;
  console.log(`📊 Trying direct URL: ${directUrl}`);
  let companyUrl = null;
  try {
    await page.goto(directUrl, { waitUntil: 'networkidle2', timeout: 30000 });
    const pageTitle = await page.title();
    console.log(`Page title: ${pageTitle}`);
    if (!pageTitle.includes('404') && !pageTitle.includes('Not Found')) {
      companyUrl = directUrl;
    }
  } catch (directError) {
    console.log(`❌ Direct URL failed: ${directError.message}`);
    await browser.close();
    return null;
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
  const data = await page.evaluate(() => {
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
    return {
      roe: parseFloat(getSummaryValue('ROE') || getTableValue('ROE')),
      pe_ratio: parseFloat(getSummaryValue('P/E') || getTableValue('P/E')),
      debt_to_equity: parseFloat(getSummaryValue('Debt to equity') || getTableValue('Debt to equity')),
      roce: parseFloat(getSummaryValue('ROCE') || getTableValue('ROCE')),
      eps_growth: parseFloat(getSummaryValue('EPS Growth') || getTableValue('EPS Growth')),
      peg: parseFloat(getSummaryValue('PEG') || getTableValue('PEG')),
      eps: parseFloat(getSummaryValue('EPS') || getTableValue('EPS')),
      book_value: parseFloat(getSummaryValue('Book Value') || getTableValue('Book Value')),
      cash_flow: parseFloat(getSummaryValue('Cash Flow') || getTableValue('Cash Flow'))
    };
  });

  console.log(`📊 Extracted data:`, data);
  await browser.close();
  return { url: companyUrl, data };
}

module.exports = fetchStockData; 