import fs from 'node:fs';
import { escapeHtml, inlineHtml, inlineMarkdown, sectionId, toHtmlSections, toMarkdownSections } from './markdown.mjs';

export const SITE = 'https://getfanbar.com';
export const REPO = 'https://github.com/helson-lin/FanBar';

const DOWNLOAD_ARROW = '<svg xmlns="http://www.w3.org/2000/svg" stroke-width="2" width="24" height="24" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" fill="none" viewBox="0 0 24 24" aria-hidden="true" class="lucide lucide-download h-4 w-4 shrink-0 text-muted-foreground group-hover:text-accent"><path d="M12 15V3"></path><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><path d="m7 10 5 5 5-5"></path></svg>';
const EXTERNAL = '<svg xmlns="http://www.w3.org/2000/svg" stroke-width="2" width="24" height="24" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" fill="none" viewBox="0 0 24 24" aria-hidden="true" class="lucide lucide-external-link h-3.5 w-3.5"><path d="M15 3h6v6"></path><path d="M10 14 21 3"></path><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path></svg>';
const ARROW_RIGHT = '<svg xmlns="http://www.w3.org/2000/svg" stroke-width="2" width="24" height="24" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" fill="none" viewBox="0 0 24 24" aria-hidden="true" class="lucide lucide-arrow-right h-4 w-4"><path d="M5 12h14"></path><path d="m12 5 7 7-7 7"></path></svg>';
const ARROW_LEFT_SM = '<svg xmlns="http://www.w3.org/2000/svg" stroke-width="2" width="24" height="24" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" fill="none" viewBox="0 0 24 24" aria-hidden="true" class="lucide lucide-arrow-left h-3.5 w-3.5"><path d="m12 19-7-7 7-7"></path><path d="M19 12H5"></path></svg>';
const ARROW_RIGHT_SM = '<svg xmlns="http://www.w3.org/2000/svg" stroke-width="2" width="24" height="24" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" fill="none" viewBox="0 0 24 24" aria-hidden="true" class="lucide lucide-arrow-right h-3.5 w-3.5"><path d="M5 12h14"></path><path d="m12 5 7 7-7 7"></path></svg>';

export function compareVersions(a, b) {
  const pa = String(a).split('.').map(Number);
  const pb = String(b).split('.').map(Number);
  const n = Math.max(pa.length, pb.length);
  for (let i = 0; i < n; i += 1) {
    const diff = (pa[i] || 0) - (pb[i] || 0);
    if (diff !== 0) return diff;
  }
  return 0;
}

export function sortReleases(releases) {
  return [...releases].sort((a, b) => compareVersions(b.version, a.version));
}

export function formatDateEn(iso) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC',
  }).format(new Date(iso));
}

export function formatDateZh(iso) {
  const d = new Date(iso);
  return `${d.getUTCFullYear()}年${d.getUTCMonth() + 1}月${d.getUTCDate()}日`;
}

export function formatRfc822(iso) {
  return new Date(iso).toUTCString();
}

export function releaseDescription(release, lang) {
  const highlights = release.highlights?.[lang] ?? [];
  const titles = highlights.slice(0, 3).join(lang === 'zh' ? '；' : '; ');
  if (lang === 'zh') {
    return titles
      ? `FanBar ${release.version} 更新内容：${titles}。查看完整说明与下载。`
      : `FanBar ${release.version} 更新说明、下载与校验信息。`;
  }
  return titles
    ? `What's new in FanBar ${release.version}: ${titles}. Full release notes and downloads.`
    : `FanBar ${release.version} release notes, downloads, and checksums.`;
}

function bestHighlight(release, lang) {
  const list = release.highlights?.[lang] ?? [];
  return list.slice(0, 3).join(lang === 'zh' ? '；' : '; ');
}

