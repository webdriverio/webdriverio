import AppiumLauncher from '../src/launcher'
import childProcess from 'child_process'
import fs from 'fs-extra'
import { mocked } from 'ts-jest/utils'
import path from 'path'

jest.mock('child_process', () => ({
    spawn: jest.fn(),
}))
const childProcessMock = mocked(childProcess, true)

jest.mock('fs-extra', () => ({
    createWriteStream: jest.fn(),
    ensureFileSync: jest.fn(),
}))

const fsMocked = mocked(fs, true)

class MockProcess {
    removeListener() {}
    kill() {}
    stdout = {
        pipe: jest.fn(),
        on: (event: string, callback: Function) =>{
            callback('[Appium] Welcome to Appium v1.11.1')
            callback('[Appium] Appium REST http interface listener started on localhost:4723')
        } }
    stderr = {
        pipe: jest.fn(), once: jest.fn()
    }
}

class MockFailingProcess extends MockProcess {
    exitCode: number
    constructor(exitCode = 2) {
        super()
        this.exitCode = exitCode
    }

    once(event: string, callback: Function) {
        if (event === 'exit') {
            callback(this.exitCode)
        }
    }
    stdout = {
        pipe: jest.fn(),
        on: jest.fn()
    }
}

class MockCustomFailingProcess extends MockFailingProcess {
    stderr = { pipe: jest.fn(), once: jest.fn().mockImplementation((event, cb) => cb(new Error('Uups'))) }
}

jest.mock('../src/utils', () => {
    const { formatCliArgs } = jest.requireActual('../src/utils')
    return {
        getFilePath: jest.fn().mockReturnValue('/some/file/path'),
        formatCliArgs
    }
})

const isWindows = process.platform === 'win32'

