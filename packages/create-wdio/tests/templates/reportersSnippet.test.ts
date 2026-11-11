import path from 'node:path'
import url from 'node:url'
import { describe, it, expect } from 'vitest'

import { renderFile } from '../../src/utils.js'

const __dirname = path.dirname(url.fileURLToPath(import.meta.url))
const SNIPPET = path.resolve(__dirname, '..', '..', 'src', 'templates', 'snippets', 'reporters.ejs')

const render = (reporters: string[]) => renderFile(SNIPPET, { reporters })

describe('reporters snippet', () => {
    it('tells that the video reporter needs ffmpeg', async () => {
        const snippet = await render(['spec', 'video'])
        expect(snippet).toContain("reporters: ['spec','video']")
        expect(snippet).toContain('https://webdriver.io/docs/video-reporter#install-ffmpeg')
    })

    it('adds no ffmpeg note without the video reporter', async () => {
        expect(await render(['spec'])).not.toContain('ffmpeg')
    })

    it('makes an HTML report with the html reporter, with no other setup', async () => {
        const snippet = await render(['spec', 'html'])
        expect(snippet).toContain('[\'html\', { outputDir: \'./reports/html-reports/\', produceHtml: true }]')
        expect(snippet).toContain('https://webdriver.io/docs/html-reporter')
    })
})
