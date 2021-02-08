import path from 'path'
import chokidar from 'chokidar'

import Watcher from '../src/watcher'

jest.mock('../src/launcher', () => {
    const { ConfigParser } = require('@wdio/config')

    class LauncherMock {
        configParser = new ConfigParser()
        isMultiremote: boolean
        runner: any
        interface: any

        constructor (configFile, args) {
            if ( this.configParser.autoCompile ) {
                this.configParser.autoCompile()
            }
            this.configParser.addConfigFile(configFile)
            this.configParser.merge(args)
            this.isMultiremote = args.isMultiremote
            this.runner = {}
            this.interface = {
                emit: jest.fn(),
                setup: jest.fn()
            }
        }
    }
    return LauncherMock
})

class WorkerMock {
    cid: string
    specs: string[]
    caps: WebDriver.DesiredCapabilities
    sessionId: string
    isBusy: boolean
    postMessage = jest.fn()

    constructor (cid, specs, sessionId, isBusy = false) {
        this.cid = cid
        this.specs = [specs]
        this.caps = { browserName: 'chrome' }
        this.sessionId = sessionId || `${Math.random()}`
        this.isBusy = isBusy
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
                    '0-0': { on: jest.fn(), isBusy: false }
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
                    '0-0': { on: jest.fn(), isBusy: false }
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
                    '0-0': { on: jest.fn(), isBusy: false }
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
        expect(watcher.run).toHaveBeenNthCalledWith(1, { spec: ['/some/path.js'] })
        expect(watcher.run).toHaveBeenNthCalledWith(2, { spec: ['/some/other/path.js'] })
        expect(watcher.run).toHaveBeenNthCalledWith(3, {})
        expect(watcher.run).toHaveBeenNthCalledWith(4, {})
    })

    it('should get workers by pickBy function', () => {
        const wdioConf = path.join(__dirname, '__fixtures__', 'wdio.conf')
        const watcher = new Watcher(wdioConf, {})
        const workerPool = {
            // @ts-ignore mock feature
            '0-0': new WorkerMock('0-0', '/foo/bar.js'),
            '0-1': new WorkerMock('0-1', '/foo/bar2.js', null, true),
            // @ts-ignore mock feature
            '1-0': new WorkerMock('1-0', '/bar/foo.js')
        }
        watcher['_launcher'].runner.workerPool = workerPool

        expect(watcher.getWorkers(null, true)).toEqual(workerPool)
        expect(watcher.getWorkers()).toEqual({
            '0-0': workerPool['0-0'],
            '1-0': workerPool['1-0']
        })
        expect(watcher.getWorkers(
            (worker) => worker.specs.includes('/bar/foo.js'))
        ).toEqual({ '1-0': workerPool['1-0'] })
    })

    it('should run workers on existing session', () => {
        const wdioConf = path.join(__dirname, '__fixtures__', 'wdio.conf')
        const watcher = new Watcher(wdioConf, {})
        watcher['_launcher'].runner.workerPool = {
            // @ts-ignore mock feature
            '0-0': new WorkerMock('0-0', '/foo/bar.js'),
            '0-1': new WorkerMock('0-1', '/foo/bar2.js', null, true),
            // @ts-ignore mock feature
            '1-0': new WorkerMock('1-0', '/bar/foo.js')
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
            '0-0': new WorkerMock('0-0', '/foo/bar.js'),
            '0-1': new WorkerMock('0-1', '/foo/bar2.js', null, true),
            // @ts-ignore mock feature
            '1-0': new WorkerMock('1-0', '/bar/foo.js')
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
            '0-0': new WorkerMock('0-0', '/foo/bar.js'),
            '0-1': new WorkerMock('0-1', '/foo/bar2.js', null, true),
            // @ts-ignore mock feature
            '1-0': new WorkerMock('1-0', '/bar/foo.js')
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

    afterEach(() => {
        (chokidar.watch as jest.Mock).mockClear()
        // @ts-ignore mock feature
        chokidar.on.mockClear()
    })
})
