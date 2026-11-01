import path from 'node:path'
import { expect, describe, afterEach, it, vi } from 'vitest'
import { remote } from '../../../src/index.js'
import { applyBidiBrowserOverwrites } from '../../../src/utils/bidi/browserOverwrites.js'
import { SESSION_MOCKS } from '../../../src/commands/browser/mock.js'
import { AsyncLocalStorage } from 'node:async_hooks'
import { getParallelContextStore, setParallelContextStore } from '../../../src/session/context.js'

vi.mock('fetch')
vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))
vi.mock('../../../src/utils/bidi/browserOverwrites.js', () => ({ applyBidiBrowserOverwrites: vi.fn() }))
vi.mock('@wdio/utils', async (origMod) => {
    const orig: any = await origMod()
    return {
        ...orig,
        userImport: vi.fn().mockResolvedValue({})
    }
})

describe('reloadSession test', () => {
    const sessionResponse = {
        sessionId: 'foobar-345',
        capabilities: { browserName: 'mockBrowser' }
    }

    it('should read the new session id from the W3C new-session response', async () => {
        const oldSessionId = vi.mocked(fetch).getSessionId()
        const hook = vi.fn()
        const browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar'
            },
            onReload: [hook]
        })

        vi.mocked(fetch).setMockResponse([{}, sessionResponse])
        await browser.reloadSession()

        expect(vi.mocked(fetch).mock.calls[1][1].method).toBe('DELETE')
        expect(vi.mocked(fetch).mock.calls[1][0].pathname)
            .toBe(`/session/${oldSessionId}`)
        expect(vi.mocked(fetch).mock.calls[2][1].method).toBe('POST')
        expect(vi.mocked(fetch).mock.calls[2][0].pathname)
            .toBe('/session')
        expect(hook).toBeCalledWith(oldSessionId, sessionResponse.sessionId)
    })

    it('should apply the BiDi browser overwrites after the session was reloaded', async () => {
        const browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: { browserName: 'foobar' }
        })
        vi.mocked(applyBidiBrowserOverwrites).mockClear()

        vi.mocked(fetch).setMockResponse([{}, sessionResponse])
        await browser.reloadSession()

        expect(applyBidiBrowserOverwrites).toHaveBeenCalledTimes(1)
        expect(applyBidiBrowserOverwrites).toHaveBeenCalledWith(browser)
    })

    it('should restore the mocks of the old session before it ends', async () => {
        const browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: { browserName: 'foobar' }
        })
        const order: string[] = []
        // a restored mock leaves the session, as a real one does
        const mock: any = { restore: vi.fn(async () => { SESSION_MOCKS.reloadTest.delete(mock); order.push('restore') }), isOwnedBy: () => true }
        SESSION_MOCKS.reloadTest = new Set([mock])
        const deleteSession = vi.fn(async () => { order.push('delete') })
        Object.defineProperty(browser, 'deleteSession', { value: deleteSession, configurable: true, writable: true })

        vi.mocked(fetch).setMockResponse([sessionResponse])
        await browser.reloadSession()
        delete SESSION_MOCKS.reloadTest

        expect(order).toEqual(['restore', 'delete'])
    })

    it('should restore the mocks through an overwritten mockRestoreAll', async () => {
        const browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: { browserName: 'foobar' }
        })
        const mockRestoreAll = vi.fn()
        Object.defineProperty(browser, 'mockRestoreAll', { value: mockRestoreAll, configurable: true, writable: true })
        Object.defineProperty(browser, 'deleteSession', { value: vi.fn(), configurable: true, writable: true })

        vi.mocked(fetch).setMockResponse([sessionResponse])
        await browser.reloadSession()

        expect(mockRestoreAll).toHaveBeenCalledTimes(1)
    })

    it('should restore every mock of the old session in a parallel test, not only the ones of the test', async () => {
        const browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: { browserName: 'foobar' }
        })
        // made outside of the test, e.g. in a `before` hook: owned by the session, not by the test
        const mock = {
            restore: vi.fn(),
            isOwnedBy: (_: unknown, { test }: { test?: string } = {}) => test === undefined
        }
        SESSION_MOCKS.reloadTest = new Set([mock as any])
        Object.defineProperty(browser, 'deleteSession', { value: vi.fn(), configurable: true, writable: true })

        vi.mocked(fetch).setMockResponse([sessionResponse])
        const noopStore = getParallelContextStore()
        setParallelContextStore(new AsyncLocalStorage<string>())
        await getParallelContextStore().run('test-1', () => browser.reloadSession()).finally(() => setParallelContextStore(noopStore))
        delete SESSION_MOCKS.reloadTest

        expect(mock.restore).toHaveBeenCalledTimes(1)
    })

    it('should fail when the new session response has no session id', async () => {
        const browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar'
            }
        })

        vi.mocked(fetch).setMockResponse([{}, {}])
        await expect(browser.reloadSession()).rejects.toThrow(/session id or capabilities/)
    })

    it('should be ok even if deleteSession throws an exception', async () => {
        const hook = vi.fn()
        const browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar'
            },
            onReload: [hook]
        })

        // @ts-expect-error
        browser.sessionId = null // INFO: destroy sessionId in browser object

        vi.mocked(fetch).setMockResponse(sessionResponse)

        await browser.reloadSession()

        // INFO: DELETE to /wd/hub/session/${oldSessionId} in not expected to be found in vi.mocked(fetch).mock.calls as it will not complete
        expect(vi.mocked(fetch).mock.calls[1][1].method).toBe('POST')
        expect(vi.mocked(fetch).mock.calls[1][0].pathname).toBe('/session')
        expect(hook).toBeCalledWith(null, sessionResponse.sessionId)
    })

    it('should disconnect puppeteer session if active', async () => {

        const clientMock = {
            send: vi.fn(),
            on: vi.fn()
        }

        const pageMock = {
            target: vi.fn().mockReturnValue({
                createCDPSession: vi.fn().mockReturnValue(Promise.resolve(clientMock))
            }),
            evaluate: vi.fn().mockReturnValue(Promise.resolve(true))
        }

        const puppeteerMock = {
            pages: vi.fn().mockReturnValue([pageMock]),
            connected: true,
            disconnect: vi.fn()
        }
        const hook = vi.fn()

        const browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                // @ts-ignore mock feature
                browserName: 'chrome'
            },
            onReload: [hook]
        })
        // @ts-expect-error
        browser.puppeteer = puppeteerMock
        await browser.reloadSession()
        expect(puppeteerMock.disconnect).toBeCalled()
    })

    afterEach(() => {
        vi.mocked(fetch).mockClear()
        vi.mocked(fetch).resetSessionId()
        vi.mocked(fetch).setMockResponse()
    })
})
