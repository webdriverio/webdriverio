import path from 'node:path'
import { expect, describe, afterEach, it, vi } from 'vitest'
import { remote } from '../../../src/index.js'

vi.mock('fetch')
vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))
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
