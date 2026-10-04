import { describe, expect, it, vi } from 'vitest'

import type { Session } from '../../src/session.js'

vi.mock('webdriverio', () => ({
    getContextManager: () => ({ setCurrentContext: vi.fn() })
}))

let src = 'https://widget.test/calc.html#a'
vi.mock('../../src/snapshot/target.js', () => ({
    resolveTarget: async (_session: Session, target: string) => ({
        element: { getTagName: async () => 'iframe', getProperty: async () => src },
        code: `$('${target}')`,
        label: target
    })
}))

const { frame } = await import('../../src/actions/contexts.js')

type Node = { context: string, url: string, children?: Node[] }

/**
 * A page whose `frame(element)` lookup is blocked (site isolation), so the
 * action falls back to the frame's URL; `frames` is the context tree below it.
 */
function blockedPage (frames: Node[], { loadAfter = 0 } = {}) {
    let calls = 0
    const store = new Map<string, unknown>()
    const page = {
        contextId: 'tab-1',
        isFrame: false,
        url: 'https://a.test/',
        getUrl: async () => 'https://a.test/',
        frame: vi.fn(async (query: unknown) => {
            if (typeof query !== 'function') {
                const err = new Error('SecurityError: Blocked a frame with origin "https://a.test" from accessing a cross-origin frame.')
                throw err
            }
            return { contextId: 'found', isFrame: true, parent: undefined, url: '' }
        })
    }
    const session = {
        isBidi: true,
        history: { entries: [], generation: 0 },
        get: (key: string) => store.get(key),
        set: (key: string, value: unknown) => store.set(key, value),
        browser: {
            getWindowHandle: async () => 'tab-1',
            browsingContexts: async () => [page],
            options: { waitforTimeout: 2000 },
            // the frame's context reports its URL only after `loadAfter` lookups
            browsingContextGetTree: async () => ({
                contexts: [{ context: 'tab-1', url: 'https://a.test/', children: calls++ < loadAfter ? frames.map((f) => ({ ...f, url: 'about:blank' })) : frames }]
            })
        }
    } as unknown as Session
    return { session, page }
}

describe('frame (BiDi) when the browser blocks looking into a cross-site frame', () => {
    it('enters the frame by its URL when no other frame loads it', async () => {
        src = 'https://widget.test/calc.html#a'
        const { session, page } = blockedPage([{ context: 'f1', url: 'https://widget.test/calc.html' }, { context: 'f2', url: 'https://ads.test/' }])
        const result = await frame(session, { target: 'e5', $cwd: '/' })
        expect(result.text).toBe('Switched to frame e5')
        expect(page.frame).toHaveBeenCalledTimes(2)
    })

    it('waits for a frame that is still loading', async () => {
        src = 'https://widget.test/calc.html'
        const { session, page } = blockedPage([{ context: 'f1', url: 'https://widget.test/calc.html' }], { loadAfter: 2 })
        const result = await frame(session, { target: 'e5', $cwd: '/' })
        expect(result.text).toBe('Switched to frame e5')
        expect(page.frame).toHaveBeenCalledTimes(2)
    })

    it('gives up when the frame never loads the URL', async () => {
        src = 'https://widget.test/calc.html'
        const { session } = blockedPage([{ context: 'f1', url: 'https://widget.test/calc.html' }], { loadAfter: 1000 })
        await expect(frame(session, { target: 'e5', $cwd: '/' })).rejects.toThrow('no frame on the page has loaded https://widget.test/calc.html.')
    })

    it('refuses when another frame differs only by its fragment', async () => {
        src = 'https://widget.test/calc.html#b'
        const { session } = blockedPage([{ context: 'f1', url: 'https://widget.test/calc.html#a' }, { context: 'f2', url: 'https://widget.test/calc.html#b' }])
        await expect(frame(session, { target: 'e5', $cwd: '/' })).rejects.toThrow("e5 can't be entered: the browser blocks looking into it, and 2 frames on the page load https://widget.test/calc.html.")
    })

    it('counts frames at any depth, e.g. one nested in another frame or in a shadow root', async () => {
        src = 'https://widget.test/calc.html'
        const { session } = blockedPage([
            { context: 'f1', url: 'https://widget.test/calc.html' },
            { context: 'f2', url: 'https://other.test/', children: [{ context: 'f3', url: 'https://widget.test/calc.html' }] }
        ])
        await expect(frame(session, { target: 'e5', $cwd: '/' })).rejects.toThrow('and 2 frames on the page load')
    })
})
