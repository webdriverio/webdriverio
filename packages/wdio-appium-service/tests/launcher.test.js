import { AppiumLauncher } from '../src/launcher'
const http = require('http')

describe('Appium launcher', () => {
    let launcher = undefined

    beforeEach(() => {
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
                    args: { foo: 'bar' }
                }
            }

            await launcher.onPrepare(config)

            expect(launcher.logPath).toBe(config.appium.logPath)
            expect(launcher.appiumArgs).toEqual(['--foo', 'bar'])
        })

        test('should set correct config properties when empty', async () => {
            await launcher.onPrepare({})

            expect(launcher.logPath).toBe(undefined)
            expect(launcher.appiumArgs).toEqual([])
        })

        test('should start Appium', async done => {
            await launcher.onPrepare({})

            http.get('http://127.0.0.1:4723/wd/hub/status', (response) => {
                expect(response.statusCode).toBe(200)
                launcher.onComplete()
                done()
            }).on('error', (error) => {
                launcher.onComplete()
                done.fail(`Appium service isn't started. Error: '${error.message}'`)
            })
        })

        test('should not output the log file', async () => {
            launcher._redirectLogStream = jest.fn()

            await launcher.onPrepare({})

            expect(launcher._redirectLogStream).not.toBeCalled()
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

    describe('argument formatting', () => {
        test('should format arguments correctly', () => {
            const args = AppiumLauncher._cliArgsFromKeyValue({
                address: '127.0.0.1',
                commandTimeout: '7200',
                showIosLog: false,
                sessionOverride: true
            })

            expect(args[0]).toBe('--address')
            expect(args[1]).toBe('127.0.0.1')
            expect(args[2]).toBe('--command-timeout')
            expect(args[3]).toBe('7200')
            expect(args[4]).toBe('--session-override')
        })
    })

    describe('platform specific command', () => {
        let originalPlatform = ''

        test('should return shell on macOS', () => {
            originalPlatform = process.platform
            Object.defineProperty(process, 'platform', {
                value: 'darwin'
            })
            expect(AppiumLauncher._getAppiumCommand()).toBe('appium')
        })

        test('should return cmd on Windows', () => {
            originalPlatform = process.platform
            Object.defineProperty(process, 'platform', {
                value: 'win32'
            })
            expect(AppiumLauncher._getAppiumCommand()).toBe('appium.cmd')
        })

        afterEach(() => {
            Object.defineProperty(process, 'platform', {
                value: originalPlatform
            })
        })
    })
})
