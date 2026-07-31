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

        const sourceFileDir = path.posix.dirname(remotePath)
        const resolveRelativePath = (relativePath: string) => {
            const resolved = path.posix.normalize(`${sourceFileDir}/${relativePath}`)
            return `https://raw.githubusercontent.com/${GITHUB_REPO}/${DOCS_SHA}/${resolved}`
        }

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

        await fs.writeFile(newDocsPath, `---
id: ${id}
title: ${title}
custom_edit_url: https://github.com/${GITHUB_REPO}/edit/main/${remotePath}
---
${transformed}`)
        console.log(`Generated docs for ${newDocsPath}`)
    }
}
