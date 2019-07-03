import { AppiumLauncher } from '../src/launcher'
import childProcess from 'child_process'
import fs from 'fs-extra'
import path from 'path'

jest.mock('child_process', () => ({
    spawn: jest.fn(),
}))
jest.mock('fs-extra', () => ({
    createWriteStream: jest.fn(),
    ensureFileSync: jest.fn(),
}))
global.console.error = jest.fn()

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

describe('Appium launcher', () => {
    let launcher = undefined
    let getAppiumCommand

    beforeEach(() => {
        childProcess.spawn.mockClear()
        childProcess.spawn.mockReturnValue(new MockProcess())
        launcher = new AppiumLauncher()
        getAppiumCommand = launcher._getAppiumCommand
        launcher._getAppiumCommand = jest.fn().mockImplementation(() => require.resolve('param-case'))
    })

    afterEach(() => {
        launcher.onComplete()
    })

    describe('onPrepare', () => {
        test('should set correct config properties', async () => {
            const config = {
                appium: {
                    logPath: './',
                    command: 'path/to/my_custom_appium',
                    args: { foo: 'bar' }
                }
            }
            await launcher.onPrepare(config)

            expect(launcher.logPath).toBe(config.appium.logPath)
            expect(launcher.command).toBe(config.appium.command)
            expect(launcher.appiumArgs).toEqual(['--foo', 'bar'])
        })

        test('should set correct config properties when empty', async () => {
            await launcher.onPrepare({})

            expect(launcher.logPath).toBe(undefined)
            expect(launcher.command).toBe('node')
            expect(launcher.appiumArgs).toEqual([path.join(process.cwd(), 'packages/wdio-appium-service/node_modules/param-case/param-case.js')])
        })

        test('should start Appium', async () => {
            await launcher.onPrepare({
                appium: {
                    args: { superspeed: true }
                }
            })

            expect(childProcess.spawn.mock.calls[0][0]).toBe('node')
            expect(childProcess.spawn.mock.calls[0][1]).toEqual([path.join(process.cwd(), 'packages/wdio-appium-service/node_modules/param-case/param-case.js'), '--superspeed'])
            expect(childProcess.spawn.mock.calls[0][2]).toEqual({ stdio: ['ignore', 'pipe', 'pipe'] })
        })

        test('should fail if Appium exits', async () => {
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
    })

    describe('onComplete', () => {
        test('should call process.kill', async () => {
            await launcher.onPrepare({})
            launcher.process.kill = jest.fn()

            launcher.onComplete()

            expect(launcher.process.kill).toBeCalled()
        })

        test('should not call process.kill', () => {
            expect(launcher.process).toBe(undefined)

            launcher.onComplete()

            expect(launcher.process).toBe(undefined)
        })
    })

    describe('_redirectLogStream', () => {
        test('should not write output to file', async () => {
            launcher._redirectLogStream = jest.fn()

            await launcher.onPrepare({})

            expect(launcher._redirectLogStream).not.toBeCalled()
        })

        test('should write output to file', async () => {
            await launcher.onPrepare({
                appium: {
                    logPath: './'
                },
            })

            expect(fs.createWriteStream.mock.calls[0][0]).toBe(path.join(process.cwd(), 'appium.txt'))
            expect(launcher.process.stdout.pipe).toBeCalled()
            expect(launcher.process.stderr.pipe).toBeCalled()
        })
    })

    describe('_getAppiumCommand', () => {
        test('should return path to dependency', () => {
            expect(getAppiumCommand('fs-extra')).toBe(path.join(process.cwd(), 'packages/wdio-appium-service/node_modules/fs-extra/lib/index.js'))
        })
        test('should be appium by default', () => {
            expect(() => getAppiumCommand()).toThrow("Cannot find module 'appium' from 'launcher.js'")
        })
    })

    describe('argument formatting', () => {
        test('should format arguments correctly', () => {
            const args = launcher._cliArgsFromKeyValue({
                address: '127.0.0.1',
                commandTimeout: '7200',
                showIosLog: false,
                sessionOverride: true,
                app: '/Users/frodo/My Projects/the-ring/the-ring.app'
            })

            expect(args[0]).toBe('--address')
            expect(args[1]).toBe('127.0.0.1')
            expect(args[2]).toBe('--command-timeout')
            expect(args[3]).toBe('7200')
            expect(args[4]).toBe('--session-override')
        })
        test('should not format arguments if array passed', () => {
            const argsArray = ['-p', 4723]
            const args = launcher._cliArgsFromKeyValue(argsArray)

            expect(args).toBe(argsArray)
        })
    })
})
