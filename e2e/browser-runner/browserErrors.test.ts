import { expect } from '@wdio/globals'

/**
 * Browser errors that happen while the tests run belong to the tests: Mocha
 * reports the results, so the runner must not end the spec (#14216, #14255).
 */
describe('browser errors during the tests', () => {
    it('passes when the code under test logs a console.error', () => {
        console.error('a console.error from the code under test')
    })

    it('passes when the test handles a failed request', async () => {
        let failed = false
        try {
            await fetch('http://127.0.0.1:9/unreachable', { method: 'POST' })
        } catch {
            failed = true
        }
        expect(failed).toBe(true)
    })

    it('passes when the page renders an invalid SVG attribute', () => {
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
        const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect')
        rect.setAttribute('height', '-25.7')
        svg.appendChild(rect)
        document.body.appendChild(svg)
        svg.remove()
    })

    it('still runs after the runner checked the browser errors', async () => {
        // the runner checks the browser errors every 500 ms
        await new Promise((resolve) => setTimeout(resolve, 1500))
        expect(document.title).toBe('WebdriverIO Browser Test')
    })
})
