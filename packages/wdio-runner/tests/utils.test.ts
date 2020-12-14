// @ts-ignore mock feature
import { logMock } from '@wdio/logger'
import { attach, remote, multiremote } from 'webdriverio'
import type { Capability } from '@wdio/config'

import {
    runHook, initialiseInstance, sanitizeCaps, sendFailureMessage, getInstancesData,
    ConfigWithSessionId
} from '../src/utils'

process.send = jest.fn()

const capability: Capability = { browserName: 'foo' }

describe('utils', () => {
    beforeEach(() => {
        logMock.error.mockClear()
    })

    describe('runHook', () => {
        it('should execute all hooks', async () => {
            const config = { before: [jest.fn(), jest.fn(), jest.fn()] }
            await runHook('before', config, capability, ['bar'])

            const args = [[config, capability, ['bar']]]
            expect(config.before.map((hook) => hook.mock.calls)).toEqual([args, args, args])
        })

        it('should not fail if hooks throw', async () => {
            const config = {
                before: [
                    jest.fn(),
                    () => new Promise((resolve, reject) => reject(new Error('foobar321'))),
                    () => {
                        throw new Error('foobar123')
                    }
                ]
            }
            await runHook('before', config, capability, ['bar'])
            expect(logMock.error.mock.calls).toHaveLength(2)
            expect(logMock.error.mock.calls[0][0]).toContain('foobar123')
            expect(logMock.error.mock.calls[1][0]).toContain('foobar321')
        })

        it('should do nothing if hook is not array', async () => {
            // @ts-ignore test with invalid params
            expect(runHook('before', null)).toBe(undefined)
            // @ts-ignore test with invalid params
            expect(runHook('before', { before: {} })).toBe(undefined)
            // @ts-ignore test with invalid params
            expect(runHook('before', {})).toBe(undefined)
        })
    })

    describe('initialiseInstance', () => {
        it('should attach to an existing session if sessionId is within config', () => {
            const config: ConfigWithSessionId = {
                sessionId: '123',
                // @ts-ignore test invalid params
                foo: 'bar'
            }
            initialiseInstance(config, { browserName: 'chrome', maxInstances: 2 })
            expect(attach).toBeCalledWith({
                sessionId: '123',
                foo: 'bar',
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
            }, caps)
            expect(remote).toBeCalledWith({
                hostname: 'barfoo',
                port: 4321,
                path: '/',
                capabilities: { browserName: 'chrome' }
            })
        })

        afterEach(() => {
            (attach as jest.Mock).mockClear()
            ;(multiremote as jest.Mock).mockClear()
            ;(remote as jest.Mock).mockClear()
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
            (process.send as jest.Mock).mockClear()
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
            } as any as WebdriverIO.MultiRemoteBrowserObject, true)).toEqual({ foo: { sessionId, isW3C, protocol, hostname, port, path, queryParams } })
        })

        it('isMultiremote = false', () => {
            expect(getInstancesData(null, false)).toEqual(undefined)
        })
    })
})
