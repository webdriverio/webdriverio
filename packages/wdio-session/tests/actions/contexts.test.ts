import { describe, expect, it, vi } from 'vitest'

import type { Session } from '../../src/session.js'

vi.mock('webdriverio', () => ({
    getContextManager: () => ({ setCurrentContext: vi.fn() })
}))

vi.mock('../../src/snapshot/target.js', () => ({
    resolveTarget: async (_session: Session, target: string) => ({
        element: { getTagName: async () => 'iframe' },
        code: `$('${target}')`,
        label: target
    })
}))

const { frame, tabs } = await import('../../src/actions/contexts.js')

function harness ({ secondUrl = 'https://b.test/', outerSiblings = ['https://a.test/outer.html'] } = {}) {
    const store = new Map<string, unknown>()
    const page = {
        contextId: 'tab-1',
        isFrame: false,
        url: 'https://a.test/',
        getUrl: async () => 'https://a.test/',
        frame: vi.fn()
    }
    const second = { contextId: 'tab-2', isFrame: false, url: secondUrl, getUrl: async () => secondUrl }
    const outer = {
        contextId: 'outer-ctx',
        isFrame: true,
        url: '',
        parent: page,
        getUrl: async () => 'https://a.test/outer.html',
        frame: vi.fn()
    }
    const inner = { contextId: 'inner-ctx', isFrame: true, url: '', parent: outer, frame: vi.fn() }
    page.frame.mockResolvedValue(outer)
    outer.frame.mockResolvedValue(inner)
    const history = { entries: [] as { code: string }[], generation: 0 }
    const closeWindow = vi.fn()
    const session = {
        isBidi: true,
        history,
        get: (key: string) => store.get(key),
        set: (key: string, value: unknown) => {
            store.set(key, value)
        },
        browser: {
            getWindowHandle: async () => 'tab-1',
            getWindowHandles: async () => ['tab-1', 'tab-2'],
            browsingContexts: async () => [page, second],
            browsingContextGetTree: async (params: { root?: string }) => params.root === 'tab-1'
                ? { contexts: [{ context: 'tab-1', children: outerSiblings.map((url, i) => ({ context: i ? `sibling-${i}` : 'outer-ctx', url })) }] }
                : { contexts: [{ context: 'tab-1', url: 'https://a.test/' }, { context: 'tab-2', url: secondUrl }] },
            scriptCallFunction: async () => ({
                type: 'success',
                result: {
                    type: 'array',
                    value: [
                        { type: 'window', value: { context: 'sibling-1' } },
                        { type: 'window', value: { context: 'outer-ctx' } }
                    ]
                }
            }),
            scriptEvaluate: async () => ({ type: 'success', result: { type: 'string', value: 'Title' } }),
            switchToWindow: vi.fn(),
            closeWindow
        }
    } as unknown as Session
    const record = async (code?: string) => {
        if (code) {
            history.entries.push({ code })
        }
        return code
    }
    return { session, history, page, outer, closeWindow, record }
}

describe('frame (BiDi)', () => {
    it('declares each held context once and enters a nested frame from its owner', async () => {
        const { session, history, page, outer, record } = harness()

        expect(await record((await frame(session, { target: 'iframe#outer', $cwd: '/' })).history)).toBe(
            "const page = (await browser.browsingContexts()).find((context) => context.url === 'https://a.test/')!\n" +
            "const frame = await page.frame(page.$('iframe#outer'))"
        )
        expect(page.frame).toHaveBeenCalled()

        expect(await record((await frame(session, { target: 'iframe#inner', $cwd: '/' })).history))
            .toBe("const frame2 = await frame.frame(frame.$('iframe#inner'))")
        expect(outer.frame).toHaveBeenCalled()

        expect((await frame(session, { target: 'parent', $cwd: '/' })).history).toBe('')
        expect((await frame(session, { target: 'top', $cwd: '/' })).history).toBe('')
        expect((await frame(session, { target: 'iframe#outer', $cwd: '/' })).history).toBe('')

        const declared = history.entries.flatMap((entry) => entry.code.match(/const \w+ =/g) ?? [])
        expect(declared).toEqual(['const page =', 'const frame =', 'const frame2 ='])
    })

    it('declares contexts again after the history is cleared', async () => {
        const { session, history, record } = harness()
        await record((await frame(session, { target: 'iframe#outer', $cwd: '/' })).history)
        await frame(session, { target: 'top', $cwd: '/' })

        history.entries = []
        history.generation++
        expect((await frame(session, { target: 'iframe#outer', $cwd: '/' })).history).toBe(
            "const page = (await browser.browsingContexts()).find((context) => context.url === 'https://a.test/')!\n" +
            "const frame = await page.frame(page.$('iframe#outer'))"
        )
    })
})

