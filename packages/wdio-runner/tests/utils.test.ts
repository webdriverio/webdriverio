import path from 'node:path'
import { EventEmitter } from 'node:events'
// @ts-expect-error - mock
import { logMock } from '@wdio/logger'
import { attach, remote, multiRemote } from 'webdriverio'
import { describe, expect, it, vi, afterEach, beforeEach } from 'vitest'
import { expect as wdioExpect } from 'expect-webdriverio'
import type * as WdioUtils from '@wdio/utils'

import type { ConfigWithSessionId } from '../src/utils.js'
import {
    initializeInstance, sanitizeCaps, getInstancesData,
    transformExpectArgs, continueSourceMapRequests
} from '../src/utils.js'

// @ts-expect-error -- Simulate global expect object for testing transformExpectArgs
global.expect = wdioExpect

vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))
vi.mock('webdriverio', () => import(path.join(process.cwd(), '__mocks__', 'webdriverio')))
vi.mock('@wdio/utils', async (importOriginal) => ({
    ...await import(path.join(process.cwd(), '__mocks__', '@wdio/utils')),
    isSourceMapRequest: (await importOriginal<typeof WdioUtils>()).isSourceMapRequest
}))

process.send = vi.fn()

describe('utils', () => {
    beforeEach(() => {
        logMock.error.mockClear()
    })

    describe('initializeInstance', () => {
        it('should attach to an existing session if sessionId is within config', async () => {
            const config: ConfigWithSessionId = {
                sessionId: '123',
                // @ts-ignore test invalid params
                foo: 'bar'
            }
            await initializeInstance(config, {
                browserName: 'chrome',
                maxInstances: 2,
                hostname: 'foobar'
            })
            const attachParams = {
                sessionId: '123',
                foo: 'bar',
                hostname: 'foobar',
                capabilities: {
                    hostname: 'foobar',
                    maxInstances: 2,
                    browserName: 'chrome'
                }
            }

            expect(attach).toBeCalledWith({ ...attachParams, options: attachParams })
            expect(config.capabilities).toEqual({ browserName: 'chrome' })
            expect(multiRemote).toHaveBeenCalledTimes(0)
            expect(remote).toHaveBeenCalledTimes(0)
        })

        it('should run multi-remote tests if flag is given', async () => {
            const capabilities = { someBrowser: { browserName: 'chrome' } }
            await initializeInstance(
                // @ts-ignore test invalid params
                { foo: 'bar' },
                capabilities,
                true
            )
            expect(attach).toHaveBeenCalledTimes(0)
            expect(multiRemote).toBeCalledWith({
                someBrowser: {
                    browserName: 'chrome',
                    foo: 'bar'
                }
            }, { foo: 'bar' })
            expect(remote).toHaveBeenCalledTimes(0)
        })

        it('should create normal remote session', async () => {
            await initializeInstance({
                // @ts-ignore test invalid params
                foo: 'bar'
            },
            {
                browserName: 'chrome',
                maxInstances: 123
            })
            expect(attach).toHaveBeenCalledTimes(0)
            expect(multiRemote).toHaveBeenCalledTimes(0)
            expect(remote).toBeCalledWith({
                foo: 'bar',
                maxInstances: 123,
                capabilities: { browserName: 'chrome' }
            })
        })

        it('should overwrite connection properties if set in capabilities', async () => {
            const caps = {
                browserName: 'chrome',
                hostname: 'barfoo',
                port: 4321,
                path: '/'
            }
            await initializeInstance({
                hostname: 'foobar',
                port: 1234,
                path: '/some/path'
            } as any, caps)
            expect(remote).toBeCalledWith({
                hostname: 'barfoo',
                port: 4321,
                path: '/',
                capabilities: { browserName: 'chrome' }
            })
        })

        afterEach(() => {
            vi.mocked(attach).mockClear()
            vi.mocked(multiRemote).mockClear()
            vi.mocked(remote).mockClear()
        })
    })

    it('sanitizeCaps', () => {
        const validCaps = {
            browserName: 'chrome',
            browserVersion: 'latest',
            platformName: 'macOS 10.13'
        }

        const invalidCaps = {
            maxInstances: 123,
            specs: ['./foo.test.js', './bar.test.js']
        }

        expect(sanitizeCaps({
            ...invalidCaps,
            ...validCaps
        })).toEqual(validCaps)
    })

    describe('getInstancesData', () => {
        it('isMultiRemote = true', () => {
            const { sessionId, protocol, hostname, port, path, queryParams } = {
                sessionId: 'bar',
                protocol: 'http',
                hostname: 'localhost',
                port: 4441,
                path: '/foo/bar',
                queryParams: { foo: '123' }
            }

            expect(getInstancesData({
                instances: ['foo'],
                getInstance: vi.fn().mockReturnValue({
                    sessionId,
                    options: { protocol, hostname, port, path, queryParams }
                })
            // @ts-expect-error
            } as unknown as WebdriverIO.MultiRemoteBrowserObject, true))
                .toEqual({ foo: { sessionId, protocol, hostname, port, path, queryParams } })
        })

        it('isMultiRemote = false', () => {
            expect(getInstancesData({} as any, false))
                .toEqual(undefined)
        })
    })

    describe(transformExpectArgs, () => {
        it('should return primitives as-is', () => {
            expect(transformExpectArgs('hello')).toBe('hello')
            expect(transformExpectArgs(42)).toBe(42)
            expect(transformExpectArgs(null)).toBe(null)
            expect(transformExpectArgs(undefined)).toBe(undefined)
            expect(transformExpectArgs(true)).toBe(true)
        })

        it('should return a plain object that is not a serialized matcher as-is', () => {
            const obj = { foo: 'bar' }
            expect(transformExpectArgs(obj)).toBe(obj)
        })

        it('should recursively transform arrays', () => {
            const result = transformExpectArgs([1, 'two', null]) as unknown[]
            expect(result).toEqual([1, 'two', null])
        })

        it('should transform a serialized ArrayContaining matcher', () => {
            const arg = { $$typeof: 'ArrayContaining', sample: [1, 2, 3] }
            const result = transformExpectArgs(arg)
            expect(result).toEqual(expect.arrayContaining([1, 2, 3]))
        })

        it('should transform a serialized ObjectContaining matcher', () => {
            const arg = { $$typeof: 'ObjectContaining', sample: { key: 'value' } }
            const result = transformExpectArgs(arg)
            expect(result).toEqual(expect.objectContaining({ key: 'value' }))
        })

        it('should transform a serialized StringContaining matcher', () => {
            const arg = { $$typeof: 'StringContaining', sample: 'foo' }
            const result = transformExpectArgs(arg)
            expect(result).toEqual(expect.stringContaining('foo'))
        })

        it('should transform a serialized StringMatching matcher', () => {
            const arg = { $$typeof: 'StringMatching', sample: /foo/ }
            const result = transformExpectArgs(arg)
            expect(result).toEqual(expect.stringMatching(/foo/))
        })

        it('should transform a serialized CloseTo matcher', () => {
            const arg = { $$typeof: 'CloseTo', sample: 1.5 }
            const result = transformExpectArgs(arg)
            expect(result).toEqual(expect.closeTo(1.5))
        })

        it('should transform a serialized OneOf matcher, spreading the sample array as arguments', () => {
            const arg = { $$typeof: 'OneOf', sample: ['a', 'b', 'c'] }
            const result = transformExpectArgs(arg)
            // expect.oneOf spreads the sample entries as individual arguments
            expect(result).toEqual(wdioExpect.oneOf('a', 'b', 'c'))
        })

        it('should apply inverse (expect.not) when inverse flag is set', () => {
            const arg = { $$typeof: 'StringContaining', sample: 'foo', inverse: true }
            const result = transformExpectArgs(arg)
            expect(result).toEqual(expect.not.stringContaining('foo'))
        })

        it('should recursively transform nested matchers inside an array', () => {
            const arg = [
                { $$typeof: 'StringContaining', sample: 'hello' },
                { $$typeof: 'ArrayContaining', sample: [1, 2] }
            ]
            const result = transformExpectArgs(arg) as unknown[]
            expect(result[0]).toEqual(expect.stringContaining('hello'))
            expect(result[1]).toEqual(expect.arrayContaining([1, 2]))
        })

        it('should recursively transform a nested matcher inside sample', () => {
            const arg = {
                $$typeof: 'ObjectContaining',
                sample: { $$typeof: 'StringContaining', sample: 'nested' }
            }
            const result = transformExpectArgs(arg)
            expect(result).toEqual(expect.objectContaining(expect.stringContaining('nested')))
        })

        it('should throw when matcher is not supported by expect-webdriverio', () => {
            const arg = { $$typeof: 'OneOf', sample: undefined, inverse: true }
            vi.spyOn(wdioExpect, 'oneOf').mockReturnValueOnce(undefined as any)
            expect(() => transformExpectArgs(arg)).toThrow('is not supported by expect-webdriverio')
        })
    })

    describe('continueSourceMapRequests', () => {
        const scriptUrl = 'http://localhost:5173/@fs/project/build/index.js'
        const getBrowser = (overrides: Record<string, unknown> = {}) => {
            const browser = Object.assign(new EventEmitter(), {
                sessionSubscribe: vi.fn().mockResolvedValue({ subscription: 'subscription-1' }),
                sessionUnsubscribe: vi.fn().mockResolvedValue(undefined),
                networkContinueRequest: vi.fn().mockResolvedValue(undefined),
                networkProvideResponse: vi.fn().mockResolvedValue(undefined),
                ...overrides
            })
            // SAFETY: the helper only uses the real event emitter and protocol stubs above.
            return browser as WebdriverIO.Browser
        }
        const emit = (browser: WebdriverIO.Browser, event: string, url: string, destination: string, isBlocked: boolean, sourceMap = false) => (
            browser.emit(event, {
                request: { request: 'req-1', url, destination },
                isBlocked,
                initiator: sourceMap ? {
                    stackTrace: { callFrames: [{ url: 'http://localhost:5173/@fs/node_modules/source-map-support/browser-source-map-support.js' }] }
                } : undefined
            })
        )

        it.each([scriptUrl, `${scriptUrl}.map`])('should continue source-map retrieval of %s', async (url) => {
            const browser = getBrowser()
            await continueSourceMapRequests(browser)
            expect(browser.sessionSubscribe).toHaveBeenCalledWith({
                events: ['network.beforeRequestSent', 'network.responseStarted', 'network.fetchError']
            })

            emit(browser, 'network.beforeRequestSent', scriptUrl, 'script', false)
            // e.g. source-map-support fetching the module synchronously
            emit(browser, 'network.beforeRequestSent', url, '', true, true)
            emit(browser, 'network.responseStarted', url, '', true)

            expect(browser.networkContinueRequest).toHaveBeenCalledWith({ request: 'req-1' })
            expect(browser.networkProvideResponse).toHaveBeenCalledWith({ request: 'req-1' })

            // A later fetch to the same URL is not part of source-map retrieval.
            emit(browser, 'network.responseStarted', scriptUrl, '', true)
            expect(browser.networkProvideResponse).toHaveBeenCalledTimes(1)
        })

        it('should leave other blocked requests to the page', async () => {
            const browser = getBrowser()
            await continueSourceMapRequests(browser)

            emit(browser, 'network.beforeRequestSent', scriptUrl, 'script', false)
            emit(browser, 'network.beforeRequestSent', scriptUrl, '', true)
            emit(browser, 'network.responseStarted', scriptUrl, '', true)

            // a fetch made before a mock existed must not mark the url as runner traffic
            emit(browser, 'network.beforeRequestSent', 'https://api.webdriver.io/api/foo', '', false)
            emit(browser, 'network.beforeRequestSent', 'https://api.webdriver.io/api/foo', '', true)
            emit(browser, 'network.responseStarted', 'https://api.webdriver.io/api/foo', '', true)
            emit(browser, 'network.beforeRequestSent', scriptUrl, 'script', true)
            emit(browser, 'network.responseStarted', scriptUrl, 'script', true)
            emit(browser, 'network.beforeRequestSent', scriptUrl, '', false)
            emit(browser, 'network.responseStarted', scriptUrl, '', false)

            expect(browser.networkContinueRequest).not.toHaveBeenCalled()
            expect(browser.networkProvideResponse).not.toHaveBeenCalled()
        })

        it('should forget failed source-map requests', async () => {
            const browser = getBrowser()
            await continueSourceMapRequests(browser)
            emit(browser, 'network.beforeRequestSent', scriptUrl, '', false, true)
            emit(browser, 'network.fetchError', scriptUrl, '', false)
            emit(browser, 'network.responseStarted', scriptUrl, '', true)
            expect(browser.networkProvideResponse).not.toHaveBeenCalled()
        })

        it('should stop listening when the browser run finishes', async () => {
            const browser = getBrowser()
            const stop = await continueSourceMapRequests(browser)
            await stop()
            emit(browser, 'network.beforeRequestSent', scriptUrl, '', true, true)
            emit(browser, 'network.responseStarted', scriptUrl, '', true)
            expect(browser.networkContinueRequest).not.toHaveBeenCalled()
            expect(browser.networkProvideResponse).not.toHaveBeenCalled()
            expect(browser.sessionUnsubscribe).toHaveBeenCalledWith({ subscriptions: ['subscription-1'] })
        })

        it('should not fail the run when unsubscribing fails', async () => {
            const browser = getBrowser({
                sessionUnsubscribe: vi.fn().mockRejectedValue(new Error('invalid session id'))
            })
            logMock.debug.mockClear()
            const stop = await continueSourceMapRequests(browser)
            await expect(stop()).resolves.toBeUndefined()
            expect(logMock.debug).toHaveBeenCalledWith(expect.stringContaining('invalid session id'))
        })

        it('should not fail the run when the remote end rejects network events', async () => {
            const browser = getBrowser({
                sessionSubscribe: vi.fn().mockRejectedValue(new Error('unsupported event'))
            })
            logMock.warn.mockClear()
            const stop = await continueSourceMapRequests(browser)

            emit(browser, 'network.beforeRequestSent', scriptUrl, '', true, true)
            await stop()
            expect(browser.networkContinueRequest).not.toHaveBeenCalled()
            expect(browser.sessionUnsubscribe).not.toHaveBeenCalled()
            expect(logMock.warn).toHaveBeenCalledWith(expect.stringContaining('unsupported event'))
        })

        it('should ignore requests the page continued already', async () => {
            const browser = getBrowser({
                networkContinueRequest: vi.fn().mockRejectedValue(new Error('no such request')),
                networkProvideResponse: vi.fn().mockRejectedValue(new Error('no such request'))
            })
            logMock.debug.mockClear()
            await continueSourceMapRequests(browser)

            emit(browser, 'network.beforeRequestSent', scriptUrl, 'script', false)
            emit(browser, 'network.beforeRequestSent', scriptUrl, '', true, true)
            emit(browser, 'network.responseStarted', scriptUrl, '', true)

            await vi.waitFor(() => expect(logMock.debug).toHaveBeenCalledTimes(2))
        })
    })
})
