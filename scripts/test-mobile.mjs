#!/usr/bin/env node
/**
 * Mobile viewport audit script for Mushaf Khan | Digital Studio.
 * Audits every route at 360x640 and 390x844 for horizontal overflow,
 * undersized tap targets (<44x44px), and console/page errors.
 *
 * Usage:
 *   BASE_URL=http://localhost:3000 npm run test:mobile
 */

const BASE_URL = (process.env.BASE_URL || 'http://localhost:3000').replace(/\/$/, '');

const ROUTES = [
  '/',
  '/about',
  '/services',
  '/work',
  '/pricing',
  '/process',
  '/skills',
  '/book',
  '/contact',
  '/blog',
  '/shop',
  '/collections/studio-hardware',
  '/product/architect-felt-desk-mat',
  '/checkout',
  '/track-order',
  '/wishlist',
  '/privacy',
  '/terms',
  '/admin',
];

const VIEWPORTS = [
  { name: '360x640', width: 360, height: 640 },
  { name: '390x844', width: 390, height: 844 },
];

async function runAudit() {
  let playwright;
  try {
    playwright = await import('playwright');
  } catch {
    console.error(
      '\n[test:mobile] Playwright is not installed in this environment.\n' +
        'Run the following on your local machine to execute the mobile viewport suite:\n' +
        '  npm i -D playwright\n' +
        '  npx playwright install chromium\n' +
        '  npm run test:mobile\n'
    );
    process.exit(1);
  }

  const browser = await playwright.chromium.launch({ headless: true });
  let totalFailures = 0;

  try {
    for (const vp of VIEWPORTS) {
      console.log(`\n=== Auditing ${vp.name} ===`);
      const context = await browser.newContext({
        viewport: { width: vp.width, height: vp.height },
        deviceScaleFactor: 2,
        isMobile: true,
        hasTouch: true,
      });
      const page = await context.newPage();

      for (const route of ROUTES) {
        const errors = [];
        const onPageError = (err) => errors.push(`pageerror: ${err.message}`);
        const onConsole = (msg) => {
          if (msg.type() === 'error') {
            const text = msg.text();
            if (!text.includes('WebSocket')) errors.push(`console.error: ${text}`);
          }
        };

        page.on('pageerror', onPageError);
        page.on('console', onConsole);

        const url = `${BASE_URL}${route}`;
        await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 }).catch(async () => {
          await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
        });
        await page.waitForTimeout(450);

        const report = await page.evaluate(() => {
          const docWidth = document.documentElement.scrollWidth;
          const winWidth = window.innerWidth;
          const overflowPx = Math.max(0, docWidth - winWidth);

          const interactive = Array.from(
            document.querySelectorAll('a, button, input, select, textarea, [role="button"]')
          );
          const undersized = [];
          for (const el of interactive) {
            const rect = el.getBoundingClientRect();
            const style = window.getComputedStyle(el);
            if (
              style.display === 'none' ||
              style.visibility === 'hidden' ||
              rect.width === 0 ||
              rect.height === 0
            ) {
              continue;
            }
            // Skip inline prose anchor links inside paragraphs/lists
            if (el.tagName === 'A' && el.closest('p, li, article')) continue;
            if (rect.width < 44 || rect.height < 44) {
              const label =
                el.getAttribute('aria-label') ||
                el.textContent?.trim().slice(0, 32) ||
                el.tagName.toLowerCase();
              undersized.push({
                tag: el.tagName.toLowerCase(),
                label,
                w: Math.round(rect.width),
                h: Math.round(rect.height),
              });
            }
          }

          return {
            overflowPx,
            undersizedCount: undersized.length,
            undersizedSample: undersized.slice(0, 6),
          };
        });

        page.off('pageerror', onPageError);
        page.off('console', onConsole);

        const hasIssue = report.overflowPx > 1 || errors.length > 0;
        if (hasIssue) totalFailures += 1;

        const statusIcon = hasIssue ? 'FAIL' : 'PASS';
        console.log(
          `[${statusIcon}] ${route.padEnd(36)} overflow=${report.overflowPx}px smallTargets=${report.undersizedCount} errors=${errors.length}`
        );
        if (report.undersizedSample.length > 0) {
          for (const item of report.undersizedSample) {
            console.log(`       - <${item.tag}> "${item.label}" (${item.w}x${item.h}px)`);
          }
        }
        for (const e of errors) {
          console.log(`       ! ${e}`);
        }
      }

      await context.close();
    }
  } finally {
    await browser.close();
  }

  if (totalFailures > 0) {
    console.error(`\n[test:mobile] ${totalFailures} route check(s) failed.`);
    process.exit(1);
  }
  console.log('\n[test:mobile] All mobile viewport checks passed.');
}

runAudit().catch((err) => {
  console.error('[test:mobile] Unexpected error:', err);
  process.exit(1);
});