describe('Appium launcher', () => {
    const originalPlatform = process.platform
    const consoleSpy = jest.spyOn(global.console, 'error')
    //@ts-ignore spyOn private function
    const getAppiumCommandSpy = jest.spyOn<any>(AppiumLauncher, '_getAppiumCommand')

    beforeEach(() => {
        getAppiumCommandSpy.mockReturnValue('/appium/command/path')
        childProcessMock.spawn.mockClear()
        childProcessMock.spawn.mockReturnValue(new MockProcess() as unknown as childProcess.ChildProcess)
    })

    describe('onPrepare', () => {
        test('should set correct config properties', async () => {
            const options = {
                logPath: './',
                command:'path/to/my_custom_appium',
                args: { foo: 'bar' }
            }
            const capabilities = [{ port: 1234 }] as WebDriver.DesiredCapabilities[]
            const launcher = new AppiumLauncher(options, capabilities, {})
            await launcher.onPrepare()

            expect(launcher['_process']).toBeInstanceOf(MockProcess)
            expect(launcher['_logPath']).toBe('./')
            if (isWindows) {
                expect(launcher['_command']).toBe('cmd')
            } else {
                expect(launcher['_command']).toBe('path/to/my_custom_appium')
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
                browserA: { port: 1234 } as WebDriver.DesiredCapabilities,
                browserB: {} as WebDriver.DesiredCapabilities
            }
            const launcher = new AppiumLauncher(options, capabilities, {})
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
                browserA: { port: 1234 } as WebDriver.DesiredCapabilities,
                browserB: { port: 4321, capabilities: { 'bstack:options': {} } } as WebDriver.DesiredCapabilities
            }
            const launcher = new AppiumLauncher(options, capabilities, {})
            launcher['_redirectLogStream'] = jest.fn()
            await launcher.onPrepare()
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
            const capabilities = [{} as WebDriver.DesiredCapabilities]
            const launcher = new AppiumLauncher(options, capabilities, {})
            launcher['_startAppium'] = jest.fn().mockImplementation(
                (cmd, args, cb) => cb(null, new MockProcess()))
            await launcher.onPrepare()

            expect(launcher['_process']).toBeInstanceOf(MockProcess)
            expect(launcher['_logPath']).toBe('./')
            if (isWindows) {
                expect(launcher['_command']).toBe('cmd')
            } else {
                expect(launcher['_command']).toBe('path/to/my_custom_appium')
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
            const capabilities = [{ port: 4321 } as WebDriver.DesiredCapabilities]
            const launcher = new AppiumLauncher(options, capabilities, {})
            launcher['_startAppium'] = jest.fn().mockImplementation(
                (cmd, args, cb) => cb(null, new MockProcess()))
            await launcher.onPrepare()

            expect(launcher['_process']).toBeInstanceOf(MockProcess)
            expect(launcher['_logPath']).toBe('./')
            if (isWindows) {
                expect(launcher['_command']).toBe('cmd')
            } else {
                expect(launcher['_command']).toBe('path/to/my_custom_appium')
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

            expect(launcher['_command']).toBe('cmd')
            expect(launcher['_appiumCliArgs']).toMatchSnapshot()
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

            expect(launcher['_command']).toBe('path/to/my_custom_appium')
            expect(launcher['_appiumCliArgs']).toMatchSnapshot()
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

            expect(launcher['_command']).toBe('path/to/my_custom_appium')
            expect(launcher['_appiumCliArgs']).toMatchSnapshot()
        })

        test('should set correct config properties when empty', async () => {
            const launcher = new AppiumLauncher({}, [], {})
            await launcher.onPrepare()

            expect(launcher['_logPath']).toBe(undefined)
            if (isWindows) {
                expect(launcher['_command']).toBe('cmd')
            } else {
                expect(launcher['_command']).toBe('node')
            }
        })

        test('should start Appium', async () => {
            const launcher = new AppiumLauncher({ args: { superspeed: true } }, [], {})
            await launcher.onPrepare()
        })

        test('should fail if Appium exits', async () => {
            const launcher = new AppiumLauncher({}, [], {})
            childProcessMock.spawn.mockReturnValue(new MockFailingProcess(1) as unknown as childProcess.ChildProcess)

            let error
            try {
                await launcher.onPrepare()
            } catch (e) {
                error = e
            }
            const expectedError = new Error('Appium exited before timeout (exit code: 1)')
            expect(error).toEqual(expectedError)
        })

        test('should fail and error message if Appium already runs', async () => {
            const launcher = new AppiumLauncher({}, [], {})
            childProcessMock.spawn.mockReturnValue(new MockFailingProcess(2) as unknown as childProcess.ChildProcess)

            let error
            try {
                await launcher.onPrepare()
            } catch (e) {
                error = e
            }
            const expectedError = new Error('Appium exited before timeout (exit code: 2)\n' +
                "Check that you don't already have a running Appium service.")
            expect(error).toEqual(expectedError)
        })

        test('should fail with Appium error message', async () => {
            const launcher = new AppiumLauncher({}, [], {})
            childProcessMock.spawn.mockReturnValue(new MockCustomFailingProcess(2) as unknown as childProcess.ChildProcess)

            let error
            try {
                await launcher.onPrepare()
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
            await launcher.onPrepare()
            launcher['_process']!.kill = jest.fn()
            launcher.onComplete()
            expect(launcher['_process']!.kill).toBeCalled()
        })

        test('should not call process.kill', () => {
            const launcher = new AppiumLauncher({}, [], {})
            expect(launcher['_process']).toBe(undefined)
            launcher.onComplete()
            expect(launcher['_process']).toBe(undefined)
        })
    })

    describe('_redirectLogStream', () => {
        test('should not write output to file', async () => {
            const launcher = new AppiumLauncher({}, [], {})
            launcher['_redirectLogStream'] = jest.fn()
            await launcher.onPrepare()
            expect(launcher['_redirectLogStream']).not.toBeCalled()
        })

        test('should write output to file', async () => {
            const launcher = new AppiumLauncher({ logPath: './' }, [], {})
            await launcher.onPrepare()

            expect(fsMocked.createWriteStream.mock.calls[0][0]).toBe('/some/file/path')
            expect(launcher['_process']!.stdout.pipe).toBeCalled()
            expect(launcher['_process']!.stderr.pipe).toBeCalled()
        })
    })

    describe('_getAppiumCommand', () => {

        beforeEach(() => {
            getAppiumCommandSpy.mockRestore()
        })

        test('should return path to dependency', () => {

            expect(AppiumLauncher['_getAppiumCommand']('fs-extra'))
                .toBe(path.join(process.cwd(), 'packages/wdio-appium-service/node_modules/fs-extra/lib/index.js'))
        })
        test('should be appium by default', () => {
            expect(() => AppiumLauncher['_getAppiumCommand']())
                .toThrow("Cannot find module 'appium' from 'packages/wdio-appium-service/src/launcher.ts'")
        })
    })

    afterEach(() => {
        consoleSpy.mockRestore()
        Object.defineProperty(process, 'platform', {
            value: originalPlatform
        })
    })
})
