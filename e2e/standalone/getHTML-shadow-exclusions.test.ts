import { afterAll, beforeAll, expect, test } from 'vitest'
import { remote } from 'webdriverio'

type FixtureWindow = Window & { readSnapshotFixture: () => string[] }

let browser: WebdriverIO.Browser

beforeAll(async () => {
    browser = await remote({
        logLevel: 'error',
        capabilities: {
            browserName: 'chrome',
            'goog:chromeOptions': { args: ['--headless=new', '--disable-gpu'] }
        }
    })
})

afterAll(async () => {
    await browser?.deleteSession()
})

test.each(['open', 'closed'] as const)('excludes elements from reconstructed %s and nested shadow roots in Node', async (mode) => {
    expect(globalThis.wdio).toBeUndefined()
    expect(browser.isBidi).toBe(true)

    await browser.url('data:text/html,<section id="snapshot"><span>Keep light</span><style>.light{color:red}</style><script type="application/json">{"level":"light"}</script><i class="omit">Drop light</i><x-outer></x-outer></section>')
    await browser.execute((outerMode: ShadowRootMode) => {
        const host = document.querySelector('x-outer')!
        const outer = host.attachShadow({ mode: outerMode })
        outer.innerHTML = '<span>Keep outer</span><style>.outer{color:red}</style><script type="application/json">{"level":"outer"}</script><i class="omit">Drop outer</i><x-inner></x-inner>'
        const inner = outer.querySelector('x-inner')!.attachShadow({ mode: outerMode === 'open' ? 'closed' : 'open' })
        inner.innerHTML = '<span>Keep inner</span><style>.inner{color:red}</style><script type="application/json">{"level":"inner"}</script><i class="omit">Drop inner</i>'
        const sheet = new CSSStyleSheet()
        sheet.replaceSync(':host { display: block; }')
        outer.adoptedStyleSheets = [sheet]
        ;(window as FixtureWindow).readSnapshotFixture = () => [
            document.querySelector('#snapshot')!.innerHTML,
            outer.innerHTML,
            inner.innerHTML,
            sheet.cssRules[0].cssText
        ]
    }, mode)

    const element = await browser.$('#snapshot')
    // Wait for the real BiDi shadow-root notifications, not a stubbed manager.
    await browser.waitUntil(async () => {
        const html = await element.getHTML({ prettify: false })
        return html.includes('Keep outer') && html.includes('Keep inner')
    }, { timeout: 5000, interval: 100 })

    const unfiltered = await element.getHTML({ prettify: false })
    expect(unfiltered.match(/<template shadowrootmode=/g)).toHaveLength(2)
    expect(unfiltered).toContain('<style>')
    expect(unfiltered).toContain('<script')
    expect(unfiltered).toContain('Drop inner')
    const liveBefore = await browser.execute(() => (window as FixtureWindow).readSnapshotFixture())

    for (const includeSelectorTag of [true, false]) {
        const html = await element.getHTML({
            pierceShadowRoot: true,
            includeSelectorTag,
            excludeElements: ['style', 'script', '.omit'],
            prettify: false
        })
        expect(html.match(/<template shadowrootmode=/g)).toHaveLength(2)
        expect(html).toContain('<template shadowrootmode="open">')
        expect(html).toContain('<template shadowrootmode="closed">')
        expect(html).toContain('Keep light')
        expect(html).toContain('Keep outer')
        expect(html).toContain('Keep inner')
        expect(html).not.toMatch(/<(?:style|script)\b/)
        expect(html).not.toContain('class="omit"')
        expect(html).not.toContain('Drop ')
        expect(html.includes('<section')).toBe(includeSelectorTag)
        expect(await browser.execute(() => (window as FixtureWindow).readSnapshotFixture())).toEqual(liveBefore)
    }
})
