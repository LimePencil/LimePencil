const { execFile } = require('node:child_process');
const { mkdtemp, rename, rm } = require('node:fs/promises');
const { join } = require('node:path');
const { promisify } = require('node:util');
const { chromium } = require('playwright');
const { fetchStats } = require('./github');
const { renderHtml } = require('./template');

const execFileAsync = promisify(execFile);

async function main() {
    console.log('Fetching stats from GitHub...');
    const stats = await fetchStats();
    const html = renderHtml(stats);

    const outputDirectory = process.cwd();
    const temporaryDirectory = await mkdtemp(join(outputDirectory, '.tui-profile-'));
    const visibleFrame = join(temporaryDirectory, 'cursor-visible.png');
    const hiddenFrame = join(temporaryDirectory, 'cursor-hidden.png');
    const temporaryGif = join(temporaryDirectory, 'tui-profile.gif');

    try {
        console.log('Capturing cursor frames...');
        const browser = await chromium.launch({
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        try {
            const page = await browser.newPage({
                viewport: { width: 900, height: 1200 },
                deviceScaleFactor: 2
            });
            await page.setContent(html, { waitUntil: 'networkidle' });

            const widget = page.locator('#capture');
            await widget.screenshot({ path: visibleFrame });
            await page.locator('#cursor').evaluate(cursor => {
                cursor.style.visibility = 'hidden';
            });
            await widget.screenshot({ path: hiddenFrame });
        } finally {
            await browser.close();
        }

        await execFileAsync('python3', [
            join(__dirname, 'encode-gif.py'),
            visibleFrame,
            hiddenFrame,
            temporaryGif
        ]);
        await rename(temporaryGif, join(outputDirectory, 'tui-profile.gif'));
        console.log('Successfully generated tui-profile.gif');
    } finally {
        await rm(temporaryDirectory, { recursive: true, force: true });
    }
}

main().catch(error => {
    console.error('Failed to generate GIF:', error);
    process.exitCode = 1;
});
