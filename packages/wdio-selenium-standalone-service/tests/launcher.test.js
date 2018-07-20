import path from 'path'
import fs from 'fs-extra'
import Selenium from 'selenium-standalone'
import SeleniumStandaloneLauncher from '../src/launcher'

jest.mock(`fs-extra`, () => ({
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
                seleniumArgs : {foo : `foo`},
                seleniumInstallArgs : {bar : `bar`}
            }

            await Launcher.onPrepare(config)

            expect(Launcher.seleniumLogs).toBe(config.seleniumLogs)
            expect(Launcher.seleniumInstallArgs).toBe(config.seleniumInstallArgs)
            expect(Launcher.seleniumArgs).toBe(config.seleniumArgs)
        })

        test('should set correct config properties when empty', async () => {
            const Launcher = new SeleniumStandaloneLauncher()
            Launcher._redirectLogStream = jest.fn()

            await Launcher.onPrepare({})

            expect(Launcher.seleniumInstallArgs).toEqual({})
            expect(Launcher.seleniumArgs).toEqual({})
        })

        test('should call selenium install and start', async () => {
            const Launcher = new SeleniumStandaloneLauncher()
            Launcher._redirectLogStream = jest.fn()

            const config = {
                seleniumLogs : './',
                seleniumInstallArgs : {
                    version : "3.9.1",
                    baseURL : "https://selenium-release.storage.googleapis.com",
                    drivers : {
                        chrome : {
                            version : "2.38",
                            arch : process.arch,
                            baseURL : "https://chromedriver.storage.googleapis.com",
                        }
                    }
                },
                seleniumArgs: {
                    version : "3.9.1",
                    drivers : {
                        chrome : {
                            version : "2.38",
                        }
                    }
                }
            }

            await Launcher.onPrepare(config)

            expect(Selenium.install.mock.calls[0][0]).toBe(config.seleniumInstallArgs)
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