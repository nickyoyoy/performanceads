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

  console.log('Starting Playwright screenshot captures for new tabbed interface...');

  // 1. Tab 1: Ringkasan Eksekutif (Desktop 1920x1080)
  {
    console.log('Capturing Tab 1: Ringkasan Eksekutif...');
    const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
    const page = await context.newPage();
    await page.goto(serverUrl, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
    const helpBtn = page.locator('button[aria-label="Informasi untuk Paid Orders"]');
    await helpBtn.hover();
    await page.waitForTimeout(300);
    await saveScreenshot(page, 'desktop-1920x1080.png', { fullPage: true });
    await context.close();
  }

  // 2. Tab 2: Tren & Rincian Kanal
  {
    console.log('Capturing Tab 2: Tren & Rincian Kanal...');
    const context = await browser.newContext({ viewport: { width: 1366, height: 768 } });
    const page = await context.newPage();
    await page.goto(serverUrl, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
    const analyticsTab = page.locator('button:has-text("Tren & Rincian Kanal")');
    await analyticsTab.click();
    await page.waitForTimeout(600);
    const barSlot = page.locator('section[aria-label="Grafik Tren Performa Iklan"] svg g.cursor-pointer').nth(13);
    await barSlot.hover();
    await page.waitForTimeout(400);
    await saveScreenshot(page, 'tab-analytics.png', { fullPage: true });
    await saveScreenshot(page, 'laptop-1366x768.png', { fullPage: false });
    await context.close();
  }

  // 3. Tab 3: Data Health & Integrasi
  {
    console.log('Capturing Tab 3: Data Health & Integrasi...');
    const context = await browser.newContext({ viewport: { width: 1366, height: 768 } });
    const page = await context.newPage();
    await page.goto(serverUrl, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
    const healthTab = page.locator('button:has-text("Data Health & Integrasi")');
    await healthTab.click();
    await page.waitForTimeout(800);
    await saveScreenshot(page, 'data-health.png', { fullPage: false });
    await context.close();
  }

  // 4. Mobile 390px
  {
    console.log('Capturing Mobile 390px with Tabs...');
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true });
    const page = await context.newPage();
    await page.goto(serverUrl, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
    await saveScreenshot(page, 'mobile-390px.png', { fullPage: false });
    await context.close();
  }

  // 5. Detail Drawer
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

  // 6. Calendar Date Range Picker Popup
  {
    console.log('Capturing Calendar Date Range Picker Popup...');
    const context = await browser.newContext({ viewport: { width: 1366, height: 768 } });
    const page = await context.newPage();
    await page.goto(serverUrl, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
    const pickerBtn = page.locator('button[aria-label="Pilih rentang tanggal dan periode"]');
    await pickerBtn.click();
    await page.waitForTimeout(600);
    await saveScreenshot(page, 'calendar-picker-popup.png');
    await context.close();
  }

  console.log('Closing browser and server...');
  await browser.close();
  await viteServer.close();
  console.log('Finished capturing all tabbed screenshots successfully!');
}

run().catch(err => {
  console.error('Screenshot script execution failed:', err);
  process.exit(1);
});
