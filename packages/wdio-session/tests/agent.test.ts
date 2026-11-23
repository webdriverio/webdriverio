import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

import { fileURLToPath } from 'node:url'

import { afterEach, describe, expect, it, vi } from 'vitest'
import type { SnapshotNode } from '@wdio/snapshot'

import { createAgentSession } from '../src/agent.js'
import { IMPLEMENTATIONS } from '../src/actions/index.js'

const contextManager = vi.hoisted(() => ({ current: 'page', getCurrentContext: vi.fn(), setCurrentContext: vi.fn() }))
vi.mock('webdriverio', () => ({
    getContextManager: () => contextManager
}))

function mockBrowser (overrides: Record<string, unknown> = {}) {
    return {
        capabilities: { browserName: 'chrome' },
        isBidi: true,
        sessionSubscribe: vi.fn().mockResolvedValue(undefined),
        on: vi.fn(),
        off: vi.fn(),
        deleteSession: vi.fn(),
        getUrl: vi.fn().mockResolvedValue('https://example.com/shop'),
        ...overrides
    } as unknown as WebdriverIO.Browser
}

const ANDROID_XML = fs.readFileSync(fileURLToPath(new URL('../../wdio-snapshot/tests/__fixtures__/pagesource/android.xml', import.meta.url)), 'utf-8')

const document = (name: string, children: SnapshotNode[]): SnapshotNode => ({ role: 'document', name, children })
const pay = { role: 'button', name: 'Pay', ref: 'e1', interactive: true }

/** a page whose tree and URL are whatever `page` holds right now */
function pageBrowser (page: { url: string, tree: SnapshotNode }) {
    return mockBrowser({
        isBidi: false,
        getUrl: vi.fn(async () => page.url),
        getWindowHandles: vi.fn(async () => ['w1']),
        execute: vi.fn(async () => ({ tree: page.tree, refs: [{ id: 'e1', role: 'button', name: 'Pay', candidates: [{ selector: '#pay' }] }], counter: 1 }))
    })
}

