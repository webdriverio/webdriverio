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

function harness () {
    const store = new Map<string, unknown>()
    const page = {
        contextId: 'tab-1',
        isFrame: false,
        url: 'https://a.test/',
        getUrl: async () => 'https://a.test/',
        frame: vi.fn()
    }
    const outer = { contextId: 'outer-ctx', isFrame: true, parent: page, frame: vi.fn() }
    const inner = { contextId: 'inner-ctx', isFrame: true, parent: outer, frame: vi.fn() }
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
            browsingContexts: async () => [page],
            browsingContextGetTree: async () => ({
                contexts: [{ context: 'tab-1', url: 'https://a.test/' }, { context: 'tab-2', url: 'https://b.test/' }]
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

describe('tabs close (BiDi)', () => {
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
