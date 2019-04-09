import { AppiumLauncher } from '../src/launcher'
import childProcess from 'child_process'
import fs from 'fs-extra'
import path from 'path'

jest.mock('child_process', () => ({
    spawn: jest.fn(),
}))
jest.mock('fs-extra', () => ({
    createWriteStream : jest.fn(),
    ensureFileSync : jest.fn(),
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
        this._eventHandler.trigger('data', '[Appium] Appium REST http interface listener started on 0.0.0.0:4723')
    }
    removeListener() {}
    kill() {}
    stdout = { pipe: jest.fn(), on: this._eventHandler.delegate.bind(this._eventHandler) }
    stderr = { pipe: jest.fn() }
}

class MockFailingProcess extends MockProcess {
    once(event, callback) {
        if (event === 'exit') {
            callback(2)
        }
    }
}

describe('Appium launcher', () => {
    let launcher = undefined

    beforeEach(() => {
        childProcess.spawn.mockClear()
        childProcess.spawn.mockReturnValue(new MockProcess())
        launcher = new AppiumLauncher()
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
            expect(launcher.command).toBe(path.join(process.cwd(), 'packages/wdio-appium-service/node_modules/appium/build/lib/main.js'))
            expect(launcher.appiumArgs).toEqual([])
        })

        test('should start Appium', async () => {
            await launcher.onPrepare({
                appium: {
                    args: { superspeed: true }
                }
            })

            expect(childProcess.spawn.mock.calls[0][0]).toBe(path.join(process.cwd(), 'packages/wdio-appium-service/node_modules/appium/build/lib/main.js'))
            expect(childProcess.spawn.mock.calls[0][1]).toEqual(['--superspeed'])
            expect(childProcess.spawn.mock.calls[0][2]).toEqual({ stdio: ['ignore', 'pipe', 'pipe'] })
        })

        test('should fail if Appium exits', async () => {
            childProcess.spawn.mockReturnValue(new MockFailingProcess())

            let error
            try {
                await launcher.onPrepare({})
            } catch (e) {
                error = e
            }
            const expectedError = new Error('Appium exited before timeout (exit code: 2)')
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
            expect(launcher._getAppiumCommand()).toBe(path.join(process.cwd(), 'packages/wdio-appium-service/node_modules/appium/build/lib/main.js'))
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
    })
})
