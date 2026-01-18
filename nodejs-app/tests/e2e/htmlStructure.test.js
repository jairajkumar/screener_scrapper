/**
 * HTML Structure Monitoring Tests
 * 
 * These tests verify that Screener.in's HTML structure hasn't changed.
 * If any of these tests fail, it means the scraper selectors need updating.
 * 
 * Run with: npm run test:html
 */

const puppeteer = require('puppeteer-core');
const { criticalSelectors, expectedRowLabels } = require('../mocks/sampleData');

// Test company - should always exist on Screener.in
const TEST_COMPANY_URL = 'https://www.screener.in/company/PETRONET/';

describe('Screener.in HTML Structure Monitoring', () => {
    let browser;
    let page;

    beforeAll(async () => {
        // Get Chrome path based on OS
        const getChromePath = () => {
            if (process.platform === 'darwin') {
                return '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
            } else if (process.platform === 'linux') {
                return '/usr/bin/chromium';
            }
            return 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
        };

        browser = await puppeteer.launch({
            headless: 'new',
            executablePath: getChromePath(),
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });

        page = await browser.newPage();
        await page.goto(TEST_COMPANY_URL, { waitUntil: 'networkidle2', timeout: 60000 });
    });

    afterAll(async () => {
        if (browser) await browser.close();
    });

    describe('Critical Section Existence', () => {
        test('Top Ratios section (#top-ratios) exists', async () => {
            const section = await page.$('#top-ratios');
            expect(section).not.toBeNull();
        });

        test('Profit & Loss section (#profit-loss) exists', async () => {
            const section = await page.$('#profit-loss');
            expect(section).not.toBeNull();
        });

        test('Balance Sheet section (#balance-sheet) exists', async () => {
            const section = await page.$('#balance-sheet');
            expect(section).not.toBeNull();
        });

        test('Cash Flow section (#cash-flow) exists', async () => {
            const section = await page.$('#cash-flow');
            expect(section).not.toBeNull();
        });

        test('Peers section (#peers) exists', async () => {
            const section = await page.$('#peers');
            expect(section).not.toBeNull();
        });

        test('Growth table (table.ranges-table) exists', async () => {
            const tables = await page.$$('table.ranges-table');
            expect(tables.length).toBeGreaterThan(0);
        });
    });

    describe('Top Ratios Structure', () => {
        test('has list items with .name and .value elements', async () => {
            const items = await page.evaluate(() => {
                const lis = document.querySelectorAll('#top-ratios li');
                return Array.from(lis).map(li => ({
                    hasName: li.querySelector('.name') !== null,
                    hasValue: li.querySelector('.value, .number') !== null
                }));
            });

            expect(items.length).toBeGreaterThan(5);
            expect(items.every(item => item.hasName)).toBe(true);
        });

        test('contains required ratios', async () => {
            const ratioNames = await page.evaluate(() => {
                const lis = document.querySelectorAll('#top-ratios li');
                return Array.from(lis).map(li =>
                    li.querySelector('.name')?.textContent?.trim().toLowerCase()
                );
            });

            const requiredRatios = ['stock p/e', 'roe', 'roce', 'book value'];
            requiredRatios.forEach(ratio => {
                expect(ratioNames.some(name => name?.includes(ratio))).toBe(true);
            });
        });
    });

    describe('Profit & Loss Table Structure', () => {
        test('has table rows with labels', async () => {
            const rows = await page.$$('#profit-loss table tbody tr');
            expect(rows.length).toBeGreaterThan(5);
        });

        test('contains required row labels', async () => {
            const labels = await page.evaluate(() => {
                const rows = document.querySelectorAll('#profit-loss table tbody tr');
                return Array.from(rows).map(row =>
                    row.querySelector('td:first-child')?.textContent?.trim().toLowerCase()
                ).filter(Boolean);
            });

            const requiredLabels = ['sales', 'net profit', 'opm', 'eps'];
            requiredLabels.forEach(required => {
                const found = labels.some(label => label.startsWith(required));
                expect(found).toBe(true);
            });
        });
    });

    describe('Balance Sheet Table Structure', () => {
        test('has table rows with labels', async () => {
            const rows = await page.$$('#balance-sheet table tbody tr');
            expect(rows.length).toBeGreaterThan(5);
        });

        test('contains required row labels', async () => {
            const labels = await page.evaluate(() => {
                const rows = document.querySelectorAll('#balance-sheet table tbody tr');
                return Array.from(rows).map(row =>
                    row.querySelector('td:first-child')?.textContent?.trim().toLowerCase()
                ).filter(Boolean);
            });

            const requiredLabels = ['equity capital', 'reserves', 'borrowings', 'total'];
            requiredLabels.forEach(required => {
                const found = labels.some(label => label.includes(required));
                expect(found).toBe(true);
            });
        });
    });

    describe('Cash Flow Table Structure', () => {
        test('has table rows with labels', async () => {
            const rows = await page.$$('#cash-flow table tbody tr');
            expect(rows.length).toBeGreaterThan(2);
        });

        test('contains required row labels', async () => {
            const labels = await page.evaluate(() => {
                const rows = document.querySelectorAll('#cash-flow table tbody tr');
                return Array.from(rows).map(row =>
                    row.querySelector('td:first-child')?.textContent?.trim().toLowerCase()
                ).filter(Boolean);
            });

            const requiredLabels = ['cash from operating', 'cash from investing'];
            requiredLabels.forEach(required => {
                const found = labels.some(label => label.includes(required));
                expect(found).toBe(true);
            });
        });
    });

    describe('Growth Table Structure', () => {
        test('has ranges-table with growth data', async () => {
            const growthData = await page.evaluate(() => {
                const tables = document.querySelectorAll('table.ranges-table');
                const results = [];

                tables.forEach(table => {
                    const header = table.querySelector('th');
                    if (header && header.textContent.toLowerCase().includes('growth')) {
                        results.push({
                            header: header.textContent.trim(),
                            rows: table.querySelectorAll('tbody tr').length
                        });
                    }
                });

                return results;
            });

            expect(growthData.length).toBeGreaterThan(0);

            // Check for profit growth table
            const profitGrowth = growthData.find(t => t.header.toLowerCase().includes('profit'));
            expect(profitGrowth).toBeDefined();
        });

        test('growth table contains 5 Years row', async () => {
            const has5Years = await page.evaluate(() => {
                const tables = document.querySelectorAll('table.ranges-table');
                for (const table of tables) {
                    const text = table.textContent.toLowerCase();
                    if (text.includes('profit') && text.includes('5 years')) {
                        return true;
                    }
                }
                return false;
            });

            expect(has5Years).toBe(true);
        });
    });

    describe('Data Extraction Validation', () => {
        test('can extract Stock P/E value', async () => {
            const pe = await page.evaluate(() => {
                const items = document.querySelectorAll('#top-ratios li');
                for (const item of items) {
                    const name = item.querySelector('.name')?.textContent?.trim().toLowerCase();
                    if (name === 'stock p/e') {
                        return item.querySelector('.value, .number')?.textContent?.trim();
                    }
                }
                return null;
            });

            expect(pe).not.toBeNull();
            expect(parseFloat(pe)).toBeGreaterThan(0);
        });

        test('can extract 5Y Profit Growth', async () => {
            const growth = await page.evaluate(() => {
                const tables = document.querySelectorAll('table.ranges-table');
                for (const table of tables) {
                    const header = table.querySelector('th');
                    if (header && header.textContent.toLowerCase().includes('profit')) {
                        const rows = table.querySelectorAll('tbody tr');
                        for (const row of rows) {
                            const cells = row.querySelectorAll('td');
                            if (cells.length >= 2 && cells[0].textContent.includes('5 Years')) {
                                return cells[1].textContent.trim();
                            }
                        }
                    }
                }
                return null;
            });

            expect(growth).not.toBeNull();
        });
    });
});
