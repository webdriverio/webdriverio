import fs from 'node:fs/promises'
import path from 'node:path'
import url from 'node:url'
import { downloadFromGitHub } from '../utils/index.js'
import { buildLinkRewriter, type PageProps } from './docsUtils.js'

const __dirname = path.dirname(url.fileURLToPath(import.meta.url))

/**
 * Source files in `packages/tauri-service/docs/` of the wdio-desktop-mobile
 * monorepo, keyed by the docusaurus `id` they should be published under.
 */
const allDocs: Record<string, PageProps> = {
    'quick-start': { sourcePath: 'quick-start.md', title: 'Quick Start' },
    configuration: { sourcePath: 'configuration.md', title: 'Configuration' },
    api: { sourcePath: 'api-reference.md', title: 'API Reference' },
    'plugin-setup': { sourcePath: 'plugin-setup.md', title: 'Plugin Setup' },
    'platform-support': { sourcePath: 'platform-support.md', title: 'Platform Support' },
    'usage-examples': { sourcePath: 'usage-examples.md', title: 'Usage Examples' },
    'log-forwarding': { sourcePath: 'log-forwarding.md', title: 'Log Forwarding' },
    'edge-webdriver-windows': { sourcePath: 'edge-webdriver-windows.md', title: 'Edge WebDriver on Windows' },
    'deeplink-testing': { sourcePath: 'deeplink-testing.md', title: 'Deeplink Testing' },
    'crabnebula-setup': { sourcePath: 'crabnebula-setup.md', title: 'CrabNebula Setup' },
    troubleshooting: { sourcePath: 'troubleshooting.md', title: 'Troubleshooting' }
}

const GITHUB_REPO = 'webdriverio/desktop-mobile'
const GITHUB_URL = `https://raw.githubusercontent.com/${GITHUB_REPO}`
const DOCS_SHA = '37081c940a4528df3bf1994d9a5391d33a8775d5'
const DOCS_SOURCE_DIR = 'packages/tauri-service/docs'
const WEBSITE_DOCS_PATH = ['website', 'docs', 'desktop-testing', 'tauri']
const PUBLISHED_URL_PREFIX = '/docs/desktop-testing/tauri'

export async function generateTauriDocs () {
    const basePath = path.join(__dirname, '..', '..')
    const tauriDocsPath = path.join(basePath, ...WEBSITE_DOCS_PATH)
    await fs.mkdir(tauriDocsPath, { recursive: true })

    const rewriteLinks = buildLinkRewriter(allDocs, PUBLISHED_URL_PREFIX)

    for (const [id, { sourcePath, title }] of Object.entries(allDocs)) {
        const newDocsPath = path.join(tauriDocsPath, `${id}.md`)
        const remotePath = `${DOCS_SOURCE_DIR}/${sourcePath}`
        const raw = await downloadFromGitHub(GITHUB_URL, DOCS_SHA, remotePath)

        const stripped = raw.replace(/^#[^\n]*\n+/, '')

        const sourceFileDir = path.posix.dirname(remotePath)
        const resolveRelativePath = (relativePath: string) => {
            const resolved = path.posix.normalize(`${sourceFileDir}/${relativePath}`)
            return `https://raw.githubusercontent.com/${GITHUB_REPO}/${DOCS_SHA}/${resolved}`
        }

        let inCodeBlock = false
        const transformed = rewriteLinks(stripped)
            // Rewrite repo-relative image paths in markdown syntax to absolute raw GitHub URLs
            .replace(
                /!\[([^\]]*)\]\(((?:\.\.\/)+[^\s)"']+)((?:\s+'[^']*')?)\)/g,
                (_match, alt: string, relativePath: string, title: string) =>
                    `![${alt}](${resolveRelativePath(relativePath)}${title})`
            )
            // Rewrite repo-relative image paths in HTML src attributes to absolute raw GitHub URLs
            .replace(
                /(src=")((?:\.\.\/)+[^\s"]+)/g,
                (_match, prefix: string, relativePath: string) =>
                    `${prefix}${resolveRelativePath(relativePath)}`
            )
            // Escape TypeScript generic angle brackets in plain text to prevent MDX parse errors
            .split('\n').map((line) => {
                if (/^```/.test(line)) { inCodeBlock = !inCodeBlock }
                if (inCodeBlock) { return line }
                return line.replace(/<([A-Z][a-zA-Z0-9]+)>/g, '\\<$1>')
            }).join('\n')

        await fs.writeFile(newDocsPath, `---
id: ${id}
title: ${title}
custom_edit_url: https://github.com/${GITHUB_REPO}/edit/main/${remotePath}
---
${transformed}`)
        console.log(`Generated docs for ${newDocsPath}`)
    }
}