function downloadList(release, lang) {
  const rows = [];
  for (const arch of ['arm64', 'x86_64', 'universal']) {
    const asset = release.downloads?.[arch];
    if (!asset?.name) continue;
    const label = arch === 'arm64' ? 'Apple Silicon' : arch === 'x86_64' ? 'Intel' : 'Universal';
    const size = Number.isFinite(asset.size) ? ` / ${(asset.size / 1_000_000).toFixed(1)} MB` : '';
    const url = `${REPO}/releases/download/v${release.version}/${asset.name}`;
    rows.push(`<li><a href="${url}" download="${escapeHtml(asset.name)}" data-track-event="download-dmg" data-track-location="release-note" data-track-locale="${lang}" data-track-architecture="${arch}" data-track-version="${release.version}" class="group flex min-h-12 items-center justify-between gap-4 py-3"><span class="min-w-0"><span class="block text-[15px] font-medium group-hover:text-accent">${label}</span><span class="block break-words font-mono text-xs text-muted-foreground">${escapeHtml(asset.name)}${size}</span></span>${DOWNLOAD_ARROW}</a></li>`);
  }
  return rows.join('');
}

function downloadSection(release, lang) {
  const rows = downloadList(release, lang);
  if (!rows) return '';
  const zh = lang === 'zh';
  const title = zh ? '下载' : 'Downloads';
  const note = zh
    ? '不确定选哪个？Universal 版本适用于所有支持的 Mac。每个文件在 GitHub 上都有对应的 .sha256 校验文件。'
    : 'Not sure which one? Universal runs on every supported Mac. Each file has a matching .sha256 checksum on GitHub.';
  const installed = zh
    ? '已经安装？FanBar 每天自动检查更新，也可以运行'
    : 'Already installed? FanBar checks for updates daily, or run';
  const github = zh ? '在 GitHub 查看' : 'View on GitHub';
  return `<section class="mt-14 rounded-xl border border-border bg-card p-6 sm:p-7" aria-labelledby="downloads"><h2 id="downloads" class="text-lg font-semibold">${title}</h2><ul class="mt-4 divide-y divide-border">${rows}</ul><p class="mt-4 text-sm leading-relaxed text-muted-foreground">${note}</p><p class="mt-3 text-sm leading-relaxed text-muted-foreground">${installed} <code class="rounded bg-muted px-1.5 py-0.5 font-mono text-[13px] text-foreground">brew upgrade --cask helson-lin/fanbar/fanbar</code></p><a href="${REPO}/releases/tag/v${release.version}" target="_blank" rel="noopener noreferrer" class="mt-4 inline-flex min-h-11 items-center gap-1.5 text-sm font-medium text-accent hover:underline">${github}${EXTERNAL}</a></section>`;
}

function neighborNav(release, neighbors, lang) {
  const newer = neighbors?.newer;
  const older = neighbors?.older;
  const newerHtml = newer
    ? `<a href="${lang === 'zh' ? '/zh' : ''}/releases/${newer.version}" class="group flex min-h-16 flex-col justify-center rounded-xl border border-border px-5 py-3 hover:border-foreground"><span class="inline-flex items-center gap-1.5 text-xs text-muted-foreground">${ARROW_LEFT_SM}${lang === 'zh' ? '较新版本' : 'Newer'}</span><span class="mt-1 text-[15px] font-medium">FanBar ${newer.version}</span></a>`
    : '<span class="hidden sm:block"></span>';
  const olderHtml = older
    ? `<a href="${lang === 'zh' ? '/zh' : ''}/releases/${older.version}" class="group flex min-h-16 flex-col items-end justify-center rounded-xl border border-border px-5 py-3 text-right hover:border-foreground"><span class="inline-flex items-center gap-1.5 text-xs text-muted-foreground">${lang === 'zh' ? '较旧版本' : 'Older'}${ARROW_RIGHT_SM}</span><span class="mt-1 text-[15px] font-medium">FanBar ${older.version}</span></a>`
    : '';
  return `<nav aria-label="${lang === 'zh' ? '全部更新日志' : 'All release notes'}" class="mt-12 grid gap-3 sm:grid-cols-2">${newerHtml}${olderHtml}</nav>`;
}

