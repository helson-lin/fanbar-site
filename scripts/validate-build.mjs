#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { sortReleases } from './lib/render.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIST = path.join(ROOT, 'dist');
const args = new Map();
for (let i = 2; i < process.argv.length; i += 1) {
  const arg = process.argv[i];
  if (arg.startsWith('--')) {
    const key = arg.slice(2);
    const value = process.argv[i + 1] && !process.argv[i + 1].startsWith('--') ? process.argv[++i] : true;
    args.set(key, value);
  }
}

const failures = [];
const check = (condition, message) => {
  if (!condition) failures.push(message);
};

const catalog = sortReleases(JSON.parse(fs.readFileSync(path.join(ROOT, 'data/releases.json'), 'utf8')));
const version = String(args.get('version') ?? catalog[0].version);
const release = catalog.find((item) => item.version === version);
check(Boolean(release), `catalog is missing ${version}`);

const read = (file) => fs.readFileSync(path.join(DIST, file), 'utf8');
for (const lang of ['en', 'zh']) {
  const base = lang === 'zh' ? 'zh/releases' : 'releases';
  const file = `${base}/${version}/index.html`;
  check(fs.existsSync(path.join(DIST, file)), `missing ${file}`);
  const html = read(file);
  check(html.includes(`FanBar ${version} ${lang === 'zh' ? '更新说明' : 'Release Notes'}`), `${file}: wrong title`);
  check(html.includes(`rel="canonical" href="https://getfanbar.com${lang === 'zh' ? '/zh' : ''}/releases/${version}"`), `${file}: wrong canonical`);
  check(html.includes(`hreflang="zh-Hans" href="https://getfanbar.com/zh/releases/${version}"`), `${file}: missing zh hreflang`);
  check(!html.includes('{{'), `${file}: unrendered placeholder`);
  check(html.includes('application/ld+json'), `${file}: missing JSON-LD`);
  const ld = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)?.[1];
  check(Boolean(ld), `${file}: missing JSON-LD body`);
  if (ld) {
    try {
      const parsed = JSON.parse(ld.replaceAll('<\\/', '</'));
      check(parsed['@graph']?.some((node) => node['@type'] === 'TechArticle'), `${file}: missing TechArticle`);
    } catch (error) {
      failures.push(`${file}: invalid JSON-LD (${error.message})`);
    }
  }
  check(fs.existsSync(path.join(DIST, `${base}/${version}.md`)), `missing ${base}/${version}.md`);
  const md = read(`${base}/${version}.md`);
  check(md.includes(`https://getfanbar.com${lang === 'zh' ? '/zh' : ''}/releases/${version}`), `${base}/${version}.md: wrong canonical`);
}

check(read('index.html').includes(`releases/download/v${version}/`), 'homepage download button is stale');
check(read('index.html').includes(`softwareVersion\":\"${version}\"`), 'homepage softwareVersion is stale');
check(read('zh/index.html').includes(`releases/download/v${version}/`), 'Chinese homepage download button is stale');
check(read('releases/index.html').includes(`/releases/${version}`), 'release index does not link to the release');
check(read('zh/releases/index.html').includes(`/zh/releases/${version}`), 'zh release index does not link to the release');
check(read('sitemap.xml').includes(`https://getfanbar.com/releases/${version}`), 'sitemap is missing the release');
check(read('sitemap.xml').includes(`https://getfanbar.com/zh/releases/${version}`), 'sitemap is missing the Chinese release');
check(read('releases.xml').includes(`https://getfanbar.com/releases/${version}`), 'RSS is missing the release');
const rss = read('releases.xml');
check((rss.match(new RegExp(`<link>https://getfanbar.com/releases/${version.replaceAll('.', '\\.')}</link>`, 'g')) ?? []).length === 1, 'RSS has a duplicate release item');
check(read('llms.txt').includes(`https://getfanbar.com/releases/${version}`), 'llms.txt is missing the release');
check(read('llms-full.txt').includes(`## FanBar ${version} release notes`), 'llms-full.txt is missing the release');
check(JSON.parse(read('api/product.json')).latestRelease?.version === version, 'product.json latestRelease is stale');

// Every same-origin image/font referenced by the deployed HTML/CSS must exist in dist.
const assetExtensions = /\.(?:png|jpe?g|webp|avif|svg|gif|ico|woff2?)$/i;
const missingAssets = new Set();
function checkAsset(url, fromFile) {
  if (!url || /^data:|^https?:\/\/(?!getfanbar\.com)/i.test(url)) return;
  const parsed = new URL(url, `https://getfanbar.com/${fromFile.replace(/(^|\/)index\.html$/, '$1')}`);
  if (!assetExtensions.test(parsed.pathname)) return;
  const file = path.join(DIST, decodeURIComponent(parsed.pathname));
  if (!fs.existsSync(file)) missingAssets.add(`${parsed.pathname} (from ${fromFile})`);
}
function walkHtml(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) { walkHtml(file); continue; }
    const relative = path.relative(DIST, file);
    if (entry.name.endsWith('.html')) {
      const html = fs.readFileSync(file, 'utf8');
      for (const match of html.matchAll(/(?:href|src|poster|data-src)="([^"]+)"/g)) checkAsset(match[1], relative);
      for (const match of html.matchAll(/(?:srcset|data-srcset|imagesrcset)="([^"]+)"/g)) {
        for (const candidate of match[1].split(',')) checkAsset(candidate.trim().split(/\s+/)[0], relative);
      }
    } else if (entry.name.endsWith('.css')) {
      const css = fs.readFileSync(file, 'utf8');
      for (const match of css.matchAll(/url\((['"]?)([^)'"]+)\1\)/g)) checkAsset(match[2], relative);
    }
  }
}
walkHtml(DIST);
for (const missing of [...missingAssets].slice(0, 20)) failures.push(`missing asset: ${missing}`);

if (failures.length) {
  console.error(`validation failed (${failures.length})`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}
console.log(`validated ${version}: ${catalog.length} releases in catalog`);
