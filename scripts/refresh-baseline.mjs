#!/usr/bin/env node
/**
 * Refresh the checked-in site snapshot and page templates from the live site.
 * Run this after a deliberate design change, then commit site/ and templates/.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SITE = 'https://getfanbar.com';
const OUT = path.join(ROOT, 'site');
const TMP = path.join(ROOT, '.site-refresh');
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/130 Safari/537.36';
const seen = new Set();
const queue = [];
let pending = 0;

function add(url) {
  if (!url.startsWith(SITE)) return;
  const clean = url.split('#')[0];
  if (seen.has(clean)) return;
  seen.add(clean);
  queue.push(clean);
}

function savePath(url, type) {
  const pathname = new URL(url).pathname;
  if (type.includes('text/html')) {
    return pathname === '/' ? 'index.html' : `${pathname.replace(/^\/|\/$/g, '')}/index.html`;
  }
  return pathname === '/' ? 'index.html' : pathname.replace(/^\//, '');
}

async function fetchText(url) {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const res = await fetch(url, { headers: { 'User-Agent': UA, Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8' } });
      if (!res.ok) throw new Error(`${res.status} ${url}`);
      return { body: Buffer.from(await res.arrayBuffer()), type: res.headers.get('content-type') ?? '' };
    } catch (error) {
      if (attempt === 2) {
        console.warn(`skip ${url}: ${error.message}`);
        return null;
      }
    }
  }
  return null;
}

async function work(url) {
  const result = await fetchText(url);
  if (!result) return;
  const file = path.join(TMP, savePath(url, result.type));
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, result.body);
  const text = result.body.toString('utf8');
  if (result.type.includes('text/html')) {
    for (const match of text.matchAll(/(?:href|src)="([^"]+)"/g)) add(new URL(match[1], url).href);
    for (const match of text.matchAll(/<meta[^>]+content="(https:\/\/getfanbar\.com[^"]+)"/g)) add(match[1]);
  } else if (/\.(txt|md|xml|json)$/.test(new URL(url).pathname)) {
    for (const match of text.matchAll(/https:\/\/getfanbar\.com[^\s)"'<>,`]+/g)) add(match[0].replace(/[.,;]+$/, ''));
  }
}

async function run() {
  const sitemap = await fetchText(`${SITE}/sitemap.xml`);
  const seeds = ['/', '/robots.txt', '/sitemap.xml', '/llms.txt', '/llms-full.txt', '/releases.xml', '/openapi.json', '/api/product.json', '/api/health.json', '/.well-known/api-catalog', '/releases', '/zh/releases'];
  for (const url of seeds) add(`${SITE}${url}`);
  if (sitemap) {
    for (const match of sitemap.body.toString('utf8').matchAll(/<loc>(.*?)<\/loc>/g)) add(match[1]);
  }
  fs.rmSync(TMP, { recursive: true, force: true });
  while (queue.length || pending) {
    const batch = queue.splice(0, 10);
    if (!batch.length) {
      await new Promise((resolve) => setTimeout(resolve, 100));
      continue;
    }
    pending += batch.length;
    await Promise.all(batch.map((url) => work(url).finally(() => { pending -= 1; })));
  }
  fs.rmSync(OUT, { recursive: true, force: true });
  fs.renameSync(TMP, OUT);

  const versions = fs.readdirSync(path.join(OUT, 'releases'))
    .filter((name) => /^\d+\.\d+\.\d+$/.test(name) && fs.existsSync(path.join(OUT, 'releases', name, 'index.html')))
    .sort((a, b) => {
      const pa = a.split('.').map(Number);
      const pb = b.split('.').map(Number);
      for (let i = 0; i < 3; i += 1) if (pa[i] !== pb[i]) return pb[i] - pa[i];
      return 0;
    });
  const templateVersion = versions[0];
  for (const lang of ['en', 'zh']) {
    const page = fs.readFileSync(path.join(OUT, lang === 'zh' ? `zh/releases/${templateVersion}/index.html` : `releases/${templateVersion}/index.html`), 'utf8');
    const start = page.indexOf('<article');
    const end = page.indexOf('</article>') + '</article>'.length;
    fs.writeFileSync(path.join(ROOT, `templates/release.${lang}.html`), `${page.slice(0, start)}{{ARTICLE}}${page.slice(end)}`);
  }
  console.log(`refreshed ${seen.size} URL(s) into site/ and templates/`);
}

run().catch((error) => { console.error(error); process.exit(1); });
