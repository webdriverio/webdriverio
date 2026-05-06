import fs from 'node:fs/promises'
import path from 'node:path'
import url from 'node:url'
import { downloadFromGitHub } from '../utils/index.js'

const __dirname = path.dirname(url.fileURLToPath(import.meta.url))

interface PageProps {
    sourcePath: string
    title: string
}

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

function buildLinkRewriter() {
    const filenameToId = new Map<string, string>()
    for (const [id, { sourcePath }] of Object.entries(allDocs)) {
        filenameToId.set(sourcePath, id)
    }
    return (content: string): string => content.replace(
        /\.\/([\w-]+\.md)(#[\w-]+)?/g,
        (match, filename: string, anchor: string | undefined) => {
            const id = filenameToId.get(filename)
            if (!id) {
                return match
            }
            return `${PUBLISHED_URL_PREFIX}/${id}${anchor ?? ''}`
        }
    )
}

export async function generateTauriDocs () {
    const basePath = path.join(__dirname, '..', '..')
    const tauriDocsPath = path.join(basePath, ...WEBSITE_DOCS_PATH)
    await fs.mkdir(tauriDocsPath, { recursive: true })

    const rewriteLinks = buildLinkRewriter()

    for (const [id, { sourcePath, title }] of Object.entries(allDocs)) {
        const newDocsPath = path.join(tauriDocsPath, `${id}.md`)
        const remotePath = `${DOCS_SOURCE_DIR}/${sourcePath}`
        const raw = await downloadFromGitHub(GITHUB_URL, DOCS_SHA, remotePath)

        const stripped = raw.replace(/^#[^\n]*\n+/, '')

        const transformed = rewriteLinks(stripped)
            .replace(
                /(\]|src=")(\.\.\/)+(assets\/[\w./-]+)/g,
                (_match, prefix: string, _dots: string, assetPath: string) =>
                    `${prefix}https://raw.githubusercontent.com/${GITHUB_REPO}/${DOCS_SHA}/${DOCS_SOURCE_DIR}/${assetPath}`
            )

        await fs.writeFile(newDocsPath, `---
id: ${id}
title: ${title}
custom_edit_url: https://github.com/${GITHUB_REPO}/edit/main/${remotePath}
---
${transformed}`)
        console.log(`Generated docs for ${newDocsPath}`)
    }
}
