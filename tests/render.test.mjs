import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { parseReleaseMarkdown, firstHighlights } from '../scripts/lib/markdown.mjs';
import { renderReleasePage, releaseDescription, updateIndex } from '../scripts/lib/render.mjs';

const markdown = fs.readFileSync(new URL('./fixtures/v0.8.2.md', import.meta.url), 'utf8');
const sections = parseReleaseMarkdown(markdown);
const release = {
  version: '0.8.2',
  publishedAt: '2026-11-03T23:07:15Z',
  sections,
  highlights: { en: firstHighlights(sections, 'en'), zh: firstHighlights(sections, 'zh') },
  downloads: {
    arm64: { name: 'FanBar-v0.8.2-arm64.dmg', size: 15756913 },
    x86_64: { name: 'FanBar-v0.8.2-x86_64.dmg', size: 15837488 },
    universal: { name: 'FanBar-0.8.2.dmg', size: 18966695 },
  },
};
const shell = fs.readFileSync(new URL('../templates/release.en.html', import.meta.url), 'utf8');

test('renders a complete canonical release page', () => {
  const html = renderReleasePage({ shell, release, lang: 'en', neighbors: {}, isLatest: true });
  assert.match(html, /<title>FanBar 0\.8\.2 Release Notes<\/title>/);
  assert.match(html, /<link rel="canonical" href="https:\/\/getfanbar\.com\/releases\/0\.8\.2">/);
  assert.match(html, /"softwareVersion":"0\.8\.2"/);
  assert.match(html, /Hands the fans back to macOS/);
  assert.doesNotMatch(html, /\{\{ARTICLE\}\}/);
  assert.doesNotMatch(html, /0\.8\.0/);
});

test('uses a localized title and date', () => {
  const zhShell = fs.readFileSync(new URL('../templates/release.zh.html', import.meta.url), 'utf8');
  const html = renderReleasePage({ shell: zhShell, release, lang: 'zh', neighbors: {}, isLatest: true });
  assert.match(html, /<title>FanBar 0\.8\.2 更新说明<\/title>/);
  assert.match(html, /<time datetime="2026-11-03T23:07:15Z">2026年11月3日<\/time>/);
});

test('index puts the newest version first and marks it latest', () => {
  const indexShell = '<ol class="mt-10 border-l border-border"></ol>';
  const html = updateIndex(indexShell, [release, { ...release, version: '0.8.1', publishedAt: '2026-11-03T14:57:36Z' }], 'en');
  assert.ok(html.indexOf('FanBar 0.8.2') < html.indexOf('FanBar 0.8.1'));
  assert.match(html, /Latest/);
});

test('description carries the first highlights', () => {
  assert.match(releaseDescription(release, 'en'), /Fans no longer stop/);
});

test('syncs shared download buttons without touching release pages', async () => {
  const fs = await import('node:fs');
  const os = await import('node:os');
  const path = await import('node:path');
  const { syncSiteLatest } = await import('../scripts/lib/render.mjs');
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fanbar-sync-'));
  fs.mkdirSync(path.join(dir, 'releases/0.1.0'), { recursive: true });
  fs.writeFileSync(path.join(dir, 'releases/0.1.0/index.html'), 'historical v0.1.0 download');
  fs.writeFileSync(path.join(dir, 'index.html'), '<a href="https://github.com/helson-lin/FanBar/releases/download/v0.1.0/FanBar-0.1.0.dmg" data-track-version="0.1.0">Latest: FanBar 0.1.0</a><span>15.0 MB</span><script>{"softwareVersion":"0.1.0","dateModified":"2026-01-01T00:00:00Z"}</script>');
  const oldRelease = {
    version: '0.1.0', publishedAt: '2026-01-01T00:00:00Z',
    downloads: { universal: { name: 'FanBar-0.1.0.dmg', size: 15_000_000 } },
  };
  const newRelease = {
    version: '0.2.0', publishedAt: '2026-02-01T00:00:00Z',
    downloads: { universal: { name: 'FanBar-0.2.0.dmg', size: 16_000_000 } },
  };
  syncSiteLatest(dir, [newRelease, oldRelease], newRelease);
  const home = fs.readFileSync(path.join(dir, 'index.html'), 'utf8');
  assert.match(home, /v0\.2\.0/);
  assert.match(home, /FanBar 0\.2\.0/);
  assert.match(home, /16\.0 MB/);
  assert.match(home, /softwareVersion":"0\.2\.0"/);
  assert.equal(fs.readFileSync(path.join(dir, 'releases/0.1.0/index.html'), 'utf8'), 'historical v0.1.0 download');
  fs.rmSync(dir, { recursive: true, force: true });
});
