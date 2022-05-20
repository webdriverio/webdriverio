import path from 'node:path'
import chokidar from 'chokidar'
import EventEmitter from 'node:events'
import type { Workers } from '@wdio/types'

import { RunCommandArguments } from '../src/types'
import Watcher from '../src/watcher'

jest.mock('../src/launcher', () => {
    const { ConfigParser } = require('@wdio/config')

    interface LauncherMockRunCommandArguments extends Omit<RunCommandArguments, 'configPath'> {
        isMultiremote?: boolean;
    }

    class LauncherMock {
        configParser = new ConfigParser()
        isMultiremote: boolean
        runner: any
        interface: any

        constructor (configFile: string, args: LauncherMockRunCommandArguments) {
            if ( this.configParser.autoCompile ) {
                this.configParser.autoCompile()
            }
            this.configParser.addConfigFile(configFile)
            this.configParser.merge(args)
            this.isMultiremote = args.isMultiremote || false
            this.runner = {}
            this.interface = {
                emit: jest.fn(),
                setup: jest.fn()
            }
        }
    }
    return LauncherMock
})

interface WorkerMockRunPayload extends Partial<Workers.WorkerRunPayload> {
    isBusy?: boolean;
    sessionId?: string;
    specs: string[];
}

class WorkerMock extends EventEmitter implements Workers.Worker {
    cid: string
    specs: string[]
    caps: WebDriver.DesiredCapabilities
    capabilities: WebDriver.DesiredCapabilities
    sessionId: string
    isBusy: boolean
    postMessage = jest.fn()

    constructor ({ cid, specs, sessionId, isBusy = false }: WorkerMockRunPayload) {
        super()
        this.cid = cid || `${Math.random()}`
        this.specs = specs
        this.caps = { browserName: 'chrome' }
        this.capabilities = this.caps
        this.sessionId = sessionId || `${Math.random()}`
        this.isBusy = isBusy
        this.on = jest.fn()
    }
}

