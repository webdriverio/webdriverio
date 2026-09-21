import fs from 'node:fs'
import url from 'node:url'
import path from 'node:path'

const __dirname = path.dirname(url.fileURLToPath(import.meta.url))
const GITHUB_BLOB_BASE = 'https://github.com/webdriverio/webdriverio/blob/main'

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

export async function copyContributingDocs () {
    const basePath = path.join(__dirname, '..', '..')
    const docsPath = path.join(basePath, 'CONTRIBUTING.md')
    const newDocsPath = path.join(basePath, 'website', 'docs', 'Contribute.md')
    const content = await fs.promises.readFile(docsPath, 'utf-8')
    const body = rewriteRepoRootMarkdownLinks(content.split(/\n/).slice(2).join('\n'))
    await fs.promises.writeFile(newDocsPath, `---
id: contribute
title: Contribute
custom_edit_url: https://github.com/webdriverio/webdriverio/edit/main/CONTRIBUTING.md
---

${body}`)
}
