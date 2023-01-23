import path from 'node:path'
import fs from 'node:fs/promises'

import logger from '@wdio/logger'
import { describe, expect, it, vi, afterEach, beforeEach } from 'vitest'
import { executeHooksWithArgs } from '@wdio/utils'
import { ConfigParser } from '@wdio/config'
import { attach } from 'webdriverio'
import { _setGlobal } from '@wdio/globals'
import { setOptions } from 'expect-webdriverio'

import WDIORunner from '../src/index.js'

vi.mock('fs/promises', () => ({
    default: { writeFile: vi.fn() }
}))
vi.mock('util')
vi.mock('expect-webdriverio')
vi.mock('webdriverio', () => import(path.join(process.cwd(), '__mocks__', 'webdriverio')))
vi.mock('@wdio/utils', () => import(path.join(process.cwd(), '__mocks__', '@wdio/utils')))
vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))
vi.mock('@wdio/globals', () => ({
    _setGlobal: vi.fn()
}))

type BrowserObject = WebdriverIO.Browser
type MultiRemoteBrowserObject = WebdriverIO.MultiRemoteBrowser

describe('wdio-runner', () => {
    beforeEach(() => {
        vi.mocked(_setGlobal).mockClear()
        vi.mocked(setOptions).mockClear()
        process.send = vi.fn()
    })

    describe('_fetchDriverLogs', () => {
        let runner: WDIORunner

        beforeEach(() => {
            runner = new WDIORunner()
            runner['_cid'] = '0-1'
        })

        it('not do anything if driver does not support log commands', async () => {
            runner['_browser'] = { sessionId: '123' } as any as BrowserObject

            const result = await runner['_fetchDriverLogs']({ outputDir: '/foo/bar', capabilities: {} }, ['*'])
            expect(result).toBe(undefined)
        })

        it('should not write to file if all logs excluded', async () => {
            runner['_browser'] = {
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
            runner['_browser'] = {
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
            runner['_browser'] = {
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
            runner['_browser'] = {
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
            runner['_browser'] = {
                getLogTypes: () => Promise.resolve(['corrupt']),
                getLogs: () => Promise.reject(new Error('boom')),
                sessionId: '123'
            } as any as BrowserObject

            await runner['_fetchDriverLogs']({ outputDir: '/foo/bar', capabilities: {} }, [])
            expect(fs.writeFile).toHaveBeenCalledTimes(0)
        })

        it('should not write to file if no logs exist', async () => {
            runner['_browser'] = {
                getLogTypes: () => Promise.resolve(['foo', 'bar']),
                getLogs: () => Promise.resolve([]),
                sessionId: '123'
            } as any as BrowserObject

            await runner['_fetchDriverLogs']({ outputDir: '/foo/bar', capabilities: {} }, [])
            expect(vi.mocked(fs.writeFile).mock.calls).toHaveLength(0)
        })

        afterEach(() => {
            vi.mocked(fs.writeFile).mockClear()
            delete runner['_browser']
        })
    })

    describe('endSession', () => {
        it('should work normally when called after framework run', async () => {
            const hook = vi.fn()
            const runner = new WDIORunner()
            runner['_shutdown'] = vi.fn()
            runner['_browser'] = {
                deleteSession: vi.fn(),
                sessionId: '123',
                config: { afterSession: [hook] }
            } as any as BrowserObject
            runner['_config'] = { logLevel: 'info', afterSession: [hook] } as any
            await runner.endSession()
            expect(executeHooksWithArgs).toBeCalledWith(
                'afterSession',
                [hook],
                [{ logLevel: 'info', afterSession: [hook] }, {}, undefined])
            expect(runner['_browser'].deleteSession).toBeCalledTimes(1)
            expect(!runner['_browser'].sessionId).toBe(true)
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
            runner['_browser'] = {
                deleteSession: vi.fn(),
                instances: ['foo', 'bar'],
                getInstance: vi.fn().mockReturnValue({
                    sessionId: '123',
                }),
                capabilities: {
                    foo: {
                        browserName: 'Chrome'
                    },
                    bar: {
                        browserName: 'Chrome'
                    }
                },
                config: { afterSession: [hook] }
            } as any
            runner['_config'] = { logLevel: 'error', afterSession: [hook] } as any
            await runner.endSession()
            expect(executeHooksWithArgs).toBeCalledWith(
                'afterSession',
                [hook],
                [{ logLevel: 'error', afterSession: [hook] }, { foo: undefined, bar: undefined }, undefined])
            expect(runner['_browser']!.deleteSession).toBeCalledTimes(1)
            expect(!(runner['_browser'] as any as MultiRemoteBrowserObject).getInstance('foo').sessionId).toBe(true)
            expect(!(runner['_browser'] as any as MultiRemoteBrowserObject).getInstance('bar').sessionId).toBe(true)
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
    })

    describe('run', () => {
        afterEach(() => {
            vi.spyOn(ConfigParser.prototype, 'initialize').mockRestore()
        })

        it('should fail if log file is corrupted', async () => {
            vi.spyOn(ConfigParser.prototype, 'initialize').mockRejectedValueOnce(new Error('ups'))
            const runner = new WDIORunner()
            runner['_shutdown'] = vi.fn()
            await runner.run({ args: {}, configFile: '/foo/bar' } as any)
            expect(runner['_shutdown']).toBeCalledWith(1, undefined, true)
        })

        it('should auto compile if args are given', async () => {
            const config: any = {
                reporters: [],
                before: [],
                beforeSession: [],
                framework: 'testWithFailures',
                runner: 'local'
            }

            const runner = new WDIORunner()
            runner['_shutdown'] = vi.fn()
            vi.spyOn(ConfigParser.prototype, 'getConfig').mockReturnValue(config)
            await runner.run({ configFile: '/foo/bar', args: { autoCompileOpts: { autoCompile: true } } } as any)

            expect(runner['_shutdown']).toBeCalledWith(1, undefined, true)
        })

        it('should fail if init session fails', async () => {
            const runner = new WDIORunner()
            const beforeSession = vi.fn()
            const before = vi.fn()
            const caps = { browserName: '123' }
            const specs = ['foobar']
            const config:any = {
                reporters: [],
                before: [before],
                beforeSession: [beforeSession],
                framework: 'testWithFailures',
                runner: 'local'
            }
            vi.spyOn(ConfigParser.prototype, 'getConfig').mockReturnValue(config)
            // @ts-expect-error mock private
            vi.spyOn(ConfigParser.prototype, 'addConfigFile').mockReturnValue()

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
            const config: any = {
                framework: 'testNoFailures',
                reporters: [],
                beforeSession: [],
                runner: 'local'
            }
            vi.spyOn(ConfigParser.prototype, 'getConfig').mockReturnValue(config)
            runner['_initSession'] = vi.fn().mockReturnValue({ options: { capabilities: {} } })
            const failures = await runner.run({ args: {}, caps: {}, configFile: '/bar/foo' } as any)

            expect(failures).toBe(0)
        })

        it('should not call browser url if args watch', async () => {
            const runner = new WDIORunner()
            const config: any = {
                framework: 'testNoFailures',
                reporters: [],
                beforeSession: [],
                runner: 'local'
            }
            vi.spyOn(ConfigParser.prototype, 'getConfig').mockReturnValue(config)
            runner['_browser'] = { url: vi.fn(url => url) } as any as BrowserObject
            runner['_startSession'] = vi.fn().mockReturnValue({ })
            runner['_initSession'] = vi.fn().mockReturnValue({ options: { capabilities: {} } })
            const failures = await runner.run({ args: { watch: true }, caps: {}, configFile: '/foo/bar' } as any)

            expect(failures).toBe(0)
            expect(runner['_browser']?.url).not.toBeCalled()
        })

        it('should set failures to 1 in case of error', async () => {
            const runner = new WDIORunner()
            const config:any = {
                framework: 'testThrows',
                reporters: [],
                beforeSession: [],
                runner: 'local'
            }
            vi.spyOn(ConfigParser.prototype, 'getConfig').mockReturnValue(config)
            runner['_initSession'] = vi.fn().mockReturnValue({ options: { capabilities: {} } })
            runner.emit = vi.fn()
            const failures = await runner.run({ args: {}, caps: {}, configFile: '/foo/bar' } as any)

            expect(failures).toBe(1)
            expect(vi.mocked(runner.emit).mock.calls[0])
                .toEqual(['error', new Error('framework testThrows failed')])
        })

        it('should return if sigintWasCalled', async () => {
            const runner = new WDIORunner()
            const caps = { browserName: '123' }
            const specs = ['foobar']
            const config: any = {
                framework: 'testThrows',
                reporters: [],
                beforeSession: [],
                runner: 'local'
            }
            vi.spyOn(ConfigParser.prototype, 'getConfig').mockReturnValue(config)
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
            expect(runner['_shutdown']).toBeCalledWith(0, 0, true)
        })

        it('should not initSession if there are no tests to run', async () => {
            const runner = new WDIORunner()
            const config: any = {
                framework: 'testNoTests',
                reporters: [],
                beforeSession: [],
                runner: 'local'
            }
            vi.spyOn(ConfigParser.prototype, 'getConfig').mockReturnValue(config)
            runner['_shutdown'] = vi.fn().mockImplementation((arg) => arg)
            runner['_initSession'] = vi.fn()

            expect(await runner.run({ args: {}, caps: {}, configFile: '/foo/bar' } as any)).toBe(0)
            expect(runner['_shutdown']).toBeCalledWith(0, undefined, true)
            expect(runner['_initSession']).not.toBeCalled()
        })

        it('should shutdown if session was not created', async () => {
            const runner = new WDIORunner()
            const caps = { browserName: '123' }
            const specs = ['foobar']
            const config: any = {
                framework: 'testNoFailures',
                reporters: [],
                beforeSession: [],
                after: 'foobar',
                runner: 'local'
            }
            vi.spyOn(ConfigParser.prototype, 'getConfig').mockReturnValue(config)
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

            expect(runner['_shutdown']).toBeCalledWith(1, 0, true)
            expect(executeHooksWithArgs).toBeCalledWith(
                'after',
                'foobar',
                [1, caps, specs]
            )

            // user defined capabilities should be used until
            // browser session is started
            expect(runner['_reporter']?.caps).toEqual(caps)
        })
    })

    describe('_initSession', () => {
        it('should register browser to global scope', async () => {
            const runner = new WDIORunner()
            const browser = await runner['_initSession'](
                { hostname: 'foobar', waitforTimeout: 1, waitforInterval: 2 } as any,
                [{ browserName: 'chrome1' }] as any
            )

            expect(_setGlobal).toBeCalledWith('browser', browser, undefined)
            expect(_setGlobal).toBeCalledWith('driver', browser, undefined)
            expect(_setGlobal).toBeCalledWith('expect', expect.any(Function), undefined)
            expect(_setGlobal).toBeCalledWith('$', expect.any(Function), undefined)
            expect(_setGlobal).toBeCalledWith('$$', expect.any(Function), undefined)

            expect(setOptions).toBeCalledTimes(1)
            expect(setOptions).toBeCalledWith({
                wait: 1,
                interval: 2
            })
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
        })
    })

    describe('_startSession', () => {
        it('can start a session', async () => {
            const runner = new WDIORunner()
            const browser = await runner['_startSession']({} as any, {} as any)
            expect(typeof browser?.deleteSession).toBe('function')
            expect(_setGlobal).toBeCalledTimes(3)
            expect(setOptions).toBeCalledTimes(1)
        })

        it('transfers custom commands from old instance to new one', async () => {
            const runner = new WDIORunner()
            runner['_browser'] = {
                customCommands: [[1, 2, 3]],
                overwrittenCommands: [[3, 2, 1]]
            } as any
            const browser = await runner['_startSession']({} as any, {} as any)
            expect(browser?.addCommand).toBeCalledWith(1, 2, 3)
            expect(browser?.overwriteCommand).toBeCalledWith(3, 2, 1)
        })
    })

    describe('_shutdown', () => {
        it('should emit exit', async () => {
            const runner = new WDIORunner()
            runner['_browser'] = {} as any as BrowserObject
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
            runner['_browser'] = {} as any as BrowserObject
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

        it('should emit runner:start if the initialisation failed', async () => {
            const runner = new WDIORunner()
            runner['_configParser'] = { getCapabilities: vi.fn().mockReturnValue([{ browserName: 'safari' }]) } as any
            runner['_browser'] = {} as any as BrowserObject
            runner['_reporter'] = {
                waitForSync: vi.fn().mockReturnValue(Promise.resolve()),
                emit: vi.fn()
            } as any
            const reporter = runner['_reporter'] as any
            runner.emit = vi.fn()

            const args = [
                ['runner:start', {
                    'capabilities': {
                        '0': { 'browserName': 'safari' }
                    },
                    'cid': undefined,
                    'config': undefined,
                    'instanceOptions': {},
                    'isMultiremote': false,
                    'retry': 0,
                    'specs': undefined
                }],
                ['runner:end', { 'cid': undefined, 'failures': 123, 'retries': 123 }]
            ]
            expect(await runner['_shutdown'](123, 123, true)).toBe(123)
            expect(reporter.emit.mock.calls).toEqual(args)
            expect(runner.emit).toBeCalledWith('exit', 1)
        })
    })

    afterEach(() => {
        vi.mocked(executeHooksWithArgs).mockClear()
        vi.mocked(attach).mockClear()
        delete process.send
    })
})
