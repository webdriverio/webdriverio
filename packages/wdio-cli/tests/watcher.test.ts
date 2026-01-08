import os from 'node:os'
import url from 'node:url'
import path from 'node:path'
import chokidar from 'chokidar'
import EventEmitter from 'node:events'

import { vi, describe, it, expect, afterEach } from 'vitest'
import type { Options, Workers } from '@wdio/types'

import type { RunCommandArguments } from '../src/types.js'
import Watcher from '../src/watcher.js'

/**
 * Helper to create cross-platform absolute paths for testing.
 * On Windows: C:\foo\bar, on Unix: /foo/bar
 */
const testPath = (...segments: string[]) => {
    if (os.platform() === 'win32') {
        return path.join('C:', ...segments)
    }
    return '/' + segments.join('/')
}

/**
 * Helper to create file:// URIs from a path (cross-platform)
 */
const toFileUrl = (filePath: string) => url.pathToFileURL(filePath).href

vi.mock('chokidar')
vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))
vi.mock('@wdio/config', () => import(path.join(process.cwd(), '__mocks__', '@wdio/config')))
vi.mock('@wdio/utils', () => import(path.join(process.cwd(), '__mocks__', '@wdio/utils')))
vi.mock('../src/launcher', async () => {
    const { ConfigParser } = await import('@wdio/config/node')

    interface LauncherMockRunCommandArguments extends Omit<RunCommandArguments, 'configPath'> {
        isMultiremote?: boolean;
    }

    class LauncherMock {
        public configParser: any
        isMultiremote: boolean
        runner: any
        interface: any

        initialize = vi.fn()

        constructor(configFile: string, args: LauncherMockRunCommandArguments) {
            this.configParser = new ConfigParser(configFile)
            this.configParser.addConfigFile(configFile)
            this.configParser.merge(args)
            this.isMultiremote = args.isMultiremote || false
            this.runner = {}
            this.interface = {
                emit: vi.fn(),
                setup: vi.fn()
            }
        }
    }
    return { default: LauncherMock }
})

interface WorkerMockRunPayload extends Partial<Workers.WorkerRunPayload> {
    isBusy?: boolean;
    sessionId?: string;
    specs: string[];
}

class WorkerMock extends EventEmitter implements Workers.Worker {
    cid: string
    specs: any
    caps: WebdriverIO.Capabilities
    config: Options.Testrunner
    capabilities: WebdriverIO.Capabilities
    sessionId: string
    isBusy: boolean
    postMessage = vi.fn()