describe('watcher', () => {
    it('should initialise properly', async () => {
        const wdioConf = path.join(__dirname, '__fixtures__', 'wdio.conf')
        const watcher = new Watcher(wdioConf, {})
        expect(watcher['_specs']).toEqual([
            './tests/test1.js',
            './tests/test2.js'
        ])
    })

    it('should initialise properly in Multiremote', async () => {
        const wdioConf = path.join(__dirname, '__fixtures__', 'wdio.conf')
        const watcher = new Watcher(wdioConf, { isMultiremote: true } as any)
        expect(watcher['_specs']).toEqual([
            './tests/test1.js',
        ])
    })

    it('should run initial suite when starting watching', async () => {
        const wdioConf = path.join(__dirname, '__fixtures__', 'wdio.conf')
        const watcher = new Watcher(wdioConf, {})
        watcher['_launcher'] = {
            run: jest.fn(),
            interface: {
                finalise: jest.fn()
            },
            configParser: {
                getConfig: jest.fn().mockReturnValue({ filesToWatch: [] })
            },
            runner: {
                workerPool: {
                    '0-0': new WorkerMock({ specs: ['./tests/test1.js'] })
                }
            }
        } as any
        await watcher.watch()

        expect(chokidar.watch).toHaveBeenCalledTimes(1)
    })

    it('should run initial suite when starting watching with grouped specs', async () => {
        const wdioConf = path.join(__dirname, '__fixtures__', 'wdio.conf')
        const watcher = new Watcher(wdioConf, {})
        watcher['_launcher'] = {
            run: jest.fn(),
            interface: {
                finalise: jest.fn()
            },
            configParser: {
                getConfig: jest.fn().mockReturnValue({ filesToWatch: [] })
            },
            runner: {
                workerPool: {
                    '0-0': new WorkerMock(<WorkerMockRunPayload>{ specs: ['/a.js', ['/b.js', '/c.js', '/d.js'], 'e.js'] })
                }
            }
        } as any
        await watcher.watch()

        expect(chokidar.watch).toHaveBeenCalledTimes(1)
    })

    it('should run also watch `filesToWatch` files', async () => {
        const wdioConf = path.join(__dirname, '__fixtures__', 'wdio.conf')
        const watcher = new Watcher(wdioConf, {})
        watcher['_launcher'] = {
            run: jest.fn(),
            interface: {
                finalise: jest.fn()
            },
            configParser: {
                getConfig: jest.fn().mockReturnValue({ filesToWatch: ['/foo/bar'] })
            },
            runner: {
                workerPool: {
                    '0-0': new WorkerMock({ specs: ['./tests/test1.js'] })
                }
            }
        } as any
        await watcher.watch()

        expect(chokidar.watch).toHaveBeenCalledTimes(2)

        const worker = watcher['_launcher'].runner.workerPool['0-0']
        expect(worker.on).toBeCalledTimes(1)

        const eventHandler = worker.on.mock.calls[0][1]
        expect(watcher['_launcher'].interface.finalise).toBeCalledTimes(0)
        worker.isBusy = true
        eventHandler()
        expect(watcher['_launcher'].interface.finalise).toBeCalledTimes(0)
        worker.isBusy = false
        eventHandler()
        expect(watcher['_launcher'].interface.finalise).toBeCalledTimes(1)
    })

    it('should call run with modifed path when a new file was changed or added', async () => {
        const wdioConf = path.join(__dirname, '__fixtures__', 'wdio.conf')
        const watcher = new Watcher(wdioConf, {})
        watcher['_launcher'] = {
            run: jest.fn(),
            interface: {
                finalise: jest.fn()
            },
            configParser: {
                getConfig: jest.fn().mockReturnValue({ filesToWatch: ['/foo/bar'] })
            },
            runner: {
                workerPool: {
                    '0-0': new WorkerMock({ specs: ['./tests/test1.js'] })
                }
            }
        } as any
        watcher.run = jest.fn()
        await watcher.watch()

        // @ts-ignore mock feature
        ;(chokidar.on as jest.Mock).mock.calls[0][1]('/some/path.js')
        // @ts-ignore mock feature
        ;(chokidar.on as jest.Mock).mock.calls[1][1]('/some/other/path.js')
        // @ts-ignore mock feature
        ;(chokidar.on as jest.Mock).mock.calls[2][1]('/some/another/path.js')
        // @ts-ignore mock feature
        ;(chokidar.on as jest.Mock).mock.calls[3][1]('/some/another/path.js')
        expect(watcher.run).toHaveBeenNthCalledWith(1, { spec: '/some/path.js' })
        expect(watcher.run).toHaveBeenNthCalledWith(2, { spec: '/some/other/path.js' })
        expect(watcher.run).toHaveBeenNthCalledWith(3, {})
        expect(watcher.run).toHaveBeenNthCalledWith(4, {})
    })

    it('should get workers by pickBy function', () => {
        const wdioConf = path.join(__dirname, '__fixtures__', 'wdio.conf')
        const watcher = new Watcher(wdioConf, {})
        const workerPool = {
            '0-0': new WorkerMock({ cid: '0-0', specs: ['/foo/bar.js'] }),
            '0-1': new WorkerMock({ cid: '0-1', specs: ['/foo/bar2.js'], isBusy: true }),
            '1-0': new WorkerMock({ cid: '1-0', specs: ['/bar/foo.js'] })
        }
        watcher['_launcher'].runner.workerPool = workerPool

        expect(watcher.getWorkers(null, true)).toEqual(workerPool)
        expect(watcher.getWorkers()).toEqual({
            '0-0': workerPool['0-0'],
            '1-0': workerPool['1-0']
        })
        expect(watcher.getWorkers(
            (worker: Workers.Worker) => worker.specs.includes('/bar/foo.js'))
        ).toEqual({ '1-0': workerPool['1-0'] })
    })

    it('should run workers on existing session', () => {
        const wdioConf = path.join(__dirname, '__fixtures__', 'wdio.conf')
        const watcher = new Watcher(wdioConf, {})
        watcher['_launcher'].runner.workerPool = {
            // @ts-ignore mock feature
            '0-0': new WorkerMock({ cid: '0-0', specs: ['/foo/bar.js'] }),
            '0-1': new WorkerMock({ cid: '0-1', specs: ['/foo/bar2.js'], isBusy: true }),
            // @ts-ignore mock feature
            '1-0': new WorkerMock({ cid: '1-0', specs: ['/bar/foo.js'] })
        }
        watcher['_launcher'].interface.emit = jest.fn()
        watcher.run({ spec: '/foo/bar.js' } as any)
        expect(watcher['_launcher'].interface.emit).toHaveBeenCalledWith('job:start', {
            cid: '0-0',
            caps: { browserName: 'chrome' },
            specs: ['/foo/bar.js']
        })

        const { postMessage, sessionId } = watcher['_launcher'].runner.workerPool['0-0']
        expect(postMessage).toHaveBeenCalledWith('run', { sessionId, spec: '/foo/bar.js' })
        expect(watcher['_launcher'].interface.totalWorkerCnt).toBe(1)
    })

    it('should not clean if no watcher is running', () => {
        const wdioConf = path.join(__dirname, '__fixtures__', 'wdio.conf')
        const watcher = new Watcher(wdioConf, {})
        watcher['_launcher'].runner.workerPool = {
            // @ts-ignore mock feature
            '0-0': new WorkerMock({ cid: '0-0', specs: ['/foo/bar.js'] }),
            '0-1': new WorkerMock({ cid: '0-1', specs: ['/foo/bar2.js'], isBusy: true }),
            // @ts-ignore mock feature
            '1-0': new WorkerMock({ cid: '1-0', specs: ['/bar/foo.js'] })
        }
        watcher['_launcher'].interface.emit = jest.fn()
        watcher.run({ spec: '/foo/bar2.js' } as any)
        expect(watcher['_launcher'].interface.emit).toHaveBeenCalledTimes(0)
    })

    it('should run all tests if `filesToWatch` entry was changed', () => {
        const wdioConf = path.join(__dirname, '__fixtures__', 'wdio.conf')
        const watcher = new Watcher(wdioConf, {})
        watcher['_launcher'].interface.totalWorkerCnt = 1
        watcher.cleanUp = jest.fn()
        watcher['_launcher'].runner.workerPool = {
            // @ts-ignore mock feature
            '0-0': new WorkerMock({ cid: '0-0', specs: ['/foo/bar.js'] }),
            '0-1': new WorkerMock({ cid: '0-1', specs: ['/foo/bar2.js'], isBusy: true }),
            // @ts-ignore mock feature
            '1-0': new WorkerMock({ cid: '1-0', specs: ['/bar/foo.js'] })
        }
        watcher.run()

        expect(watcher['_launcher'].interface.totalWorkerCnt).toBe(2)

        const worker00 = watcher['_launcher'].runner.workerPool['0-0']
        expect(worker00.postMessage).toHaveBeenCalledWith(
            'run',
            { sessionId: worker00.sessionId })
        expect(watcher['_launcher'].interface.emit).toHaveBeenCalledWith('job:start', {
            cid: '0-0',
            caps: { browserName: 'chrome' },
            specs: ['/foo/bar.js'] })

        const worker10 = watcher['_launcher'].runner.workerPool['0-0']
        expect(worker10.postMessage).toHaveBeenCalledWith(
            'run',
            { sessionId: worker10.sessionId })
        expect(watcher['_launcher'].interface.emit).toHaveBeenCalledWith('job:start', {
            cid: '1-0',
            caps: { browserName: 'chrome' },
            specs: ['/bar/foo.js'] })
    })

    it('should re-run all specs when the --spec command line option is set and a filesToWatch file is added or changed', async () => {
        const spec = ['/some/path.js', '/some/other/path.js']
        const someOtherExcludedPath = '/some/other/excluded/path.js'
        const filesToWatch = ['/some/another/path.js']
        const wdioConf = path.join(__dirname, '__fixtures__', 'wdio.conf')
        const watcher = new Watcher(wdioConf, {})
        watcher['_launcher'] = {
            __args: { spec },
            run: jest.fn(),
            interface: {
                emit: jest.fn(),
                finalise: jest.fn()
            },
            configParser: {
                getConfig: jest.fn().mockReturnValue({ filesToWatch })
            },
            runner: {
                workerPool: {
                    '0-0': new WorkerMock({ cid: '0-0', specs: [spec[0]] }),
                    '0-1': new WorkerMock({ cid: '0-1', specs: [spec[1]] })
                }
            }
        } as any
        const runSpy = jest.spyOn(watcher, 'run')
        const emitSpy = watcher['_launcher'].interface.emit
        watcher.cleanUp = jest.fn()
        await watcher.watch()

        // @ts-ignore mock feature
        ;(chokidar.on as jest.Mock).mock.calls[0][1](spec[0])
        expect(runSpy).toHaveBeenNthCalledWith(1, { spec: spec[0] })
        expect(emitSpy).toHaveBeenCalledTimes(1) // Only one Worker called

        ;(emitSpy as jest.Mock).mockClear()
        // @ts-ignore mock feature
        ;(chokidar.on as jest.Mock).mock.calls[1][1](someOtherExcludedPath)
        expect(runSpy).toHaveBeenNthCalledWith(2, { spec: someOtherExcludedPath })
        expect(emitSpy).not.toHaveBeenCalled() // No Workers called

        ;(emitSpy as jest.Mock).mockClear()
        // @ts-ignore mock feature
        ;(chokidar.on as jest.Mock).mock.calls[2][1](filesToWatch[0])
        expect(runSpy).toHaveBeenNthCalledWith(3, {})
        expect(emitSpy).toHaveBeenCalledTimes(2) // Both Workers called

        ;(emitSpy as jest.Mock).mockClear()
        // @ts-ignore mock feature
        ;(chokidar.on as jest.Mock).mock.calls[3][1](filesToWatch[0])
        expect(runSpy).toHaveBeenNthCalledWith(4, {})
        expect(emitSpy).toHaveBeenCalledTimes(2) // Both Workers called
    })

    it('should re-run all specs, with grouped specs, when the --spec command line option is set and a filesToWatch file is added or changed', async () => {
        const spec = ['/a.js', ['/b.js', '/c.js', '/d.js']]
        const someOtherExcludedPath = '/some/other/excluded/path.js'
        const filesToWatch = ['/some/another/path.js']
        const wdioConf = path.join(__dirname, '__fixtures__', 'wdio.conf')
        const watcher = new Watcher(wdioConf, {})
        // @ts-ignore
        watcher['_launcher'] = {
            __args: { spec },
            run: jest.fn(),
            interface: {
                emit: jest.fn(),
                finalise: jest.fn()
            },
            configParser: {
                getConfig: jest.fn().mockReturnValue({ filesToWatch })
            },
            runner: {
                workerPool: {
                    '0-0': new WorkerMock({ cid: '0-0', specs: [spec[0]] }),
                    '0-1': new WorkerMock({ cid: '0-1', specs: [spec[1]] })
                }
            }
        } as any
        const runSpy = jest.spyOn(watcher, 'run')
        const emitSpy = watcher['_launcher'].interface.emit
        watcher.cleanUp = jest.fn()
        await watcher.watch()

        // @ts-ignore mock feature
        ;(chokidar.on as jest.Mock).mock.calls[0][1](spec[0])
        expect(runSpy).toHaveBeenNthCalledWith(1, { spec: spec[0] })
        expect(emitSpy).toHaveBeenCalledTimes(1) // Only one Worker called

        ;(emitSpy as jest.Mock).mockClear()
        // @ts-ignore mock feature
        ;(chokidar.on as jest.Mock).mock.calls[1][1](someOtherExcludedPath)
        expect(runSpy).toHaveBeenNthCalledWith(2, { spec: someOtherExcludedPath })
        expect(emitSpy).not.toHaveBeenCalled() // No Workers called

        ;(emitSpy as jest.Mock).mockClear()
        // @ts-ignore mock feature
        ;(chokidar.on as jest.Mock).mock.calls[2][1](filesToWatch[0])
        expect(runSpy).toHaveBeenNthCalledWith(3, {})
        expect(emitSpy).toHaveBeenCalledTimes(2) // Both Workers called

        ;(emitSpy as jest.Mock).mockClear()
        // @ts-ignore mock feature
        ;(chokidar.on as jest.Mock).mock.calls[3][1](filesToWatch[0])
        expect(runSpy).toHaveBeenNthCalledWith(4, {})
        expect(emitSpy).toHaveBeenCalledTimes(2) // Both Workers called
    })

    afterEach(() => {
        (chokidar.watch as jest.Mock).mockClear()
        // @ts-ignore mock feature
        chokidar.on.mockClear()
    })
})
