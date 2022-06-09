import fs from 'node:fs'
import url from 'node:url'
import path from 'node:path'

const __dirname = path.dirname(url.fileURLToPath(import.meta.url))

export async function copyContributingDocs () {
    const basePath = path.join(__dirname, '..', '..')
    const docsPath = path.join(basePath, 'CONTRIBUTING.md')
    const newDocsPath = path.join(basePath, 'website', 'docs', 'Contribute.md')
    const content = await fs.promises.readFile(docsPath)
    await fs.promises.writeFile(newDocsPath, `---
id: contribute
title: Contribute
custom_edit_url: https://github.com/webdriverio/webdriverio/edit/main/CONTRIBUTING.md
---

${content.toString().split(/\n/).slice(2).join('\n')}`)
}
