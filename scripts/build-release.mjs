#!/usr/bin/env node
import fs from 'node:fs';

import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseReleaseMarkdown, firstHighlights } from './lib/markdown.mjs';
import {
  compareVersions, sortReleases, renderReleasePage, updateIndex, releaseMarkdown,
  upsertRss, upsertLlmsLatest, updateLlmsFull, updateSitemap, updateProductJson, syncSiteLatest,
} from './lib/render.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = new Map();
for (let i = 2; i < process.argv.length; i += 1) {
  const arg = process.argv[i];
  if (arg.startsWith('--')) {
    const key = arg.slice(2);
    const value = process.argv[i + 1] && !process.argv[i + 1].startsWith('--') ? process.argv[++i] : true;
    args.set(key, value);
  }
}

const SRC = path.resolve(args.get('src') ?? path.join(ROOT, '../../FanBar/docs/releases'));
const OUT = path.resolve(args.get('out') ?? path.join(ROOT, 'dist'));
const SITE_DIR = path.join(ROOT, 'site');
const DATA = path.join(ROOT, 'data/releases.json');
const MIN_RENDER = args.get('min-render') ?? '0.8.0';
const TAG = String(args.get('tag') ?? '').replace(/^v/, '');
const TOKEN = process.env.GITHUB_TOKEN || process.env.GH_TOKEN || '';

function readCatalog() {
  return JSON.parse(fs.readFileSync(DATA, 'utf8'));
}

function writeCatalog(catalog) {
  fs.writeFileSync(DATA, `${JSON.stringify(sortReleases(catalog), null, 2)}\n`);
}

async function fetchReleases() {
  const headers = { Accept: 'application/vnd.github+json', 'User-Agent': 'fanbar-geo/1.0' };
  if (TOKEN) headers.Authorization = `Bearer ${TOKEN}`;
  const res = await fetch('https://api.github.com/repos/helson-lin/FanBar/releases?per_page=100', { headers });
  if (!res.ok) throw new Error(`GitHub releases API ${res.status}: ${await res.text()}`);
  return res.json();
}

function downloadsFromAssets(version, assets = []) {
  const expected = {
    arm64: `FanBar-v${version}-arm64.dmg`,
    x86_64: `FanBar-v${version}-x86_64.dmg`,
    universal: `FanBar-${version}.dmg`,
  };
  const out = {};
  for (const [arch, name] of Object.entries(expected)) {
    const asset = assets.find((item) => item.name === name);
    if (asset) out[arch] = { name: asset.name, size: asset.size };
  }
  return out;
}

function docsFor(version) {
  const file = path.join(SRC, `v${version}.md`);
  return fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : null;
}

