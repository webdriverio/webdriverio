import path from 'node:path'
// @ts-expect-error - mock
import { logMock } from '@wdio/logger'
import { attach, remote, multiremote } from 'webdriverio'
import { describe, expect, it, vi, afterEach, beforeEach } from 'vitest'

import type { ConfigWithSessionId
} from '../src/utils.js'
import {
    initialiseInstance, sanitizeCaps, getInstancesData
} from '../src/utils.js'

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
            initialiseInstance(config, {
                browserName: 'chrome',
                maxInstances: 2,
                hostname: 'foobar'
            })
            expect(attach).toBeCalledWith({
                sessionId: '123',
                foo: 'bar',
                hostname: 'foobar',
                capabilities: {
                    hostname: 'foobar',
                    maxInstances: 2,
                    browserName: 'chrome'
                }
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
                getInstance: vi.fn().mockReturnValue({
                    isW3C,
                    sessionId,
                    options: { protocol, hostname, port, path, queryParams }
                })
            // @ts-expect-error
            } as any as WebdriverIO.MultiRemoteBrowserObject, true))
                .toEqual({ foo: { sessionId, isW3C, protocol, hostname, port, path, queryParams } })
        })

        it('isMultiremote = false', () => {
            expect(getInstancesData({} as any, false))
                .toEqual(undefined)
        })
    })
})
