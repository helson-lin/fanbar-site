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
