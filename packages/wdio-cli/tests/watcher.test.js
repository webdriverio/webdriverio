import path from 'path'
import chokidar from 'chokidar'

import Watcher from '../src/watcher'

jest.mock('../src/launcher', () => {
    const { ConfigParser } = require('@wdio/config')

    class LauncherMock {
        constructor (configFile, argv) {
            this.configParser = new ConfigParser()
            this.configParser.addConfigFile(configFile)
            this.configParser.merge(argv)
            this.runner = {}
            this.interface = {
                setup: jest.fn(),
                updateView: jest.fn()
            }
        }
    }
    return LauncherMock
})

class WorkerMock {
    constructor (cid, specs, sessionId, isBusy = false) {
        this.cid = cid
        this.specs = [specs]
        this.caps = { browserName: 'chrome' }
        this.sessionId = sessionId || `${Math.random()}`
        this.isBusy = isBusy
        this.postMessage = jest.fn()
    }
}

describe('watcher', () => {
    it('should initialise properly', async () => {
        const wdioConf = path.join(__dirname, '__fixtures__', 'wdio.conf')
        const watcher = new Watcher(wdioConf, {})
        expect(watcher.specs).toEqual([
            './tests/test1.js',
            './tests/test2.js'
        ])
    })

    it('should run initial suite when starting watching', async () => {
        const wdioConf = path.join(__dirname, '__fixtures__', 'wdio.conf')
        const watcher = new Watcher(wdioConf, {})
        watcher.launcher = {
            run: jest.fn(),
            interface: { updateView: jest.fn() }
        }
        await watcher.watch()

        expect(chokidar.watch).toHaveBeenCalledTimes(1)
    })

    it('should call run with modifed path when a new file was changed or added', async () => {
        const wdioConf = path.join(__dirname, '__fixtures__', 'wdio.conf')
        const watcher = new Watcher(wdioConf, {})
        watcher.launcher = {
            run: jest.fn(),
            interface: { updateView: jest.fn() }
        }
        watcher.run = jest.fn()
        await watcher.watch()

        chokidar.on.mock.calls[0][1]('/some/path.js')
        chokidar.on.mock.calls[1][1]('/some/other/path.js')
        expect(watcher.run).toHaveBeenCalledWith({ spec: '/some/path.js' })
        expect(watcher.run).toHaveBeenCalledWith({ spec: '/some/other/path.js' })
    })

    it('should run workers on existing session', () => {
        const wdioConf = path.join(__dirname, '__fixtures__', 'wdio.conf')
        const watcher = new Watcher(wdioConf, {})
        watcher.launcher.runner.workerPool = {
            '0-0': new WorkerMock('0-0', '/foo/bar.js'),
            '0-1': new WorkerMock('0-1', '/foo/bar2.js', null, true),
            '1-0': new WorkerMock('1-0', '/bar/foo.js')
        }
        watcher.launcher.interface.emit = jest.fn()
        watcher.run({ spec: '/foo/bar.js' })
        expect(watcher.launcher.interface.emit).toHaveBeenCalledWith('job:start', {
            cid: '0-0',
            caps: { browserName: 'chrome' },
            specs: [ '/foo/bar.js' ]
        })

        const { postMessage, sessionId } = watcher.launcher.runner.workerPool['0-0']
        expect(postMessage).toHaveBeenCalledWith('run', { sessionId, spec: '/foo/bar.js' });
    })

    it('should not clean if no watcher is running', () => {
        const wdioConf = path.join(__dirname, '__fixtures__', 'wdio.conf')
        const watcher = new Watcher(wdioConf, {})
        watcher.launcher.runner.workerPool = {
            '0-0': new WorkerMock('0-0', '/foo/bar.js'),
            '0-1': new WorkerMock('0-1', '/foo/bar2.js', null, true),
            '1-0': new WorkerMock('1-0', '/bar/foo.js')
        }
        watcher.launcher.interface.emit = jest.fn()
        watcher.run({ spec: '/foo/bar2.js' })
        expect(watcher.launcher.interface.emit).toHaveBeenCalledTimes(0)
    })

    afterEach(() => {
        chokidar.on.mockClear()
    })
})
