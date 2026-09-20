import fs from 'node:fs'
import path from 'node:path'
import { getRootDir } from '@wdio/repo-utils'

export interface CopyContributingOptions {
    rootDir?: string
}

export function renderContributePage(content: string) {
    return `---
id: contribute
title: Contribute
custom_edit_url: https://github.com/webdriverio/webdriverio/edit/main/CONTRIBUTING.md
---

${content.split(/\n/).slice(2).join('\n')}`
}

export async function copyContributingDocs (options: CopyContributingOptions = {}) {
    const rootDir = options.rootDir ?? getRootDir()
    const docsPath = path.join(rootDir, 'CONTRIBUTING.md')
    const newDocsPath = path.join(rootDir, 'website', 'docs', 'Contribute.md')
    const content = await fs.promises.readFile(docsPath, 'utf-8')
    await fs.promises.writeFile(newDocsPath, renderContributePage(content))
}
