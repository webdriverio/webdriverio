import AppiumLauncher from '../src/launcher'
import childProcess from 'child_process'
import fs from 'fs-extra'

jest.unmock('@wdio/config')
jest.mock('child_process', () => ({
    spawn: jest.fn(),
}))
jest.mock('fs-extra', () => ({
    createWriteStream: jest.fn(),
    ensureFileSync: jest.fn(),
}))

class eventHandler {
    registered = {};

    delegate(event, callback) {
        this.registered[event] = callback
    }

    trigger(event, data) {
        this.registered[event](data)
    }
}

class MockProcess {
    _eventHandler = new eventHandler()
    once() {
        this._eventHandler.trigger('data', '[Appium] Welcome to Appium v1.11.1')
        this._eventHandler.trigger('data', '[Appium] Appium REST http interface listener started on localhost:4723')
    }
    removeListener() {}
    kill() {}
    stdout = { pipe: jest.fn(), on: this._eventHandler.delegate.bind(this._eventHandler) }
    stderr = { pipe: jest.fn(), once: jest.fn() }
}

class MockFailingProcess extends MockProcess {
    constructor(exitCode = 2) {
        super()
        this.exitCode = exitCode
    }

    once(event, callback) {
        if (event === 'exit') {
            callback(this.exitCode)
        }
    }
}

class MockCustomFailingProcess extends MockFailingProcess {
    stderr = { pipe: jest.fn(), once: jest.fn().mockImplementation((event, cb) => cb(new Error('Uups'))) }
}

jest.mock('../src/utils', () => {
    const { cliArgsFromKeyValue } = jest.requireActual('../src/utils')
    return {
        getFilePath: jest.fn().mockReturnValue('/some/file/path'),
        getAppiumCommand: jest.fn().mockReturnValue('/appium/command/path'),
        cliArgsFromKeyValue
    }
})

