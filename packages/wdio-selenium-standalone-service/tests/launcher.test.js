import path from 'path'
import fs from 'fs-extra'
import Selenium from 'selenium-standalone'
import SeleniumStandaloneLauncher from '../src/launcher'

jest.mock('fs-extra', () => ({
    createWriteStream : jest.fn(),
    ensureFileSync : jest.fn(),
}))

describe('Selenium standalone launcher', () => {
    beforeEach(() => {
        Selenium.install.mockClear()
        Selenium.start.mockClear()
    })

    describe('onPrepare', () => {
        test('should set correct config properties', async () => {
            const Launcher = new SeleniumStandaloneLauncher()
            Launcher._redirectLogStream = jest.fn()

            const config = {
                seleniumLogs : './',
                seleniumArgs : { foo : 'foo' },
                seleniumInstallArgs : { bar : 'bar' },
                watch: true
            }

            await Launcher.onPrepare(config)

            expect(Launcher.seleniumLogs).toBe(config.seleniumLogs)
            expect(Launcher.seleniumInstallArgs).toBe(config.seleniumInstallArgs)
            expect(Launcher.seleniumArgs).toBe(config.seleniumArgs)
            expect(Launcher.skipSeleniumInstall).toBe(false)
            expect(Launcher.watchMode).toEqual(true)
        })

        test('should set correct config properties when empty', async () => {
            const Launcher = new SeleniumStandaloneLauncher()
            Launcher._redirectLogStream = jest.fn()

            await Launcher.onPrepare({})

            expect(Launcher.seleniumInstallArgs).toEqual({})
            expect(Launcher.seleniumArgs).toEqual({})
            expect(Launcher.skipSeleniumInstall).toEqual(false)
            expect(Launcher.watchMode).toEqual(false)
        })

        test('should call selenium install and start', async () => {
            const Launcher = new SeleniumStandaloneLauncher()
            Launcher._redirectLogStream = jest.fn()

            const config = {
                seleniumLogs : './',
                seleniumInstallArgs : {
                    version : '3.9.1',
                    baseURL : 'https://selenium-release.storage.googleapis.com',
                    drivers : {
                        chrome : {
                            version : '2.38',
                            arch : process.arch,
                            baseURL : 'https://chromedriver.storage.googleapis.com',
                        }
                    }
                },
                seleniumArgs: {
                    version : '3.9.1',
                    drivers : {
                        chrome : {
                            version : '2.38',
                        }
                    }
                }
            }

            await Launcher.onPrepare(config)

            expect(Selenium.install.mock.calls[0][0]).toBe(config.seleniumInstallArgs)
            expect(Selenium.start.mock.calls[0][0]).toBe(config.seleniumArgs)
            expect(Launcher._redirectLogStream).toBeCalled()
        })

        test('should skip selenium install', async () => {
            const Launcher = new SeleniumStandaloneLauncher()
            Launcher._redirectLogStream = jest.fn()

            const config = {
                seleniumLogs : './',
                seleniumArgs: {
                    version : '3.9.1',
                    drivers : {
                        chrome : {
                            version : '2.38',
                        }
                    }
                },
                skipSeleniumInstall: true
            }

            await Launcher.onPrepare(config)

            expect(Selenium.install).not.toBeCalled()
            expect(Selenium.start.mock.calls[0][0]).toBe(config.seleniumArgs)
            expect(Launcher._redirectLogStream).toBeCalled()
        })

        test('should not output the log file', async () => {
            const Launcher = new SeleniumStandaloneLauncher()
            Launcher._redirectLogStream = jest.fn()

            await Launcher.onPrepare({
                seleniumInstallArgs : {},
                seleniumArgs : {},
            })

            expect(Launcher._redirectLogStream).not.toBeCalled()
        })

        test('should add exit listeners to kill process in watch mode', async () => {
            const processOnSpy = jest.spyOn(process, 'on')

            const Launcher = new SeleniumStandaloneLauncher()
            Launcher._redirectLogStream = jest.fn()

            await Launcher.onPrepare({
                seleniumInstallArgs : {},
                seleniumArgs : {},
                watch: true
            })

            expect(processOnSpy).toHaveBeenCalledWith('SIGINT', Launcher._stopProcess)
            expect(processOnSpy).toHaveBeenCalledWith('exit', Launcher._stopProcess)
            expect(processOnSpy).toHaveBeenCalledWith('uncaughtException', Launcher._stopProcess)
        })
    })

    describe('onComplete', () => {
        test('should call process.kill', async () => {
            const Launcher = new SeleniumStandaloneLauncher()
            Launcher._redirectLogStream = jest.fn()

            await Launcher.onPrepare({
                seleniumInstallArgs : {},
                seleniumArgs : {},
            })

            Launcher.onComplete()

            expect(Launcher.process.kill).toBeCalled()
        })

        test('should not call process.kill', () => {
            const Launcher = new SeleniumStandaloneLauncher()
            Launcher.onComplete()

            expect(Launcher.process).toBeFalsy()
        })

        test('should not call process.kill in watch mode', async () => {
            const Launcher = new SeleniumStandaloneLauncher()
            Launcher._redirectLogStream = jest.fn()

            await Launcher.onPrepare({
                seleniumInstallArgs : {},
                seleniumArgs : {},
                watch: true
            })

            Launcher.onComplete()
            expect(Launcher.process.kill).not.toBeCalled()
        })
    })

    describe('_redirectLogStream', () => {
        test('should write output to file', async () => {
            const Launcher = new SeleniumStandaloneLauncher()

            await Launcher.onPrepare({
                seleniumLogs : './',
                seleniumInstallArgs : {},
                seleniumArgs : {},
            })

            expect(fs.createWriteStream.mock.calls[0][0]).toBe(path.join(process.cwd(), 'selenium-standalone.txt'))
            expect(Launcher.process.stdout.pipe).toBeCalled()
            expect(Launcher.process.stderr.pipe).toBeCalled()
        })
    })
})
