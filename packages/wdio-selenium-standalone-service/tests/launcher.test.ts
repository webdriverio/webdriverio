import path from 'path'
import fs from 'fs-extra'
import Selenium from 'selenium-standalone'
import SeleniumStandaloneLauncher from '../src/launcher'
jest.unmock('@wdio/config')
jest.mock('fs-extra', () => ({
    createWriteStream: jest.fn(),
    ensureFileSync: jest.fn(),
}))

describe('Selenium standalone launcher', () => {
    beforeEach(() => {
        (Selenium.install as jest.Mock).mockClear();
        (Selenium.start as jest.Mock).mockClear()
    })

    describe('onPrepare', () => {
        test('should set correct config properties', async () => {
            const options = {
                logPath: './',
                args: { drivers: { chrome: {} } },
                installArgs: { drivers: { chrome: {} } },
            }
            const capabilities: WebDriver.Capabilities[] & WebDriver.Options[] = [{ port: 1234 }]
            const launcher = new SeleniumStandaloneLauncher(options, capabilities, {})
            launcher._redirectLogStream = jest.fn()
            await launcher.onPrepare({ watch: true } as never)

            expect(launcher.logPath).toBe(options.logPath)
            expect(launcher.installArgs).toBe(options.installArgs)
            expect(launcher.args).toBe(options.args)
            expect(launcher.skipSeleniumInstall).toBe(false)
            expect(launcher.watchMode).toEqual(true)
            expect(capabilities[0].protocol).toBe('http')
            expect(capabilities[0].hostname).toBe('localhost')
            expect(capabilities[0].port).toBe(1234)
            expect(capabilities[0].path).toBe('/wd/hub')
        })

        test('should set correct config properties using multiremote', async () => {
            const options = {
                logPath: './',
                args: { drivers: { chrome: {} } },
                installArgs: { drivers: { chrome: {} } },
            }
            const capabilities: Record<string, WebDriver.Capabilities & WebDriver.Options> = {
                browserA: { port: 1234 },
                browserB: { port: 4321 }
            }
            const launcher = new SeleniumStandaloneLauncher(options, capabilities, {})
            launcher._redirectLogStream = jest.fn()
            await launcher.onPrepare({ watch: true } as never)
            expect(capabilities.browserA.protocol).toBe('http')
            expect(capabilities.browserA.hostname).toBe('localhost')
            expect(capabilities.browserA.port).toBe(1234)
            expect(capabilities.browserA.path).toBe('/wd/hub')
            expect(capabilities.browserB.protocol).toBe('http')
            expect(capabilities.browserB.hostname).toBe('localhost')
            expect(capabilities.browserB.port).toBe(4321)
            expect(capabilities.browserB.path).toBe('/wd/hub')
        })

        test('should not override cloud config using multiremote', async () => {
            const options = {
                logPath: './',
                args: { drivers: { chrome: {} } },
                installArgs: { drivers: { chrome: {} } },
            }
            const capabilities: Record<string, WebDriver.Capabilities & WebDriver.Options> = {
                browserA: { port: 1234 },
                browserB: { port: 4321, capabilities: { 'bstack:options': {} } }
            }
            const launcher = new SeleniumStandaloneLauncher(options, capabilities, {})
            launcher._redirectLogStream = jest.fn()
            await launcher.onPrepare({ watch: true } as never)
            expect(capabilities.browserA.protocol).toBe('http')
            expect(capabilities.browserA.hostname).toBe('localhost')
            expect(capabilities.browserA.port).toBe(1234)
            expect(capabilities.browserA.path).toBe('/wd/hub')
            expect(capabilities.browserB.protocol).toBeUndefined()
            expect(capabilities.browserB.hostname).toBeUndefined()
            expect(capabilities.browserB.port).toBe(4321)
            expect(capabilities.browserB.path).toBeUndefined()
        })

        test('should call selenium install and start', async () => {
            const options = {
                logPath: './',
                installArgs: {
                    version: '3.9.1',
                    baseURL: 'https://selenium-release.storage.googleapis.com',
                    drivers: {
                        chrome: {
                            version: '2.38',
                            arch: process.arch,
                            baseURL: 'https://chromedriver.storage.googleapis.com',
                        }
                    }
                },
                args: {
                    version: '3.9.1',
                    drivers: {
                        chrome: {
                            version: '2.38',
                        }
                    }
                }
            }
            const launcher = new SeleniumStandaloneLauncher(options, [], {})
            launcher._redirectLogStream = jest.fn()
            await launcher.onPrepare({})

            expect((Selenium.install as jest.Mock).mock.calls[0][0]).toBe(options.installArgs)
            expect((Selenium.start as jest.Mock).mock.calls[0][0]).toBe(options.args)
            expect(launcher._redirectLogStream).toBeCalled()
        })

        test('should skip selenium install', async () => {
            const options = {
                logPath: './',
                args: {
                    version: '3.9.1',
                    drivers: {
                        chrome: {
                            version: '2.38',
                        }
                    }
                },
                skipSeleniumInstall: true
            }
            const launcher = new SeleniumStandaloneLauncher(options, [], {})
            launcher._redirectLogStream = jest.fn()
            await launcher.onPrepare({})

            expect(Selenium.install).not.toBeCalled()
            expect((Selenium.start as jest.Mock).mock.calls[0][0]).toBe(options.args)
            expect(launcher._redirectLogStream).toBeCalled()
        })

        test('should not output the log file', async () => {
            const launcher = new SeleniumStandaloneLauncher({
                installArgs: {},
                args: {},
            }, [], {})
            launcher._redirectLogStream = jest.fn()
            await launcher.onPrepare({})

            expect(launcher._redirectLogStream).not.toBeCalled()
        })

        test('should add exit listeners to kill process in watch mode', async () => {
            const processOnSpy = jest.spyOn(process, 'on')

            const launcher = new SeleniumStandaloneLauncher({
                installArgs: {},
                args: {}
            }, [], {})
            launcher._redirectLogStream = jest.fn()
            await launcher.onPrepare({ watch: true } as never)

            expect(processOnSpy).toHaveBeenCalledWith('SIGINT', launcher._stopProcess)
            expect(processOnSpy).toHaveBeenCalledWith('exit', launcher._stopProcess)
            expect(processOnSpy).toHaveBeenCalledWith('uncaughtException', launcher._stopProcess)
        })
    })

    describe('onComplete', () => {
        test('should call process.kill', async () => {
            const launcher = new SeleniumStandaloneLauncher({
                installArgs: {},
                args: {},
            }, [], {})
            launcher._redirectLogStream = jest.fn()
            await launcher.onPrepare({})
            launcher.onComplete()

            expect(launcher.process.kill).toBeCalled()
        })

        test('should not call process.kill', () => {
            const launcher = new SeleniumStandaloneLauncher({}, [], {})
            launcher.onComplete()

            expect(launcher.process).toBeFalsy()
        })

        test('should not call process.kill in watch mode', async () => {
            const launcher = new SeleniumStandaloneLauncher({
                installArgs: {},
                args: {}
            }, [], {})
            launcher._redirectLogStream = jest.fn()
            await launcher.onPrepare({ watch: true } as never)
            launcher.onComplete()

            expect(launcher.process.kill).not.toBeCalled()
        })
    })

    describe('_redirectLogStream', () => {
        test('should write output to file', async () => {
            const launcher = new SeleniumStandaloneLauncher({
                logPath: './',
                installArgs: {},
                args: {},
            }, [], {})
            await launcher.onPrepare({})

            expect((fs.createWriteStream as jest.Mock).mock.calls[0][0])
                .toBe(path.join(process.cwd(), 'wdio-selenium-standalone.log'))
            expect(launcher.process.stdout.pipe).toBeCalled()
            expect(launcher.process.stderr.pipe).toBeCalled()
        })
    })
})
