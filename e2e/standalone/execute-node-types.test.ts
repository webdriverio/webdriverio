import { expect, test } from 'vitest'
import { startStandaloneChrome } from './helpers.js'

const ELEMENT_KEY = 'element-6066-11e4-a52e-4f735466cecf'
const SHADOW_ELEMENT_KEY = 'shadow-6066-11e4-a52e-4f735466cecf'

const PAGE = 'data:text/html,' + encodeURIComponent(
    '<ul id="list"><!-- a comment --><li>one</li> text <li>two</li></ul><p id="host"></p>' +
    '<script>document.getElementById("host").attachShadow({ mode: "open" }).innerHTML = "<b>in shadow</b>"</script>'
)

/**
 * reduce an `execute` result to the kind of value it is, so that WebDriver Bidi
 * and WebDriver Classic can be compared (Classic copies all node properties)
 */
function kind (value: unknown): unknown {
    if (Array.isArray(value)) {
        return value.map(kind)
    }
    if (value && typeof value === 'object') {
        if (ELEMENT_KEY in value) {
            return 'element'
        }
        if (SHADOW_ELEMENT_KEY in value) {
            return 'shadow root'
        }
        const { nodeType, nodeValue } = value as { nodeType?: number, nodeValue?: string }
        return { nodeType, nodeValue }
    }
    return value
}

test.each([false, true])('execute returns the same kind of value for each node type (classic: %s)', async (classic) => {
    const browser = await startStandaloneChrome(classic
        ? { capabilities: { browserName: 'chrome', 'wdio:enforceWebDriverClassic': true, 'goog:chromeOptions': { args: ['--headless=new', '--disable-gpu'] } } }
        : {}
    )

    try {
        expect(browser.isBidi).toBe(!classic)
        await browser.url(PAGE)
        await browser.waitUntil(() => browser.execute(() => Boolean(document.getElementById('host')?.shadowRoot)))

        const text = { nodeType: 3, nodeValue: ' text ' }
        const comment = { nodeType: 8, nodeValue: ' a comment ' }
        expect(kind(await browser.execute(() => document.getElementById('list')!.childNodes[2]))).toEqual(text)
        expect(kind(await browser.execute(() => document.getElementById('list')!.childNodes[0]))).toEqual(comment)
        expect(kind(await browser.execute(() => document.getElementById('list')!.childNodes[1]))).toBe('element')
        expect(kind(await browser.execute(() => document))).toBe('element')
        expect(kind(await browser.execute(() => Array.from(document.getElementById('list')!.childNodes))))
            .toEqual([comment, 'element', text, 'element'])
        expect(kind(await browser.execute(() => document.getElementById('list')!.childNodes)))
            .toEqual([comment, 'element', text, 'element'])

        const shadowRoot = await browser.execute(() => document.getElementById('host')!.shadowRoot)
        expect(kind(shadowRoot)).toBe('shadow root')
        /**
         * a shadow root reference can be passed back into `execute`
         */
        expect(await browser.execute((root) => (root as unknown as ShadowRoot).innerHTML, shadowRoot)).toBe('<b>in shadow</b>')
    } finally {
        await browser.deleteSession()
    }
})
