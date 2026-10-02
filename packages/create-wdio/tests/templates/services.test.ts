import path from 'node:path'
import url from 'node:url'

import ejs from 'ejs'
import { describe, expect, it } from 'vitest'

const __dirname = path.dirname(url.fileURLToPath(import.meta.url))
const SNIPPET = path.resolve(__dirname, '..', '..', 'src', 'templates', 'snippets', 'services.ejs')

describe('services snippet', () => {
    it('configures the AI service with the model from the environment', async () => {
        const rendered = await ejs.renderFile(SNIPPET, { answers: { services: ['ai', 'visual'], rawAnswers: {} } })
        expect(rendered).toContain(`[
        'ai',
        {`)
        expect(rendered).toContain('model: process.env.WDIO_AI_MODEL')
        expect(rendered).toContain('https://webdriver.io/docs/ai-steps')
        expect(rendered).toContain('\'visual\'')
    })
})
