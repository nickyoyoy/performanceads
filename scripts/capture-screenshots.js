import { chromium } from 'playwright';
import { createServer } from 'vite';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const OUTPUT_DIR = path.resolve(__dirname, '../screenshots');
const ARTIFACT_DIR = 'C:\\Users\\UseR\\.gemini\\antigravity\\brain\\16e85af6-467d-4f2d-a03d-c00fe56aa9a9';

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

async function saveScreenshot(page, filename, options = {}) {
  const localPath = path.join(OUTPUT_DIR, filename);
  await page.screenshot({ path: localPath, ...options });
  console.log(`Saved screenshot: ${localPath}`);

  if (fs.existsSync(ARTIFACT_DIR)) {
    const artifactPath = path.join(ARTIFACT_DIR, filename);
    fs.copyFileSync(localPath, artifactPath);
    console.log(`Copied to artifact: ${artifactPath}`);
  }
}

async function run() {
  console.log('Starting internal Vite dev server...');
  const viteServer = await createServer({
    server: { port: 3100, host: '127.0.0.1' },
  });
  await viteServer.listen();
  const serverUrl = 'http://127.0.0.1:3100';
  console.log(`Vite server running at ${serverUrl}`);

  const browser = await chromium.launch({ headless: true });

  console.log('Starting Playwright screenshot captures...');

  // 1. Desktop 1920x1080
  {
    console.log('Capturing Desktop 1920x1080...');
    const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
    const page = await context.newPage();
    await page.goto(serverUrl, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
    await saveScreenshot(page, 'desktop-1920x1080.png', { fullPage: false });
    await context.close();
  }

  // 2. Laptop 1366x768
  {
    console.log('Capturing Laptop 1366x768...');
    const context = await browser.newContext({ viewport: { width: 1366, height: 768 } });
    const page = await context.newPage();
    await page.goto(serverUrl, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
    await saveScreenshot(page, 'laptop-1366x768.png', { fullPage: false });
    await context.close();
  }

  // 3. Mobile 390px (iPhone 13 viewport)
  {
    console.log('Capturing Mobile 390px...');
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true });
    const page = await context.newPage();
    await page.goto(serverUrl, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
    await saveScreenshot(page, 'mobile-390px.png', { fullPage: false });
    await context.close();
  }

  // 4. Loading State
  {
    console.log('Capturing Loading State...');
    const context = await browser.newContext({ viewport: { width: 1366, height: 768 } });
    const page = await context.newPage();
    await page.route('**/api/sheets-csv', () => {
      // Intentionally hang response to capture loading spinner
    });
    await page.goto(serverUrl, { waitUntil: 'commit' });
    await page.waitForSelector('[role="status"]');
    await page.waitForTimeout(600);
    await saveScreenshot(page, 'loading-state.png');
    await context.close();
  }

  // 5. Fetch Error / Fallback State
  {
    console.log('Capturing Fetch Fallback State...');
    const context = await browser.newContext({ viewport: { width: 1366, height: 768 } });
    const page = await context.newPage();
    // Simulate network disconnect so fallback fixture engages
    await page.route('**/api/sheets-csv', route => route.abort());
    await page.route('https://docs.google.com/**', route => route.abort());
    await page.goto(serverUrl, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
    await saveScreenshot(page, 'fetch-error-state.png');
    await context.close();
  }

  // 6. Partial Data State
  {
    console.log('Capturing Partial Data State...');
    const context = await browser.newContext({ viewport: { width: 1366, height: 768 } });
    const page = await context.newPage();
    await page.goto(serverUrl, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
    await saveScreenshot(page, 'partial-data-state.png');
    await context.close();
  }

  // 7. Detail Drawer
  {
    console.log('Capturing Detail Drawer...');
    const context = await browser.newContext({ viewport: { width: 1366, height: 768 } });
    const page = await context.newPage();
    await page.goto(serverUrl, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
    const detailBtn = page.locator('button:has-text("Detail")').first();
    await detailBtn.click();
    await page.waitForTimeout(600);
    await saveScreenshot(page, 'detail-drawer.png');
    await context.close();
  }

  // 8. Data Health section
  {
    console.log('Capturing Data Health section...');
    const context = await browser.newContext({ viewport: { width: 1366, height: 768 } });
    const page = await context.newPage();
    await page.goto(serverUrl, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
    const healthSection = page.locator('#data-health');
    await healthSection.scrollIntoViewIfNeeded();
    await page.waitForTimeout(600);
    await saveScreenshot(page, 'data-health.png');
    await context.close();
  }

  console.log('Closing browser and server...');
  await browser.close();
  await viteServer.close();
  console.log('Finished capturing all screenshots successfully!');
}

run().catch(err => {
  console.error('Screenshot script execution failed:', err);
  process.exit(1);
});