async function main() {
  const catalog = readCatalog();
  const byVersion = new Map(catalog.map((release) => [release.version, release]));
  let api = [];
  try {
    api = await fetchReleases();
  } catch (error) {
    console.warn(`warning: ${error.message}; building from the checked-in catalog`);
  }

  for (const item of api) {
    const version = String(item.tag_name || '').replace(/^v/, '');
    if (!version || item.draft || item.prerelease) continue;
    const hasDocs = Boolean(docsFor(version));
    const hasPage = fs.existsSync(path.join(SITE_DIR, 'releases', version, 'index.html'));
    // Old releases that never had a website page (for example 0.4.5) stay out of the index.
    if (!hasDocs && !hasPage && compareVersions(version, MIN_RENDER) < 0) continue;
    const existing = byVersion.get(version) ?? { version, highlights: { en: [], zh: [] } };
    const markdown = docsFor(version) ?? item.body ?? '';
    const sections = parseReleaseMarkdown(markdown);
    existing.publishedAt = item.published_at || existing.publishedAt;
    existing.downloads = downloadsFromAssets(version, item.assets);
    if (sections.length) {
      existing.highlights = { en: firstHighlights(sections, 'en'), zh: firstHighlights(sections, 'zh') };
    }
    byVersion.set(version, existing);
  }

  // Versions that only exist in docs (rare) still need a timestamp for the index.
  if (fs.existsSync(SRC)) {
    for (const file of fs.readdirSync(SRC)) {
      const match = file.match(/^v(.+)\.md$/);
      if (!match) continue;
      const version = match[1];
      if (!byVersion.has(version)) {
        byVersion.set(version, {
          version,
          publishedAt: new Date().toISOString().replace(/\.\d{3}Z$/, 'Z'),
          highlights: { en: [], zh: [] },
          downloads: {},
        });
      }
    }
  }

  const allCatalog = sortReleases([...byVersion.values()]).filter((release) => {
    const page = fs.existsSync(path.join(SITE_DIR, 'releases', release.version, 'index.html'));
    return compareVersions(release.version, MIN_RENDER) >= 0 ? page || Boolean(docsFor(release.version)) : page;
  });
  const currentCatalog = TAG
    ? allCatalog.filter((release) => compareVersions(release.version, TAG) <= 0)
    : allCatalog;
  const latest = currentCatalog[0];
  if (!latest) throw new Error('no releases found');

  const rendered = [];
  for (const release of currentCatalog) {
    if (compareVersions(release.version, MIN_RENDER) < 0) continue;
    const markdown = docsFor(release.version) ?? api.find((item) => String(item.tag_name).replace(/^v/, '') === release.version)?.body;
    if (!markdown) continue;
    const sections = parseReleaseMarkdown(markdown);
    if (!sections.length) continue;
    const enriched = {
      ...release,
      sections,
      highlights: { en: firstHighlights(sections, 'en'), zh: firstHighlights(sections, 'zh') },
      publishedAt: release.publishedAt ?? new Date().toISOString().replace(/\.\d{3}Z$/, 'Z'),
    };
    rendered.push(enriched);
  }

  fs.rmSync(OUT, { recursive: true, force: true });
  fs.cpSync(SITE_DIR, OUT, { recursive: true });

  const sorted = sortReleases(currentCatalog);
  for (const release of rendered) {
    const index = sorted.findIndex((item) => item.version === release.version);
    const neighbors = {
      newer: index > 0 ? sorted[index - 1] : null,
      older: index >= 0 && index < sorted.length - 1 ? sorted[index + 1] : null,
    };
    const isLatest = release.version === latest.version;
    for (const lang of ['en', 'zh']) {
      const shell = fs.readFileSync(path.join(ROOT, `templates/release.${lang}.html`), 'utf8');
      const html = renderReleasePage({ shell, release, lang, neighbors, isLatest });
      const dir = path.join(OUT, lang === 'zh' ? 'zh/releases' : 'releases', release.version);
      fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(path.join(dir, 'index.html'), html);
      fs.mkdirSync(path.dirname(path.join(OUT, lang === 'zh' ? 'zh/releases' : 'releases', `${release.version}.md`)), { recursive: true });
      fs.writeFileSync(path.join(OUT, lang === 'zh' ? 'zh/releases' : 'releases', `${release.version}.md`), releaseMarkdown(release, lang));
    }
  }

  for (const lang of ['en', 'zh']) {
    const file = path.join(OUT, lang === 'zh' ? 'zh/releases/index.html' : 'releases/index.html');
    fs.writeFileSync(file, updateIndex(fs.readFileSync(file, 'utf8'), currentCatalog, lang));
  }

  const rssFile = path.join(OUT, 'releases.xml');
  fs.writeFileSync(rssFile, upsertRss(fs.readFileSync(rssFile, 'utf8'), rendered));

  const llmsFile = path.join(OUT, 'llms.txt');
  fs.writeFileSync(llmsFile, upsertLlmsLatest(fs.readFileSync(llmsFile, 'utf8'), currentCatalog));

  const llmsFullFile = path.join(OUT, 'llms-full.txt');
  fs.writeFileSync(llmsFullFile, updateLlmsFull(fs.readFileSync(llmsFullFile, 'utf8'), currentCatalog, rendered));

  const synced = syncSiteLatest(OUT, allCatalog, latest);

  const sitemapFile = path.join(OUT, 'sitemap.xml');
  fs.writeFileSync(sitemapFile, updateSitemap(fs.readFileSync(sitemapFile, 'utf8'), rendered, latest.publishedAt.slice(0, 10)));

  const productFile = path.join(OUT, 'api/product.json');
  fs.writeFileSync(productFile, updateProductJson(fs.readFileSync(productFile, 'utf8'), latest));

  const healthFile = path.join(OUT, 'api/health.json');
  const health = JSON.parse(fs.readFileSync(healthFile, 'utf8'));
  health.updated = latest.publishedAt.slice(0, 10);
  fs.writeFileSync(healthFile, `${JSON.stringify(health, null, 2)}\n`);

  writeCatalog(allCatalog);
  console.log(`built ${rendered.length} release page(s); latest ${latest.version}; ${currentCatalog.length} in catalog; ${synced} shared page(s) synced`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
