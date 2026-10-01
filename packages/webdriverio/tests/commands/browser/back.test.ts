import path from 'node:path'
import { expect, describe, it, beforeAll, beforeEach, afterEach, vi } from 'vitest'

import { remote } from '../../../src/index.js'

vi.mock('fetch')
vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))

const contextMocks = vi.hoisted(() => ({
    getCurrentWindowHandle: vi.fn((): string | undefined => 'top-level'),
    getCurrentContext: vi.fn(async () => 'frame-1')
}))

vi.mock('../../../src/session/context.js', () => ({
    getContextManager: vi.fn(() => ({
        initialize: vi.fn().mockResolvedValue('top-level'),
        getCurrentWindowHandle: contextMocks.getCurrentWindowHandle,
        getCurrentContext: contextMocks.getCurrentContext
    }))
}))

function scriptValue (value: string) {
    return {
        type: 'success' as const,
        realm: 'realm-1',
        result: { type: 'string' as const, value }
    }
}

function navigationInfo (context: string) {
    return {
        context,
        navigation: 'nav-1',
        timestamp: 1,
        url: 'https://example.test/'
    }
}

async function flush () {
    await Promise.resolve()
    await Promise.resolve()
}

function delay (ms: number) {
    return new Promise<void>((resolve) => setTimeout(resolve, ms))
}

