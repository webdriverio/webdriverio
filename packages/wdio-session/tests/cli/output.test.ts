import { describe, expect, it } from 'vitest'

import { renderResult } from '../../src/cli/output.js'

const opts = { session: 'default', action: 'click' }

describe('renderResult', () => {
    it('prints the code an action ran after its text', () => {
        expect(renderResult({ text: 'Clicked e3', code: 'await $(\'#a\').click()' }, opts)).toBe('Clicked e3\n→ await $(\'#a\').click()\n')
    })

    it('prints short multi-line code as is', () => {
        const code = 'const page2 = await browser.newWindow(\'/cart\')\nawait page2.close()'
        expect(renderResult({ text: 'Closed tab', code }, opts)).toBe(`Closed tab\n→ ${code}\n`)
    })

    it('prints only the first line of long code', () => {
        const code = `await browser.waitUntil(async () => {\n    const state = await browser.execute(function probe () {\n${'        state.n++\n'.repeat(20)}    })\n    return state.ready\n})`
        expect(renderResult({ text: 'Page is network-idle', code }, opts)).toBe('Page is network-idle\n→ await browser.waitUntil(async () => { …\n')
    })

    it('cuts long single-line code', () => {
        const line = renderResult({ code: `await browser.execute(${'x'.repeat(400)})` }, opts).trimEnd()
        expect(line.length).toBeLessThanOrEqual(162)
        expect(line.endsWith('…')).toBe(true)
    })

    it('prints no code with --quiet', () => {
        expect(renderResult({ text: 'value', code: 'await browser.getUrl()' }, { ...opts, quiet: true })).toBe('value\n')
    })
})
