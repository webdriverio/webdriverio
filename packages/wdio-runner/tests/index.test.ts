import path from 'node:path'
import fs from 'node:fs/promises'

import { describe, expect, it, vi, afterEach, beforeEach } from 'vitest'
import { executeHooksWithArgs } from '@wdio/utils'
import { attach, Browser } from 'webdriverio'
import WDIORunner from '../src'
import logger from '@wdio/logger'

vi.mock('fs/promises', () => ({
    default: { writeFile: vi.fn() }
}))
vi.mock('util')
vi.mock('webdriverio', () => import(path.join(process.cwd(), '__mocks__', 'webdriverio')))
vi.mock('@wdio/utils', () => import(path.join(process.cwd(), '__mocks__', '@wdio/utils')))
vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))
vi.mock('@wdio/config', () => import(path.join(process.cwd(), '__mocks__', '@wdio/config')))

type BrowserObject = Browser<'async'>

describe('wdio-runner', () => {
    describe('_fetchDriverLogs', () => {
        let runner: WDIORunner

        beforeEach(() => {
            runner = new WDIORunner()
            runner['_cid'] = '0-1'
        })

        it('not do anything if driver does not support log commands', async () => {
            // @ts-expect-error
            global.browser = { sessionId: '123' } as any as BrowserObject

            const result = await runner['_fetchDriverLogs']({ outputDir: '/foo/bar', capabilities: {} }, ['*'])
            expect(result).toBe(undefined)
        })

        it('should not write to file if all logs excluded', async () => {
            // @ts-expect-error
            global.browser = {
                getLogTypes: () => Promise.resolve(['foo', 'bar']),
                getLogs: (type: string) => Promise.resolve([
                    { message: `#1 ${type} log` },
                    { message: `#2 ${type} log` }
                ]),
                sessionId: '123'
            } as any as BrowserObject

            await runner['_fetchDriverLogs']({ outputDir: '/foo/bar', capabilities: {} }, ['*'])

            expect(fs.writeFile).toHaveBeenCalledTimes(0)
        })

        it('should not write to file excluded logTypes', async () => {
            // @ts-expect-error
            global.browser = {
                getLogTypes: () => Promise.resolve(['foo', 'bar']),
                getLogs: (type: string) => Promise.resolve([
                    { message: `#1 ${type} log` },
                    { message: `#2 ${type} log` }
                ]),
                sessionId: '123'
            } as any as BrowserObject

            await runner['_fetchDriverLogs']({ outputDir: '/foo/bar', capabilities: {} }, ['bar'])

            expect(fs.writeFile).toHaveBeenCalledTimes(1)

            expect(vi.mocked(fs.writeFile).mock.calls[0][0])
                .toMatch(/(\\|\/)foo(\\|\/)bar(\\|\/)wdio-0-1-foo.log/)
            expect(vi.mocked(fs.writeFile).mock.calls[0][1])
                .toEqual('{"message":"#1 foo log"}\n{"message":"#2 foo log"}')
            expect(vi.mocked(fs.writeFile).mock.calls[0][2])
                .toEqual('utf-8')
        })

        it('should fetch logs', async () => {
            // @ts-expect-error
            global.browser = {
                getLogTypes: () => Promise.resolve(['foo', 'bar']),
                getLogs: (type: string) => Promise.resolve([
                    { message: `#1 ${type} log` },
                    { message: `#2 ${type} log` }
                ]),
                sessionId: '123'
            } as any

            await runner['_fetchDriverLogs']({ outputDir: '/foo/bar', capabilities: {} }, [])
            expect(vi.mocked(fs.writeFile).mock.calls[0][0])
                .toMatch(/(\\|\/)foo(\\|\/)bar(\\|\/)wdio-0-1-foo.log/)
            expect(vi.mocked(fs.writeFile).mock.calls[0][1])
                .toEqual('{"message":"#1 foo log"}\n{"message":"#2 foo log"}')
            expect(vi.mocked(fs.writeFile).mock.calls[0][2])
                .toEqual('utf-8')

            expect(vi.mocked(fs.writeFile).mock.calls[1][0])
                .toMatch(/(\\|\/)foo(\\|\/)bar(\\|\/)wdio-0-1-bar.log/)
            expect(vi.mocked(fs.writeFile).mock.calls[0][1])
                .toEqual('{"message":"#1 foo log"}\n{"message":"#2 foo log"}')
            expect(vi.mocked(fs.writeFile).mock.calls[0][2])
                .toEqual('utf-8')

        })

        it('should not fail if logsTypes can not be received', async () => {
            // @ts-expect-error
            global.browser = {
                getLogTypes: () => Promise.reject(new Error('boom')),
                getLogs: (type: string) => Promise.resolve([
                    { message: `#1 ${type} log` },
                    { message: `#2 ${type} log` }
                ]),
                sessionId: '123'
            } as any as BrowserObject

            await runner['_fetchDriverLogs']({ outputDir: '/foo/bar', capabilities: {} }, [])
            expect(fs.writeFile).toHaveBeenCalledTimes(0)
        })

        it('should not fail if logs can not be received', async () => {
            // @ts-expect-error
            global.browser = {
                getLogTypes: () => Promise.resolve(['corrupt']),
                getLogs: () => Promise.reject(new Error('boom')),
                sessionId: '123'
            } as any as BrowserObject

            await runner['_fetchDriverLogs']({ outputDir: '/foo/bar', capabilities: {} }, [])
            expect(fs.writeFile).toHaveBeenCalledTimes(0)
        })

        it('should not write to file if no logs exist', async () => {
            // @ts-expect-error
            global.browser = {
                getLogTypes: () => Promise.resolve(['foo', 'bar']),
                getLogs: () => Promise.resolve([]),
                sessionId: '123'
            } as any as BrowserObject

            await runner['_fetchDriverLogs']({ outputDir: '/foo/bar', capabilities: {} }, [])
            expect(vi.mocked(fs.writeFile).mock.calls).toHaveLength(0)
        })

        afterEach(() => {
            vi.mocked(fs.writeFile).mockClear()
            // @ts-ignore test scenario
            delete global.browser
        })
    })

    describe('endSession', () => {
        it('should work normally when called after framework run', async () => {
            const hook = vi.fn()
            const runner = new WDIORunner()
            runner['_shutdown'] = vi.fn()
            // @ts-expect-error
            global.browser = {
                deleteSession: vi.fn(),
                sessionId: '123',
                config: { afterSession: [hook] }
            } as any as BrowserObject
            runner['_config'] = { logLevel: 'info' } as any
            await runner.endSession()
            expect(executeHooksWithArgs).toBeCalledWith(
                'afterSession',
                [hook],
                [{ logLevel: 'info' }, {}, undefined])
            // @ts-expect-error
            expect(global.browser.deleteSession).toBeCalledTimes(1)
            // @ts-expect-error
            expect(!global.browser.sessionId).toBe(true)
            expect(runner['_shutdown']).toBeCalledTimes(0)
        })

        it('should do nothing when triggered by run method without session', async () => {
            const hook = vi.fn()
            const runner = new WDIORunner()
            runner['_shutdown'] = vi.fn()
            await runner.endSession()
            expect(hook).toBeCalledTimes(0)
        })

        it('should work normally when called after framework run in multiremote', async () => {
            const hook = vi.fn()
            const runner = new WDIORunner()
            runner['_isMultiremote'] = true
            runner['_shutdown'] = vi.fn()
            // @ts-expect-error
            global.browser = {
                deleteSession: vi.fn(),
                instances: ['foo', 'bar'],
                foo: {
                    sessionId: '123',
                },
                bar: {
                    sessionId: '456',
                },
                capabilities: {
                    foo: {
                        browserName: 'Chrome'
                    },
                    bar: {
                        browserName: 'Chrome'
                    }
                },
                config: { afterSession: [hook] }
            } as any as WebdriverIO.MultiRemoteBrowser
            runner['_config'] = { logLevel: 'error' } as any
            await runner.endSession()
            expect(executeHooksWithArgs).toBeCalledWith(
                'afterSession',
                [hook],
                [{ logLevel: 'error' }, { foo: undefined, bar: undefined }, undefined])
            // @ts-expect-error
            expect(global.browser.deleteSession).toBeCalledTimes(1)
            // @ts-expect-error
            expect(!global.browser.foo.sessionId).toBe(true)
            // @ts-expect-error
            expect(!global.browser.bar.sessionId).toBe(true)
            expect(runner['_shutdown']).toBeCalledTimes(0)
        })

        it('should do nothing when triggered by run method without session in multiremote', async () => {
            const hook = vi.fn()
            const runner = new WDIORunner()
            runner['_isMultiremote'] = true
            runner['_shutdown'] = vi.fn()
            await runner.endSession()
            expect(hook).toBeCalledTimes(0)
        })

        afterEach(() => {
            // @ts-ignore test scenario
            delete global.browser
        })
    })

    describe('run', () => {
        beforeEach(() => {
            process.send = vi.fn()
        })

        it('should fail if log file is corrupted', async () => {
            const runner = new WDIORunner()
            runner['_shutdown'] = vi.fn()
            runner['_configParser'].autoCompile = vi.fn()
            runner['_configParser'].addConfigFile = vi.fn().mockImplementation(
                () => { throw new Error('boom') })
            await runner.run({ args: {} } as any)

            expect(runner['_shutdown']).toBeCalledWith(1, undefined)
            expect(runner['_configParser'].autoCompile).toBeCalledTimes(0)
        })

        it('should auto compile if args are given', async () => {
            const config = {
                reporters: [],
                before: [],
                beforeSession: [],
                framework: 'testWithFailures'
            }

            const runner = new WDIORunner()
            runner['_shutdown'] = vi.fn()
            runner['_configParser'].autoCompile = vi.fn()
            runner['_configParser'].getConfig = vi.fn().mockReturnValue(config)
            await runner.run({ args: { autoCompileOpts: { autoCompile: true } } } as any)

            expect(runner['_shutdown']).toBeCalledWith(1, undefined)
            expect(runner['_configParser'].autoCompile).toBeCalledTimes(1)
        })

        it('should fail if init session fails', async () => {
            const runner = new WDIORunner()
            const beforeSession = vi.fn()
            const before = vi.fn()
            const caps = { browserName: '123' }
            const specs = ['foobar']
            const config = {
                reporters: [],
                before: [before],
                beforeSession: [beforeSession],
                framework: 'testWithFailures'
            }
            runner['_configParser'].getConfig = vi.fn().mockReturnValue(config)
            runner['_shutdown'] = vi.fn()
            const stubBrowser = {
                capabilities: { browserName: 'chrome' },
                options: {}
            }
            runner['_initSession'] = vi.fn().mockReturnValue(stubBrowser)
            await runner.run({
                args: { reporters: [] },
                cid: '0-0',
                retries: 2,
                caps,
                specs,
                configFile: '/foo/bar'
            })

            expect(runner['_shutdown']).toBeCalledWith(123, 2)
            expect(executeHooksWithArgs).toBeCalledWith('beforeSession', [beforeSession], [config, {
                browserName: '123'
            }, ['foobar'], '0-0'])
            expect(executeHooksWithArgs).toBeCalledWith('before', config.before, [caps, specs, stubBrowser])

            // session capabilities should be passed to reporter
            expect(runner['_reporter']?.caps).toEqual({ browserName: 'chrome' })
        })

        it('should return failures count', async () => {
            const runner = new WDIORunner()
            const config = {
                framework: 'testNoFailures',
                reporters: [],
                beforeSession: []
            }
            runner['_configParser'].getConfig = vi.fn().mockReturnValue(config)
            runner['_initSession'] = vi.fn().mockReturnValue({ options: { capabilities: {} } })
            const failures = await runner.run({ args: {}, caps: {} } as any)

            expect(failures).toBe(0)
        })

        it('should not call browser url if args watch', async () => {
            const runner = new WDIORunner()
            const config = {
                framework: 'testNoFailures',
                reporters: [],
                beforeSession: []
            }
            runner['_configParser'].getConfig = vi.fn().mockReturnValue(config)
            // @ts-expect-error
            global.browser = { url: vi.fn(url => url) } as any as BrowserObject
            runner['_startSession'] = vi.fn().mockReturnValue({ })
            runner['_initSession'] = vi.fn().mockReturnValue({ options: { capabilities: {} } })
            const failures = await runner.run({ args: { watch: true }, caps: {} } as any)

            expect(failures).toBe(0)
            // @ts-expect-error
            expect(global.browser.url).not.toBeCalled()
        })

        it('should set failures to 1 in case of error', async () => {
            const runner = new WDIORunner()
            const config = {
                framework: 'testThrows',
                reporters: [],
                beforeSession: []
            }
            runner['_configParser'].getConfig = vi.fn().mockReturnValue(config)
            runner['_initSession'] = vi.fn().mockReturnValue({ options: { capabilities: {} } })
            runner.emit = vi.fn()
            const failures = await runner.run({ args: {}, caps: {} } as any)

            expect(failures).toBe(1)
            expect(vi.mocked(runner.emit).mock.calls[0])
                .toEqual(['error', new Error('framework testThrows failed')])
        })

        it('should return if sigintWasCalled', async () => {
            const runner = new WDIORunner()
            const caps = { browserName: '123' }
            const specs = ['foobar']
            const config = {
                framework: 'testThrows',
                reporters: [],
                beforeSession: []
            }
            runner['_configParser'].getConfig = vi.fn().mockReturnValue(config)
            runner['_shutdown'] = vi.fn()
            runner.endSession = vi.fn()
            runner['_initSession'] = vi.fn().mockReturnValue({})
            runner['_sigintWasCalled'] = true
            await runner.run({
                args: { reporters: [] },
                cid: '0-0',
                caps,
                specs,
                configFile: '/foo/bar',
                retries: 0
            })

            expect(runner.endSession).toBeCalledTimes(1)
            expect(runner['_shutdown']).toBeCalledWith(0, 0)
        })

        it('should not initSession if there are no tests to run', async () => {
            const runner = new WDIORunner()
            const config = {
                framework: 'testNoTests',
                reporters: [],
                beforeSession: []
            }
            runner['_configParser'].getConfig = vi.fn().mockReturnValue(config)
            runner['_shutdown'] = vi.fn().mockImplementation((arg) => arg)
            runner['_initSession'] = vi.fn()

            expect(await runner.run({ args: {}, caps: {} } as any)).toBe(0)
            expect(runner['_shutdown']).toBeCalledWith(0, undefined)
            expect(runner['_initSession']).not.toBeCalled()
        })

        it('should shutdown if session was not created', async () => {
            const runner = new WDIORunner()
            const caps = { browserName: '123' }
            const specs = ['foobar']
            const config = {
                framework: 'testNoFailures',
                reporters: [],
                beforeSession: [],
                after: 'foobar'
            }
            runner['_configParser'].getConfig = vi.fn().mockReturnValue(config)
            runner['_shutdown'] = vi.fn().mockReturnValue('_shutdown')
            runner.endSession = vi.fn()
            runner['_initSession'] = vi.fn().mockReturnValue(null)
            expect(await runner.run({
                args: { reporters: [] },
                cid: '0-0',
                caps,
                specs,
                configFile: '/foo/bar',
                retries: 0
            })).toBe('_shutdown')

            expect(runner['_shutdown']).toBeCalledWith(1, 0)
            expect(executeHooksWithArgs).toBeCalledWith(
                'after',
                'foobar',
                [1, caps, specs]
            )

            // user defined capabilities should be used until
            // browser session is started
            expect(runner['_reporter']?.caps).toEqual(caps)
        })

        afterEach(() => {
            // @ts-ignore test scenario
            delete global.browser
        })
    })

    describe('_initSession', () => {
        it('should register browser to global scope', async () => {
            const runner = new WDIORunner()
            const browser = await runner['_initSession'](
                { hostname: 'foobar' } as any,
                [{ browserName: 'chrome1' }] as any
            )

            // @ts-expect-error
            expect(browser).toBe(global.browser)
            expect(typeof $).toBe('function')
            expect(typeof $$).toBe('function')

            expect(browser!.$).toBeCalledTimes(0)
            expect(browser!.$$).toBeCalledTimes(0)
            /* eslint-disable-next-line */
            $('foobar')
            /* eslint-disable-next-line */
            $$('barfoo')
            expect(browser!.$).toBeCalledTimes(1)
            expect(browser!.$$).toBeCalledTimes(1)
        })

        it('should register before and after command listener', async () => {
            const reporter = { emit: vi.fn() }
            const runner = new WDIORunner()

            runner['_reporter'] = reporter as any
            const browser = await runner['_initSession'](
                { hostname: 'foobar' } as any,
                [{ browserName: 'chrome' }] as any
            )

            const beforeListener = vi.mocked(browser!.on).mock.calls[0]
            expect(beforeListener[0]).toBe('command')
            beforeListener[1]({ foo: 'bar' })
            expect(reporter.emit).toBeCalledWith(
                'client:beforeCommand',
                { foo: 'bar', sessionId: 'fakeid' })

            reporter.emit.mockClear()

            const afterListener = vi.mocked(browser!.on).mock.calls[1]
            expect(afterListener[0]).toBe('result')
            afterListener[1]({ bar: 'foo' })
            expect(reporter.emit).toBeCalledWith(
                'client:afterCommand',
                { bar: 'foo', sessionId: 'fakeid' })
        })

        it('should return null if initiating session fails', async () => {
            // @ts-ignore test scenario
            global.throwRemoteCall = true
            const runner = new WDIORunner()
            runner.emit = vi.fn()
            const browser = await runner['_initSession'](
                { hostname: 'foobar' } as any,
                [{ browserName: 'chrome' }] as any
            )

            expect(browser).toBe(undefined)
        })

        afterEach(() => {
            // @ts-ignore test scenario
            delete global.throwRemoteCall
            // @ts-ignore test scenario
            delete global.browser
            // @ts-ignore test scenario
            delete global.driver
            // @ts-ignore test scenario
            delete global.$
            // @ts-ignore test scenario
            delete global.$$
        })
    })

    describe('_shutdown', () => {
        it('should emit exit', async () => {
            const runner = new WDIORunner()
            runner['_reporter'] = {
                waitForSync: vi.fn().mockReturnValue(Promise.resolve()),
                emit: vi.fn()
            } as any
            runner.emit = vi.fn()

            expect(await runner['_shutdown'](123, 123)).toBe(123)
            expect(runner['_reporter']!.waitForSync).toBeCalledTimes(1)
            expect(runner.emit).toBeCalledWith('exit', 1)
        })

        it('should emit exit when reporter unsync', async () => {
            const log = logger('wdio-runner')
            vi.spyOn(log, 'error').mockImplementation((string) => string)

            const runner = new WDIORunner()
            runner['_reporter'] = {
                waitForSync: vi.fn().mockReturnValue(Promise.reject('foo')),
                emit: vi.fn()
            } as any
            runner.emit = vi.fn()

            expect(await runner['_shutdown'](123, 123)).toBe(123)
            expect(runner['_reporter']!.waitForSync).toBeCalledTimes(1)
            expect(runner.emit).toBeCalledWith('exit', 1)
            expect(log.error).toHaveBeenCalledWith('foo')
        })
    })

    afterEach(() => {
        vi.mocked(executeHooksWithArgs).mockClear()
        vi.mocked(attach).mockClear()
        // @ts-ignore test scenario
        delete global.browser
    })
})
