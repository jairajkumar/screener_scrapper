#!/usr/bin/env node
/**
 * Screener.in Webpage Structure Analyzer
 * 
 * This script logs into Screener.in and analyzes the webpage structure
 * to identify all available data fields for logged-in users.
 * 
 * Usage: node scripts/analyze-screener-structure.js [COMPANY_SYMBOL]
 * Example: node scripts/analyze-screener-structure.js RELIANCE
 */

const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const LOGIN = {
    email: process.env.SCREENER_EMAIL,
    password: process.env.SCREENER_PASSWORD
};

const SCREENSHOTS_DIR = path.join(__dirname, '..', 'screenshots');
const OUTPUT_DIR = path.join(__dirname, '..', 'analysis');

// Create directories if they don't exist
[SCREENSHOTS_DIR, OUTPUT_DIR].forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
});

/**
 * Get Chrome executable path based on OS
 */
function getChromePath() {
    const paths = {
        darwin: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
        linux: '/usr/bin/chromium',
        win32: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
    };

    // Check for Puppeteer environment variable first
    if (process.env.PUPPETEER_EXECUTABLE_PATH) {
        return process.env.PUPPETEER_EXECUTABLE_PATH;
    }

    return paths[process.platform] || paths.linux;
}

/**
 * Login to Screener.in
 */
async function loginToScreener(page) {
    console.log('🔐 Logging into Screener.in...');

    if (!LOGIN.email || !LOGIN.password) {
        throw new Error('Missing SCREENER_EMAIL or SCREENER_PASSWORD in .env');
    }

    await page.goto('https://www.screener.in/login/', { waitUntil: 'networkidle2', timeout: 30000 });

    // Enter email
    const emailField = await page.$('input[name="username"], input[type="email"], input[type="text"]');
    if (!emailField) throw new Error('Could not find email field');
    await emailField.type(LOGIN.email);

    // Enter password
    const passwordField = await page.$('input[type="password"]');
    if (!passwordField) throw new Error('Could not find password field');
    await passwordField.type(LOGIN.password);

    // Click login button
    const submitButton = await page.$('button[type="submit"], input[type="submit"]');
    if (submitButton) {
        await submitButton.click();
    } else {
        await page.keyboard.press('Enter');
    }

    // Wait for navigation
    try {
        await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 });
    } catch (e) {
        console.log('Navigation timeout, checking login status anyway...');
    }

    // More robust login verification - check multiple indicators
    const isLoggedIn = await page.evaluate(() => {
        // Check for logout link
        if (document.querySelector('a[href*="logout"]')) return true;
        // Check for user menu/profile elements
        if (document.querySelector('.user-menu, .profile-menu, .user-info')) return true;
        // Check for "My Screens" or account-specific elements
        if (document.querySelector('a[href*="screens"], a[href*="watchlist"]')) return true;
        // Check if login button is gone (we're no longer on login page)
        const isOnLoginPage = window.location.href.includes('/login/');
        if (!isOnLoginPage) return true;
        return false;
    });

    if (!isLoggedIn) {
        await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'login-failed.png') });
        throw new Error('Login failed - check credentials');
    }

    console.log('✅ Login successful!');
    return true;
}

/**
 * Analyze the complete webpage structure
 */
