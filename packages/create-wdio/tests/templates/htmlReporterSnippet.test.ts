import path from 'node:path'
import url from 'node:url'
import ejs from 'ejs'
import { describe, it, expect } from 'vitest'

const __dirname = path.dirname(url.fileURLToPath(import.meta.url))
const snippet = path.resolve(__dirname, '..', '..', 'src', 'templates', 'snippets', 'reporters.ejs')

describe('reporters snippet', () => {
    it('makes an HTML report with the html reporter, with no other setup', async () => {
        const output = await ejs.renderFile(snippet, { reporters: ['spec', 'html'] })
        expect(output).toContain('[\'html\', { outputDir: \'./reports/html-reports/\', produceHtml: true }]')
        expect(output).toContain('https://webdriver.io/docs/html-reporter')
    })
})
