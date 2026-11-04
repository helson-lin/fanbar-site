import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { parseReleaseMarkdown, firstHighlights, inlineHtml, toMarkdownSections } from '../scripts/lib/markdown.mjs';

const markdown = fs.readFileSync(new URL('./fixtures/v0.8.2.md', import.meta.url), 'utf8');

test('parses bilingual sections and bullets', () => {
  const sections = parseReleaseMarkdown(markdown);
  assert.deepEqual(sections.map((section) => section.en), ['Fixes', 'Support', 'Install']);
  assert.equal(sections[0].bullets.length, 2);
  assert.equal(sections[0].bullets[0].enTitle, 'Hands the fans back to macOS even when the SMC refuses to switch them to automatic');
  assert.equal(sections[0].bullets[0].zhTitle, 'SMC 拒绝切回自动时也能把风扇交还 macOS');
});

test('derives index highlights and skips install/support sections', () => {
  const sections = parseReleaseMarkdown(markdown);
  assert.deepEqual(firstHighlights(sections, 'en'), [
    'Hands the fans back to macOS even when the SMC refuses to switch them to automatic',
    'Fans no longer stop when the hand-back fails',
  ]);
});

test('renders inline links, code, bold, and issue references', () => {
  const html = inlineHtml('**Title** — see [docs](https://example.com) and `fanbar status` (#142)');
  assert.match(html, /<strong>Title<\/strong>/);
  assert.match(html, /<a href="https:\/\/example.com" rel="nofollow">docs<\/a>/);
  assert.match(html, /<code[^>]*>fanbar status<\/code>/);
  assert.match(html, /<a href="https:\/\/github.com\/helson-lin\/FanBar\/issues\/142">#142<\/a>/);
});

test('markdown output links issue references', () => {
  const sections = parseReleaseMarkdown(markdown);
  const md = toMarkdownSections(sections);
  assert.match(md, /\(\[#142\]\(https:\/\/github.com\/helson-lin\/FanBar\/issues\/142\)\)/);
});