async function analyzePageStructure(page, companySymbol) {
    const companyUrl = `https://www.screener.in/company/${companySymbol}/`;
    console.log(`\n📊 Analyzing: ${companyUrl}`);

    await page.goto(companyUrl, { waitUntil: 'networkidle2', timeout: 30000 });

    // Take full page screenshot
    await page.screenshot({
        path: path.join(SCREENSHOTS_DIR, `analysis-${companySymbol.toLowerCase()}.png`),
        fullPage: true
    });
    console.log(`📸 Screenshot saved: analysis-${companySymbol.toLowerCase()}.png`);

    // Extract comprehensive page structure
    const structure = await page.evaluate(() => {
        const result = {
            pageTitle: document.title,
            url: window.location.href,
            timestamp: new Date().toISOString(),
            sections: [],
            tables: [],
            ratioCards: [],
            dataFields: {},
            rawHTML: {}
        };

        // ===== 1. TOP RATIOS SECTION =====
        const topRatios = document.querySelector('#top-ratios');
        if (topRatios) {
            const ratios = [];
            topRatios.querySelectorAll('li').forEach(li => {
                const name = li.querySelector('.name')?.textContent?.trim();
                const value = li.querySelector('.value, .number')?.textContent?.trim();
                if (name) {
                    ratios.push({ name, value });
                }
            });
            result.ratioCards.push({ section: 'top-ratios', ratios });
            result.rawHTML['top-ratios'] = topRatios.innerHTML;
        }

        // ===== 2. COMPANY INFO SECTION =====
        const companyInfo = document.querySelector('.company-info, #company-info');
        if (companyInfo) {
            result.dataFields.companyInfo = companyInfo.textContent?.trim();
            result.rawHTML['company-info'] = companyInfo.innerHTML;
        }

        // ===== 3. ALL MAJOR SECTIONS =====
        const sectionIds = [
            '#quarters', '#profit-loss', '#balance-sheet', '#cash-flow',
            '#ratios', '#shareholding', '#peers', '#documents', '#announcements',
            '#annual-report', '#concalls', '#screener-rating'
        ];

        sectionIds.forEach(sectionId => {
            const section = document.querySelector(sectionId);
            if (section) {
                const sectionData = {
                    id: sectionId,
                    title: section.querySelector('h2, h3, .section-heading')?.textContent?.trim(),
                    hasTable: !!section.querySelector('table'),
                    tableHeaders: [],
                    tableRowLabels: [],
                    dataPoints: []
                };

                // Extract table structure
                const table = section.querySelector('table');
                if (table) {
                    // Get headers
                    table.querySelectorAll('thead th, thead td').forEach(th => {
                        sectionData.tableHeaders.push(th.textContent?.trim());
                    });

                    // Get row labels (first column of each row)
                    table.querySelectorAll('tbody tr').forEach(tr => {
                        const firstCell = tr.querySelector('td:first-child, td.text');
                        if (firstCell) {
                            sectionData.tableRowLabels.push(firstCell.textContent?.trim());
                        }
                    });
                }

                result.sections.push(sectionData);
                result.rawHTML[sectionId] = section.innerHTML;
            }
        });

        // ===== 4. RANGES TABLES (Growth Rates) =====
        document.querySelectorAll('table.ranges-table').forEach((table, idx) => {
            const tableData = {
                index: idx,
                header: table.querySelector('th')?.textContent?.trim(),
                rows: []
            };

            table.querySelectorAll('tbody tr').forEach(tr => {
                const cells = tr.querySelectorAll('td');
                if (cells.length >= 2) {
                    tableData.rows.push({
                        label: cells[0]?.textContent?.trim(),
                        value: cells[1]?.textContent?.trim()
                    });
                }
            });

            result.tables.push(tableData);
        });

        // ===== 5. PROS AND CONS (Premium Feature) =====
        const prosSection = document.querySelector('.pros, #pros');
        const consSection = document.querySelector('.cons, #cons');

        if (prosSection || consSection) {
            result.dataFields.prosAndCons = {
                pros: prosSection ? Array.from(prosSection.querySelectorAll('li')).map(li => li.textContent?.trim()) : [],
                cons: consSection ? Array.from(consSection.querySelectorAll('li')).map(li => li.textContent?.trim()) : []
            };
            if (prosSection) result.rawHTML['pros'] = prosSection.innerHTML;
            if (consSection) result.rawHTML['cons'] = consSection.innerHTML;
        }

        // ===== 6. CONCALL TRANSCRIPTS (Premium Feature) =====
        const concalls = document.querySelector('#concalls, .concalls-section');
        if (concalls) {
            result.dataFields.concalls = {
                available: true,
                links: Array.from(concalls.querySelectorAll('a')).map(a => ({
                    text: a.textContent?.trim(),
                    href: a.href
                }))
            };
            result.rawHTML['concalls'] = concalls.innerHTML;
        }

        // ===== 7. PRICE CHART DATA =====
        const chartSection = document.querySelector('#chart, .chart-container');
        if (chartSection) {
            result.dataFields.chartAvailable = true;
            // Charts are usually rendered via JavaScript, so we capture the container
            result.rawHTML['chart'] = chartSection.outerHTML;
        }

        // ===== 8. PEER COMPARISON (Premium Data) =====
        const peersSection = document.querySelector('#peers');
        if (peersSection) {
            const peersTable = peersSection.querySelector('table');
            if (peersTable) {
                const peerHeaders = Array.from(peersTable.querySelectorAll('thead th')).map(th => th.textContent?.trim());
                const peerRows = [];

                peersTable.querySelectorAll('tbody tr').forEach(tr => {
                    const cells = Array.from(tr.querySelectorAll('td')).map(td => td.textContent?.trim());
                    peerRows.push(cells);
                });

                result.dataFields.peers = {
                    headers: peerHeaders,
                    companies: peerRows
                };
            }
        }

        // ===== 9. DETAILED RATIOS (Premium) =====
        const ratiosSection = document.querySelector('#ratios');
        if (ratiosSection) {
            const ratioTable = ratiosSection.querySelector('table');
            if (ratioTable) {
                const ratioData = [];
                ratioTable.querySelectorAll('tbody tr').forEach(tr => {
                    const label = tr.querySelector('td:first-child')?.textContent?.trim();
                    const values = Array.from(tr.querySelectorAll('td')).slice(1).map(td => td.textContent?.trim());
                    if (label) {
                        ratioData.push({ label, values });
                    }
                });
                result.dataFields.detailedRatios = ratioData;
            }
        }

        // ===== 10. SHAREHOLDING PATTERN =====
        const shareholdingSection = document.querySelector('#shareholding');
        if (shareholdingSection) {
            const shTable = shareholdingSection.querySelector('table');
            if (shTable) {
                const shData = [];
                shTable.querySelectorAll('tbody tr').forEach(tr => {
                    const label = tr.querySelector('td:first-child')?.textContent?.trim();
                    const values = Array.from(tr.querySelectorAll('td')).slice(1).map(td => td.textContent?.trim());
                    if (label) {
                        shData.push({ label, values });
                    }
                });
                result.dataFields.shareholding = shData;
            }
        }

        // ===== 11. ALL CSS CLASSES (for future selectors) =====
        const allClasses = new Set();
        document.querySelectorAll('*').forEach(el => {
            el.classList.forEach(cls => allClasses.add(cls));
        });
        result.cssClasses = Array.from(allClasses).sort();

        // ===== 12. ALL IDs (for future selectors) =====
        const allIds = [];
        document.querySelectorAll('[id]').forEach(el => {
            allIds.push(el.id);
        });
        result.elementIds = allIds.sort();

        return result;
    });

    return structure;
}

