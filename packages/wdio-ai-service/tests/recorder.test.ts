import { describe, expect, it, vi } from 'vitest'

import { resolveEffectsConfig } from '../src/effects.js'
import { EffectRecorder, EFFECTS_CHANNEL } from '../src/recorder.js'

vi.mock('webdriverio', () => ({ getContextManager: () => ({ getCurrentContext: vi.fn().mockResolvedValue('page') }) }))

function bidiBrowser () {
    const handlers = new Map<string, ((params: unknown) => void)[]>()
    const browser = {
        isBidi: true,
        sessionSubscribe: vi.fn().mockResolvedValue(undefined),
        scriptAddPreloadScript: vi.fn().mockResolvedValue({ script: 'p' }),
        browsingContextGetTree: vi.fn().mockResolvedValue({ contexts: [{ context: 'page' }] }),
        scriptCallFunction: vi.fn().mockResolvedValue({}),
        scriptEvaluate: vi.fn().mockResolvedValue({}),
        getUrl: vi.fn().mockResolvedValue('https://shop.example/products'),
        on (event: string, handler: (params: unknown) => void) {
            handlers.set(event, [...(handlers.get(event) || []), handler])
        }
    }
    const emit = (event: string, params: unknown) => (handlers.get(event) || []).forEach((handler) => handler(params))
    const request = (id: string, url: string, extra: Record<string, unknown> = {}) => ({
        context: 'page', navigation: null, request: { request: id, url, method: 'POST', initiatorType: 'fetch', ...extra }
    })
    return { browser: browser as unknown as WebdriverIO.Browser & typeof browser, emit, request }
}