describe('frame (BiDi) after a cleared history', () => {
    it('declares the held parent frame by URL before entering a nested frame', async () => {
        const { session, history, record } = harness()
        await record((await frame(session, { target: 'iframe#outer', $cwd: '/' })).history)

        history.entries = []
        history.generation++
        expect((await frame(session, { target: 'iframe#inner', $cwd: '/' })).history).toBe(
            "const page = (await browser.browsingContexts()).find((context) => context.url === 'https://a.test/')!\n" +
            "const frame = await page.frame('https://a.test/outer.html')\n" +
            "const frame2 = await frame.frame(frame.$('iframe#inner'))"
        )
    })
})

describe('frame (BiDi) with sibling frames on the same URL', () => {
    it('finds the held parent frame by its position among the frame elements', async () => {
        const { session, history, record } = harness({ outerSiblings: ['https://a.test/outer.html', 'https://a.test/outer.html'] })
        await record((await frame(session, { target: 'iframe#outer', $cwd: '/' })).history)

        history.entries = []
        history.generation++
        expect((await frame(session, { target: 'iframe#inner', $cwd: '/' })).history).toBe(
            "const page = (await browser.browsingContexts()).find((context) => context.url === 'https://a.test/')!\n" +
            "const frame = await page.frame(page.$$('iframe, frame')[1])\n" +
            "const frame2 = await frame.frame(frame.$('iframe#inner'))"
        )
    })
})

describe('tabs close (BiDi)', () => {
    it('does not keep the page variable when closing fails', async () => {
        const { session, closeWindow } = harness()
        closeWindow.mockRejectedValueOnce(new Error('no such window'))
        await expect(tabs(session, { sub: 'close', arg: '1', $cwd: '/' })).rejects.toThrow('no such window')

        const result = await tabs(session, { sub: 'switch', arg: '1', $cwd: '/' })
        expect(result.history).toBe("const page = (await browser.browsingContexts()).find((context) => context.url === 'https://b.test/')!")
    })

    it('tells tabs with the same URL apart by their order', async () => {
        const { session } = harness({ secondUrl: 'https://a.test/' })
        const result = await tabs(session, { sub: 'close', arg: '1', $cwd: '/' })
        expect(result.history).toBe(
            "const page = (await browser.browsingContexts()).filter((context) => context.url === 'https://a.test/')[1]!\n" +
            'await page.closeWindow()\n' +
            "const page2 = (await browser.browsingContexts()).filter((context) => context.url === 'https://a.test/')[0]!"
        )
    })

    it('closes the held page instead of the session window', async () => {
        const { session, closeWindow } = harness()
        const result = await tabs(session, { sub: 'close', arg: '1', $cwd: '/' })
        expect(closeWindow).toHaveBeenCalledTimes(1)
        expect(result.history).toBe(
            "const page = (await browser.browsingContexts()).find((context) => context.url === 'https://b.test/')!\n" +
            'await page.closeWindow()\n' +
            "const page2 = (await browser.browsingContexts()).find((context) => context.url === 'https://a.test/')!"
        )
    })
})
