const { fetchStats } = require('./github');
const { renderHtml } = require('./template');
const { chromium } = require('playwright');

async function main() {
    try {
        console.log("Fetching stats from GitHub...");
        const stats = await fetchStats();
        
        console.log("Generating HTML template...");
        const html = renderHtml(stats);

        console.log("Launching headless browser...");
        const browser = await chromium.launch({
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        
        const context = await browser.newContext({
            viewport: { width: 900, height: 1200 }, // Generous height, will clip to content
            deviceScaleFactor: 2
        });
        
        const page = await context.newPage();
        await page.setContent(html, { waitUntil: 'networkidle' });
        
        const element = page.locator('#capture');
        await element.screenshot({ path: 'tui-profile.png', omitBackground: true });
        
        await browser.close();
        console.log("Successfully generated tui-profile.png");
    } catch (err) {
        console.error("Failed to generate PNG:", err);
        process.exit(1);
    }
}

main();