describe('EffectRecorder on a BiDi session', () => {
    it('subscribes to the events and installs the DOM observer in every context and future document', async () => {
        const { browser } = bidiBrowser()
        await EffectRecorder.attach(browser, resolveEffectsConfig())
        expect(browser.sessionSubscribe).toHaveBeenCalledWith({ events: expect.arrayContaining(['network.beforeRequestSent', 'browsingContext.navigationStarted', 'script.message']) })
        expect(browser.scriptAddPreloadScript).toHaveBeenCalledWith(expect.objectContaining({ arguments: [{ type: 'channel', value: { channel: EFFECTS_CHANNEL } }] }))
        expect(browser.scriptCallFunction).toHaveBeenCalledWith(expect.objectContaining({ target: { context: 'page' } }))
    })

    it('attaches when the browser rejects an event it does not implement yet', async () => {
        const { browser } = bidiBrowser()
        browser.sessionSubscribe.mockImplementation(async ({ events }: { events: string[] }) => {
            if (events.includes('browsingContext.navigationAborted')) {
                throw new Error('invalid argument - browsingContext.navigationAborted is not a valid event name')
            }
        })
        await expect(EffectRecorder.attach(browser, resolveEffectsConfig())).resolves.toBeInstanceOf(EffectRecorder)
        expect(browser.sessionSubscribe).toHaveBeenCalledWith({ events: ['browsingContext.historyUpdated'] })
    })

    it('starts a new epoch in every frame of the page, so changes from before the step do not count', async () => {
        const { browser } = bidiBrowser()
        browser.browsingContextGetTree.mockResolvedValue({ contexts: [{ context: 'page', children: [{ context: 'frame', children: [] }] }] })
        const recorder = await EffectRecorder.attach(browser, resolveEffectsConfig())
        browser.scriptCallFunction.mockClear()
        await recorder.start()
        const targets = browser.scriptCallFunction.mock.calls.map(([params]) => (params as { target: { context: string }, arguments: unknown[] }))
        expect(targets.map((params) => params.target.context)).toEqual(['page', 'frame'])
        expect(targets[0].arguments).toEqual([{ type: 'number', value: 1 }])
    })

    it('records requests, the regions that changed and navigations of the step', async () => {
        const { browser, emit, request } = bidiBrowser()
        const recorder = await EffectRecorder.attach(browser, resolveEffectsConfig({ ignore: ['/telemetry'] }))

        emit('network.beforeRequestSent', request('before', 'https://shop.example/api/early'))
        await recorder.start()
        emit('network.beforeRequestSent', request('r1', 'https://shop.example/api/cart/42'))
        emit('network.beforeRequestSent', request('r2', 'https://shop.example/telemetry'))
        emit('network.beforeRequestSent', request('r3', 'https://shop.example/img/shirt.png', { method: 'GET', initiatorType: 'img' }))
        emit('network.responseCompleted', { ...request('r1', 'https://shop.example/api/cart/42'), response: { status: 201 } })
        emit('network.responseCompleted', { ...request('r2', 'https://shop.example/telemetry'), response: { status: 204 } })
        emit('script.message', { channel: EFFECTS_CHANNEL, data: { type: 'array', value: [{ type: 'string', value: '1' }, { type: 'string', value: 'status "Cart"' }] } })
        emit('script.message', { channel: EFFECTS_CHANNEL, data: { type: 'array', value: [{ type: 'string', value: '0' }, { type: 'string', value: 'main "Page load"' }] } })
        emit('script.message', { channel: 'other', data: { type: 'array', value: [{ type: 'string', value: '1' }, { type: 'string', value: 'nope' }] } })
        emit('browsingContext.historyUpdated', { context: 'page', url: 'https://shop.example/cart' })

        expect(await recorder.settle({ quiet: 10 })).toEqual({
            requests: ['POST /api/cart/:id → 2xx'],
            navigation: '/cart',
            changed: ['status "Cart"']
        })
    })

    it('leaves out what other tabs do during the step, and counts frames the step added', async () => {
        const { browser, emit, request } = bidiBrowser()
        const recorder = await EffectRecorder.attach(browser, resolveEffectsConfig())
        await recorder.start()
        expect(browser.browsingContextGetTree).toHaveBeenLastCalledWith({ root: 'page' })

        emit('network.beforeRequestSent', { ...request('other', 'https://shop.example/api/poll'), context: 'other-tab' })
        emit('network.responseCompleted', { ...request('other', 'https://shop.example/api/poll'), context: 'other-tab', response: { status: 200 } })
        emit('script.message', { channel: EFFECTS_CHANNEL, source: { context: 'other-tab' }, data: { type: 'array', value: [{ type: 'string', value: '1' }, { type: 'string', value: 'list "Inbox"' }] } })
        emit('browsingContext.userPromptOpened', { context: 'other-tab', type: 'alert' })
        emit('browsingContext.contextCreated', { context: 'popup-of-other-tab', parent: null, originalOpener: 'other-tab', url: 'https://mail.example/' })

        emit('browsingContext.contextCreated', { context: 'new-frame', parent: 'page', url: 'https://pay.example/' })
        emit('network.beforeRequestSent', { ...request('pay', 'https://pay.example/api/token'), context: 'new-frame' })
        emit('network.responseCompleted', { ...request('pay', 'https://pay.example/api/token'), context: 'new-frame', response: { status: 200 } })
        emit('script.message', { channel: EFFECTS_CHANNEL, source: { context: 'new-frame' }, data: { type: 'array', value: [{ type: 'string', value: '1' }, { type: 'string', value: 'form "Card"' }] } })

        expect(await recorder.settle({ quiet: 10 })).toEqual({
            requests: ['POST pay.example/api/token → 2xx'],
            changed: ['form "Card"']
        })
    })

    it('waits the quiet time after the action, so a slow action does not miss the page changes', async () => {
        const { browser, emit } = bidiBrowser()
        const recorder = await EffectRecorder.attach(browser, resolveEffectsConfig())
        await recorder.start()
        /**
         * the action took longer than the quiet time, its change arrives
         * right after it returned
         */
        await new Promise((resolve) => setTimeout(resolve, 60))
        setTimeout(() => emit('script.message', { channel: EFFECTS_CHANNEL, source: { context: 'page' }, data: { type: 'array', value: [{ type: 'string', value: '1' }, { type: 'string', value: 'main' }] } }), 20)
        expect(await recorder.settle({ quiet: 50 })).toEqual({ changed: ['main'] })
    })

    it('lets the page report what the action did before the quiet time starts', async () => {
        const { browser, emit, request } = bidiBrowser()
        const recorder = await EffectRecorder.attach(browser, resolveEffectsConfig())
        await recorder.start()
        /**
         * the request event of the click arrives while the page renders the
         * next frame, after the action returned
         */
        browser.scriptEvaluate.mockImplementationOnce(async () => {
            await new Promise((resolve) => setTimeout(resolve, 30))
            emit('network.beforeRequestSent', request('late', 'https://shop.example/api/cart'))
            emit('network.responseCompleted', { ...request('late', 'https://shop.example/api/cart'), response: { status: 200 } })
            return {}
        })
        expect(await recorder.settle({ quiet: 10 })).toEqual({ requests: ['POST /api/cart → 2xx'] })
        expect(browser.scriptEvaluate).toHaveBeenCalledWith(expect.objectContaining({ target: { context: 'page' }, awaitPromise: true }))
    })

    it('settles when the page cannot run the round trip because a dialog is open', async () => {
        const { browser, emit } = bidiBrowser()
        const recorder = await EffectRecorder.attach(browser, resolveEffectsConfig())

        await recorder.start()
        browser.scriptEvaluate.mockClear()
        emit('browsingContext.userPromptOpened', { context: 'page', type: 'alert' })
        expect(await recorder.settle({ quiet: 10 })).toEqual({ prompt: 'alert' })
        expect(browser.scriptEvaluate).not.toHaveBeenCalled()

        /**
         * a dialog that opens during the round trip holds the script forever
         */
        await recorder.start()
        browser.scriptEvaluate.mockImplementationOnce(() => new Promise(() => {}))
        const started = Date.now()
        await recorder.settle({ quiet: 10 })
        expect(Date.now() - started).toBeLessThan(1000)
    })

    it('waits for the requests a step started before it returns', async () => {
        const { browser, emit, request } = bidiBrowser()
        const recorder = await EffectRecorder.attach(browser, resolveEffectsConfig())
        await recorder.start()
        emit('network.beforeRequestSent', request('slow', 'https://shop.example/api/checkout'))
        setTimeout(() => emit('network.responseCompleted', { ...request('slow', 'https://shop.example/api/checkout'), response: { status: 200 } }), 150)

        const started = Date.now()
        const effect = await recorder.settle({ quiet: 10 })
        expect(Date.now() - started).toBeGreaterThanOrEqual(140)
        expect(effect.requests).toEqual(['POST /api/checkout → 2xx'])
    })

    it('waits for a navigation to load and stops at the timeout', async () => {
        const { browser, emit } = bidiBrowser()
        const recorder = await EffectRecorder.attach(browser, resolveEffectsConfig())
        await recorder.start()
        emit('browsingContext.navigationStarted', { context: 'page', navigation: 'nav-1', url: 'https://shop.example/checkout' })
        setTimeout(() => emit('browsingContext.load', { context: 'page', navigation: 'nav-1' }), 80)
        expect(await recorder.settle({ quiet: 10 })).toEqual({ navigation: '/checkout' })

        await recorder.start()
        emit('network.beforeRequestSent', { context: 'page', navigation: null, request: { request: 'hang', url: 'https://shop.example/api/poll', method: 'GET', initiatorType: 'fetch' } })
        const started = Date.now()
        await recorder.settle({ timeout: 120, quiet: 10 })
        expect(Date.now() - started).toBeLessThan(400)
        expect(recorder.unsettled).toEqual(['GET /api/poll'])

        await recorder.start()
        expect(await recorder.settle({ quiet: 10 })).toEqual({})
        expect(recorder.unsettled).toEqual([])
    })

    it('records a window the step opened and a dialog', async () => {
        const { browser, emit } = bidiBrowser()
        const recorder = await EffectRecorder.attach(browser, resolveEffectsConfig())
        await recorder.start()
        emit('browsingContext.contextCreated', { context: 'popup', parent: null, url: 'about:blank' })
        emit('browsingContext.navigationStarted', { context: 'popup', navigation: 'nav-2', url: 'https://auth.example/oauth/authorize?client=1' })
        emit('browsingContext.userPromptOpened', { context: 'page', type: 'confirm' })
        expect(await recorder.settle({ quiet: 10 })).toEqual({ opened: 'auth.example/oauth/authorize', prompt: 'confirm' })
    })

    it('ignores events while no step runs', async () => {
        const { browser, emit, request } = bidiBrowser()
        const recorder = await EffectRecorder.attach(browser, resolveEffectsConfig())
        await recorder.start()
        await recorder.settle({ quiet: 1 })
        emit('network.beforeRequestSent', request('late', 'https://shop.example/api/late'))
        emit('script.message', { channel: EFFECTS_CHANNEL, data: { type: 'array', value: [{ type: 'string', value: '1' }, { type: 'string', value: 'main' }] } })
        await recorder.start()
        expect(await recorder.settle({ quiet: 1 })).toEqual({})
    })
})

describe('EffectRecorder on a Classic session', () => {
    it('reads the regions the page collected and detects a URL change', async () => {
        const urls = ['https://shop.example/products', 'https://shop.example/cart']
        const execute = vi.fn()
            .mockResolvedValueOnce(undefined)
            .mockResolvedValueOnce(['status "Cart"'])
            .mockResolvedValue(['status "Cart"'])
        const browser = { isBidi: false, execute, getUrl: vi.fn(async () => urls.shift()) } as unknown as WebdriverIO.Browser
        const recorder = await EffectRecorder.attach(browser, resolveEffectsConfig())
        expect(recorder.bidi).toBe(false)
        await recorder.start()
        expect(await recorder.settle({ quiet: 30 })).toEqual({ navigation: '/cart', changed: ['status "Cart"'] })
    })
})
