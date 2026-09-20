import fs from 'node:fs'
import path from 'node:path'
import { downloadFromGitHub, getRootDir } from '@wdio/repo-utils'

export interface AwesomeResourcesOptions {
    rootDir?: string
    download?: typeof downloadFromGitHub
}

export function renderResourcesPage(content: string) {
    let lines = content.split(/\n/)
    lines = lines.slice(lines.findIndex((line) => line.includes('WebdriverIO Ecosystem')))
    return `---
id: resources
title: Resources
custom_edit_url: https://github.com/webdriverio-community/awesome-webdriverio/edit/main/README.md
---

There are many wonderful curated resources the WebdriverIO community has put together.
Make sure to contribute yours at [\`awesome-webdriverio\`](https://github.com/webdriverio-community/awesome-webdriverio)!

${lines.join('\n')}`
}

export async function downloadAwesomeResources (options: AwesomeResourcesOptions = {}) {
    const rootDir = options.rootDir ?? getRootDir()
    const download = options.download ?? downloadFromGitHub
    const newDocsPath = path.join(rootDir, 'website', 'community', 'Resources.md')
    const content = await download('https://raw.githubusercontent.com/webdriverio-community/awesome-webdriverio', 'main')
    await fs.promises.writeFile(newDocsPath, renderResourcesPage(content))
}