describe('back and forward', () => {
    describe('classic', () => {
        let browser: WebdriverIO.Browser

        beforeAll(async () => {
            browser = await remote({
                capabilities: {
                    browserName: 'foobar'
                }
            })
        })

        beforeEach(() => {
            vi.mocked(fetch).mockClear()
        })

        it('posts the classic back endpoint and does not traverse history', async () => {
            const traverse = vi.spyOn(browser, 'browsingContextTraverseHistory')

            await browser.back()

            expect(traverse).not.toHaveBeenCalled()
            expect(contextMocks.getCurrentContext).not.toHaveBeenCalled()
            expect(fetch).toHaveBeenCalledWith(
                expect.objectContaining({ pathname: '/session/foobar-123/back' }),
                expect.anything()
            )
            traverse.mockRestore()
        })

        it('posts the classic forward endpoint and does not traverse history', async () => {
            const traverse = vi.spyOn(browser, 'browsingContextTraverseHistory')

            await browser.forward()

            expect(traverse).not.toHaveBeenCalled()
            expect(fetch).toHaveBeenCalledWith(
                expect.objectContaining({ pathname: '/session/foobar-123/forward' }),
                expect.anything()
            )
            traverse.mockRestore()
        })
    })

    describe('bidi', () => {
        let browser: WebdriverIO.Browser

        beforeAll(async () => {
            browser = await remote({
                capabilities: {
                    browserName: 'bidi'
                }
            })
        })

        beforeEach(() => {
            contextMocks.getCurrentWindowHandle.mockReset()
            contextMocks.getCurrentWindowHandle.mockReturnValue('top-level')
            contextMocks.getCurrentContext.mockClear()
            browser.capabilities.pageLoadStrategy = 'normal'
            browser.capabilities.timeouts = { implicit: 0, pageLoad: 300000, script: 30000 }
            vi.spyOn(browser, 'sessionSubscribe').mockResolvedValue({ subscription: 'sub-1' })
            vi.spyOn(browser, 'sessionUnsubscribe').mockResolvedValue({})
            vi.spyOn(browser, 'getTimeouts').mockResolvedValue({ implicit: 0, pageLoad: 300000, script: 30000 })
            vi.spyOn(browser, 'getWindowHandle').mockResolvedValue('from-protocol')
            vi.spyOn(browser, 'browsingContextTraverseHistory').mockResolvedValue({})
            vi.mocked(fetch).mockClear()
        })

        afterEach(() => {
            vi.mocked(browser.sessionSubscribe).mockRestore()
            vi.mocked(browser.sessionUnsubscribe).mockRestore()
            vi.mocked(browser.getTimeouts).mockRestore()
            vi.mocked(browser.getWindowHandle).mockRestore()
            vi.mocked(browser.browsingContextTraverseHistory).mockRestore()
        })

        async function loadAfterTraverse (context = 'top-level') {
            vi.mocked(browser.browsingContextTraverseHistory).mockImplementation(async () => {
                browser.emit('browsingContext.load', navigationInfo(context))
                return {}
            })
        }

        it('traverses the top-level context by -1 and waits for load', async () => {
            await loadAfterTraverse()

            await browser.back()

            expect(contextMocks.getCurrentContext).not.toHaveBeenCalled()
            expect(browser.browsingContextTraverseHistory).toHaveBeenCalledWith({
                context: 'top-level',
                delta: -1
            })
            expect(browser.sessionSubscribe).toHaveBeenCalledWith({
                events: expect.arrayContaining([
                    'browsingContext.domContentLoaded',
                    'browsingContext.load'
                ]),
                contexts: ['top-level']
            })
        })

        it('traverses forward by 1', async () => {
            await loadAfterTraverse()

            await browser.forward()

            expect(browser.browsingContextTraverseHistory).toHaveBeenCalledWith({
                context: 'top-level',
                delta: 1
            })
        })

        it('uses the window handle when the context cache is empty', async () => {
            contextMocks.getCurrentWindowHandle.mockReturnValue(undefined)
            browser.capabilities.pageLoadStrategy = 'none'

            await browser.back()

            expect(browser.getWindowHandle).toHaveBeenCalled()
            expect(browser.browsingContextTraverseHistory).toHaveBeenCalledWith({
                context: 'from-protocol',
                delta: -1
            })
            expect(contextMocks.getCurrentContext).not.toHaveBeenCalled()
        })

        it('does not pass a frame context through', async () => {
            browser.capabilities.pageLoadStrategy = 'none'

            await browser.back()

            expect(browser.browsingContextTraverseHistory).toHaveBeenCalledWith({
                context: 'top-level',
                delta: -1
            })
            expect(contextMocks.getCurrentContext).not.toHaveBeenCalled()
            expect(browser.sessionSubscribe).not.toHaveBeenCalled()
        })

        it('does not wait when pageLoadStrategy is none', async () => {
            browser.capabilities.pageLoadStrategy = 'none'

            await browser.back()

            expect(browser.sessionSubscribe).not.toHaveBeenCalled()
            expect(browser.browsingContextTraverseHistory).toHaveBeenCalledTimes(1)
        })

        it('waits for domContentLoaded when pageLoadStrategy is eager', async () => {
            browser.capabilities.pageLoadStrategy = 'eager'
            vi.mocked(browser.browsingContextTraverseHistory).mockImplementation(async () => {
                browser.emit('browsingContext.domContentLoaded', navigationInfo('top-level'))
                return {}
            })

            await browser.back()

            expect(browser.browsingContextTraverseHistory).toHaveBeenCalledWith({
                context: 'top-level',
                delta: -1
            })
        })

        it('keeps waiting for load after a cross-document history update', async () => {
            vi.mocked(browser.browsingContextTraverseHistory).mockImplementation(async () => {
                browser.emit('browsingContext.navigationStarted', navigationInfo('top-level'))
                browser.emit('browsingContext.historyUpdated', {
                    context: 'top-level',
                    timestamp: 2,
                    url: 'https://example.test/'
                })
                return {}
            })

            let resolved = false
            const pending = browser.back().then(() => {
                resolved = true
            })
            await vi.waitFor(() => {
                expect(browser.browsingContextTraverseHistory).toHaveBeenCalled()
            })
            await flush()
            expect(resolved).toBe(false)

            browser.emit('browsingContext.load', navigationInfo('top-level'))
            await pending
            expect(resolved).toBe(true)
        })

        it('finishes a same-document traversal on historyUpdated', async () => {
            vi.mocked(browser.browsingContextTraverseHistory).mockImplementation(async () => {
                browser.emit('browsingContext.historyUpdated', {
                    context: 'top-level',
                    timestamp: 2,
                    url: 'https://example.test/#a'
                })
                return {}
            })

            await browser.back()
            expect(browser.browsingContextTraverseHistory).toHaveBeenCalledTimes(1)
        })

        it('ignores a load event for a different context', async () => {
            vi.mocked(browser.browsingContextTraverseHistory).mockImplementation(async () => {
                browser.emit('browsingContext.load', navigationInfo('other-frame'))
                return {}
            })

            let resolved = false
            const pending = browser.back().then(() => {
                resolved = true
            })
            await vi.waitFor(() => {
                expect(browser.browsingContextTraverseHistory).toHaveBeenCalled()
            })
            await flush()
            expect(resolved).toBe(false)

            browser.emit('browsingContext.load', navigationInfo('top-level'))
            await pending
        })

        it('ignores a history update from pushState or replaceState', async () => {
            vi.spyOn(browser, 'scriptEvaluate').mockImplementation(async (params) => {
                const expression = params?.expression ?? ''
                if (expression.includes('addEventListener')) {
                    return scriptValue('installed')
                }
                return scriptValue('push')
            })
            vi.mocked(browser.browsingContextTraverseHistory).mockImplementation(async () => {
                browser.emit('browsingContext.historyUpdated', {
                    context: 'top-level',
                    timestamp: 2,
                    url: 'https://example.test/pushed'
                })
                return {}
            })

            let resolved = false
            const pending = browser.back().then(() => {
                resolved = true
            })
            await vi.waitFor(() => {
                expect(browser.scriptEvaluate).toHaveBeenCalledWith(expect.objectContaining({
                    expression: expect.stringContaining('entry.events')
                }))
            })
            await flush()
            expect(resolved).toBe(false)

            browser.emit('browsingContext.load', navigationInfo('top-level'))
            await pending
            vi.mocked(browser.scriptEvaluate).mockRestore()
        })

        it('finishes a same-document traversal when the Navigation API reports traverse', async () => {
            vi.spyOn(browser, 'scriptEvaluate').mockImplementation(async (params) => {
                const expression = params?.expression ?? ''
                if (expression.includes('addEventListener')) {
                    return scriptValue('installed')
                }
                return scriptValue('traverse')
            })
            vi.mocked(browser.browsingContextTraverseHistory).mockImplementation(async () => {
                browser.emit('browsingContext.historyUpdated', {
                    context: 'top-level',
                    timestamp: 2,
                    url: 'https://example.test/previous'
                })
                return {}
            })

            await browser.back()

            expect(browser.browsingContextTraverseHistory).toHaveBeenCalledTimes(1)
            vi.mocked(browser.scriptEvaluate).mockRestore()
        })

        it('uses a separate history marker for each traversal', async () => {
            const installs: string[] = []
            const clears: string[] = []
            vi.spyOn(browser, 'scriptEvaluate').mockImplementation(async (params) => {
                const expression = params?.expression ?? ''
                if (expression.includes('addEventListener')) {
                    installs.push(expression)
                    return scriptValue('installed')
                }
                if (expression.includes('removeEventListener')) {
                    clears.push(expression)
                    return scriptValue('')
                }
                if (expression.includes('location.href')) {
                    return scriptValue('https://example.test/same')
                }
                return scriptValue('unsupported')
            })
            await loadAfterTraverse()

            await browser.back()
            await browser.forward()

            const markerKey = (source: string) => source.match(/entries\[("t[^"]+")\]/)?.[1]
            expect(installs).toHaveLength(2)
            expect(clears.map(markerKey)).toEqual(installs.map(markerKey))
            expect(markerKey(installs[0])).not.toBe(markerKey(installs[1]))
            vi.mocked(browser.scriptEvaluate).mockRestore()
        })

        it('returns when a restored document is ready even if the url is unchanged', async () => {
            let reads = 0
            vi.spyOn(browser, 'scriptEvaluate').mockImplementation(async (params) => {
                const expression = params?.expression ?? ''
                if (!expression.includes('__wdioHistoryTokens')) {
                    return scriptValue('unsupported')
                }
                reads += 1
                if (expression.includes('] = true')) {
                    return scriptValue(JSON.stringify({
                        href: 'https://example.test/same',
                        readyState: 'complete',
                        marked: true
                    }))
                }
                if (reads === 2) {
                    return scriptValue(JSON.stringify({
                        href: 'https://example.test/other',
                        readyState: 'complete',
                        marked: true
                    }))
                }
                return scriptValue(JSON.stringify({
                    href: 'https://example.test/same',
                    readyState: 'loading',
                    marked: false
                }))
            })
            vi.mocked(browser.browsingContextTraverseHistory).mockImplementation(async () => {
                browser.emit('browsingContext.navigationStarted', navigationInfo('top-level'))
                return {}
            })

            let resolved = false
            const pending = browser.back().then(() => {
                resolved = true
            })
            await vi.waitFor(() => {
                expect(reads).toBeGreaterThanOrEqual(3)
            })
            await flush()
            expect(resolved).toBe(false)

            browser.emit('browsingContext.load', navigationInfo('top-level'))
            await pending
            vi.mocked(browser.scriptEvaluate).mockRestore()
        })

        it('keeps each concurrent traversal mark on the outgoing document', async () => {
            /**
             * One outgoing document that stays complete. Each command marks
             * it under its own token, so neither may take it for the destination.
             */
            const tokens: Record<string, true> = {}
            vi.spyOn(browser, 'scriptEvaluate').mockImplementation(async (params) => {
                const expression = params?.expression ?? ''
                if (!expression.includes('__wdioHistoryTokens')) {
                    return scriptValue('unsupported')
                }
                const key = JSON.parse(expression.match(/\[("t[^"]+")\]/)![1]) as string
                if (expression.includes('] = true')) {
                    tokens[key] = true
                }
                return scriptValue(JSON.stringify({
                    href: 'https://example.test/same',
                    readyState: 'complete',
                    marked: tokens[key] === true
                }))
            })
            vi.mocked(browser.browsingContextTraverseHistory).mockImplementation(async () => {
                browser.emit('browsingContext.navigationStarted', navigationInfo('top-level'))
                return {}
            })

            let settled = 0
            const first = browser.back().then(() => { settled += 1 })
            const second = browser.back().then(() => { settled += 1 })
            await vi.waitFor(() => {
                expect(Object.keys(tokens)).toHaveLength(2)
                expect(browser.browsingContextTraverseHistory).toHaveBeenCalledTimes(2)
            })
            await delay(150)
            expect(settled).toBe(0)

            browser.emit('browsingContext.load', navigationInfo('top-level'))
            await Promise.all([first, second])
            vi.mocked(browser.scriptEvaluate).mockRestore()
        })

        it('returns when a committed document is already complete', async () => {
            vi.spyOn(browser, 'scriptEvaluate').mockImplementation(async (params) => {
                if ((params?.expression ?? '').includes('document.readyState')) {
                    return scriptValue(JSON.stringify({
                        href: 'https://example.test/',
                        readyState: 'complete',
                        marked: false
                    }))
                }
                return scriptValue('unsupported')
            })
            vi.mocked(browser.browsingContextTraverseHistory).mockImplementation(async () => {
                browser.emit('browsingContext.navigationStarted', navigationInfo('top-level'))
                browser.emit('browsingContext.navigationCommitted', navigationInfo('top-level'))
                return {}
            })

            await browser.back()

            expect(browser.scriptEvaluate).toHaveBeenCalledWith(expect.objectContaining({
                expression: expect.stringContaining('document.readyState'),
                target: { context: 'top-level' }
            }))
            vi.mocked(browser.scriptEvaluate).mockRestore()
        })

        it('retries the readyState check when the committed realm rejects it', async () => {
            let readyChecks = 0
            vi.spyOn(browser, 'scriptEvaluate').mockImplementation(async (params) => {
                if ((params?.expression ?? '').includes('document.readyState')) {
                    readyChecks += 1
                    if (readyChecks === 1) {
                        throw new Error('realm not ready')
                    }
                    return scriptValue(JSON.stringify({
                        href: 'https://example.test/',
                        readyState: 'complete',
                        marked: false
                    }))
                }
                return scriptValue('unsupported')
            })
            vi.mocked(browser.browsingContextTraverseHistory).mockImplementation(async () => {
                browser.emit('browsingContext.navigationStarted', navigationInfo('top-level'))
                browser.emit('browsingContext.navigationCommitted', navigationInfo('top-level'))
                return {}
            })

            await browser.back()

            expect(readyChecks).toBeGreaterThan(1)
            vi.mocked(browser.scriptEvaluate).mockRestore()
        })

        it('uses the session page-load timeout', async () => {
            vi.mocked(browser.getTimeouts).mockResolvedValue({ implicit: 0, pageLoad: 30, script: 0 })
            vi.mocked(browser.browsingContextTraverseHistory).mockResolvedValue({})

            await expect(browser.back()).rejects.toThrow(
                'History traversal timed out after 30ms waiting for browsingContext.load'
            )
        })

        it('does not wait for sessionUnsubscribe after the traversal finishes', async () => {
            let release: (value: Awaited<ReturnType<WebdriverIO.Browser['sessionUnsubscribe']>>) => void = () => {}
            vi.mocked(browser.sessionUnsubscribe).mockReturnValue(new Promise((resolve) => {
                release = resolve
            }))
            await loadAfterTraverse()

            await browser.back()

            expect(browser.sessionUnsubscribe).toHaveBeenCalledWith({ subscriptions: ['sub-1'] })
            release({})
        })

        it('does not swallow a no such history entry rejection', async () => {
            const error = new Error(
                'WebDriver Bidi command "browsingContext.traverseHistory" failed with error: no such history entry'
            )
            vi.mocked(browser.browsingContextTraverseHistory).mockRejectedValue(error)

            await expect(browser.back()).rejects.toBe(error)
            await expect(browser.forward()).rejects.toBe(error)
        })

        it('issues the classic endpoint when a BiDi session is not connected', async () => {
            const handler = (browser as unknown as { _bidiHandler: { isConnected: boolean } })._bidiHandler
            const wasConnected = handler.isConnected
            handler.isConnected = false
            vi.mocked(fetch).mockClear()

            try {
                expect(browser.isBidi).toBe(false)
                await browser.back()
                expect(browser.browsingContextTraverseHistory).not.toHaveBeenCalled()
                expect(fetch).toHaveBeenCalledWith(
                    expect.objectContaining({ pathname: '/session/foobar-123/back' }),
                    expect.anything()
                )
            } finally {
                handler.isConnected = wasConnected
            }
        })
    })
})