    constructor({ cid, specs, sessionId, isBusy = false }: WorkerMockRunPayload) {
        super()
        this.cid = cid || `${Math.random()}`
        this.specs = specs.map((spec) => Array.isArray(spec)
            ? spec.map((s) => url.pathToFileURL(s).href)
            : url.pathToFileURL(spec).href
        )
        this.caps = { browserName: 'chrome' }
        this.config = { baseUrl: 'http://localhost:1234' } as any
        this.capabilities = this.caps
        this.sessionId = sessionId || `${Math.random()}`
        this.isBusy = isBusy
        this.on = vi.fn()
    }
    logsAggregator: string[]
    execArgv?: string[] | undefined
    onWorkerStart?(cid: string, capabilities: WebdriverIO.Capabilities, specs: string[], args: Options.Testrunner, execArgv: string[]): unknown | Promise<unknown> {
        throw new Error('Method not implemented.')
    }
    onWorkerEnd?(cid: string, exitCode: number, specs: string[], retries: number): unknown | Promise<unknown> {
        throw new Error('Method not implemented.')
    }
    afterSession?(config: Options.Testrunner, capabilities: WebdriverIO.Capabilities, specs: string[]): unknown | Promise<unknown> {
        throw new Error('Method not implemented.')
    }
    onReload?(oldSessionId: string, newSessionId: string): unknown | Promise<unknown> {
        throw new Error('Method not implemented.')
    }
    beforeHook?(test: any, context: any, hookName: string): unknown | Promise<unknown> {
        throw new Error('Method not implemented.')
    }
    beforeCommand?(commandName: string, args: any[]): unknown | Promise<unknown> {
        throw new Error('Method not implemented.')
    }
    afterCommand?(commandName: string, args: any[], result: any, error?: Error): unknown | Promise<unknown> {
        throw new Error('Method not implemented.')
    }
    beforeAssertion?(params: AssertionHookParams): unknown | Promise<unknown> {
        throw new Error('Method not implemented.')
    }
    afterAssertion?(params: AfterAssertionHookParams): unknown | Promise<unknown> {
        throw new Error('Method not implemented.')
    }
    runner?: 'local' | 'browser' | ['browser', WebdriverIO.BrowserRunnerOptions] | ['local', never] | undefined
    exclude?: string[] | undefined
    suites?: Record<string, (string | string[])[] | string[][]> | undefined
    maxInstances?: number | undefined
    maxInstancesPerCapability?: number | undefined
    injectGlobals?: boolean | undefined
    bail?: number | undefined
    updateSnapshots?: 'all' | 'new' | 'none' | undefined
    resolveSnapshotPath?: ((testPath: string, snapExtension: string) => string) | undefined
    specFileRetries?: number | undefined
    specFileRetriesDelay?: number | undefined
    specFileRetriesDeferred?: boolean | undefined
    groupLogsByTestSpec?: boolean | undefined
    services?
    framework?: string | undefined
    reporters?
    reporterSyncInterval?: number | undefined
    reporterSyncTimeout?: number | undefined
    runnerEnv?: Record<string, string> | undefined
    filesToWatch?: string[] | undefined
    cucumberFeaturesWithLineNumbers?: string[] | undefined
    watch?: boolean | undefined
    shard?: Options.ShardOptions | undefined
    mochaOpts?: WebdriverIO.MochaOpts | undefined
    jasmineOpts?: WebdriverIO.JasmineOpts | undefined
    cucumberOpts?: WebdriverIO.CucumberOpts | undefined
    tsConfigPath?: string | undefined
    automationProtocol?: string | undefined
    region?: Options.SauceRegions | undefined
    baseUrl?: string | undefined
    waitforTimeout?: number | undefined
    waitforInterval?: number | undefined
    logLevel?: Options.WebDriverLogTypes | undefined
    logLevels?: Record<string, Options.WebDriverLogTypes> | undefined
    connectionRetryTimeout?: number | undefined
    connectionRetryCount?: number | undefined
    headers?: { [name: string]: string } | undefined
    transformRequest?: ((requestOptions: RequestInit) => RequestInit) | undefined
    transformResponse?: ((response: Options.RequestLibResponse, requestOptions: RequestInit) => Options.RequestLibResponse) | undefined
    enableDirectConnect?: boolean | undefined
    strictSSL?: boolean | undefined
    outputDir?: string | undefined
    cacheDir?: string | undefined
    protocol?: string | undefined
    hostname?: string | undefined
    port?: number | undefined
    path?: string | undefined
    queryParams?: { [name: string]: string } | undefined
    user?: string | undefined
    key?: string | undefined
}