/**
 * Generate analysis report
 */
function generateReport(structure, companySymbol) {
    const reportPath = path.join(OUTPUT_DIR, `${companySymbol.toLowerCase()}-structure.json`);
    fs.writeFileSync(reportPath, JSON.stringify(structure, null, 2));
    console.log(`\n📄 Full structure saved: ${reportPath}`);

    // Generate human-readable summary
    const summaryPath = path.join(OUTPUT_DIR, `${companySymbol.toLowerCase()}-summary.md`);
    let summary = `# Screener.in Structure Analysis: ${companySymbol}\n\n`;
    summary += `**Analyzed at:** ${structure.timestamp}\n`;
    summary += `**URL:** ${structure.url}\n\n`;

    summary += `## Available Sections\n\n`;
    structure.sections.forEach(section => {
        summary += `### ${section.id}\n`;
        summary += `- **Title:** ${section.title || 'N/A'}\n`;
        summary += `- **Has Table:** ${section.hasTable}\n`;
        if (section.tableHeaders.length > 0) {
            summary += `- **Headers:** ${section.tableHeaders.join(', ')}\n`;
        }
        if (section.tableRowLabels.length > 0) {
            summary += `- **Row Labels:** ${section.tableRowLabels.slice(0, 10).join(', ')}${section.tableRowLabels.length > 10 ? '...' : ''}\n`;
        }
        summary += '\n';
    });

    summary += `## Growth Rate Tables\n\n`;
    structure.tables.forEach(table => {
        summary += `### ${table.header || `Table ${table.index}`}\n`;
        table.rows.forEach(row => {
            summary += `- ${row.label}: ${row.value}\n`;
        });
        summary += '\n';
    });

    summary += `## Top Ratio Cards\n\n`;
    structure.ratioCards.forEach(card => {
        card.ratios.forEach(ratio => {
            summary += `- **${ratio.name}:** ${ratio.value}\n`;
        });
    });

    if (structure.dataFields.prosAndCons) {
        summary += `\n## Pros and Cons (Logged-In Feature)\n\n`;
        summary += `### Pros\n`;
        structure.dataFields.prosAndCons.pros.forEach(pro => {
            summary += `- ${pro}\n`;
        });
        summary += `\n### Cons\n`;
        structure.dataFields.prosAndCons.cons.forEach(con => {
            summary += `- ${con}\n`;
        });
    }

    if (structure.dataFields.peers) {
        summary += `\n## Peer Comparison (${structure.dataFields.peers.companies.length} peers)\n\n`;
        summary += `**Columns:** ${structure.dataFields.peers.headers.join(' | ')}\n`;
    }

    summary += `\n## All Element IDs\n\n`;
    summary += structure.elementIds.join(', ');

    fs.writeFileSync(summaryPath, summary);
    console.log(`📝 Summary saved: ${summaryPath}`);

    return { reportPath, summaryPath };
}

