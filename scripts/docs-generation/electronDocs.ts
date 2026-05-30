import fs from 'node:fs/promises'
import path from 'node:path'
import url from 'node:url'
import { downloadFromGitHub } from '../utils/index.js'
import { buildLinkRewriter, type PageProps } from './docsUtils.js'

const __dirname = path.dirname(url.fileURLToPath(import.meta.url))

/**
 * Source files in `packages/electron-service/docs/` of the wdio-desktop-mobile
 * monorepo, keyed by the docusaurus `id` they should be published under.
 */
const allDocs: Record<string, PageProps> = {
    configuration: { sourcePath: 'configuration.md', title: 'Configuration' },
    api: { sourcePath: 'electron-apis.md', title: 'Accessing Electron APIs' },
    'api-reference': { sourcePath: 'api-reference.md', title: 'API Reference' },
    'standalone': { sourcePath: 'standalone-mode.md', title: 'Standalone Mode' },
    'window-management': { sourcePath: 'window-management.md', title: 'Window Management' },
    'deeplink-testing': { sourcePath: 'deeplink-testing.md', title: 'Deeplink Testing' },
    debugging: { sourcePath: 'debugging.md', title: 'Debugging' },
    'common-issues': { sourcePath: 'common-issues.md', title: 'Common Issues' }
}

const GITHUB_REPO = 'webdriverio/desktop-mobile'
const GITHUB_URL = `https://raw.githubusercontent.com/${GITHUB_REPO}`
const DOCS_SHA = '37081c940a4528df3bf1994d9a5391d33a8775d5'
const DOCS_SOURCE_DIR = 'packages/electron-service/docs'
const WEBSITE_DOCS_PATH = ['website', 'docs', 'desktop-testing', 'electron']
const PUBLISHED_URL_PREFIX = '/docs/desktop-testing/electron'

export async function generateElectronDocs () {
    const basePath = path.join(__dirname, '..', '..')
    const electronDocsPath = path.join(basePath, ...WEBSITE_DOCS_PATH)
    await fs.mkdir(electronDocsPath, { recursive: true })

    const rewriteLinks = buildLinkRewriter(allDocs, PUBLISHED_URL_PREFIX)

    for (const [id, { sourcePath, title }] of Object.entries(allDocs)) {
        const newDocsPath = path.join(electronDocsPath, `${id}.md`)
        const remotePath = `${DOCS_SOURCE_DIR}/${sourcePath}`
        const raw = await downloadFromGitHub(GITHUB_URL, DOCS_SHA, remotePath)

        // Drop the source's first H1 heading (Docusaurus uses front-matter title)
        const stripped = raw.replace(/^#[^\n]*\n+/, '')

        const transformed = rewriteLinks(stripped)
            // Rewrite repo-relative image paths (e.g. ../assets/foo.png) to absolute raw URLs
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