describe('watcher', () => {
    it('should initialize properly', async () => {
        const wdioConf = path.join(__dirname, '__fixtures__', 'wdio.conf')
        const watcher = new Watcher(wdioConf, {})
        expect(watcher['_launcher']).toBeDefined()
    })

    it('should run initial suite when starting watching', async () => {
        const fooPath = testPath('foo')
        const barPath = testPath('bar')
        const wdioConf = path.join(__dirname, '__fixtures__', 'wdio.conf')
        const watcher = new Watcher(wdioConf, {})
        watcher['_launcher'] = {
            run: vi.fn(),
            initialize: vi.fn(),
            interface: {
                finalise: vi.fn()
            },
            configParser: {
                getConfig: vi.fn().mockReturnValue({ filesToWatch: ['./foobar'] }),
                initialize: vi.fn(),
                getSpecs: vi.fn().mockReturnValue([toFileUrl(fooPath), toFileUrl(barPath)]),
                getCapabilities: vi.fn().mockReturnValue([{ browserName: 'chrome' }])
            },
            runner: {
                workerPool: {
                    '0-0': new WorkerMock({ specs: ['./tests/test1.js'] })
                }
            }
        } as any
        await watcher.watch()

        expect(chokidar.watch).toHaveBeenCalledTimes(2)
        expect(chokidar.watch).toBeCalledWith([fooPath, barPath], expect.any(Object))
        expect(chokidar.watch).toBeCalledWith([expect.stringContaining('foobar')], expect.any(Object))

    })

    it('should pass absolute file paths (not file:// URIs) to chokidar for filesToWatch', async () => {
        const wdioConf = path.join(__dirname, '__fixtures__', 'wdio.conf')
        const watcher = new Watcher(wdioConf, {})
        watcher['_launcher'] = {
            run: vi.fn(),
            initialize: vi.fn(),
            interface: {
                finalise: vi.fn()
            },
            configParser: {
                getConfig: vi.fn().mockReturnValue({ filesToWatch: ['./relative/path', '/absolute/path'] }),
                initialize: vi.fn(),
                getSpecs: vi.fn().mockReturnValue([]),
                getCapabilities: vi.fn().mockReturnValue([{ browserName: 'chrome' }])
            },
            runner: {
                workerPool: {
                    '0-0': new WorkerMock({ specs: ['./tests/test1.js'] })
                }
            }
        } as any
        await watcher.watch()

        // Find the chokidar.watch call for filesToWatch
        const calls = vi.mocked(chokidar.watch).mock.calls
        const filesToWatchCall = calls.find(call => {
            const watchedPaths = call[0] as string[]
            return watchedPaths.some(p => p.includes('path'))
        })

        expect(filesToWatchCall).toBeDefined()
        const watchedPaths = filesToWatchCall![0] as string[]

        // Verify no file:// URIs are passed to chokidar (fix for issue #14685)
        watchedPaths.forEach(p => {
            expect(p.startsWith('file://')).toBe(false)
        })

        // Verify paths are absolute
        watchedPaths.forEach(p => {
            expect(path.isAbsolute(p)).toBe(true)
        })
    })

    it('should run initial suite when starting watching with grouped specs', async () => {
        const fooPath = testPath('foo')
        const barPath = testPath('bar')
        const wdioConf = path.join(__dirname, '__fixtures__', 'wdio.conf')
        const watcher = new Watcher(wdioConf, {})
        watcher['_launcher'] = {
            run: vi.fn(),
            initialize: vi.fn(),
            interface: {
                finalise: vi.fn()
            },
            configParser: {
                getConfig: vi.fn().mockReturnValue({ filesToWatch: [] }),
                initialize: vi.fn(),
                getSpecs: vi.fn().mockReturnValue([toFileUrl(fooPath), toFileUrl(barPath)]),
                getCapabilities: vi.fn().mockReturnValue([{ browserName: 'chrome' }])
            },
            runner: {
                workerPool: {
                    '0-0': new WorkerMock(<WorkerMockRunPayload>{ specs: [testPath('a.js'), [testPath('b.js'), testPath('c.js'), testPath('d.js')], 'e.js'] })
                }
            }
        } as any
        await watcher.watch()

        expect(chokidar.watch).toHaveBeenCalledTimes(1)
    })

    it('should run also watch `filesToWatch` files', async () => {
        const fooPath = testPath('foo')
        const barPath = testPath('bar')
        const fooBarPath = testPath('foo', 'bar')
        const wdioConf = path.join(__dirname, '__fixtures__', 'wdio.conf')
        const watcher = new Watcher(wdioConf, {})
        watcher['_launcher'] = {
            run: vi.fn(),
            initialize: vi.fn(),
            interface: {
                finalise: vi.fn()
            },
            configParser: {
                getConfig: vi.fn().mockReturnValue({ filesToWatch: [fooBarPath] }),
                initialize: vi.fn(),
                getSpecs: vi.fn().mockReturnValue([toFileUrl(fooPath), toFileUrl(barPath)]),
                getCapabilities: vi.fn().mockReturnValue([{ browserName: 'chrome' }])
            },
            runner: {
                workerPool: {
                    '0-0': new WorkerMock({ specs: ['./tests/test1.js'] })
                }
            }
        } as any
        await watcher.watch()

        expect(chokidar.watch).toHaveBeenCalledTimes(2)

        const worker = watcher['_launcher'].runner!.workerPool['0-0']
        expect(worker.on).toBeCalledTimes(1)

        const eventHandler = worker.on.mock.calls[0][1]
        expect(watcher['_launcher'].interface!.finalise).toBeCalledTimes(0)
        worker.isBusy = true
        eventHandler()
        expect(watcher['_launcher'].interface!.finalise).toBeCalledTimes(0)
        worker.isBusy = false
        eventHandler()
        expect(watcher['_launcher'].interface!.finalise).toBeCalledTimes(1)
    })

    it('should call run with modifed path when a new file was changed or added', async () => {
        const fooPath = testPath('foo')
        const barPath = testPath('bar')
        const fooBarPath = testPath('foo', 'bar')
        const somePath = testPath('some', 'path.js')
        const someOtherPath = testPath('some', 'other', 'path.js')
        const someAnotherPath = testPath('some', 'another', 'path.js')

        const wdioConf = path.join(__dirname, '__fixtures__', 'wdio.conf')
        const watcher = new Watcher(wdioConf, {})
        watcher['_launcher'] = {
            run: vi.fn(),
            initialize: vi.fn(),
            interface: {
                finalise: vi.fn()
            },
            configParser: {
                getConfig: vi.fn().mockReturnValue({ filesToWatch: [fooBarPath] }),
                initialize: vi.fn(),
                getSpecs: vi.fn().mockReturnValue([toFileUrl(fooPath), toFileUrl(barPath)]),
                getCapabilities: vi.fn().mockReturnValue([{ browserName: 'chrome' }])
            },
            runner: {
                workerPool: {
                    '0-0': new WorkerMock({ specs: ['./tests/test1.js'] })
                }
            }
        } as any
        watcher.run = vi.fn()
        await watcher.watch()

        // @ts-ignore mock feature
        vi.mocked(chokidar.on).mock.calls[0][1](somePath)
        // @ts-ignore mock feature
        vi.mocked(chokidar.on).mock.calls[1][1](someOtherPath)
        // @ts-ignore mock feature
        vi.mocked(chokidar.on).mock.calls[2][1](someAnotherPath)
        // @ts-ignore mock feature
        vi.mocked(chokidar.on).mock.calls[3][1](someAnotherPath)
        expect(watcher.run).toHaveBeenNthCalledWith(1, { spec: [toFileUrl(somePath)] })
        expect(watcher.run).toHaveBeenNthCalledWith(2, { spec: [toFileUrl(someOtherPath)] })
        expect(watcher.run).toHaveBeenNthCalledWith(3, {})
        expect(watcher.run).toHaveBeenNthCalledWith(4, {})
    })

    it('should get workers by pickBy function', () => {
        const wdioConf = path.join(__dirname, '__fixtures__', 'wdio.conf')
        const watcher = new Watcher(wdioConf, {})
        const workerPool = {
            '0-0': new WorkerMock({ cid: '0-0', specs: ['file:///foo/bar.js'] }),
            '0-1': new WorkerMock({ cid: '0-1', specs: ['file:///foo/bar2.js'], isBusy: true }),
            '1-0': new WorkerMock({ cid: '1-0', specs: ['file:///bar/foo.js'] })
        }
        watcher['_launcher'].runner!.workerPool = workerPool

        expect(watcher.getWorkers(null, true)).toEqual(workerPool)
        expect(watcher.getWorkers()).toEqual({
            '0-0': workerPool['0-0'],
            '1-0': workerPool['1-0']
        })
        expect(watcher.getWorkers(
            (worker: Workers.Worker) => worker.specs.find((spec) => spec.endsWith('/bar/foo.js')))
        ).toEqual({ '1-0': workerPool['1-0'] })
    })

    it('should run workers on existing session', () => {
        const fooBarPath = testPath('foo', 'bar.js')
        const fooBar2Path = testPath('foo', 'bar2.js')
        const barFooPath = testPath('bar', 'foo.js')
        const wdioConf = path.join(__dirname, '__fixtures__', 'wdio.conf')
        const watcher = new Watcher(wdioConf, {})
        watcher['_launcher'].runner!.workerPool = {
            // @ts-ignore mock feature
            '0-0': new WorkerMock({ cid: '0-0', specs: [fooBarPath] }),
            '0-1': new WorkerMock({ cid: '0-1', specs: [fooBar2Path], isBusy: true }),
            // @ts-ignore mock feature
            '1-0': new WorkerMock({ cid: '1-0', specs: [barFooPath] })
        }
        watcher['_launcher'].interface!.emit = vi.fn()
        watcher.run({ spec: toFileUrl(fooBarPath) } as any)
        expect(watcher['_launcher'].interface!.emit).toHaveBeenCalledWith('job:start', {
            cid: '0-0',
            caps: { browserName: 'chrome' },
            specs: [toFileUrl(fooBarPath)]
        })

        const { postMessage, sessionId } = watcher['_launcher'].runner!.workerPool['0-0']
        expect(postMessage).toHaveBeenCalledWith('run', {
            sessionId,
            spec: toFileUrl(fooBarPath),
            baseUrl: 'http://localhost:1234'
        })
        expect(watcher['_launcher'].interface!.totalWorkerCnt).toBe(1)
    })

    it('should not clean if no watcher is running', () => {
        const fooBarPath = testPath('foo', 'bar.js')
        const fooBar2Path = testPath('foo', 'bar2.js')
        const barFooPath = testPath('bar', 'foo.js')
        const wdioConf = path.join(__dirname, '__fixtures__', 'wdio.conf')
        const watcher = new Watcher(wdioConf, {})
        watcher['_launcher'].runner!.workerPool = {
            // @ts-ignore mock feature
            '0-0': new WorkerMock({ cid: '0-0', specs: [fooBarPath] }),
            '0-1': new WorkerMock({ cid: '0-1', specs: [fooBar2Path], isBusy: true }),
            // @ts-ignore mock feature
            '1-0': new WorkerMock({ cid: '1-0', specs: [barFooPath] })
        }
        watcher['_launcher'].interface!.emit = vi.fn()
        watcher.run({ spec: fooBar2Path } as any)
        expect(watcher['_launcher'].interface!.emit).toHaveBeenCalledTimes(0)
    })

    it('should run all tests if `filesToWatch` entry was changed', () => {
        const fooBarPath = testPath('foo', 'bar.js')
        const fooBar2Path = testPath('foo', 'bar2.js')
        const barFooPath = testPath('bar', 'foo.js')

        const wdioConf = path.join(__dirname, '__fixtures__', 'wdio.conf')
        const watcher = new Watcher(wdioConf, {})
        watcher['_launcher'].interface!.totalWorkerCnt = 1
        watcher.cleanUp = vi.fn()
        watcher['_launcher'].runner!.workerPool = {
            // @ts-ignore mock feature
            '0-0': new WorkerMock({ cid: '0-0', specs: [fooBarPath] }),
            '0-1': new WorkerMock({ cid: '0-1', specs: [fooBar2Path], isBusy: true }),
            // @ts-ignore mock feature
            '1-0': new WorkerMock({ cid: '1-0', specs: [barFooPath] })
        }
        watcher.run()

        expect(watcher['_launcher'].interface!.totalWorkerCnt).toBe(2)

        const worker00 = watcher['_launcher'].runner!.workerPool['0-0']
        expect(worker00.postMessage).toHaveBeenCalledWith(
            'run',
            { sessionId: worker00.sessionId, baseUrl: 'http://localhost:1234' })
        expect(watcher['_launcher'].interface!.emit).toHaveBeenCalledWith('job:start', {
            cid: '0-0',
            caps: { browserName: 'chrome' },
            specs: [toFileUrl(fooBarPath)]
        })

        const worker10 = watcher['_launcher'].runner!.workerPool['0-0']
        expect(worker10.postMessage).toHaveBeenCalledWith(
            'run',
            { sessionId: worker10.sessionId, baseUrl: 'http://localhost:1234' })
        expect(watcher['_launcher'].interface!.emit).toHaveBeenCalledWith('job:start', {
            cid: '1-0',
            caps: { browserName: 'chrome' },
            specs: [toFileUrl(barFooPath)]
        })
    })

    it('should re-run all specs when the --spec command line option is set and a filesToWatch file is added or changed', async () => {
        const fooPath = testPath('foo')
        const barPath = testPath('bar')
        const spec = [testPath('some', 'path.js'), testPath('some', 'other', 'path.js')]
        const someOtherExcludedPath = testPath('some', 'other', 'excluded', 'path.js')
        const filesToWatch = [testPath('some', 'another', 'path.js')]
        const wdioConf = path.join(__dirname, '__fixtures__', 'wdio.conf')
        const watcher = new Watcher(wdioConf, {})
        watcher['_launcher'] = {
            __args: { spec },
            run: vi.fn(),
            initialize: vi.fn(),
            interface: {
                emit: vi.fn(),
                finalise: vi.fn()
            },
            configParser: {
                getConfig: vi.fn().mockReturnValue({ filesToWatch }),
                initialize: vi.fn(),
                getSpecs: vi.fn().mockReturnValue([toFileUrl(fooPath), toFileUrl(barPath)]),
                getCapabilities: vi.fn().mockReturnValue([{ browserName: 'chrome' }])
            },
            runner: {
                workerPool: {
                    '0-0': new WorkerMock({ cid: '0-0', specs: [spec[0]] }),
                    '0-1': new WorkerMock({ cid: '0-1', specs: [spec[1]] })
                }
            }
        } as any
        const runSpy = vi.spyOn(watcher, 'run')
        const emitSpy = watcher['_launcher'].interface!.emit
        watcher.cleanUp = vi.fn()
        await watcher.watch()

        // @ts-ignore mock feature
        vi.mocked(chokidar.on).mock.calls[0][1](spec[0])
        expect(runSpy).toHaveBeenNthCalledWith(1, { spec: [toFileUrl(spec[0])] })
        expect(emitSpy).toHaveBeenCalledTimes(1) // Only one Worker called

        vi.mocked(emitSpy).mockClear()
        // @ts-ignore mock feature
        vi.mocked(chokidar.on).mock.calls[1][1](someOtherExcludedPath)
        expect(runSpy).toHaveBeenNthCalledWith(2, { spec: [toFileUrl(someOtherExcludedPath)] })
        expect(emitSpy).not.toHaveBeenCalled() // No Workers called

        vi.mocked(emitSpy).mockClear()
        // @ts-ignore mock feature
        vi.mocked(chokidar.on).mock.calls[2][1](filesToWatch[0])
        expect(runSpy).toHaveBeenNthCalledWith(3, {})
        expect(emitSpy).toHaveBeenCalledTimes(2) // Both Workers called

        vi.mocked(emitSpy).mockClear()
        // @ts-ignore mock feature
        vi.mocked(chokidar.on).mock.calls[3][1](filesToWatch[0])
        expect(runSpy).toHaveBeenNthCalledWith(4, {})
        expect(emitSpy).toHaveBeenCalledTimes(2) // Both Workers called
    })

    it('should re-run all specs, with grouped specs, when the --spec command line option is set and a filesToWatch file is added or changed', async () => {
        const fooPath = testPath('foo')
        const barPath = testPath('bar')
        const spec = [testPath('a.js'), [testPath('b.js'), testPath('c.js'), testPath('d.js')]]
        const someOtherExcludedPath = testPath('some', 'other', 'excluded', 'path.js')
        const filesToWatch = [testPath('some', 'another', 'path.js')]
        const wdioConf = path.join(__dirname, '__fixtures__', 'wdio.conf')
        const watcher = new Watcher(wdioConf, {})
        // @ts-ignore
        watcher['_launcher'] = {
            __args: { spec },
            run: vi.fn(),
            initialize: vi.fn(),
            interface: {
                emit: vi.fn(),
                finalise: vi.fn()
            },
            configParser: {
                getConfig: vi.fn().mockReturnValue({ filesToWatch }),
                initialize: vi.fn(),
                getSpecs: vi.fn().mockReturnValue([toFileUrl(fooPath), toFileUrl(barPath)]),
                getCapabilities: vi.fn().mockReturnValue([{ browserName: 'chrome' }])
            },
            runner: {
                workerPool: {
                    '0-0': new WorkerMock({ cid: '0-0', specs: [spec[0] as any] }),
                    '0-1': new WorkerMock({ cid: '0-1', specs: spec[1] as any })
                }
            }
        } as any
        const runSpy = vi.spyOn(watcher, 'run')
        const emitSpy = watcher['_launcher'].interface!.emit
        watcher.cleanUp = vi.fn()
        await watcher.watch()

        // @ts-ignore mock feature
        vi.mocked(chokidar.on).mock.calls[0][1](spec[0])
        expect(runSpy).toHaveBeenNthCalledWith(1, { spec: [toFileUrl(spec[0] as string)] })
        expect(emitSpy).toHaveBeenCalledTimes(1) // Only one Worker called

        vi.mocked(emitSpy).mockClear()
        // @ts-ignore mock feature
        vi.mocked(chokidar.on).mock.calls[1][1](someOtherExcludedPath)
        expect(runSpy).toHaveBeenNthCalledWith(2, { spec: [toFileUrl(someOtherExcludedPath)] })
        expect(emitSpy).not.toHaveBeenCalled() // No Workers called

        vi.mocked(emitSpy).mockClear()
        // @ts-ignore mock feature
        vi.mocked(chokidar.on).mock.calls[2][1](filesToWatch[0])
        expect(runSpy).toHaveBeenNthCalledWith(3, {})
        expect(emitSpy).toHaveBeenCalledTimes(2) // Both Workers called

        vi.mocked(emitSpy).mockClear()
        // @ts-ignore mock feature
        vi.mocked(chokidar.on).mock.calls[3][1](filesToWatch[0])
        expect(runSpy).toHaveBeenNthCalledWith(4, {})
        expect(emitSpy).toHaveBeenCalledTimes(2) // Both Workers called
    })

    afterEach(() => {
        vi.mocked(chokidar.watch).mockClear()
        // @ts-ignore mock feature
        chokidar.on.mockClear()
    })
})