describe('Appium launcher', () => {
    const originalPlatform = process.platform

    beforeEach(() => {
        global.console.error = jest.fn()
        childProcess.spawn.mockClear()
        childProcess.spawn.mockReturnValue(new MockProcess())
    })

    describe('onPrepare', () => {
        const isWindows = process.platform === 'win32'
        test('should set correct config properties', async () => {
            const options = {
                logPath: './',
                command:'path/to/my_custom_appium',
                args: { foo: 'bar' }
            }
            const capabilities = [{ port: 1234 }]
            const launcher = new AppiumLauncher(options, capabilities, {})
            launcher._startAppium = jest.fn().mockImplementation((cmd, args, cb) => cb(null, new MockProcess()))
            await launcher.onPrepare()

            expect(launcher.process).toBeInstanceOf(MockProcess)
            expect(launcher.logPath).toBe('./')
            if (isWindows) {
                expect(launcher.command).toBe('cmd')
            } else {
                expect(launcher.command).toBe('path/to/my_custom_appium')
            }
            expect(capabilities[0].protocol).toBe('http')
            expect(capabilities[0].hostname).toBe('localhost')
            expect(capabilities[0].port).toBe(1234)
            expect(capabilities[0].path).toBe('/')
        })

        test('should set correct config properties using multiremote', async () => {
            const options = {
                logPath: './',
                command: 'path/to/my_custom_appium',
                args: { foo: 'bar' }
            }
            const capabilities = {
                browserA: { port: 1234 },
                browserB: {}
            }
            const launcher = new AppiumLauncher(options, capabilities, {})
            launcher._startAppium = jest.fn().mockImplementation((cmd, args, cb) => cb(null, new MockProcess()))
            await launcher.onPrepare()
            expect(capabilities.browserA.protocol).toBe('http')
            expect(capabilities.browserA.hostname).toBe('localhost')
            expect(capabilities.browserA.port).toBe(1234)
            expect(capabilities.browserA.path).toBe('/')
            expect(capabilities.browserB.protocol).toBe('http')
            expect(capabilities.browserB.hostname).toBe('localhost')
            expect(capabilities.browserB.port).toBe(4723)
            expect(capabilities.browserB.path).toBe('/')
        })

        test('should not override cloud config using multiremote', async () => {
            const options = {
                logPath : './',
                args : { foo : 'foo' },
                installArgs : { bar : 'bar' },
            }
            const capabilities = {
                browserA: { port: 1234 },
                browserB: { port: 4321, capabilities: { 'bstack:options': {} } }
            }
            const launcher = new AppiumLauncher(options, capabilities, {})
            launcher._redirectLogStream = jest.fn()
            await launcher.onPrepare({ watch: true })
            expect(capabilities.browserA.protocol).toBe('http')
            expect(capabilities.browserA.hostname).toBe('localhost')
            expect(capabilities.browserA.port).toBe(1234)
            expect(capabilities.browserA.path).toBe('/')
            expect(capabilities.browserB.protocol).toBeUndefined()
            expect(capabilities.browserB.hostname).toBeUndefined()
            expect(capabilities.browserB.port).toBe(4321)
            expect(capabilities.browserB.path).toBeUndefined()
        })

        test('should respect custom Appium port', async () => {
            const options = {
                logPath: './',
                command: 'path/to/my_custom_appium',
                args: { foo: 'bar', port: 1234 }
            }
            const capabilities = [{}]
            const launcher = new AppiumLauncher(options, capabilities, {})
            launcher._startAppium = jest.fn().mockImplementation(
                (cmd, args, cb) => cb(null, new MockProcess()))
            await launcher.onPrepare()

            expect(launcher.process).toBeInstanceOf(MockProcess)
            expect(launcher.logPath).toBe('./')
            if (isWindows) {
                expect(launcher.command).toBe('cmd')
            } else {
                expect(launcher.command).toBe('path/to/my_custom_appium')
            }
            expect(capabilities[0].protocol).toBe('http')
            expect(capabilities[0].hostname).toBe('localhost')
            expect(capabilities[0].port).toBe(1234)
            expect(capabilities[0].path).toBe('/')
        })

        test('should respect custom port and path before Appium port and path', async () => {
            const options = {
                logPath: './',
                command: 'path/to/my_custom_appium',
                args: { foo: 'bar', port: 1234, basePath: '/foo/bar' }
            }
            const capabilities = [{ port: 4321 }]
            const launcher = new AppiumLauncher(options, capabilities, {})
            launcher._startAppium = jest.fn().mockImplementation(
                (cmd, args, cb) => cb(null, new MockProcess()))
            await launcher.onPrepare()

            expect(launcher.process).toBeInstanceOf(MockProcess)
            expect(launcher.logPath).toBe('./')
            if (isWindows) {
                expect(launcher.command).toBe('cmd')
            } else {
                expect(launcher.command).toBe('path/to/my_custom_appium')
            }

            expect(capabilities[0].protocol).toBe('http')
            expect(capabilities[0].hostname).toBe('localhost')
            expect(capabilities[0].port).toBe(4321)
            expect(capabilities[0].path).toBe('/foo/bar')
        })

        test('should set correct config properties for Windows', async () => {
            Object.defineProperty(process, 'platform', {
                value: 'win32'
            })

            const launcher = new AppiumLauncher({
                logPath: './',
                command: 'path/to/my_custom_appium',
                args: { foo: 'bar' }
            }, [], {})
            await launcher.onPrepare()

            expect(launcher.command).toBe('cmd')
            expect(launcher.appiumArgs).toMatchSnapshot()
        })

        test('should set correct config properties for mac', async () => {
            Object.defineProperty(process, 'platform', {
                value: 'darwin'
            })

            const launcher = new AppiumLauncher({
                logPath: './',
                command: 'path/to/my_custom_appium',
                args: { foo: 'bar' }
            }, [], {})
            await launcher.onPrepare()

            expect(launcher.command).toBe('path/to/my_custom_appium')
            expect(launcher.appiumArgs).toMatchSnapshot()
        })

        test('should set correct config properties for linux', async () => {
            Object.defineProperty(process, 'platform', {
                value: 'linux'
            })

            const launcher = new AppiumLauncher({
                logPath: './',
                command: 'path/to/my_custom_appium',
                args: { foo: 'bar' }
            }, [], {})
            await launcher.onPrepare()

            expect(launcher.command).toBe('path/to/my_custom_appium')
            expect(launcher.appiumArgs).toMatchSnapshot()
        })

        test('should set correct config properties when empty', async () => {
            const launcher = new AppiumLauncher({}, [], {})
            await launcher.onPrepare()

            expect(launcher.logPath).toBe(undefined)
            if (isWindows) {
                expect(launcher.command).toBe('cmd')
            } else {
                expect(launcher.command).toBe('node')
            }
        })

        test('should start Appium', async () => {
            const launcher = new AppiumLauncher({ args: { superspeed: true } }, [], {})
            await launcher.onPrepare()
        })

        test('should fail if Appium exits', async () => {
            const launcher = new AppiumLauncher({}, [], {})
            childProcess.spawn.mockReturnValue(new MockFailingProcess(1))

            let error
            try {
                await launcher.onPrepare({})
            } catch (e) {
                error = e
            }
            const expectedError = new Error('Appium exited before timeout (exit code: 1)')
            expect(error).toEqual(expectedError)
        })

        test('should fail and error message if Appium already runs', async () => {
            const launcher = new AppiumLauncher({}, [], {})
            childProcess.spawn.mockReturnValue(new MockFailingProcess(2))

            let error
            try {
                await launcher.onPrepare({})
            } catch (e) {
                error = e
            }
            const expectedError = new Error('Appium exited before timeout (exit code: 2)\n' +
                "Check that you don't already have a running Appium service.")
            expect(error).toEqual(expectedError)
        })

        test('should fail with Appium error message', async () => {
            const launcher = new AppiumLauncher({}, [], {})
            childProcess.spawn.mockReturnValue(new MockCustomFailingProcess(2))

            let error
            try {
                await launcher.onPrepare({})
            } catch (e) {
                error = e
            }
            const expectedError = new Error('Appium exited before timeout (exit code: 2)\nError: Uups')
            expect(error).toEqual(expectedError)
        })
    })

    describe('onComplete', () => {
        test('should call process.kill', async () => {
            const launcher = new AppiumLauncher({}, [], {})
            await launcher.onPrepare({})
            launcher.process.kill = jest.fn()
            launcher.onComplete()
            expect(launcher.process.kill).toBeCalled()
        })

        test('should not call process.kill', () => {
            const launcher = new AppiumLauncher({}, [], {})
            expect(launcher.process).toBe(undefined)
            launcher.onComplete()
            expect(launcher.process).toBe(undefined)
        })
    })

    describe('_redirectLogStream', () => {
        test('should not write output to file', async () => {
            const launcher = new AppiumLauncher({}, [], {})
            launcher._redirectLogStream = jest.fn()
            await launcher.onPrepare({})
            expect(launcher._redirectLogStream).not.toBeCalled()
        })

        test('should write output to file', async () => {
            const launcher = new AppiumLauncher({ logPath: './' }, [], {})
            await launcher.onPrepare({})

            expect(fs.createWriteStream.mock.calls[0][0]).toBe('/some/file/path')
            expect(launcher.process.stdout.pipe).toBeCalled()
            expect(launcher.process.stderr.pipe).toBeCalled()
        })
    })

    afterEach(() => {
        global.console.error.mockRestore()
        Object.defineProperty(process, 'platform', {
            value: originalPlatform
        })
    })
})
