import { AsyncLocalStorage } from 'node:async_hooks'
import path from 'node:path'
import url from 'node:url'

import logger from '@wdio/logger'
import { describe, expect, it, vi, afterEach, beforeEach, onTestFinished } from 'vitest'
import { executeHooksWithArgs, initializePlugin } from '@wdio/utils'
import { ConfigParser } from '@wdio/config/node'
import type { Instances } from 'webdriverio'
import { attach, PARALLEL_CONTEXT_STORE_KEY } from 'webdriverio'
import { _setGlobal } from '@wdio/globals'
import { setDefaultOptions, SnapshotService, SoftAssertionService } from 'expect-webdriverio'

import WDIORunner from '../src/index.js'
import BaseReporter from '../src/reporter.js'
import type { CustomStubCommand } from '../src/types.js'

vi.mock('expect-webdriverio', () => ({
    setDefaultOptions: vi.fn(),
    expect: vi.fn(),
    SoftAssertionService: vi.fn(),
    SnapshotService: {
        initiate: vi.fn().mockReturnValue({
            results: ['foobar']
        })
    }
}))
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
        vi.mocked(setDefaultOptions).mockClear()
        process.send = vi.fn()
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
            } as unknown as BrowserObject
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

        it('should skip teardown when no session was created', async () => {
            const runner = new WDIORunner()
            runner['_config'] = { afterSession: [vi.fn()] } as any
            await runner.endSession()
            expect(executeHooksWithArgs).not.toBeCalled()
            expect(attach).not.toBeCalled()
        })

        it('should work normally when called after framework run in multi-remote', async () => {
            const hook = vi.fn()
            const runner = new WDIORunner()
            runner['_isMultiRemote'] = true
            runner['_shutdown'] = vi.fn()
            const instances: Record<string, { sessionId?: string, deleteSession: () => Promise<void> }> = {
                foo: { sessionId: '123', deleteSession: vi.fn() },
                bar: { sessionId: '456', deleteSession: vi.fn() }
            }
            runner['_browser'] = {
                deleteSession: vi.fn(),
                instances: ['foo', 'bar'],
                getInstance: vi.fn((name: string) => instances[name]),
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
            expect(instances.foo.deleteSession).toBeCalledTimes(1)
            expect(instances.bar.deleteSession).toBeCalledTimes(1)
            expect(runner['_browser']!.deleteSession).not.toBeCalled()
            expect(!(runner['_browser'] as unknown as MultiRemoteBrowserObject).getInstance('foo').sessionId).toBe(true)
            expect(!(runner['_browser'] as unknown as MultiRemoteBrowserObject).getInstance('bar').sessionId).toBe(true)
            expect(runner['_shutdown']).toBeCalledTimes(0)
        })

        it('should still end the worker when the session is already gone', async () => {
            const log = logger('wdio-runner')
            vi.spyOn(log, 'error').mockImplementation(() => {})
            const hook = vi.fn()
            const runner = new WDIORunner()
            runner['_cid'] = '0-0'
            runner['_browser'] = {
                deleteSession: vi.fn().mockRejectedValue(new Error('invalid session id: A session is either terminated or not started')),
                sessionId: '123'
            } as unknown as BrowserObject
            runner['_config'] = { afterSession: [hook] } as any

            await expect(runner.endSession()).resolves.toBeUndefined()

            expect(log.error).toHaveBeenCalledWith(expect.stringContaining('Failed to end the session: invalid session id'))
            expect(log.error).toHaveBeenCalledWith(expect.stringContaining('Close it manually if needed.'))
            expect(process.send).toBeCalledWith({ origin: 'worker', name: 'sessionEnded', cid: '0-0' })
            expect(runner['_browser']!.sessionId).toBeUndefined()
            expect(executeHooksWithArgs).toBeCalledWith('afterSession', [hook], expect.any(Array))
        })

        it('should delete every multi-remote session when one of them is already gone', async () => {
            const log = logger('wdio-runner')
            vi.spyOn(log, 'error').mockImplementation(() => {})
            const runner = new WDIORunner()
            runner['_isMultiRemote'] = true
            const instances: Record<string, { sessionId?: string, capabilities: object, deleteSession: () => Promise<void> }> = {
                foo: { sessionId: '123', capabilities: {}, deleteSession: vi.fn().mockRejectedValue(new Error('fetch failed')) },
                bar: { sessionId: '456', capabilities: {}, deleteSession: vi.fn().mockResolvedValue(undefined) }
            }
            runner['_browser'] = {
                instances: ['foo', 'bar'],
                getInstance: vi.fn((name: string) => instances[name]),
                capabilities: {}
            } as any
            runner['_config'] = { afterSession: [] } as any

            await expect(runner.endSession()).resolves.toBeUndefined()

            expect(instances.foo.deleteSession).toBeCalledTimes(1)
            expect(instances.bar.deleteSession).toBeCalledTimes(1)
            expect(log.error).toHaveBeenCalledTimes(1)
            expect(log.error).toHaveBeenCalledWith(expect.stringContaining('Failed to end the session of "foo": fetch failed'))
            expect(instances.foo.sessionId).toBeUndefined()
            expect(instances.bar.sessionId).toBeUndefined()
            expect(executeHooksWithArgs).toBeCalledWith('afterSession', [], expect.any(Array))
        })
    })

    describe('run', () => {
        beforeEach(() => {
            // @ts-expect-error mock private
            vi.spyOn(ConfigParser.prototype, 'addConfigFile').mockReturnValue(undefined)
        })

        afterEach(() => {
            vi.spyOn(ConfigParser.prototype, 'initialize').mockRestore()
            // @ts-expect-error mock private
            vi.spyOn(ConfigParser.prototype, 'addConfigFile').mockRestore()
            vi.spyOn(ConfigParser.prototype, 'getConfig').mockRestore()
        })

        it('should shut down when config initialization fails', async () => {
            vi.spyOn(ConfigParser.prototype, 'initialize').mockRejectedValueOnce(new Error('ups'))
            const runner = new WDIORunner()
            runner['_shutdown'] = vi.fn()
            await runner.run({ args: {}, configFile: '/foo/bar' } as any)
            expect(runner['_shutdown']).toBeCalledWith(1, undefined, true)
        })

        it('should run session hooks and return framework failures', async () => {
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

        it('should shut down and report when the session is already gone at the end', async () => {
            const log = logger('wdio-runner')
            vi.spyOn(log, 'error').mockImplementation(() => {})
            const runner = new WDIORunner()
            const config: any = {
                reporters: [],
                before: [],
                beforeSession: [],
                framework: 'testWithFailures',
                runner: 'local'
            }
            vi.spyOn(ConfigParser.prototype, 'getConfig').mockReturnValue(config)
            runner['_shutdown'] = vi.fn().mockResolvedValue(123)
            const stubBrowser = {
                sessionId: '123',
                capabilities: { browserName: 'chrome' },
                options: {},
                deleteSession: vi.fn().mockRejectedValue(new Error('invalid session id'))
            }
            runner['_initSession'] = vi.fn().mockImplementation(async () => {
                runner['_browser'] = stubBrowser as unknown as BrowserObject
                return stubBrowser
            })

            await expect(runner.run({
                args: { reporters: [] },
                cid: '0-0',
                retries: 0,
                caps: { browserName: '123' },
                specs: ['foobar'],
                configFile: '/foo/bar'
            })).resolves.toBe(123)

            expect(stubBrowser.deleteSession).toBeCalledTimes(1)
            expect(process.send).toBeCalledWith({ origin: 'worker', name: 'sessionEnded', cid: '0-0' })
            expect(runner['_shutdown']).toBeCalledWith(123, 0)
        })

        it('should send the post-beforeSession retry budget with testFrameworkInit', async () => {
            const runner = new WDIORunner()
            const config: any = {
                reporters: [],
                before: [],
                beforeSession: [vi.fn()],
                specFileRetries: 2,
                framework: 'testWithFailures',
                runner: 'local'
            }
            vi.spyOn(ConfigParser.prototype, 'getConfig').mockReturnValue(config)
            vi.mocked(executeHooksWithArgs).mockImplementation(async (name: unknown, _hooks: unknown, args: unknown) => {
                if (name === 'beforeSession') {
                    (args as any[])[0].specFileRetries = 5
                }
                return []
            })
            onTestFinished(() => vi.mocked(executeHooksWithArgs).mockReset())

            runner['_shutdown'] = vi.fn()
            runner['_initSession'] = vi.fn().mockReturnValue({
                capabilities: { browserName: 'chrome' },
                options: {}
            })
            await runner.run({
                args: { reporters: [] },
                cid: '0-0',
                retries: -1,
                caps: { browserName: '123' },
                specs: ['foobar'],
                configFile: '/foo/bar'
            })

            expect(process.send).toBeCalledWith(expect.objectContaining({
                name: 'testFrameworkInit',
                // budget overridden in `beforeSession` (5) minus the -1 launcher
                // sentinel, mirroring the `sessionStarted` accounting
                specFileRetries: 6
            }))
        })

        it('should hand the browser to the framework before running it', async () => {
            const calls: string[] = []
            const stubBrowser = { capabilities: {}, options: {} }
            const framework: any = {
                init: () => framework,
                hasTests: () => true,
                setBrowser: vi.fn(() => calls.push('setBrowser')),
                run: vi.fn(async () => { calls.push('run'); return 0 })
            }
            vi.mocked(initializePlugin).mockResolvedValueOnce({ default: framework } as any)
            vi.spyOn(ConfigParser.prototype, 'getConfig').mockReturnValue({
                framework: 'testNoFailures', reporters: [], beforeSession: [], runner: 'local'
            } as any)
            const runner = new WDIORunner()
            runner['_shutdown'] = vi.fn()
            runner['_initSession'] = vi.fn().mockReturnValue(stubBrowser)
            await runner.run({ args: {}, caps: {}, configFile: '/bar/foo' } as any)

            expect(framework.setBrowser).toBeCalledWith(stubBrowser)
            expect(calls).toEqual(['setBrowser', 'run'])
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

        it('should start the pre-session stub without a side-channel protocol field', async () => {
            const runner = new WDIORunner()
            const config: any = {
                framework: 'testNoFailures',
                reporters: [],
                beforeSession: [],
                runner: 'local',
                automationProtocol: 'webdriver'
            }
            vi.spyOn(ConfigParser.prototype, 'getConfig').mockReturnValue(config)
            runner['_shutdown'] = vi.fn()
            const startSession = vi.spyOn(runner as any, '_startSession').mockResolvedValue({
                capabilities: { browserName: 'chrome' },
                options: {}
            })
            runner['_initSession'] = vi.fn().mockResolvedValue({
                capabilities: { browserName: 'chrome' },
                options: {},
                sessionId: 'sid'
            })

            await runner.run({
                args: { reporters: [] },
                cid: '0-0',
                caps: { browserName: 'chrome' },
                specs: ['foobar'],
                configFile: '/foo/bar'
            } as any)

            const stubConfig = startSession.mock.calls[0][0]
            expect(stubConfig.automationProtocol).toBe('./protocol-stub.js')
            expect(stubConfig).not.toHaveProperty('_automationProtocol')
            expect(config.automationProtocol).toBe('webdriver')
        })

        it('should leave the session open in watch mode', async () => {
            const runner = new WDIORunner()
            const config: any = {
                framework: 'testNoFailures',
                reporters: [],
                beforeSession: [],
                runner: 'local'
            }
            vi.spyOn(ConfigParser.prototype, 'getConfig').mockReturnValue(config)
            runner['_startSession'] = vi.fn().mockReturnValue({ })
            runner['_initSession'] = vi.fn().mockReturnValue({ options: { capabilities: {} } })
            const endSession = vi.spyOn(runner, 'endSession').mockResolvedValue(undefined)

            expect(await runner.run({ args: { watch: true }, caps: {}, configFile: '/foo/bar' } as any)).toBe(0)
            expect(endSession).not.toBeCalled()

            endSession.mockClear()
            expect(await runner.run({ args: {}, caps: {}, configFile: '/foo/bar' } as any)).toBe(0)
            expect(endSession).toBeCalledTimes(1)
        })

        it.each([
            [undefined, true],
            [true, true],
            [false, false]
        ])('should pass autoAssertOnTestEnd=%s to the soft assertion service as %s', async (value, expected) => {
            vi.mocked(SoftAssertionService).mockClear()
            const runner = new WDIORunner()
            const config: any = {
                framework: 'testNoFailures',
                reporters: [],
                beforeSession: [],
                runner: 'local',
                autoAssertOnTestEnd: value
            }
            vi.spyOn(ConfigParser.prototype, 'getConfig').mockReturnValue(config)
            runner['_browser'] = { url: vi.fn(url => url) } as unknown as BrowserObject
            runner['_startSession'] = vi.fn().mockReturnValue({ })
            runner['_initSession'] = vi.fn().mockReturnValue({ options: { capabilities: {} } })
            await runner.run({ args: { watch: true }, caps: {}, configFile: '/foo/bar' } as any)

            expect(SoftAssertionService).toBeCalledWith({ autoAssertOnTestEnd: expected })
        })

        it('should attach snapshot service to service list', async () => {
            const runner = new WDIORunner()
            const config: any = {
                framework: 'testNoFailures',
                reporters: [],
                beforeSession: [],
                runner: 'local',
                updateSnapshots: 'do it',
                resolveSnapshotPath: 'resolve me'
            }
            vi.spyOn(ConfigParser.prototype, 'getConfig').mockReturnValue(config)
            const addServiceSpy = vi.spyOn(ConfigParser.prototype, 'addService')
            runner['_browser'] = { url: vi.fn(url => url) } as unknown as BrowserObject
            runner['_startSession'] = vi.fn().mockReturnValue({ })
            runner['_initSession'] = vi.fn().mockReturnValue({ options: { capabilities: {} } })
            await runner.run({ args: { watch: true }, caps: {}, configFile: '/foo/bar' } as any)

            expect(addServiceSpy).toBeCalledWith({
                results: ['foobar']
            })
            expect(SnapshotService.initiate).toBeCalledWith({
                updateState: 'do it',
                resolveSnapshotPath: 'resolve me'
            })
            expect(process.send).toBeCalledWith({
                origin: 'worker',
                name: 'snapshot',
                content: ['foobar']
            })
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

        it('should call afterSession hook when session initialization fails', async () => {
            const afterSessionHook = vi.fn()
            const runner = new WDIORunner()
            const caps = { browserName: '123' }
            const specs = ['foobar']
            const config: any = {
                framework: 'testNoFailures',
                reporters: [],
                beforeSession: [],
                after: [],
                afterSession: [afterSessionHook],
                runner: 'local'
            }
            vi.spyOn(ConfigParser.prototype, 'getConfig').mockReturnValue(config)
            runner['_shutdown'] = vi.fn().mockReturnValue('_shutdown')
            runner['_initSession'] = vi.fn().mockReturnValue(null)

            await runner.run({
                args: { reporters: [] },
                cid: '0-0',
                caps,
                specs,
                configFile: '/foo/bar',
                retries: 0
            })

            // afterSession must run to allow services to clean up resources
            // allocated during beforeSession, even when browser init fails
            expect(executeHooksWithArgs).toBeCalledWith(
                'afterSession',
                [afterSessionHook],
                expect.any(Array)
            )
        })

        describe('error that no framework reports', () => {
            const startWith = (frameworkRun: () => unknown, args: Record<string, unknown> = {}, browser: Record<string, unknown> = {}) => {
                const runner = new WDIORunner()
                const config: any = { reporters: [], before: [], beforeSession: [], framework: 'late', runner: 'local' }
                vi.spyOn(ConfigParser.prototype, 'getConfig').mockReturnValue(config)
                vi.mocked(initializePlugin).mockResolvedValueOnce({
                    default: { init () { return this }, hasTests: () => true, run: frameworkRun }
                } as any)
                const stub = { capabilities: {}, options: {}, ...browser }
                runner['_initSession'] = vi.fn().mockImplementation(async () => {
                    runner['_browser'] = stub as unknown as BrowserObject
                    return stub
                })
                const errors: { message: string }[] = []
                const exits: number[] = []
                runner.on('error', (err) => errors.push(err))
                runner.on('exit', (code) => exits.push(code))
                const done = runner.run({ args: { reporters: [], ...args }, cid: '0-0', retries: 0, caps: {}, specs: ['foobar'], configFile: '/foo/bar' })
                return { runner, errors, exits, done }
            }
            const runWith = async (frameworkRun: () => unknown, args: Record<string, unknown> = {}) => {
                const { done, ...rest } = startWith(frameworkRun, args)
                return { ...rest, failures: await done }
            }
            const runnerEnds = () => vi.mocked(BaseReporter.prototype.emit).mock.calls.filter(([event]) => event === 'runner:end')
            const lateRejection = () => process.emit('uncaughtException', new Error('late rejection'), 'unhandledRejection')
            const never = () => new Promise(() => {})

            // Jasmine removes every listener during its run and puts them back after it, so do the same here
            const withOnlyRunnerListeners = () => {
                const saved = process.listeners('uncaughtException')
                process.removeAllListeners('uncaughtException')
                onTestFinished(() => {
                    process.removeAllListeners('uncaughtException')
                    saved.forEach((listener) => process.on('uncaughtException', listener))
                })
            }

            it('keeps the worker alive, shows the error and fails the run', async () => {
                withOnlyRunnerListeners()
                const log = logger('@wdio/runner')
                vi.spyOn(log, 'error').mockImplementation(() => {})
                const late = new Error('late rejection')
                let listeners = 0
                const { errors, exits, failures } = await runWith(() => {
                    listeners = process.listenerCount('uncaughtException')
                    process.emit('uncaughtException', late, 'unhandledRejection')
                    return 0
                })

                expect(listeners).toBe(1)
                expect(failures).toBe(1)
                expect(exits).toEqual([1])
                expect(errors).toHaveLength(1)
                expect(errors[0].message).toContain('Unhandled promise rejection')
                expect(errors[0].message).toContain(late.stack)
                expect(log.error).toBeCalledWith(errors[0].message)
            })

            it('also fails the run when Node\'s domain module adds its own listener', async () => {
                withOnlyRunnerListeners()
                await import('node:domain')
                const log = logger('@wdio/runner')
                vi.spyOn(log, 'error').mockImplementation(() => {})
                let listeners: string[] = []
                const { errors, failures } = await runWith(() => {
                    listeners = process.listeners('uncaughtException').map((listener) => listener.name)
                    process.emit('uncaughtException', new Error('late rejection'), 'unhandledRejection')
                    return 0
                })

                expect(listeners).toContain('domainUncaughtExceptionClear')
                expect(failures).toBe(1)
                expect(errors).toHaveLength(1)
            })

            it('fails the run for an error that comes after the end of the session', async () => {
                withOnlyRunnerListeners()
                const log = logger('@wdio/runner')
                vi.spyOn(log, 'error').mockImplementation(() => {})
                const { failures, exits } = await runWith(() => {
                    setImmediate(() => process.emit('uncaughtException', new Error('late rejection'), 'unhandledRejection'))
                    return 0
                })

                expect(failures).toBe(1)
                expect(exits).toEqual([1])
            })

            it('keeps the listener with mochaOpts.allowUncaught of a shared config (the Mocha adapter owns that option)', async () => {
                withOnlyRunnerListeners()
                let listeners: string[] = []
                const runner = new WDIORunner()
                const config: any = { reporters: [], before: [], beforeSession: [], framework: 'jasmine', runner: 'local', mochaOpts: { allowUncaught: true } }
                vi.spyOn(ConfigParser.prototype, 'getConfig').mockReturnValue(config)
                vi.mocked(initializePlugin).mockResolvedValueOnce({
                    default: { init () { return this }, hasTests: () => true, run: () => {
                        listeners = process.listeners('uncaughtException').map((listener) => listener.name)
                        return 0
                    } }
                } as any)
                runner['_initSession'] = vi.fn().mockReturnValue({ capabilities: {}, options: {} })
                await runner.run({ args: { reporters: [] }, cid: '0-0', retries: 0, caps: {}, specs: ['foobar'], configFile: '/foo/bar' })
                expect(listeners).toContain('onLateError')
            })

            describe('forced end', () => {
                beforeEach(() => {
                    withOnlyRunnerListeners()
                    vi.spyOn(logger('@wdio/runner'), 'error').mockImplementation(() => {})
                    vi.spyOn(BaseReporter.prototype, 'emit')
                    return () => { vi.useRealTimers() }
                })

                it('ends the worker with the reports on an uncaught exception', async () => {
                    const deleteSession = vi.fn().mockResolvedValue(undefined)
                    const { errors, exits } = startWith(() => {
                        process.emit('uncaughtException', new Error('timer error'), 'uncaughtException')
                        return never()
                    }, {}, { sessionId: 's', deleteSession })

                    await vi.waitFor(() => expect(exits).toEqual([1]))
                    expect(errors[0].message).toMatch(/^Uncaught error that no test reports/)
                    expect(deleteSession).toBeCalledTimes(1)
                    expect(runnerEnds()).toHaveLength(1)
                    expect(runnerEnds()[0][1]).toMatchObject({ failures: 1 })
                })

                it('runs the shutdown once when the hook resolves after the forced end', async () => {
                    let release = () => {}
                    const { exits, done } = startWith(() => {
                        process.emit('uncaughtException', new Error('timer error'), 'uncaughtException')
                        return new Promise<number>((resolve) => { release = () => resolve(0) })
                    }, {}, { sessionId: 's', deleteSession: vi.fn().mockResolvedValue(undefined) })

                    await vi.waitFor(() => expect(exits).toEqual([1]))
                    release()
                    await done
                    expect(exits).toEqual([1])
                    expect(runnerEnds()).toHaveLength(1)
                })

                it('ends the worker also when closing the session does not answer', async () => {
                    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'Date'] })
                    const { exits } = startWith(() => {
                        process.emit('uncaughtException', new Error('timer error'), 'uncaughtException')
                        return never()
                    }, {}, { sessionId: 's', deleteSession: vi.fn(never) })

                    await vi.advanceTimersByTimeAsync(4_900)
                    expect(exits).toEqual([])
                    await vi.advanceTimersByTimeAsync(200)
                    await vi.waitFor(() => expect(exits).toEqual([1]))
                })

                it('ends the worker with the reports when a hook waits for the rejected promise', async () => {
                    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'Date'] })
                    const { errors, exits } = startWith(() => {
                        lateRejection()
                        return never()
                    })

                    await vi.advanceTimersByTimeAsync(59_000)
                    expect(exits).toEqual([])
                    await vi.advanceTimersByTimeAsync(1_000)
                    await vi.waitFor(() => expect(exits).toEqual([1]))
                    expect(errors.map((e) => e.message)).toEqual([
                        expect.stringMatching(/^Unhandled promise rejection that no test reports/),
                        expect.stringMatching(/^The worker did not finish 60s after an unhandled rejection/)
                    ])
                    expect(runnerEnds()).toHaveLength(1)
                })

                it('does not end the worker while reporter events go on', async () => {
                    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'Date'] })
                    let release = () => {}
                    const { runner, errors, exits, done } = startWith(() => {
                        lateRejection()
                        return new Promise<number>((resolve) => { release = () => resolve(0) })
                    })
                    await vi.advanceTimersByTimeAsync(0)
                    for (let i = 0; i < 12; i++) {
                        runner['_reporter']!.emit('client:beforeCommand', {})
                        await vi.advanceTimersByTimeAsync(10_000)
                    }
                    release()
                    await done
                    expect(exits).toEqual([1])
                    expect(errors).toHaveLength(1)
                })

                it('does not end the worker while a framework listener is there', async () => {
                    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'Date'] })
                    let release = () => {}
                    const frameworkListener = () => {}
                    const { errors, exits, done } = startWith(() => {
                        lateRejection()
                        process.on('uncaughtException', frameworkListener)
                        return new Promise<number>((resolve) => { release = () => resolve(0) })
                    })

                    await vi.advanceTimersByTimeAsync(120_000)
                    expect(exits).toEqual([])
                    process.removeListener('uncaughtException', frameworkListener)
                    release()
                    await done
                    expect(exits).toEqual([1])
                    expect(errors).toHaveLength(1)
                })

                it('ends the worker on an uncaught exception that comes before the reporters exist', async () => {
                    vi.mocked(executeHooksWithArgs).mockImplementation(async (name: string) => {
                        if (name === 'beforeSession') {
                            process.emit('uncaughtException', new Error('service timer error'), 'uncaughtException')
                            await new Promise((resolve) => setTimeout(resolve, 50))
                        }
                        return []
                    })
                    onTestFinished(() => { vi.mocked(executeHooksWithArgs).mockReset() })
                    const { exits, done } = startWith(() => 0)
                    await done
                    await vi.waitFor(() => expect(exits).toEqual([1]))
                })

                it('fails the run for a rejection that comes while the reporters write', async () => {
                    vi.spyOn(BaseReporter.prototype, 'waitForSync').mockImplementationOnce(async () => {
                        lateRejection()
                        return true
                    })
                    const { exits, done } = startWith(() => 0)
                    await done
                    expect(exits).toEqual([1])
                })

                it('closes the session once for two uncaught exceptions', async () => {
                    const deleteSession = vi.fn(() => new Promise((resolve) => setTimeout(resolve, 50)))
                    const { exits } = startWith(() => {
                        process.emit('uncaughtException', new Error('first'), 'uncaughtException')
                        process.emit('uncaughtException', new Error('second'), 'uncaughtException')
                        return never()
                    }, {}, { sessionId: 's', deleteSession })
                    await vi.waitFor(() => expect(exits).toEqual([1]))
                    expect(deleteSession).toBeCalledTimes(1)
                    expect(vi.mocked(process.send!).mock.calls.filter(([m]: any) => m.name === 'sessionEnded')).toHaveLength(1)
                })

                it('sends runner:start before runner:end when the worker ends in the before hook', async () => {
                    vi.mocked(executeHooksWithArgs).mockImplementation(async (name: string) => {
                        if (name === 'before') {
                            process.emit('uncaughtException', new Error('timer error'), 'uncaughtException')
                            await never()
                        }
                        return []
                    })
                    onTestFinished(() => { vi.mocked(executeHooksWithArgs).mockReset() })
                    const { exits } = startWith(() => 0, {}, { sessionId: 's', deleteSession: vi.fn().mockResolvedValue(undefined) })

                    await vi.waitFor(() => expect(exits).toEqual([1]))
                    const events = vi.mocked(BaseReporter.prototype.emit).mock.calls.map(([event]) => event)
                    expect(events.filter((e) => e.startsWith('runner:'))).toEqual(['runner:start', 'runner:end'])
                })

                it('keeps the session in watch mode when the worker ends early', async () => {
                    const deleteSession = vi.fn().mockResolvedValue(undefined)
                    const { exits } = startWith(() => {
                        process.emit('uncaughtException', new Error('timer error'), 'uncaughtException')
                        return never()
                    }, { watch: true }, { sessionId: 's', deleteSession })

                    await vi.waitFor(() => expect(exits).toEqual([1]))
                    expect(deleteSession).not.toBeCalled()
                    expect(runnerEnds()).toHaveLength(1)
                })

                it('closes the session in watch mode when the parent does not know it yet', async () => {
                    vi.mocked(executeHooksWithArgs).mockImplementation(async (name: string) => {
                        if (name === 'before') {
                            process.emit('uncaughtException', new Error('timer error'), 'uncaughtException')
                            await never()
                        }
                        return []
                    })
                    onTestFinished(() => { vi.mocked(executeHooksWithArgs).mockReset() })
                    const deleteSession = vi.fn().mockResolvedValue(undefined)
                    const { exits } = startWith(() => 0, { watch: true }, { sessionId: 's', deleteSession })

                    await vi.waitFor(() => expect(exits).toEqual([1]))
                    expect(deleteSession).toBeCalledTimes(1)
                })

                it('keeps the session of a watch rerun, which the parent already knows', async () => {
                    vi.mocked(executeHooksWithArgs).mockImplementation(async (name: string) => {
                        if (name === 'before') {
                            process.emit('uncaughtException', new Error('timer error'), 'uncaughtException')
                            await never()
                        }
                        return []
                    })
                    onTestFinished(() => { vi.mocked(executeHooksWithArgs).mockReset() })
                    const deleteSession = vi.fn().mockResolvedValue(undefined)
                    const { exits } = startWith(() => 0, { watch: true, sessionId: 's' }, { sessionId: 's', deleteSession })

                    await vi.waitFor(() => expect(exits).toEqual([1]))
                    expect(deleteSession).not.toBeCalled()
                })

                it('starts no watchdog without a late rejection', async () => {
                    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'Date'] })
                    const { errors, exits, done } = startWith(() => new Promise<number>((resolve) => setTimeout(() => resolve(0), 120_000)))

                    await vi.advanceTimersByTimeAsync(120_000)
                    await done
                    expect(exits).toEqual([0])
                    expect(errors).toHaveLength(0)
                })
            })

            it('names the spec file and the last test that ended in the message', async () => {
                withOnlyRunnerListeners()
                vi.spyOn(logger('@wdio/runner'), 'error').mockImplementation(() => {})
                let reporter: BaseReporter | undefined
                const runner = new WDIORunner()
                const config: any = { reporters: [], before: [], beforeSession: [], framework: 'late', runner: 'local' }
                vi.spyOn(ConfigParser.prototype, 'getConfig').mockReturnValue(config)
                vi.mocked(initializePlugin).mockResolvedValueOnce({
                    default: { init (...args: any[]) { reporter = args[4]; return this }, hasTests: () => true, run: () => {
                        reporter!.emit('test:end', { title: 'only test', fullTitle: 'suite only test' })
                        lateRejection()
                        return 0
                    } }
                } as any)
                runner['_initSession'] = vi.fn().mockReturnValue({ capabilities: {}, options: {} })
                const errors: { message: string }[] = []
                runner.on('error', (err) => errors.push(err))
                const spec = path.resolve('project', 'test', 'a.spec.ts')
                await runner.run({ args: { reporters: [] }, cid: '0-0', retries: 0, caps: {}, specs: [url.pathToFileURL(spec).href, 'file://host/share/b.spec.ts'], configFile: '/foo/bar' })

                expect(errors[0].message).toContain(
                    `Unhandled promise rejection that no test reports, for example of a command without await in the last hook (spec file: ${spec}, `
                )
                expect(errors[0].message).toContain(', last test or hook: "suite only test"): Error: late rejection')
            })

            it('describes a rejection reason that cannot be made a string', async () => {
                withOnlyRunnerListeners()
                vi.spyOn(logger('@wdio/runner'), 'error').mockImplementation(() => {})
                const { errors, failures } = await runWith(() => {
                    process.emit('uncaughtException', Object.create(null), 'unhandledRejection')
                    return 0
                })

                expect(failures).toBe(1)
                expect(errors[0].message).toMatch(/\[Object: null prototype\] \{\}$/)
            })

            it('ends the worker at once, as without the listener, when the parent process is gone', async () => {
                withOnlyRunnerListeners()
                const connected = Object.getOwnPropertyDescriptor(process, 'connected')
                Object.defineProperty(process, 'connected', { value: false, configurable: true, writable: true })
                onTestFinished(() => {
                    if (connected) {
                        Object.defineProperty(process, 'connected', connected)
                    } else {
                        delete (process as { connected?: boolean }).connected
                    }
                })
                const thrown: string[] = []
                const { errors } = await runWith(() => {
                    for (const origin of ['uncaughtException', 'unhandledRejection'] as const) {
                        try {
                            process.emit('uncaughtException', Object.assign(new Error('Channel closed'), { code: 'ERR_IPC_CHANNEL_CLOSED' }), origin)
                        } catch (err) {
                            thrown.push((err as Error).message)
                        }
                    }
                    return 0
                })

                expect(thrown).toEqual(['Channel closed', 'Channel closed'])
                expect(errors).toHaveLength(0)
            })

            it('leaves the error to the framework when it has its own listener', async () => {
                withOnlyRunnerListeners()
                const frameworkListener = vi.fn()
                const { errors, exits, failures } = await runWith(() => {
                    process.on('uncaughtException', frameworkListener)
                    process.emit('uncaughtException', new Error('in a test'), 'uncaughtException')
                    process.removeListener('uncaughtException', frameworkListener)
                    return 0
                })

                expect(frameworkListener).toBeCalledTimes(1)
                expect(failures).toBe(0)
                expect(exits).toEqual([0])
                expect(errors).toHaveLength(0)
            })

            it('adds one listener and counts the errors of each run (watch mode)', async () => {
                withOnlyRunnerListeners()
                const log = logger('@wdio/runner')
                vi.spyOn(log, 'error').mockImplementation(() => {})
                const { runner, failures } = await runWith(() => {
                    process.emit('uncaughtException', new Error('late rejection'), 'unhandledRejection')
                    return 2
                }, { watch: true })
                expect(failures).toBe(3)

                vi.mocked(initializePlugin).mockResolvedValueOnce({
                    default: { init () { return this }, hasTests: () => true, run: () => 0 }
                } as any)
                expect(await runner.run({ args: { reporters: [], watch: true }, cid: '0-0', retries: 0, caps: {}, specs: ['foobar'], configFile: '/foo/bar' })).toBe(0)
                expect(process.listeners('uncaughtException').filter((listener) => listener.name === 'onLateError')).toHaveLength(1)
            })
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

            expect(setDefaultOptions).toBeCalledTimes(1)
            expect(setDefaultOptions).toBeCalledWith({
                afterAssertion: expect.any(Function),
                beforeAssertion: expect.any(Function),
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
            // @ts-expect-error
            beforeListener[1]({ foo: 'bar' })
            expect(reporter.emit).toBeCalledWith(
                'client:beforeCommand',
                { foo: 'bar', sessionId: 'fakeid' })

            reporter.emit.mockClear()

            const afterListener = vi.mocked(browser!.on).mock.calls[1]
            expect(afterListener[0]).toBe('result')
            // @ts-expect-error
            afterListener[1]({ bar: 'foo' })
            expect(reporter.emit).toBeCalledWith(
                'client:afterCommand',
                { bar: 'foo', sessionId: 'fakeid' })
        })

        it('should forward the parallel context id from the async store', async () => {
            const reporter = { emit: vi.fn() }
            const runner = new WDIORunner()
            runner['_reporter'] = reporter as any
            const browser = await runner['_initSession'](
                { hostname: 'foobar' } as any,
                [{ browserName: 'chrome' }] as any
            )
            const store = new AsyncLocalStorage<string>()
            ;(browser as any)[PARALLEL_CONTEXT_STORE_KEY] = store
            const [, beforeListener] = vi.mocked(browser!.on).mock.calls[0] as any
            const [, afterListener] = vi.mocked(browser!.on).mock.calls[1] as any

            store.run('ctx-1', () => beforeListener({ foo: 'bar' }))
            store.run('ctx-2', () => afterListener({ bar: 'foo' }))
            expect(reporter.emit).toBeCalledWith('client:beforeCommand', { foo: 'bar', sessionId: 'fakeid', contextId: 'ctx-1' })
            expect(reporter.emit).toBeCalledWith('client:afterCommand', { bar: 'foo', sessionId: 'fakeid', contextId: 'ctx-2' })

            reporter.emit.mockClear()
            beforeListener({ foo: 'bar' })
            expect(reporter.emit).toBeCalledWith('client:beforeCommand', { foo: 'bar', sessionId: 'fakeid' })
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
            expect(setDefaultOptions).toBeCalledTimes(1)
        })

        it('transfers stubbed custom commands onto the new session', async () => {
            const runner = new WDIORunner()
            const myCustomFunction = () => {}
            const options = {
                attachToElement: true,
                disableElementImplicitWait: true,
                proto: { foo: 'bar' },
                instances: { baz: 'qux' as unknown as Instances }
            }
            const customCommands: CustomStubCommand[] = [['myCustomCommandName', myCustomFunction, options]]

            runner['_browser'] = { customCommands } as any
            const browser = await runner['_startSession']({} as any, {} as any)

            expect(browser?.addCommand).toBeCalledWith('myCustomCommandName', myCustomFunction, options)
        })

        it('transfers overwritten commands from old instance to new one', async () => {
            const runner = new WDIORunner()

            runner['_browser'] = {
                overwrittenCommands: [[3, 2, 1]]
            } as any
            const browser = await runner['_startSession']({} as any, {} as any)

            expect(browser?.overwriteCommand).toBeCalledWith(3, 2, 1)
        })
    })

    describe('_shutdown', () => {
        it('should emit exit', async () => {
            const runner = new WDIORunner()
            runner['_browser'] = {} as unknown as BrowserObject
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
            runner['_browser'] = {} as unknown as BrowserObject
            runner['_reporter'] = {
                waitForSync: vi.fn().mockRejectedValue('foo'),
                emit: vi.fn()
            } as any
            runner.emit = vi.fn()

            expect(await runner['_shutdown'](123, 123)).toBe(123)
            expect(runner['_reporter']!.waitForSync).toBeCalledTimes(1)
            expect(runner.emit).toBeCalledWith('exit', 1)
            expect(log.error).toHaveBeenCalledWith('foo')
        })

        it('should emit runner:start if the initialization failed', async () => {
            const runner = new WDIORunner()
            runner['_configParser'] = { getCapabilities: vi.fn().mockReturnValue([{ browserName: 'safari' }]) } as any
            runner['_browser'] = {} as unknown as BrowserObject
            runner['_caps'] = { 'browserName': 'safari' }
            runner['_reporter'] = {
                waitForSync: vi.fn().mockReturnValue(Promise.resolve()),
                emit: vi.fn()
            } as any
            const reporter = runner['_reporter'] as any
            runner.emit = vi.fn()

            const args = [
                ['runner:start', {
                    'capabilities': { 'browserName': 'safari' },
                    'cid': undefined,
                    'config': undefined,
                    'instanceOptions': {},
                    'isMultiRemote': false,
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
