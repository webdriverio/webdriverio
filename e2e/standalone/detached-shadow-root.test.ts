import { expect, test } from 'vitest'
import { remote } from 'webdriverio'

const cases = [
    { mode: 'open', initiallyConnected: false },
    { mode: 'closed', initiallyConnected: false },
    { mode: 'open', initiallyConnected: true },
    { mode: 'closed', initiallyConnected: true }
] as const

test.each(cases)('serializes $mode shadow host once (initiallyConnected: $initiallyConnected)', async (options) => {
    const browser = await remote({
        capabilities: {
            browserName: 'chrome',
            'goog:chromeOptions': { args: ['--headless=new'] }
        }
    })

    try {
        await browser.url('data:text/html,<main>Detached shadow host</main>')
        await browser.execute(({ mode, initiallyConnected }) => {
            const host = document.createElement('div') as HTMLDivElement & { testShadowRoot: ShadowRoot }
            host.id = 'detached-shadow-host'
            host.innerHTML = '<span>Light content</span>'
            if (initiallyConnected) {
                document.body.append(host)
            }
            host.testShadowRoot = host.attachShadow({ mode })
            host.testShadowRoot.innerHTML = '<p>Shadow content</p>'
            if (!initiallyConnected) {
                document.body.append(host)
            }
        }, options)

        const snapshot = await browser.$('#detached-shadow-host').getHTML({ prettify: false })
        expect(snapshot.match(/shadowrootmode=/g)).toHaveLength(1)
        expect(snapshot).toContain(`shadowrootmode="${options.mode}"`)
        expect(snapshot.match(/<p>Shadow content<\/p>/g)).toHaveLength(1)
        expect(snapshot).toContain('<span>Light content</span>')
        expect(await browser.execute(() => {
            const host = document.querySelector('#detached-shadow-host') as HTMLDivElement & { testShadowRoot: ShadowRoot }
            return { connected: host.isConnected, light: host.innerHTML, shadow: host.testShadowRoot.innerHTML }
        })).toEqual({ connected: true, light: '<span>Light content</span>', shadow: '<p>Shadow content</p>' })
    } finally {
        await browser.deleteSession()
    }
})

test.each(['open', 'closed'] as const)('keeps a detached %s host when another host registers the document root', async (mode) => {
    const browser = await remote({
        capabilities: { browserName: 'chrome', 'goog:chromeOptions': { args: ['--headless=new'] } }
    })
    try {
        await browser.url('data:text/html,<main id="area"></main>')
        await browser.execute((mode) => {
            const first = document.createElement('div') as HTMLDivElement & { testShadowRoot: ShadowRoot }
            first.id = 'first-host'
            first.testShadowRoot = first.attachShadow({ mode })
            first.testShadowRoot.innerHTML = '<p>Shadow A</p>'
            document.querySelector('#area')!.append(first)
        }, mode)
        await browser.execute(() => {
            const second = document.createElement('div') as HTMLDivElement & { testShadowRoot: ShadowRoot }
            second.id = 'second-host'
            document.querySelector('#area')!.append(second)
            second.testShadowRoot = second.attachShadow({ mode: 'open' })
            second.testShadowRoot.innerHTML = '<p>Shadow B</p>'
        })

        const snapshot = await browser.$('#area').getHTML({ prettify: false })
        expect(snapshot.match(/shadowrootmode=/g)).toHaveLength(2)
        expect(snapshot.match(/<p>Shadow A<\/p>/g)).toHaveLength(1)
        expect(snapshot.match(/<p>Shadow B<\/p>/g)).toHaveLength(1)
        expect(await browser.execute(() => Array.from(document.querySelectorAll('#area > div')).map((node) => {
            const host = node as HTMLDivElement & { testShadowRoot: ShadowRoot }
            return { connected: host.isConnected, content: host.testShadowRoot.innerHTML }
        }))).toEqual([
            { connected: true, content: '<p>Shadow A</p>' },
            { connected: true, content: '<p>Shadow B</p>' }
        ])
    } finally {
        await browser.deleteSession()
    }
})
