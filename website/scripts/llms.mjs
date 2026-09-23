#!/usr/bin/env node
/**
 * Writes the machine-readable entry points for coding agents after
 * `docusaurus build`:
 *
 * - `build/llms.txt`: a curated index that follows the sidebar structure
 *   (it replaces the path-based index written by the llms-txt plugin)
 * - `build/llms/<section>.txt`: every page of one docs section concatenated,
 *   so an agent can load exactly the context it needs
 *
 * `llms-full.txt` and the per-page Markdown twins are written by
 * `@signalwire/docusaurus-plugin-llms-txt`.
 */
import fs from 'node:fs'
import url from 'node:url'
import path from 'node:path'

const __dirname = path.dirname(url.fileURLToPath(import.meta.url))
const WEBSITE_DIR = path.join(__dirname, '..')
const BUILD_DIR = path.join(WEBSITE_DIR, 'build')
const SITE_URL = 'https://webdriver.io'

/**
 * sidebar categories whose pages are not advertised to agents
 */
const EXCLUDED_CATEGORIES = new Set(['Archive'])

const sidebars = JSON.parse(fs.readFileSync(path.join(WEBSITE_DIR, 'sidebars.json'), 'utf-8'))

const decode = (text) => text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&#x27;/g, '\'')

function page (id) {
    const html = [
        path.join(BUILD_DIR, 'docs', `${id}.html`),
        path.join(BUILD_DIR, 'docs', id, 'index.html'),
    ].find((file) => fs.existsSync(file))
    const markdown = path.join(BUILD_DIR, 'docs', `${id}.md`)
    if (!html || !fs.existsSync(markdown)) {
        return undefined
    }
    const content = fs.readFileSync(html, 'utf-8')
    const title = decode(content.match(/<title[^>]*>([^<]*)<\/title>/)?.[1] || id).replace(/ \| WebdriverIO$/, '')
    const meta = content.match(/<meta[^>]*name="?description"?[^>]*content=(?:"([^"]*)"|([^\s>]+))/)
    const description = decode(meta?.[1] ?? meta?.[2] ?? '')
    return { id, title, description, url: `${SITE_URL}/docs/${id}.md`, file: markdown }
}

/**
 * flattens a sidebar (sub)tree into sections: every category becomes a
 * heading, docs become links
 */
function collect (items, trail = []) {
    const sections = []
    const pages = []
    for (const item of items) {
        if (typeof item === 'string' || item.type === 'doc') {
            const p = page(typeof item === 'string' ? item : item.id)
            if (p) {
                pages.push(p)
            }
            continue
        }
        if (item.type !== 'category' || EXCLUDED_CATEGORIES.has(item.label)) {
            continue
        }
        const landing = item.link?.type === 'doc' ? page(item.link.id) : undefined
        const nested = collect(item.items || [], [...trail, item.label])
        sections.push({
            label: [...trail, item.label].join(' / '),
            pages: [...(landing ? [landing] : []), ...nested.pages],
        }, ...nested.sections)
    }
    return { sections, pages }
}

const slug = (label) => label.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

/**
 * top-level sections of the llms.txt index and the bundle each one is written to
 */
const topLevel = [
    ...sidebars.docs
        .filter((item) => item.type === 'category' && !EXCLUDED_CATEGORIES.has(item.label))
        .map((item) => ({ label: item.label, tree: [item] })),
    { label: 'Reference', tree: sidebars.api || [] },
    { label: 'Ecosystem', tree: sidebars.ecosystem || [] },
]

const index = [
    '# WebdriverIO',
    '',
    '> WebdriverIO is an open source, openly governed (OpenJS Foundation) test automation framework for Node.js. It automates web browsers (WebDriver and WebDriver BiDi), native, hybrid and mobile web apps (Appium), desktop apps (macOS, Windows, Electron, Tauri, Dioxus), VS Code and browser extensions, and supports visual, accessibility and component testing.',
    '',
    'These docs describe WebdriverIO v10. Notes for agents:',
    '',
    '- Every link below points to the Markdown version of a page. Any page on webdriver.io is available as Markdown by appending `.md` to its URL or by sending `Accept: text/markdown`.',
    '- Each section below is also available as one file under `/llms/<section>.txt` (listed next to the section heading), and the complete documentation is at https://webdriver.io/llms-full.txt.',
    '- The docs are also available as an MCP server (Streamable HTTP) at https://webdriver.io/mcp with `search_docs`, `get_page` and `list_sections` tools. See https://webdriver.io/docs/ai-agents.md for how to set up coding agents.',
    '- All WebdriverIO commands are async; always `await` them. Configuration lives in `wdio.conf.ts`; run tests with `npx wdio run wdio.conf.ts`.',
    '- Documentation for WebdriverIO v9 is at https://v9.webdriver.io. Older versions are no longer documented, see https://webdriver.io/docs/v10-migration.md for upgrading.',
    '',
]

const bundles = []
for (const { label, tree } of topLevel) {
    const { sections, pages } = collect(tree)
    const allSections = [...(pages.length ? [{ label, pages }] : []), ...sections]
    const bundlePages = allSections.flatMap((s) => s.pages)
    if (bundlePages.length === 0) {
        continue
    }

    const bundle = `llms/${slug(label)}.txt`
    bundles.push({ bundle, label, pages: bundlePages })
    index.push(`## ${label}`, '', `All pages of this section in one file: ${SITE_URL}/${bundle}`, '')
    for (const section of allSections) {
        if (section.label !== label) {
            index.push(`### ${section.label}`, '')
        }
        for (const p of section.pages) {
            index.push(`- [${p.title}](${p.url})${p.description ? `: ${p.description}` : ''}`)
        }
        index.push('')
    }
}

index.push(
    '## Optional',
    '',
    `- [Blog](${SITE_URL}/blog): release announcements and deep dives`,
    `- [Community](${SITE_URL}/community/support.md): where to get help (Discord, GitHub Discussions)`,
    '- [GitHub](https://github.com/webdriverio/webdriverio): source code, issues and changelog',
    '- [WebdriverIO MCP](https://github.com/webdriverio/mcp): MCP server that lets agents drive browsers and mobile apps',
    '- [WebdriverIO DevTools](https://github.com/webdriverio/devtools): live test debugging and portable traces',
    ''
)

fs.writeFileSync(path.join(BUILD_DIR, 'llms.txt'), index.join('\n'))

fs.mkdirSync(path.join(BUILD_DIR, 'llms'), { recursive: true })
for (const { bundle, label, pages } of bundles) {
    const content = [
        `# WebdriverIO v10 documentation: ${label}`,
        '',
        `> ${pages.length} pages. Index of all sections: ${SITE_URL}/llms.txt`,
        '',
        ...pages.map((p) => [
            '---',
            '',
            `Source: ${p.url}`,
            '',
            fs.readFileSync(p.file, 'utf-8').trim(),
            ''
        ].join('\n'))
    ].join('\n')
    fs.writeFileSync(path.join(BUILD_DIR, bundle), content)
}

const size = (file) => `${Math.round(fs.statSync(path.join(BUILD_DIR, file)).size / 1024)} KB`
console.log(`Wrote llms.txt (${size('llms.txt')}) and ${bundles.length} bundles:`)
for (const { bundle, pages } of bundles) {
    console.log(`  ${bundle}: ${pages.length} pages, ${size(bundle)}`)
}
