import fs from 'node:fs'
import path from 'node:path'
import { getRootDir } from '@wdio/repo-utils'

const GITHUB_BLOB_BASE = 'https://github.com/webdriverio/webdriverio/blob/main'

export interface CopyContributingOptions {
    rootDir?: string
}

/**
 * CONTRIBUTING.md lives at the repo root, so relative links such as
 * `./AGENTS.md` resolve on GitHub. After this file is copied into
 * `website/docs/`, Docusaurus treats those as docs-plugin pages and the
 * build fails. Rewrite them to GitHub blob URLs.
 */
export function rewriteRepoRootMarkdownLinks (markdown: string) {
    return markdown.replace(
        /\]\(\.\/([\w./-]+\.md)(#[\w-]+)?\)/g,
        (_match, filePath: string, hash = '') => `](${GITHUB_BLOB_BASE}/${filePath}${hash})`
    )
}

export function renderContributePage(content: string) {
    const body = rewriteRepoRootMarkdownLinks(content.split(/\n/).slice(2).join('\n'))
    return `---
id: contribute
title: Contribute
custom_edit_url: https://github.com/webdriverio/webdriverio/edit/main/CONTRIBUTING.md
---

${body}`
}

export async function copyContributingDocs (options: CopyContributingOptions = {}) {
    const rootDir = options.rootDir ?? getRootDir()
    const docsPath = path.join(rootDir, 'CONTRIBUTING.md')
    const newDocsPath = path.join(rootDir, 'website', 'docs', 'Contribute.md')
    const content = await fs.promises.readFile(docsPath, 'utf-8')
    await fs.promises.writeFile(newDocsPath, renderContributePage(content))
}