export function renderArticle(release, lang, { neighbors, isLatest } = {}) {
  const zh = lang === 'zh';
  const base = zh ? '/zh' : '';
  const date = zh ? formatDateZh(release.publishedAt) : formatDateEn(release.publishedAt);
  const latest = isLatest ? `<span> · ${zh ? '最新版本' : 'Latest'}</span>` : '';
  const sections = toHtmlSections(release.sections, lang);
  const breadcrumb = `<nav aria-label="Breadcrumb" class="text-sm text-muted-foreground"><ol class="flex flex-wrap items-center gap-2"><li><a href="${base || '/'}" class="transition-colors hover:text-foreground">FanBar</a></li><li aria-hidden="true">/</li><li><a href="${base}/releases" class="transition-colors hover:text-foreground">${zh ? '更新日志' : 'Release notes'}</a></li><li aria-hidden="true">/</li><li aria-current="page" class="text-foreground">${release.version}</li></ol></nav>`;
  const header = `<header class="mt-10"><h1 class="font-display text-[2.6rem] leading-[1.1] tracking-[-0.02em] sm:text-5xl">FanBar ${release.version}</h1><p class="mt-4 text-muted-foreground ${zh ? 'text-sm' : 'font-mono text-xs uppercase tracking-[0.08em]'}"><time datetime="${release.publishedAt}">${date}</time>${latest}</p></header>`;
  const all = `<a href="${base}/releases" class="mt-6 inline-flex min-h-11 items-center gap-1.5 text-sm font-medium text-accent hover:underline">${zh ? '全部更新日志' : 'All release notes'}${ARROW_RIGHT}</a>`;
  return `<article class="mx-auto max-w-[44rem] px-6 pt-14 pb-20 sm:px-8 md:pt-20">${breadcrumb}${header}<div class="article-body mt-10">${sections}</div>${downloadSection(release, lang)}${neighborNav(release, neighbors, lang)}${all}</article>`;
}

function jsonLd(release, lang) {
  const zh = lang === 'zh';
  const canonical = `${SITE}${zh ? '/zh' : ''}/releases/${release.version}`;
  const tagUrl = `${REPO}/releases/tag/v${release.version}`;
  const description = releaseDescription(release, lang);
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'TechArticle',
        '@id': `${canonical}#article`,
        headline: `FanBar ${release.version}`,
        description,
        datePublished: release.publishedAt,
        dateModified: release.publishedAt,
        inLanguage: zh ? 'zh-Hans' : 'en',
        mainEntityOfPage: canonical,
        author: { '@id': `${SITE}/#publisher` },
        publisher: { '@id': `${SITE}/#publisher` },
        about: {
          '@type': 'SoftwareApplication',
          name: 'FanBar',
          softwareVersion: release.version,
          operatingSystem: 'macOS 11 or later',
          applicationCategory: 'UtilitiesApplication',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
          downloadUrl: tagUrl,
        },
        isBasedOn: tagUrl,
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'FanBar', item: zh ? `${SITE}/zh` : SITE },
          { '@type': 'ListItem', position: 2, name: zh ? '更新日志' : 'Release notes', item: `${SITE}${zh ? '/zh' : ''}/releases` },
          { '@type': 'ListItem', position: 3, name: `FanBar ${release.version}`, item: canonical },
        ],
      },
    ],
  };
}

/**
 * The page shell is captured from the live 0.8.0 page. All version-specific
 * head fields and the article are replaced; shared nav, styles, and footer stay.
 */
