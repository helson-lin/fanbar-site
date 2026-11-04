const ISSUE_BASE = 'https://github.com/helson-lin/FanBar/issues';

const SECTION_EN = {
  '新功能': 'New Features',
  '改进': 'Improvements',
  '修复': 'Fixes',
  '注意': 'Notes',
  '说明': 'Notes',
  '支持': 'Support',
  '安装': 'Install',
  '安全': 'Security',
  '其他': 'Other',
};

export function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function escapeAttr(value) {
  return escapeHtml(value).replaceAll("'", '&#39;');
}

export function slugify(value) {
  return String(value)
    .toLowerCase()
    .replace(/&amp;/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** Convert the small inline Markdown subset used by FanBar release notes to HTML. */
export function inlineHtml(markdown) {
  const tokens = [];
  const stash = (html) => {
    tokens.push(html);
    return `\u0000${tokens.length - 1}\u0000`;
  };
  let text = String(markdown ?? '');

  text = text.replace(/`([^`]+)`/g, (_, code) =>
    stash(`<code class="rounded bg-muted px-1.5 py-0.5 font-mono text-[13px] text-foreground">${escapeHtml(code)}</code>`),
  );
  text = text.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_, label, href) => {
    const rel = /^https?:\/\//.test(href) && !href.startsWith('https://github.com/') ? ' rel="nofollow"' : '';
    return stash(`<a href="${escapeAttr(href)}"${rel}>${escapeHtml(label)}</a>`);
  });

  text = escapeHtml(text);
  text = text.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  text = text.replace(/(^|[\s(（])(#\d+)/g, (_, prefix, issue) =>
    `${prefix}<a href="${ISSUE_BASE}/${issue.slice(1)}">${issue}</a>`,
  );
  text = text.replace(/\u0000(\d+)\u0000/g, (_, index) => tokens[Number(index)]);
  return text;
}

/** Markdown form with bare issue references turned into links. */
export function inlineMarkdown(markdown) {
  return String(markdown ?? '').replace(/(^|[\s(（])(#\d+)/g, (_, prefix, issue) =>
    `${prefix}[${issue}](${ISSUE_BASE}/${issue.slice(1)})`,
  );
}

export function splitTitleBody(raw) {
  const text = String(raw ?? '').trim();
  const match = text.match(/^\*\*(.+?)\*\*\s*(?:—|–|-)\s*(.*)$/s);
  if (!match) return { title: '', body: text };
  return { title: match[1].trim(), body: match[2].trim() };
}

function normaliseHeading(raw) {
  const text = raw.trim();
  const parts = text.split(/\s+\/\s+/);
  if (parts.length >= 2) {
    const zh = parts[0].trim();
    const en = parts.slice(1).join(' / ').trim();
    return { zh, en: en || SECTION_EN[zh] || zh };
  }
  return { zh: text, en: SECTION_EN[text] || text };
}

/**
 * Parse the bilingual release note format in FanBar's docs/releases.
 * Each bullet is a Chinese paragraph followed by an indented English translation.
 */
export function parseReleaseMarkdown(markdown) {
  const lines = String(markdown ?? '').replace(/\r\n?/g, '\n').split('\n');
  const sections = [];
  let current = null;
  let bullet = null;

  const flushBullet = () => {
    if (!bullet) return;
    const zhRaw = bullet.zh.join(' ').trim();
    let enRaw = bullet.en.join(' ').trim();
    if (!enRaw && !/[\u3400-\u9fff]/.test(zhRaw)) enRaw = zhRaw;
    const zh = splitTitleBody(zhRaw);
    const en = splitTitleBody(enRaw || zhRaw);
    current.bullets.push({
      zhTitle: zh.title,
      zhBody: zh.body,
      enTitle: en.title,
      enBody: en.body,
      enMissing: !enRaw,
    });
    bullet = null;
  };

  for (const line of lines) {
    const heading = line.match(/^###\s+(.+?)\s*$/);
    if (heading) {
      flushBullet();
      const names = normaliseHeading(heading[1]);
      current = { ...names, bullets: [] };
      sections.push(current);
      continue;
    }
    if (!current) continue;

    if (/^\s*-\s+/.test(line)) {
      flushBullet();
      bullet = { zh: [line.replace(/^\s*-\s+/, '')], en: [] };
      continue;
    }
    if (!bullet) continue;

    if (/^\s{2,}\S/.test(line)) {
      bullet.en.push(line.trim());
    } else if (line.trim() === '') {
      continue;
    } else {
      // A wrapped Chinese line (rare) continues the Chinese paragraph.
      bullet.zh.push(line.trim());
    }
  }
  flushBullet();
  return sections.filter((section) => section.bullets.length > 0);
}

export function sectionId(section, lang) {
  if (lang === 'zh') return section.zh;
  return slugify(section.en);
}

export function firstHighlights(sections, lang) {
  const usable = sections
    .filter((section) => !/^(Install|安装|Support|支持)$/i.test(section.en))
    .slice(0, 2);
  return usable
    .flatMap((section) => section.bullets.map((item) =>
      lang === 'zh' ? item.zhTitle || item.zhBody : item.enTitle || item.enBody,
    ))
    .filter(Boolean)
    .slice(0, 4);
}

export function toMarkdownSections(sections) {
  return sections
    .filter((section) => !/^(Install|安装|Support|支持)$/i.test(section.en))
    .map((section) => {
      const bullets = section.bullets.map((item) => {
        const title = item.enTitle ? `**${item.enTitle}** — ` : '';
        return `- ${title}${inlineMarkdown(item.enBody)}`;
      }).join('\n');
      return `### ${section.en}\n\n${bullets}`;
    })
    .join('\n\n');
}

export function toHtmlSections(sections, lang) {
  return sections
    .filter((section) => !/^(Install|安装)$/i.test(section.en))
    .map((section) => {
      const bullets = section.bullets.map((item) => {
        const title = lang === 'zh' ? item.zhTitle : item.enTitle;
        const body = lang === 'zh' ? item.zhBody : item.enBody;
        const strong = title ? `<strong>${inlineHtml(title)}</strong> — ` : '';
        return `<li>${strong}${inlineHtml(body)}</li>`;
      }).join('');
      return `<h2 id="${escapeAttr(sectionId(section, lang))}">${escapeHtml(lang === 'zh' ? section.zh : section.en)}</h2><ul>${bullets}</ul>`;
    })
    .join('');
}