describe('createAgentSession', () => {
    const dirs: string[] = []
    const tmp = () => {
        const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'wdio-agent-test-'))
        dirs.push(dir)
        return dir
    }

    afterEach(() => {
        for (const dir of dirs.splice(0)) {
            fs.rmSync(dir, { recursive: true, force: true })
        }
    })

    it('wraps a browser it does not own and keeps the history in memory', async () => {
        const artifactsDir = tmp()
        const browser = mockBrowser()
        const agent = await createAgentSession(browser, { artifactsDir })

        expect(agent.browser).toBe(browser)
        expect(agent.session.plan).toMatchObject({ target: 'agent', detach: true, platform: 'browser', label: 'chrome' })
        agent.session.history.append({ kind: 'action', code: 'await $(\'#a\').click()' })
        expect(agent.history.map((entry) => entry.code)).toEqual(['await $(\'#a\').click()'])
        expect(fs.existsSync(path.join(artifactsDir, 'history.json'))).toBe(false)
    })

    it('creates a temporary artifacts directory when none is given', async () => {
        const agent = await createAgentSession(mockBrowser())
        dirs.push(agent.session.artifactsDir)
        expect(fs.existsSync(agent.session.artifactsDir)).toBe(true)
        expect(agent.session.artifactsDir.startsWith(os.tmpdir())).toBe(true)
    })

    it('lists the actions that apply to the platform', async () => {
        const web = await createAgentSession(mockBrowser(), { artifactsDir: tmp() })
        const names = web.actions.map((spec) => spec.name)
        expect(names).toEqual(expect.arrayContaining(['click', 'fill', 'snapshot', 'navigate']))
        expect(names).not.toContain('tap')
        expect(names).not.toContain('swipe')

        const android = await createAgentSession(mockBrowser({
            capabilities: { platformName: 'Android' },
            isBidi: false
        }), { artifactsDir: tmp() })
        const mobile = android.actions.map((spec) => spec.name)
        expect(mobile).toEqual(expect.arrayContaining(['tap', 'swipe']))
        expect(mobile).not.toContain('navigate')
    })

    it('runs actions through the session dispatcher and returns their code', async () => {
        const agent = await createAgentSession(mockBrowser(), { artifactsDir: tmp() })
        const dispatch = vi.spyOn(agent.session, 'dispatch').mockResolvedValue({ text: 'Clicked e3', code: 'await $(\'#buy\').click()' })
        await expect(agent.run('click', { target: 'e3' })).resolves.toEqual({ text: 'Clicked e3', code: 'await $(\'#buy\').click()' })
        expect(dispatch).toHaveBeenCalledWith({ action: 'click', args: { target: 'e3' }, cwd: agent.session.cwd }, { detail: true })
    })

    it('rejects unsupported timeouts on non-exec actions', async () => {
        const agent = await createAgentSession(mockBrowser(), { artifactsDir: tmp() })
        await expect(agent.runAction('wait', { target: '30000' }, { timeout: 500 }))
            .rejects.toThrow('only supported for exec')
    })

    describe('exec', () => {
        const execAgent = (overrides: Record<string, unknown> = {}) => createAgentSession(mockBrowser({
            capabilities: { platformName: 'Android' },
            isBidi: false,
            options: {},
            ...overrides
        }), { artifactsDir: tmp(), captureNetwork: false })

        it('executes the typed inline source', async () => {
            const agent = await execAgent()
            await expect(agent.run('exec', { e: 'console.log("typed")' })).resolves.toMatchObject({ text: 'typed' })
            await expect(agent.run('exec', { code: '42', e: '0' })).resolves.toMatchObject({ text: '42' })
        })

        it('returns exactly the recorded code and omits it for unrecorded runs', async () => {
            const agent = await execAgent()
            const code = 'const n = 41; console.log("n is", n + 1)'
            const recorded = await agent.runAction('exec', { code: `  ${code}  ` })
            expect(recorded).toMatchObject({ text: 'n is 42', code })
            expect(agent.history).toMatchObject([{ kind: 'exec', code }])

            const read = await agent.run('exec', { code: 'n' })
            expect(read.text).toBe('41')
            expect(read).not.toHaveProperty('code')
            const skipped = await agent.run('exec', { code: 'console.log(n)', history: false })
            expect(skipped.text).toBe('41')
            expect(skipped).not.toHaveProperty('code')
            expect(agent.history).toHaveLength(1)
        })

        it('passes JSON arguments and returns code that replays without them', async () => {
            const agent = await execAgent()
            const input = [41, { label: "a quote: '\"\n", items: [true, null] }] as const
            const code = 'console.log(args[1].label, args[0] + 1, JSON.stringify(args[1].items)); args.pop()'
            const result = await agent.runAction('exec', { code, args: input })
            expect(result.text).toBe(`${input[1].label} 42 [true,null]\n${JSON.stringify(input[1], null, 2)}`)
            expect(input).toHaveLength(2)
            expect(typeof result.code).toBe('string')
            expect(result.code).toBe(agent.history.at(-1)?.code)

            const fresh = await execAgent()
            const replay = await fresh.run('exec', { code: result.code! })
            expect(replay.text).toBe(result.text)
            const read = await agent.run('exec', { code: 'args.length', args: [] })
            expect(read.text).toBe('0')
            expect(read).not.toHaveProperty('code')
            expect((await agent.run('exec', { code: 'typeof args', history: false })).text).toBe('undefined')
            expect(agent.history).toHaveLength(1)
        })

        it.each([
            ['run', 25],
            ['runAction', 25],
            ['default', 60_000]
        ] as const)('enforces the %s exec timeout and reports partial output', async (method, timeout) => {
            vi.useFakeTimers()
            try {
                const started = Promise.withResolvers<void>()
                const agent = await execAgent({
                    pause: () => {
                        started.resolve()
                        return new Promise((resolve) => setTimeout(resolve, 61_000))
                    }
                })
                const code = 'console.log("before"); await browser.pause(); console.log("after")'
                const outcomes: unknown[] = []
                const pending = (method === 'runAction'
                    ? agent.runAction('exec', { code }, { timeout })
                    : method === 'run'
                        ? agent.run('exec', { code, e: code }, { timeout })
                        : agent.runAction('exec', { code })
                ).then((value) => outcomes.push(value), (error) => outcomes.push(error))
                await Promise.race([started.promise, pending])
                await vi.advanceTimersByTimeAsync(timeout - 1)
                expect(outcomes).toEqual([])
                await vi.advanceTimersByTimeAsync(1)
                expect(outcomes).toMatchObject([{ code: 'TIMEOUT', details: 'Output so far:\nbefore' }])
                await vi.runAllTimersAsync()
                await pending
                expect(agent.history).toEqual([])
                expect((await agent.run('exec', { code: '1 + 1' })).text).toBe('2')
            } finally {
                vi.useRealTimers()
            }
        })
    })

    it('looks up refs with or without the @ prefix', async () => {
        const agent = await createAgentSession(mockBrowser(), { artifactsDir: tmp() })
        agent.session.refs.set({ id: 'e3', kind: 'web', role: 'button', name: 'Buy', candidates: ['role/button[name="Buy"]'], generation: 1 })
        expect(agent.ref('e3')?.name).toBe('Buy')
        expect(agent.ref('@e3')?.candidates).toEqual(['role/button[name="Buy"]'])
        expect(agent.ref('e99')).toBeUndefined()
    })

    it('captures network events by default and console events only when asked', async () => {
        const networkOnly = mockBrowser()
        await createAgentSession(networkOnly, { artifactsDir: tmp() })
        expect(networkOnly.sessionSubscribe).toHaveBeenCalledWith({
            events: ['network.beforeRequestSent', 'network.responseCompleted', 'network.fetchError']
        })
        expect(networkOnly.on).not.toHaveBeenCalledWith('log.entryAdded', expect.any(Function))

        const quiet = mockBrowser()
        await createAgentSession(quiet, { artifactsDir: tmp(), captureNetwork: false })
        expect(quiet.sessionSubscribe).not.toHaveBeenCalled()

        const capturing = mockBrowser()
        await createAgentSession(capturing, { artifactsDir: tmp(), captureEvents: true })
        expect(capturing.sessionSubscribe).toHaveBeenCalledWith({
            events: ['log.entryAdded', 'network.beforeRequestSent', 'network.responseCompleted', 'network.fetchError']
        })
    })

    it('stops capturing on dispose and leaves the browser session open', async () => {
        const browser = mockBrowser()
        const agent = await createAgentSession(browser, { artifactsDir: tmp(), captureEvents: true })
        await agent.dispose()
        expect(browser.off).toHaveBeenCalledWith('log.entryAdded', expect.any(Function))
        expect(browser.deleteSession).not.toHaveBeenCalled()
    })

    it('pins an element as a ref the session can resolve', async () => {
        const execute = vi.fn().mockResolvedValue(undefined)
        const agent = await createAgentSession(mockBrowser({ execute }), { artifactsDir: tmp() })
        const element = { elementId: 'el-1', selector: '#products' } as unknown as WebdriverIO.Element
        const first = await agent.pin(element)
        const second = await agent.pin(element)
        expect(first).toMatch(/^e\d+$/)
        expect(second).not.toBe(first)
        expect(execute).toHaveBeenCalledWith(expect.any(Function), element, first)
        expect(agent.ref(first)).toMatchObject({ id: first, kind: 'web', role: 'scope', candidates: ['#products'] })
    })

    it('enters a held frame and goes back to the context before', async () => {
        contextManager.getCurrentContext.mockResolvedValue('page')
        contextManager.setCurrentContext.mockClear()
        const switchToWindow = vi.fn().mockResolvedValue(undefined)
        const agent = await createAgentSession(mockBrowser({ switchToWindow }), { artifactsDir: tmp() })
        const page = { contextId: 'page', isFrame: false } as unknown as WebdriverIO.BrowsingContext
        const frame = { contextId: 'frame-1', isFrame: true, url: 'https://pay.example/', parent: page } as unknown as WebdriverIO.BrowsingContext

        const leave = await agent.enter(frame)
        expect(contextManager.setCurrentContext).toHaveBeenLastCalledWith('page')
        expect(contextManager.setCurrentContext).not.toHaveBeenCalledWith('frame-1')
        expect(agent.session.get('activeContext')).toBe(frame)
        expect(agent.scope).toBe(frame)
        expect(switchToWindow).not.toHaveBeenCalled()

        await leave()
        expect(contextManager.setCurrentContext).toHaveBeenLastCalledWith('page')
        expect(agent.session.get('activeContext')).toBeUndefined()
        expect(agent.scope).toBe(agent.browser)
    })

    it('switches to a held tab and back', async () => {
        contextManager.getCurrentContext.mockResolvedValue('page')
        const switchToWindow = vi.fn().mockResolvedValue(undefined)
        const agent = await createAgentSession(mockBrowser({ switchToWindow }), { artifactsDir: tmp() })
        const tab = { contextId: 'tab-2', isFrame: false } as unknown as WebdriverIO.BrowsingContext

        const leave = await agent.enter(tab)
        expect(switchToWindow).toHaveBeenLastCalledWith('tab-2')
        expect(contextManager.setCurrentContext).toHaveBeenLastCalledWith('tab-2')
        await leave()
        expect(switchToWindow).toHaveBeenLastCalledWith('page')
        expect(contextManager.setCurrentContext).toHaveBeenLastCalledWith('page')
    })

    describe('snapshot', () => {
        it('returns the snapshot without writing an artifact', async () => {
            const artifactsDir = tmp()
            const agent = await createAgentSession(pageBrowser({ url: 'http://x/', tree: document('Shop', [pay]) }), { artifactsDir })
            const snapshot = await agent.snapshot({ interactive: true })
            expect(snapshot.text).toContain('button "Pay" [ref=e1]')
            expect(snapshot).toMatchObject({ lines: 2, refs: 1, tooBig: false, page: { url: 'http://x/', title: 'Shop' } })
            expect(snapshot.tree.role).toBe('document')
            expect(snapshot.chars).toBe(snapshot.text.length)
            expect(fs.existsSync(path.join(artifactsDir, 'snapshots'))).toBe(false)
            expect(agent.ref('e1')?.candidates).toEqual(['#pay'])
        })

        it('does not return a snapshot above maxChars, only its size', async () => {
            const agent = await createAgentSession(pageBrowser({ url: 'http://x/', tree: document('Shop', [pay]) }), { artifactsDir: tmp() })
            const snapshot = await agent.snapshot({ maxChars: 10 })
            expect(snapshot.tooBig).toBe(true)
            expect(snapshot.text).toBe(`Snapshot: 2 lines, 1 refs, ${snapshot.chars} chars: too big to return (max 10). Use \`wdio session find <text>\` or \`scope\`.`)
            expect(snapshot.tree.children).toHaveLength(1)
            expect(snapshot.refs).toBe(1)
        })

        it('names the hint of the caller in the summary', async () => {
            const hint = vi.fn((command: string) => command === 'find' ? 'find_text' : undefined)
            const agent = await createAgentSession(pageBrowser({ url: 'http://x/', tree: document('Shop', [pay]) }), { artifactsDir: tmp(), hint })
            expect((await agent.snapshot({ maxChars: 10 })).text).toContain('Use `find_text` or `scope`.')
        })

        it('works on a native app', async () => {
            const agent = await createAgentSession(mockBrowser({
                capabilities: { platformName: 'Android' },
                isBidi: false,
                getPageSource: vi.fn().mockResolvedValue(ANDROID_XML)
            }), { artifactsDir: tmp() })
            const snapshot = await agent.snapshot({ interactive: true })
            expect(snapshot.refs).toBeGreaterThan(0)
            expect(snapshot.text).toContain('button "save"')
            expect(snapshot.page).toBeUndefined()
            expect(agent.ref('e1')?.kind).toBe('native')
        })
    })

    describe('structured results', () => {
        it('carries the page change and page of an action', async () => {
            const page = { url: 'http://x/', tree: document('Shop', [pay]) }
            const agent = await createAgentSession(pageBrowser(page), { artifactsDir: tmp() })
            const click = vi.spyOn(IMPLEMENTATIONS, 'click').mockImplementation(async () => {
                page.url = 'http://x/done'
                page.tree = document('Done', [{ role: 'link', name: 'Back', ref: 'e2', interactive: true }])
                return { text: 'Clicked e1' }
            })
            try {
                const result = await agent.run('click', { target: 'e1' })
                expect(result.text).toBe('Clicked e1\nPage: http://x/done\n- document "Done"\n  - link "Back" [ref=e2]')
                expect(result.changes).toMatchObject({ kind: 'page', frame: false, url: 'http://x/done', title: 'Done', refs: 1 })
                expect(result.page).toEqual({ url: 'http://x/done', title: 'Done' })
                expect(result.noVisibleChange).toBeUndefined()
            } finally {
                click.mockRestore()
            }
        })

        it('flags a click after which the page did not change', async () => {
            const agent = await createAgentSession(pageBrowser({ url: 'http://x/', tree: document('Shop', [pay]) }), { artifactsDir: tmp() })
            const click = vi.spyOn(IMPLEMENTATIONS, 'click').mockResolvedValue({ text: 'Clicked e1' })
            try {
                const result = await agent.run('click', { target: 'e1' })
                expect(result.noVisibleChange).toBe(true)
                expect(result.text).toBe('Clicked e1\nNo visible change on the page.')
                expect(result.changes).toBeUndefined()
            } finally {
                click.mockRestore()
            }
        })

        describe('failed requests', () => {
            const REQUEST = { request: { request: 'r1', method: 'POST', url: 'https://algolia.shop.test/1/indexes/*/queries?k=1', initiatorType: 'fetch' }, response: { status: 403 } }

            /** a BiDi browser on a page that does not change, whose events the test fires */
            function eventBrowser () {
                const handlers: Record<string, (params: unknown) => void> = {}
                const browser = mockBrowser({
                    ...pageBrowser({ url: 'http://x/', tree: document('Shop', [pay]) }),
                    isBidi: true,
                    on: vi.fn((event: string, fn: (params: unknown) => void) => { handlers[event] = fn })
                })
                return { browser, emit: (event: string, params: unknown) => handlers[event](params) }
            }

            it('lists a request that failed during the action as a note and in the text', async () => {
                const { browser, emit } = eventBrowser()
                const agent = await createAgentSession(browser, { artifactsDir: tmp() })
                const click = vi.spyOn(IMPLEMENTATIONS, 'click').mockImplementation(async () => {
                    emit('network.responseCompleted', REQUEST)
                    emit('network.responseCompleted', { ...REQUEST, request: { ...REQUEST.request, request: 'r2' } })
                    emit('network.responseCompleted', { request: { request: 'r3', method: 'GET', url: 'https://cdn.test/a.png', initiatorType: 'img' }, response: { status: 404 } })
                    return { text: 'Clicked e1' }
                })
                try {
                    const result = await agent.run('click', { target: 'e1' })
                    const line = 'Requests failed: 403 POST algolia.shop.test/1/indexes/*/queries (×2)'
                    expect(result.notes).toEqual([line])
                    expect(result.text).toContain(`\n${line}`)
                } finally {
                    click.mockRestore()
                }
            })

            it('has no note when nothing failed', async () => {
                const { browser, emit } = eventBrowser()
                const agent = await createAgentSession(browser, { artifactsDir: tmp() })
                const click = vi.spyOn(IMPLEMENTATIONS, 'click').mockImplementation(async () => {
                    emit('network.responseCompleted', { ...REQUEST, response: { status: 200 } })
                    return { text: 'Clicked e1' }
                })
                try {
                    const result = await agent.run('click', { target: 'e1' })
                    expect(result.notes).toBeUndefined()
                    expect(result.text).not.toContain('Requests failed')
                } finally {
                    click.mockRestore()
                }
            })

            it('reports a failure from between actions with the next snapshot, once', async () => {
                const { browser, emit } = eventBrowser()
                const agent = await createAgentSession(browser, { artifactsDir: tmp() })
                emit('network.fetchError', { request: { request: 'r9', method: 'GET', url: 'https://shop.test/late', initiatorType: 'fetch' }, errorText: 'net::ERR_CONNECTION_RESET' })
                const first = await agent.snapshot()
                expect(first.notes).toEqual(['Requests failed: ERR GET shop.test/late'])
                expect((await agent.snapshot()).notes).toBeUndefined()
            })

            it('says nothing without capture, on classic sessions', async () => {
                const browser = pageBrowser({ url: 'http://x/', tree: document('Shop', [pay]) })
                const agent = await createAgentSession(browser, { artifactsDir: tmp() })
                expect((await agent.snapshot()).notes).toBeUndefined()
                expect(browser.sessionSubscribe).not.toHaveBeenCalled()
            })
        })

        it('lists the browser error page as a note, and in the text', async () => {
            const page = { url: 'chrome-error://chromewebdata/', tree: document('x', []) }
            page.tree = { role: 'document', name: 'x', url: page.url, children: [] } as SnapshotNode
            const agent = await createAgentSession(pageBrowser(page), { artifactsDir: tmp() })
            const snapshot = await agent.snapshot()
            expect(snapshot.notes).toHaveLength(1)
            expect(snapshot.notes![0]).toMatch(/^The page did not load/)
            expect(snapshot.text).toContain(snapshot.notes![0])
        })

        it('uses the hint of the caller in an error', async () => {
            const hint = (command: string) => command === 'snapshot' ? 'snapshot_tool' : undefined
            const agent = await createAgentSession(pageBrowser({ url: 'http://x/', tree: document('Shop', [pay]) }), { artifactsDir: tmp(), hint })
            await expect(agent.run('click', { target: 'e99' })).rejects.toMatchObject({ code: 'REF_NOT_FOUND', hint: 'Run `snapshot_tool` to get refs.' })
        })
    })
})
