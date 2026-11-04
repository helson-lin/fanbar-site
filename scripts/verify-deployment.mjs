#!/usr/bin/env node
/**
 * Verify a deployed base URL: pages, sitemap, GEO files, and every referenced
 * same-origin image/font. Usage: node scripts/verify-deployment.mjs https://base
 */
const base = (process.argv[2] || '').replace(/\/$/, '');
if (!base) {
  console.error('usage: node scripts/verify-deployment.mjs <base-url>');
  process.exit(2);
}
const ua = 'fanbar-geo-verify/1.0';
const failures = [];
const seen = new Set();
let checkedAssets = 0;

async function get(url, { text = true } = {}) {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const res = await fetch(url, { headers: { 'User-Agent': ua }, redirect: 'follow' });
      return { status: res.status, type: res.headers.get('content-type') || '', body: text ? await res.text() : null };
    } catch (error) {
      if (attempt === 2) return { status: 0, type: '', body: null, error: error.message };
    }
  }
}

function fail(message) {
  failures.push(message);
}

const sitemap = await get(`${base}/sitemap.xml`);
if (sitemap.status !== 200) fail(`sitemap ${sitemap.status}`);
const baseOrigin = new URL(base).origin;
const pagePaths = [...new Set([...(sitemap.body || '').matchAll(/<loc>(.*?)<\/loc>/g)].map((m) => new URL(m[1]).pathname))];
const pages = pagePaths.map((pathname) => `${base}${pathname === '/' ? '/' : pathname}`);
for (const page of pages) {
  const res = await get(page);
  if (res.status !== 200) {
    fail(`page ${res.status} ${page}`);
    continue;
  }
  const addAsset = (raw) => {
    if (!raw) return;
    const url = new URL(raw, page);
    if (url.origin !== baseOrigin && url.origin !== 'https://getfanbar.com') return;
    seen.add(url.pathname);
  };
  for (const match of res.body.matchAll(/(?:src|poster|data-src)="([^"]+)"/g)) addAsset(match[1]);
  for (const match of res.body.matchAll(/(?:srcset|data-srcset|imagesrcset)="([^"]+)"/g)) {
    for (const candidate of match[1].split(',')) addAsset(candidate.trim().split(/\s+/)[0]);
  }
}
for (const pathname of seen) {
  if (!/\.(png|jpe?g|webp|avif|svg|gif|ico|woff2?)$/i.test(pathname)) continue;
  checkedAssets += 1;
  const res = await get(`${base}${pathname}`, { text: false });
  if (res.status !== 200) fail(`asset ${res.status} ${pathname}`);
}
for (const pathname of ['/llms.txt', '/llms-full.txt', '/releases.xml', '/api/product.json', '/api/health.json']) {
  const res = await get(`${base}${pathname}`);
  if (res.status !== 200) fail(`file ${res.status} ${pathname}`);
}
const product = await get(`${base}/api/product.json`);
if (product.status === 200) {
  try { JSON.parse(product.body); } catch { fail('product.json is invalid JSON'); }
}
console.log(`checked ${pages.length} pages and ${checkedAssets} assets`);
if (failures.length) {
  console.error(`verification failed (${failures.length})`);
  for (const failure of failures.slice(0, 30)) console.error(`- ${failure}`);
  process.exit(1);
}
console.log('deployment verification passed');