/**
 * Main function
 */
async function main() {
    const companySymbol = process.argv[2] || 'RELIANCE';

    console.log('='.repeat(60));
    console.log('  Screener.in Webpage Structure Analyzer');
    console.log('='.repeat(60));
    console.log(`\n🎯 Target Company: ${companySymbol}\n`);

    const browser = await puppeteer.launch({
        headless: true,
        executablePath: getChromePath(),
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-gpu'
        ]
    });

    try {
        const page = await browser.newPage();
        await page.setViewport({ width: 1920, height: 1080 });
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36');

        // Login
        await loginToScreener(page);

        // Analyze page structure
        const structure = await analyzePageStructure(page, companySymbol);

        // Generate reports
        const { reportPath, summaryPath } = generateReport(structure, companySymbol);

        console.log('\n' + '='.repeat(60));
        console.log('  Analysis Complete!');
        console.log('='.repeat(60));
        console.log(`\n📊 Key Findings:`);
        console.log(`   - Sections found: ${structure.sections.length}`);
        console.log(`   - Growth tables: ${structure.tables.length}`);
        console.log(`   - Top ratios: ${structure.ratioCards[0]?.ratios.length || 0}`);
        console.log(`   - Element IDs: ${structure.elementIds.length}`);
        console.log(`   - CSS Classes: ${structure.cssClasses.length}`);

        if (structure.dataFields.prosAndCons) {
            console.log(`   - Pros/Cons: ✅ Available (${structure.dataFields.prosAndCons.pros.length} pros, ${structure.dataFields.prosAndCons.cons.length} cons)`);
        }
        if (structure.dataFields.peers) {
            console.log(`   - Peer Comparison: ✅ ${structure.dataFields.peers.companies.length} peers`);
        }
        if (structure.dataFields.concalls) {
            console.log(`   - Concall Transcripts: ✅ ${structure.dataFields.concalls.links.length} available`);
        }

        console.log(`\n📁 Output Files:`);
        console.log(`   - ${reportPath}`);
        console.log(`   - ${summaryPath}`);

    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    } finally {
        await browser.close();
    }
}

main().catch(console.error);
