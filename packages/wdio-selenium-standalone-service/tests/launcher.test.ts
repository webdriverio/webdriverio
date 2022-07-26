import path from 'node:path'
import fs from 'fs-extra'
import * as SeleniumStandalone from 'selenium-standalone'
import { describe, expect, test, vi, beforeEach } from 'vitest'

import SeleniumStandaloneLauncher from '../src/launcher'

vi.mock('fs-extra', () => ({
    default: {
        createWriteStream: vi.fn(),
        ensureFile: vi.fn(),
    }
}))
vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))
vi.mock('selenium-standalone')

describe('Selenium standalone launcher', () => {
    beforeEach(() => {
        vi.mocked(SeleniumStandalone.install).mockClear()
        vi.mocked(SeleniumStandalone.start).mockClear()
    })

    describe('onPrepare', () => {
        test('should set correct config properties', async () => {
            const options = {
                logPath: './',
                args: { drivers: { chrome: {} } },
                installArgs: { drivers: { chrome: {} } },
            }
            const capabilities: any = [{ port: 1234, browserName: 'firefox' }]
            const launcher = new SeleniumStandaloneLauncher(options, capabilities, {} as any)
            launcher._redirectLogStream = vi.fn()
            await launcher.onPrepare({ watch: true } as never)

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
            const capabilities: any = {
                browserA: { port: 1234, browserName: 'safari' },
                browserB: { port: 4321, browserName: 'edge' }
            }
            const launcher = new SeleniumStandaloneLauncher(options, capabilities, {} as any)
            launcher._redirectLogStream = vi.fn()
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
            const capabilities: any = {
                browserA: {
                    port: 1234,
                    capabilities: {
                        browserName: 'chrome',
                        acceptInsecureCerts: true
                    }
                },
                browserB: { port: 4321, capabilities: { 'bstack:options': {} } }
            }
            const launcher = new SeleniumStandaloneLauncher(options, capabilities, {} as any)
            launcher._redirectLogStream = vi.fn()
            await launcher.onPrepare({ watch: true } as never)
            expect(capabilities.browserA.protocol).toBe('http')
            expect(capabilities.browserA.hostname).toBe('localhost')
            expect(capabilities.browserA.path).toBe('/wd/hub')
            expect(capabilities.browserA.port).toBe(1234)
            expect(capabilities.browserB.protocol).toBeUndefined()
            expect(capabilities.browserB.hostname).toBeUndefined()
            expect(capabilities.browserB.port).toBe(4321)
            expect(capabilities.browserB.path).toBeUndefined()
        })

        test('should not override if capabilities do not match supported set of browser', async () => {
            const options = {
                logPath: './',
                args: { drivers: { chrome: {} } },
                installArgs: { drivers: { chrome: {} } },
            }
            const capabilities: any = {
                browserA: {
                    capabilities: {
                        browserName: 'chrome',
                        acceptInsecureCerts: true
                    }
                },
                browserB: {
                    capabilities: {
                        platformName: 'Android',
                        'appium:deviceName': 'pixel2',
                        'appium:avd': 'pixel2',
                    }
                }
            }
            const launcher = new SeleniumStandaloneLauncher(options, capabilities, {} as any)
            launcher._redirectLogStream = vi.fn()
            await launcher.onPrepare({ watch: true } as never)
            expect(capabilities.browserB.protocol).toBeUndefined()
            expect(capabilities.browserB.hostname).toBeUndefined()
            expect(capabilities.browserB.port).toBeUndefined()
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
            const launcher = new SeleniumStandaloneLauncher(options, [], { outputDir: '/foo/bar' })
            launcher._redirectLogStream = vi.fn()
            await launcher.onPrepare({} as any)

            expect(vi.mocked(SeleniumStandalone.install).mock.calls[0][0]).toBe(options.installArgs)
            expect(vi.mocked(SeleniumStandalone.start).mock.calls[0][0]).toBe(options.args)
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
            const launcher = new SeleniumStandaloneLauncher(options, [], { outputDir: '/foo/bar' })
            launcher._redirectLogStream = vi.fn()
            await launcher.onPrepare({} as any)

            expect(SeleniumStandalone.install).not.toBeCalled()
            expect(vi.mocked(SeleniumStandalone.start).mock.calls[0][0]).toBe(options.args)
            expect(launcher._redirectLogStream).toBeCalled()
        })

        test('should not output the log file', async () => {
            const launcher = new SeleniumStandaloneLauncher({
                installArgs: {},
                args: {},
            }, [], {} as any)
            launcher._redirectLogStream = vi.fn()
            await launcher.onPrepare({} as any)

            expect(launcher._redirectLogStream).not.toBeCalled()
        })

        test('should add exit listeners to kill process in watch mode', async () => {
            const processOnSpy = vi.spyOn(process, 'on')

            const launcher = new SeleniumStandaloneLauncher({
                installArgs: {},
                args: {}
            }, [], {} as any)
            launcher._redirectLogStream = vi.fn()
            await launcher.onPrepare({ watch: true } as never)

            expect(processOnSpy).toHaveBeenCalledWith('SIGINT', launcher._stopProcess)
            expect(processOnSpy).toHaveBeenCalledWith('exit', launcher._stopProcess)
            expect(processOnSpy).toHaveBeenCalledWith('uncaughtException', launcher._stopProcess)
        })

        test('simplified mode - multiple browser drivers', async () => {
            const options = {
                logPath: './',
                drivers: { chrome: 'latest', firefox: '0.28.0', ie: true, chromiumedge: '87.0.637.0', edge: false },
            }
            const capabilities: any = [{ port: 1234 }]
            const launcher = new SeleniumStandaloneLauncher(options, capabilities, {} as any)

            const seleniumArgs = { drivers: { chrome: { version: 'latest' }, firefox: { version: '0.28.0' }, ie: {}, chromiumedge: { version: '87.0.637.0' } } }
            expect(launcher.args).toEqual(seleniumArgs)
            expect(launcher.installArgs).toEqual(seleniumArgs)
        })

        test('simplified mode - single browser driver', async () => {
            const options = {
                logPath: './',
                drivers: { chrome: 'latest' },
            }
            const capabilities: any = [{ port: 1234 }]
            const launcher = new SeleniumStandaloneLauncher(options, capabilities, {} as any)

            const seleniumArgs = { drivers: { chrome: { version: 'latest' } } }
            expect(launcher.args).toEqual(seleniumArgs)
            expect(launcher.installArgs).toEqual(seleniumArgs)
        })

        test('simplified mode - no drivers', async () => {
            const options = {
                logPath: './',
                drivers: {},
            }
            const capabilities: any = [{ port: 1234 }]
            const launcher = new SeleniumStandaloneLauncher(options, capabilities, {} as any)

            const seleniumArgs = {}
            expect(launcher.args).toEqual(seleniumArgs)
            expect(launcher.installArgs).toEqual(seleniumArgs)
        })
    })

    describe('onComplete', () => {
        test('should call process.kill', async () => {
            const launcher = new SeleniumStandaloneLauncher({
                installArgs: {},
                args: {},
            }, [], {} as any)
            launcher._redirectLogStream = vi.fn()
            await launcher.onPrepare({} as any)
            launcher.onComplete()

            expect(launcher.process.kill).toBeCalled()
        })

        test('should not call process.kill', () => {
            const launcher = new SeleniumStandaloneLauncher({}, [], {} as any)
            launcher.onComplete()

            expect(launcher.process).toBeFalsy()
        })

        test('should not call process.kill in watch mode', async () => {
            const launcher = new SeleniumStandaloneLauncher({
                installArgs: {},
                args: {}
            }, [], {} as any)
            launcher._redirectLogStream = vi.fn()
            await launcher.onPrepare({ watch: true } as never)
            launcher.onComplete()

            expect(launcher.process.kill).not.toBeCalled()
        })
    })

    describe('_redirectLogStream', () => {
        test('should write output to file', async () => {
            const launcher = new SeleniumStandaloneLauncher({
                installArgs: {},
                args: {},
            }, [], { outputDir: './' } as any)
            await launcher.onPrepare({} as any)

            expect(vi.mocked(fs.createWriteStream).mock.calls[0][0])
                .toBe(path.join(process.cwd(), 'wdio-selenium-standalone.log'))
            expect(launcher.process.stdout?.pipe).toBeCalled()
            expect(launcher.process.stderr?.pipe).toBeCalled()
        })
    })
})