export function renderReleasePage({ shell, release, lang, neighbors, isLatest }) {
  const zh = lang === 'zh';
  const base = zh ? '/zh' : '';
  const canonical = `${SITE}${base}/releases/${release.version}`;
  const description = releaseDescription(release, lang);
  const title = zh ? `FanBar ${release.version} 更新说明` : `FanBar ${release.version} Release Notes`;
  // The shell is refreshed from the live site, so derive its version/date instead of
  // assuming the 0.8.0 snapshot that the templates were originally cut from.
  const shellVersion = shell.match(/\/releases\/([^"/]+)"/)?.[1] ?? '0.8.0';
  const shellDate = shell.match(/article:published_time" content="([^"]+)"/)?.[1];

  let html = shell;
  html = html.replaceAll(`/zh/releases/${shellVersion}`, `/zh/releases/${release.version}`);
  html = html.replaceAll(`/releases/${shellVersion}`, `/releases/${release.version}`);
  html = html.replaceAll(shellVersion, release.version);
  if (shellDate) html = html.replaceAll(shellDate, release.publishedAt);
  html = html.replaceAll('November 2, 2026', formatDateEn(release.publishedAt));
  html = html.replaceAll('2026年11月2日', formatDateZh(release.publishedAt));

  html = html.replace(/<title>[\s\S]*?<\/title>/, `<title>${escapeHtml(title)}</title>`);
  html = html.replace(/<meta name="description" content="[^"]*">/, `<meta name="description" content="${escapeHtml(description)}">`);
  html = html.replace(/<meta name="keywords" content="[^"]*">/, `<meta name="keywords" content="FanBar ${release.version}, ${zh ? 'FanBar 更新' : 'FanBar release notes'}">`);
  html = html.replace(/<meta property="og:title" content="[^"]*">/, `<meta property="og:title" content="${escapeHtml(title)}">`);
  html = html.replace(/<meta property="og:description" content="[^"]*">/, `<meta property="og:description" content="${escapeHtml(description)}">`);
  html = html.replace(/<meta name="twitter:title" content="[^"]*">/, `<meta name="twitter:title" content="${escapeHtml(title)}">`);
  html = html.replace(/<meta name="twitter:description" content="[^"]*">/, `<meta name="twitter:description" content="${escapeHtml(description)}">`);
  html = html.replace(/<link rel="alternate" type="text\/markdown" href="[^"]*">/, `<link rel="alternate" type="text/markdown" href="${canonical}.md">`);
  html = html.replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/, `<script type="application/ld+json">${JSON.stringify(jsonLd(release, lang)).replaceAll('</', '<\\/')}</script>`);
  html = html.replace('{{ARTICLE}}', renderArticle(release, lang, { neighbors, isLatest }));
  return html;
}

export function renderIndexList(catalog, lang) {
  const zh = lang === 'zh';
  const sorted = sortReleases(catalog);
  return sorted.map((release, index) => {
    const latest = index === 0;
    const href = `${zh ? '/zh' : ''}/releases/${release.version}`;
    const date = zh ? formatDateZh(release.publishedAt) : formatDateEn(release.publishedAt);
    const highlights = (release.highlights?.[lang] ?? []).map((item) => `<li>${escapeHtml(item)}</li>`).join('');
    return `<li class="relative pb-10 pl-7 last:pb-0"><span class="absolute top-2 -left-[5px] h-[9px] w-[9px] rounded-full border-2 border-background ${latest ? 'bg-accent' : 'bg-border'}" aria-hidden="true"></span><p class="text-muted-foreground ${zh ? 'text-sm' : 'font-mono text-xs uppercase tracking-[0.08em]'}"><time datetime="${release.publishedAt}">${date}</time>${latest ? `<span class="ml-2 text-accent">${zh ? '最新版本' : 'Latest'}</span>` : ''}</p><h2 class="mt-1.5 text-xl font-semibold tracking-[-0.01em]"><a href="${href}" data-track-event="view-release-notes" data-track-location="release-index" data-track-locale="${lang}" data-track-version="${release.version}" class="hover:text-accent">FanBar ${release.version}</a></h2>${highlights ? `<ul class="mt-3 space-y-1.5 text-[15px] leading-relaxed text-muted-foreground">${highlights}</ul>` : ''}<a href="${href}" data-track-event="view-release-notes" data-track-location="release-index" data-track-locale="${lang}" data-track-version="${release.version}" class="mt-3 inline-flex min-h-11 items-center gap-1.5 text-sm font-medium text-accent">${zh ? '更新说明' : 'Release notes'}${ARROW_RIGHT}</a></li>`;
  }).join('');
}

export function updateIndex(shell, catalog, lang) {
  return shell.replace(/<ol class="mt-10 border-l border-border">[\s\S]*?<\/ol>/, `<ol class="mt-10 border-l border-border">${renderIndexList(catalog, lang)}</ol>`);
}

export function releaseMarkdown(release, lang) {
  const zh = lang === 'zh';
  const canonical = `${SITE}${zh ? '/zh' : ''}/releases/${release.version}`;
  const highlights = bestHighlight(release, lang);
  const downloads = ['arm64', 'x86_64', 'universal']
    .map((arch) => [arch, release.downloads?.[arch]])
    .filter(([, asset]) => asset?.name)
    .map(([arch, asset]) => `- ${arch === 'arm64' ? 'Apple Silicon' : arch === 'x86_64' ? 'Intel' : 'Universal'}: [${asset.name}](${REPO}/releases/download/v${release.version}/${asset.name})`)
    .join('\n');
  const body = zh
    ? `# FanBar ${release.version} 更新说明\n\n发布时间：${release.publishedAt}\n规范链接：${canonical}\n\n摘要：${highlights}\n\n${release.sections
      .filter((section) => !/^(Install|安装)$/i.test(section.en))
      .map((section) => `## ${section.zh}\n\n${section.bullets.map((item) => `- ${item.zhTitle ? `**${item.zhTitle}** — ` : ''}${inlineMarkdown(item.zhBody)}`).join('\n')}`)
      .join('\n\n')}\n`
    : `# FanBar ${release.version} release notes\n\nPublished: ${release.publishedAt}\nCanonical: ${canonical}\n\nSummary: ${highlights}\n\n${release.sections
      .filter((section) => !/^(Install|安装)$/i.test(section.en))
      .map((section) => `## ${section.en}\n\n${section.bullets.map((item) => `- ${item.enTitle ? `**${item.enTitle}** — ` : ''}${inlineMarkdown(item.enBody)}`).join('\n')}`)
      .join('\n\n')}\n`;
  return `${body}\n## Downloads\n\n${downloads}\n\nAll builds: ${REPO}/releases/tag/v${release.version}\n`;
}

export function rssItem(release) {
  const description = bestHighlight(release, 'en');
  const content = toHtmlSections(release.sections, 'en');
  return `<item><title>FanBar ${release.version}</title><link>${SITE}/releases/${release.version}</link><guid isPermaLink="true">${SITE}/releases/${release.version}</guid><pubDate>${formatRfc822(release.publishedAt)}</pubDate><description>${escapeHtml(description)}</description><content:encoded><![CDATA[${content.replaceAll(']]>', ']]]]><![CDATA[>')}]]></content:encoded></item>`;
}

export function upsertRss(xml, releases) {
  const items = [...xml.matchAll(/<item>[\s\S]*?<\/item>/g)].map((match) => match[0]);
  const byVersion = new Map();
  for (const item of items) {
    const link = item.match(/<link>([^<]+)<\/link>/)?.[1] ?? '';
    const version = link.match(/\/releases\/([^/]+)$/)?.[1];
    if (version) byVersion.set(version, item);
  }
  for (const release of releases) byVersion.set(release.version, rssItem(release));
  const sorted = [...byVersion.values()].sort((a, b) => {
    const da = Date.parse(a.match(/<pubDate>([^<]+)<\/pubDate>/)?.[1] ?? 0);
    const db = Date.parse(b.match(/<pubDate>([^<]+)<\/pubDate>/)?.[1] ?? 0);
    return db - da;
  });
  const firstItem = xml.indexOf('<item>');
  const channelEnd = xml.lastIndexOf('</channel>');
  const prefix = firstItem >= 0 ? xml.slice(0, firstItem) : xml.slice(0, channelEnd);
  const suffix = xml.slice(channelEnd);
  const latest = sorted.length ? sorted[0].match(/<pubDate>([^<]+)<\/pubDate>/)?.[1] : new Date().toUTCString();
  const head = prefix.replace(/<lastBuildDate>[^<]+<\/lastBuildDate>/, `<lastBuildDate>${latest}</lastBuildDate>`);
  return `${head}${sorted.join('')}${suffix}`;
}

export function upsertLlmsLatest(text, catalog) {
  const sorted = sortReleases(catalog);
  const latest = sorted[0];
  if (!latest) return text;
  const lines = [
    '## Latest release',
    '',
    `- [FanBar ${latest.version} release notes](${SITE}/releases/${latest.version}): ${bestHighlight(latest, 'en')}.`,
    `- [FanBar ${latest.version} 中文发布说明](${SITE}/zh/releases/${latest.version}): ${bestHighlight(latest, 'zh')}。`,
  ];
  for (const release of sorted.slice(1, 3)) {
    lines.push(`- [FanBar ${release.version} release notes](${SITE}/releases/${release.version}): ${bestHighlight(release, 'en')}.`);
  }
  lines.push(`- [All release notes](${SITE}/releases): Every version with changes and downloads.`);
  const block = `${lines.join('\n')}\n\n`;
  if (/## Latest release[\s\S]*?(?=\n## )/.test(text)) {
    return text.replace(/## Latest release[\s\S]*?(?=\n## )/, block.trimEnd() + '\n');
  }
  const anchor = '## Agent access and API discovery';
  if (text.includes(anchor)) return text.replace(anchor, `${block}${anchor}`);
  return `${text.trimEnd()}\n\n${block}`;
}

function llmsReleaseSection(release) {
  return `## FanBar ${release.version} release notes\n\nSource: ${SITE}/releases/${release.version}\n\nReleased ${release.publishedAt.slice(0, 10)}.\n\n${toMarkdownSections(release.sections)}`;
}

export function updateLlmsFull(text, catalog, releases) {
  const marker = '# Recent releases';
  const index = text.indexOf(marker);
  if (index < 0) return text;
  const head = text.slice(0, index);
  const tail = text.slice(index);
  const sections = new Map();
  for (const match of tail.matchAll(/## FanBar ([0-9][^\s]+) release notes\n[\s\S]*?(?=\n---\n|\s*$)/g)) {
    sections.set(match[1], match[0].trim());
  }
  for (const release of releases) sections.set(release.version, llmsReleaseSection(release));
  const top = sortReleases(catalog)
    .filter((release) => sections.has(release.version))
    .slice(0, 5)
    .map((release) => sections.get(release.version));
  return `${head}${marker}\n\n${top.join('\n\n---\n\n')}\n`;
}

export function updateSitemap(xml, releases, latestDate) {
  let out = xml;
  for (const release of releases) {
    for (const lang of ['en', 'zh']) {
      const loc = `${SITE}${lang === 'zh' ? '/zh' : ''}/releases/${release.version}`;
      const block = `  <url>\n    <loc>${loc}</loc>\n    <lastmod>${release.publishedAt.slice(0, 10)}</lastmod>\n` +
        `    <xhtml:link rel="alternate" hreflang="en" href="${SITE}/releases/${release.version}" />\n` +
        `    <xhtml:link rel="alternate" hreflang="zh-Hans" href="${SITE}/zh/releases/${release.version}" />\n` +
        `    <xhtml:link rel="alternate" hreflang="x-default" href="${SITE}/releases/${release.version}" />\n  </url>\n`;
      out = out.replace(new RegExp(`  <url>\\s*<loc>${loc.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}</loc>[\\s\\S]*?</url>\\n`, 'g'), '');
      out = out.replace('</urlset>', `${block}</urlset>`);
    }
  }
  for (const loc of [`${SITE}/releases`, `${SITE}/zh/releases`]) {
    const re = new RegExp(`(<loc>${loc.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}</loc>\\s*<lastmod>)[^<]+(</lastmod>)`);
    out = out.replace(re, `$1${latestDate}$2`);
  }
  return out;
}

export function updateProductJson(json, latest) {
  const data = JSON.parse(json);
  data.latestRelease = {
    version: latest.version,
    publishedAt: latest.publishedAt,
    notes: `${SITE}/releases/${latest.version}`,
    url: `${REPO}/releases/tag/v${latest.version}`,
  };
  data.downloads = {};
  for (const arch of ['arm64', 'x86_64', 'universal']) {
    const asset = latest.downloads?.[arch];
    if (!asset?.name) continue;
    data.downloads[arch] = {
      name: asset.name,
      url: `${REPO}/releases/download/v${latest.version}/${asset.name}`,
      ...(Number.isFinite(asset.size) ? { size: asset.size } : {}),
    };
  }
  return `${JSON.stringify(data, null, 2)}\n`;
}

export function sizeLabel(size) {
  return Number.isFinite(size) ? `${(size / 1_000_000).toFixed(1)} MB` : '';
}

/**
 * Keep the site-wide download buttons and SoftwareApplication JSON-LD on the latest
 * release. Historical release pages are excluded; their downloads stay pinned.
 */
export function syncSiteLatest(distDir, catalog, latest) {
  const home = fs.readFileSync(`${distDir}/index.html`, 'utf8');
  const oldVersion = home.match(/releases\/download\/v([^/]+)\//)?.[1];
  if (!oldVersion || oldVersion === latest.version) return 0;
  const previous = catalog.find((release) => release.version === oldVersion);
  let changed = 0;

  const walk = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const file = `${dir}/${entry.name}`;
      if (entry.isDirectory()) {
        if (entry.name === 'releases') continue;
        walk(file);
      } else if (entry.name.endsWith('.html')) {
        let html = fs.readFileSync(file, 'utf8');
        const before = html;
        html = html.replaceAll(oldVersion, latest.version);
        html = html.replaceAll(`/releases/${oldVersion}`, `/releases/${latest.version}`);
        if (previous?.publishedAt) {
          html = html.replaceAll(previous.publishedAt, latest.publishedAt);
          const oldDate = new Date(previous.publishedAt);
          const newDate = new Date(latest.publishedAt);
          const pairs = [
            [formatDateEn(previous.publishedAt), formatDateEn(latest.publishedAt)],
            [formatDateZh(previous.publishedAt), formatDateZh(latest.publishedAt)],
            [`${oldDate.getUTCDate()} novembre ${oldDate.getUTCFullYear()}`, `${newDate.getUTCDate()} novembre ${newDate.getUTCFullYear()}`],
            [`${oldDate.getUTCDate()} ноября ${oldDate.getUTCFullYear()}`, `${newDate.getUTCDate()} ноября ${newDate.getUTCFullYear()}`],
          ];
          for (const [from, to] of pairs) if (from !== to) html = html.replaceAll(from, to);
        }
        for (const arch of ['arm64', 'x86_64', 'universal']) {
          const oldSize = sizeLabel(previous?.downloads?.[arch]?.size);
          const newSize = sizeLabel(latest.downloads?.[arch]?.size);
          if (oldSize && newSize && oldSize !== newSize) html = html.replaceAll(oldSize, newSize);
        }
        if (html !== before) {
          fs.writeFileSync(file, html);
          changed += 1;
        }
      }
    }
  };
  walk(distDir);
  return changed;
}
