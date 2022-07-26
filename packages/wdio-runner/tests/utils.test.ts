import path from 'node:path'
// @ts-ignore mock feature
import { logMock } from '@wdio/logger'
import { attach, remote, multiremote } from 'webdriverio'
import { describe, expect, it, vi, afterEach, beforeEach } from 'vitest'

import {
    initialiseInstance, sanitizeCaps, sendFailureMessage, getInstancesData, ConfigWithSessionId
} from '../src/utils'

vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))
vi.mock('webdriverio', () => import(path.join(process.cwd(), '__mocks__', 'webdriverio')))

process.send = vi.fn()

describe('utils', () => {
    beforeEach(() => {
        logMock.error.mockClear()
    })

    describe('initialiseInstance', () => {
        it('should attach to an existing session if sessionId is within config', () => {
            const config: ConfigWithSessionId = {
                sessionId: '123',
                // @ts-ignore test invalid params
                foo: 'bar'
            }
            initialiseInstance(
                config,
                {
                    browserName: 'chrome',
                    maxInstances: 2,
                    hostname: 'foobar'
                }
            )
            expect(attach).toBeCalledWith({
                sessionId: '123',
                foo: 'bar',
                hostname: 'foobar',
                capabilities: { browserName: 'chrome' }
            })
            expect(config.capabilities).toEqual({ browserName: 'chrome' })
            expect(multiremote).toHaveBeenCalledTimes(0)
            expect(remote).toHaveBeenCalledTimes(0)
        })

        it('should run multiremote tests if flag is given', () => {
            const capabilities = { someBrowser: { browserName: 'chrome' } }
            initialiseInstance(
                // @ts-ignore test invalid params
                { foo: 'bar' },
                capabilities,
                true
            )
            expect(attach).toHaveBeenCalledTimes(0)
            expect(multiremote).toBeCalledWith({
                someBrowser: {
                    browserName: 'chrome',
                    foo: 'bar'
                }
            }, { foo: 'bar' })
            expect(remote).toHaveBeenCalledTimes(0)
        })

        it('should create normal remote session', () => {
            initialiseInstance({
                // @ts-ignore test invalid params
                foo: 'bar'
            },
            {
                browserName: 'chrome',
                maxInstances: 123
            })
            expect(attach).toHaveBeenCalledTimes(0)
            expect(multiremote).toHaveBeenCalledTimes(0)
            expect(remote).toBeCalledWith({
                foo: 'bar',
                maxInstances: 123,
                capabilities: { browserName: 'chrome' }
            })
        })

        it('should overwrite connection properties if set in capabilities', () => {
            const caps = {
                browserName: 'chrome',
                hostname: 'barfoo',
                port: 4321,
                path: '/'
            }
            initialiseInstance({
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
            vi.mocked(multiremote).mockClear()
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

    describe('sendFailureMessage', () => {
        const scenarios = [{
            name: 'should send message on test fail',
            event: 'test:fail',
            calls: 1
        }, {
            name: 'should not send message on any other event',
            event: 'test:pass',
            calls: 0
        }, {
            name: 'should send message on before all hook failure',
            event: 'hook:end',
            payload: { error: true, title: '"before all" hook foobar' },
            calls: 1
        }, {
            name: 'should send message on after all hook failure',
            event: 'hook:end',
            payload: { error: true, title: '"before all" hook foobar' },
            calls: 1
        }, {
            name: 'should not send message on after all hook success',
            event: 'hook:end',
            payload: { error: false, title: '"before all" hook foobar' },
            calls: 0
        }, {
            name: 'should not send message for other hooks',
            event: 'hook:end',
            payload: { error: true, title: '"after each" hook foobar' },
            calls: 0
        }]

        scenarios.forEach(scenario => {
            it(scenario.name, () => {
                sendFailureMessage(scenario.event, scenario.payload)
                expect(process.send).toHaveBeenCalledTimes(scenario.calls)
            })
        })

        afterEach(() => {
            vi.mocked(process.send)!.mockClear()
        })
    })

    describe('getInstancesData', () => {
        it('isMultiremote = true', () => {
            const { sessionId, isW3C, protocol, hostname, port, path, queryParams } = {
                isW3C: true,
                sessionId: 'bar',
                protocol: 'http',
                hostname: 'localhost',
                port: 4441,
                path: '/foo/bar',
                queryParams: { foo: '123' }
            }

            expect(getInstancesData({
                instances: ['foo'],
                foo: {
                    isW3C,
                    sessionId,
                    options: { protocol, hostname, port, path, queryParams }
                }
            // @ts-expect-error
            } as any as WebdriverIO.MultiRemoteBrowserObject, true))
                .toEqual({ foo: { sessionId, isW3C, protocol, hostname, port, path, queryParams } })
        })

        it('isMultiremote = false', () => {
            expect(getInstancesData({} as WebdriverIO.Browser, false))
                .toEqual(undefined)
        })
    })
})
