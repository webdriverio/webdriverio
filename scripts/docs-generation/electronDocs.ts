import fs from 'node:fs/promises'
import path from 'node:path'
import { downloadFromGitHub } from '../utils/index.js'

const __dirname = path.dirname(new URL(import.meta.url).pathname)

type ComplexPage = [string, ((content: string) => string)][]
interface PageProps {
    pages: string | ComplexPage
    id: string
}

const allDocs: Record<string, PageProps> = {
    'Configuration': {
        pages: [
            ['docs/configuration/service-configuration.md', (content) => content],
            ['docs/configuration/chromedriver-configuration.md', (content: string) => {
                return '## Chromedriver Configuration\n\n' + content.replace(/\n#/g, '\n##')
            }]
        ],
        id: 'configuration'
    },
    'Accessing Electron APIs': {
        pages: 'docs/electron-apis/accessing-apis.md',
        id: 'api'
    },
    'Mocking': {
        pages: 'docs/electron-apis/mocking-apis.md',
        id: 'mocking'
    },
    'Standalone Mode': {
        pages: 'docs/standalone-mode.md',
        id: 'standalone'
    }
}

const GITHUB_REPO = 'webdriverio-community/wdio-electron-service'
const GITHUB_URL = `https://raw.githubusercontent.com/${GITHUB_REPO}`
const DOCS_SHA = 'a2cb203f2d0c501736bdd03ac29d528c0a70fca4'

export async function generateElectronDocs () {
    const basePath = path.join(__dirname, '..', '..')
    const electronDocsPath = path.join(basePath, 'website', 'docs', 'desktop-testing', 'electron')
    await fs.mkdir(electronDocsPath, { recursive: true })

    for (const [title, { pages, id }] of Object.entries(allDocs)) {
        const newDocsPath = path.join(electronDocsPath, `${id}.md`)
        const sources = Array.isArray(pages) ? pages : [[pages, (content: string) => content]] as ComplexPage
        const content = (await Promise.all(sources.map(
            async ([page, transformer]) => transformer(
                /**
                 * download from GitHub
                 */
                (await downloadFromGitHub(GITHUB_URL, DOCS_SHA, page))
                    /**
                     * and remove first two lines
                     */
                    .split('\n').slice(2).join('\n')
                    /**
                     * transform image paths
                     */
                    .replace('../../.github', `https://raw.githubusercontent.com/${GITHUB_REPO}/${DOCS_SHA}/.github`)
            )
        ))).join('\n\n')
        await fs.writeFile(newDocsPath, `---
id: ${id}
title: ${title}
custom_edit_url: https://github.com/${GITHUB_REPO}/edit/main/${sources[0][1]}
---
${content}`)
        console.log(`Generated docs for ${newDocsPath}`)
    }
}
