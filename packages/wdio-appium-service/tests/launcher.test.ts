import fs from 'node:fs'
import os from 'node:os'
import url from 'node:url'
import path from 'node:path'
import treeKill from 'tree-kill'
import { spawn, type ChildProcessByStdio } from 'node:child_process'
import type cp from 'node:child_process'
import getPort from 'get-port'
import { Readable, type Writable } from 'node:stream'

import { describe, expect, beforeEach, afterEach, test, vi } from 'vitest'
import { resolve } from 'import-meta-resolve'
import type { Capabilities } from '@wdio/types'
import logger from '@wdio/logger'

import AppiumLauncher from '../src/launcher.js'

const log = logger('@wdio/appium-service')

vi.mock('node:fs', () => ({
    default: {
        createWriteStream: vi.fn()
    }
}))

vi.mock('node:os', () => ({
    default: {
        platform: vi.fn().mockReturnValue('Darwin'),
        tmpdir: vi.fn().mockReturnValue('/tmp')
    }
}))

vi.mock('node:fs/promises', () => ({
    default: {
        mkdir: vi.fn(),
        access: vi.fn().mockResolvedValue(true),
    }
}))

vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))
vi.mock('child_process', () => ({
    spawn: vi.fn(),
    exec: vi.fn()
}))
vi.mock('import-meta-resolve', () => ({
    resolve: vi.fn().mockResolvedValue(
        url.pathToFileURL(path.resolve(process.cwd(), '/', 'foo', 'bar', 'appium')))
}))

vi.mock('get-port', () => ({
    default: vi.fn().mockResolvedValue(4723)
}))

vi.mock('tree-kill', () => ({
    default: vi.fn()
}))

class MockProcess implements Partial<ChildProcessByStdio<null, Readable, Readable>> {
    removeListener = vi.fn()
    kill = vi.fn()
    stdout = {
        pipe: vi.fn(),
        on: vi.fn((event: string, callback: Function) => {
            callback('[Appium] Welcome to Appium v1.11.1')
            callback('[Appium] Appium REST http interface listener started on 127.0.0.1:4723')
        }),
        off: vi.fn(),
    } as unknown as Readable
    stderr = {
        pipe: vi.fn(),
        once: vi.fn(),
        on: vi.fn(),
        off: vi.fn()
    } as unknown as Readable
}

class MockFailingProcess extends MockProcess {
    exitCode: number
    constructor(exitCode = 2) {
        super()
        this.exitCode = exitCode
    }

    once = vi.fn((event: string, callback: Function) => {
        if (event === 'exit') {
            callback(this.exitCode)
        }
    })
    stdout = {
        pipe: vi.fn(),
        on: vi.fn(),
        off: vi.fn()
    } as unknown as Readable
}

// MockProcess2 class. Mocks the entire _process object so we can set specific values on it, such as pid
class MockProcess2 implements Partial<ChildProcessByStdio<null, Readable, Readable>> {
    pid: number
    exitCode: number | null = null
    signalCode?: null
    spawnargs: string[] = []
    spawnfile: string = ''
    stdin: null = null
    stdout: Readable = new Readable({
        read() {
            this.push(null)
        }
    })
    stderr: Readable = new Readable({
        read() {
            this.push(null)
        }
    })
    stdio: [null, Readable, Readable, Readable | Writable | null | undefined, Readable | Writable | null | undefined] = [null, this.stdout, this.stderr, null, null]
    killed = false
    connected = true
    kill = vi.fn()
    send = vi.fn()
    disconnect = vi.fn()
    unref = vi.fn()
    ref = vi.fn()
    addListener = vi.fn()
    emit = vi.fn()
    on = vi.fn()
    once = vi.fn()
    prependListener = vi.fn()
    prependOnceListener = vi.fn()
    removeAllListeners = vi.fn()
    removeListener = vi.fn()

    constructor(pid: number) {
        this.pid = pid
    }
}

class MockCustomFailingProcess extends MockFailingProcess {
    stderr = {
        pipe: vi.fn(),
        on: vi.fn().mockImplementation((event, cb) => cb(new Error('Uups'))),
        off: vi.fn()
    } as unknown as Readable
}

vi.mock('../src/utils', async () => {
    const { formatCliArgs } = await vi.importActual('../src/utils.js') as any
    return {
        getFilePath: vi.fn().mockReturnValue('/some/file/path'),
        formatCliArgs
    }
})

describe('Appium launcher', () => {
    const consoleSpy = vi.spyOn(global.console, 'error')

    beforeEach(() => {
        vi.mocked(spawn).mockClear()
        vi.mocked(spawn).mockReturnValue(new MockProcess() as unknown as cp.ChildProcess)
    })

    describe('onPrepare', () => {
        test('mac: should set correct config properties', async () => {
            const options = {
                logPath: './',
                command: 'path/to/my_custom_appium',
                args: { address: 'bar', defaultCapabilities: { 'foo': 'bar' } },
            }
            const capabilities = [{ port: 1234, 'appium:deviceName': 'baz' }] as WebdriverIO.Capabilities[]
            const launcher = new AppiumLauncher(options, capabilities, {} as any)
            await launcher.onPrepare()

            expect(launcher['_process']).toBeInstanceOf(MockProcess)
            expect(launcher['_logPath']).toBe('./')
            expect(spawn).toBeCalledWith(
                'path/to/my_custom_appium',
                [
                    '--base-path',
                    '/',
                    '--address',
                    'bar',
                    '--default-capabilities',
                    '{"foo":"bar"}',
                    '--port',
                    '4723'
                ],
                expect.any(Object)
            )

            expect(capabilities[0].protocol).toBe('http')
            expect(capabilities[0].hostname).toBe('127.0.0.1')
            expect(capabilities[0].port).toBe(1234)
            expect(capabilities[0].path).toBe('/')
        })

        test('windows: should set correct config properties', async () => {
            vi.mocked(os.platform).mockReturnValueOnce('win32')
            const options = {
                logPath: './',
                command: 'path/to/my_custom_appium',
                args: { address: 'bar', defaultCapabilities: { 'foo': 'bar' } },
            }
            const capabilities = [{ port: 1234, 'appium:deviceName': 'baz' }] as WebdriverIO.Capabilities[]
            const launcher = new AppiumLauncher(options, capabilities, {} as any)
            await launcher.onPrepare()

            expect(launcher['_process']).toBeInstanceOf(MockProcess)
            expect(launcher['_logPath']).toBe('./')
            expect(spawn).toBeCalledWith(
                'cmd',
                [
                    '/c',
                    'path/to/my_custom_appium',
                    '--base-path',
                    '/',
                    '--address',
                    'bar',
                    '--default-capabilities',
                    '{"foo":"bar"}',
                    '--port',
                    '4723'
                ],
                expect.any(Object)
            )

            expect(capabilities[0].protocol).toBe('http')
            expect(capabilities[0].hostname).toBe('127.0.0.1')
            expect(capabilities[0].port).toBe(1234)
            expect(capabilities[0].path).toBe('/')
        })

        test('should set correct config properties using multiremote', async () => {
            const options = {
                logPath: './',
                command: 'path/to/my_custom_appium',
                args: { address: 'bar' }
            }
            const capabilities: Capabilities.RequestedMultiremoteCapabilities = {
                browserA: { port: 1234, capabilities: { 'appium:deviceName': 'baz' } },
                browserB: { capabilities: { 'appium:deviceName': 'baz' } }
            }
            const launcher = new AppiumLauncher(options, capabilities, {} as any)
            await launcher.onPrepare()
            expect(capabilities.browserA.protocol).toBe('http')
            expect(capabilities.browserA.hostname).toBe('127.0.0.1')
            expect(capabilities.browserA.port).toBe(1234)
            expect(capabilities.browserA.path).toBe('/')
            expect(capabilities.browserB.protocol).toBe('http')
            expect(capabilities.browserB.hostname).toBe('127.0.0.1')
            expect(capabilities.browserB.port).toBe(4723)
            expect(capabilities.browserB.path).toBe('/')
        })

        test('should set correct config properties of mixed browser and device using multiremote', async () => {
            const options = {
                logPath: './',
                command: 'path/to/my_custom_appium',
                args: { address: 'bar' }
            }
            const capabilities: Capabilities.RequestedMultiremoteCapabilities = {
                browserA: { port: 1234, capabilities: { browserName: 'chrome' } },
                browserB: { capabilities: { 'appium:deviceName': 'baz' } }
            }
            const launcher = new AppiumLauncher(options, capabilities, {} as any)
            await launcher.onPrepare()
            expect(capabilities.browserA.protocol).toBeUndefined()
            expect(capabilities.browserA.hostname).toBeUndefined()
            expect(capabilities.browserA.port).toBe(1234)
            expect(capabilities.browserA.path).toBeUndefined()
            expect(capabilities.browserB.protocol).toBe('http')
            expect(capabilities.browserB.hostname).toBe('127.0.0.1')
            expect(capabilities.browserB.port).toBe(4723)
            expect(capabilities.browserB.path).toBe('/')
        })

        test('should set correct config properties using parallel multiremote', async () => {
            const options = {
                logPath: './',
                command: 'path/to/my_custom_appium',
                args: { address: 'bar' }
            }
            const capabilities: Capabilities.RequestedMultiremoteCapabilities[] = [{
                browserA: { port: 1234, capabilities: { 'appium:deviceName': 'baz' } },
                browserB: { capabilities: { 'appium:deviceName': 'baz' } }
            }, {
                browserC: { port: 5678, capabilities: { 'appium:deviceName': 'baz' } },
                browserD: { capabilities: { 'appium:deviceName': 'baz' } }
            }]
            const launcher = new AppiumLauncher(options, capabilities, {} as any)
            await launcher.onPrepare()
            expect(capabilities[0].browserA.protocol).toBe('http')
            expect(capabilities[0].browserA.hostname).toBe('127.0.0.1')
            expect(capabilities[0].browserA.port).toBe(1234)
            expect(capabilities[0].browserA.path).toBe('/')
            expect(capabilities[0].browserB.protocol).toBe('http')
            expect(capabilities[0].browserB.hostname).toBe('127.0.0.1')
            expect(capabilities[0].browserB.port).toBe(4723)
            expect(capabilities[0].browserB.path).toBe('/')
            expect(capabilities[1].browserC.protocol).toBe('http')
            expect(capabilities[1].browserC.hostname).toBe('127.0.0.1')
            expect(capabilities[1].browserC.port).toBe(5678)
            expect(capabilities[1].browserC.path).toBe('/')
            expect(capabilities[1].browserD.protocol).toBe('http')
            expect(capabilities[1].browserD.hostname).toBe('127.0.0.1')
            expect(capabilities[1].browserD.port).toBe(4723)
            expect(capabilities[1].browserD.path).toBe('/')
        })

        test('should not override cloud config using multiremote', async () => {
            const options = {
                logPath: './',
                args: { address: 'foo' },
                installArgs: { bar: 'bar' },
            }
            const capabilities: Capabilities.RequestedMultiremoteCapabilities = {
                browserA: { port: 1234, capabilities: { 'appium:deviceName': 'baz' } },
                browserB: { port: 4321, capabilities: { 'bstack:options': {} } }
            }
            const launcher = new AppiumLauncher(options, capabilities, {} as any)
            launcher['_redirectLogStream'] = vi.fn()
            await launcher.onPrepare()
            expect(capabilities.browserA.protocol).toBe('http')
            expect(capabilities.browserA.hostname).toBe('127.0.0.1')
            expect(capabilities.browserA.port).toBe(1234)
            expect(capabilities.browserA.path).toBe('/')
            expect(capabilities.browserB.protocol).toBeUndefined()
            expect(capabilities.browserB.hostname).toBeUndefined()
            expect(capabilities.browserB.port).toBe(4321)
            expect(capabilities.browserB.path).toBeUndefined()
        })

        test('mac: should respect custom Appium port', async () => {
            const options = {
                logPath: './',
                command: 'path/to/my_custom_appium',
                args: { address: 'bar', port: 1234 }
            }
            const capabilities = [{ 'appium:deviceName': 'baz' }] as WebdriverIO.Capabilities[]
            const launcher = new AppiumLauncher(options, capabilities, {} as any)
            await launcher.onPrepare()

            expect(spawn).toBeCalledWith(
                'path/to/my_custom_appium',
                [
                    '--base-path',
                    '/',
                    '--address',
                    'bar',
                    '--port',
                    '1234'
                ],
                expect.any(Object)
            )

            expect(launcher['_process']).toBeInstanceOf(MockProcess)
            expect(launcher['_logPath']).toBe('./')
            expect(capabilities[0].protocol).toBe('http')
            expect(capabilities[0].hostname).toBe('127.0.0.1')
            expect(capabilities[0].port).toBe(1234)
            expect(capabilities[0].path).toBe('/')
        })

        test('win: should respect custom Appium port', async () => {
            vi.mocked(os.platform).mockReturnValueOnce('win32')
            const options = {
                logPath: './',
                command: 'path/to/my_custom_appium',
                args: { address: 'bar', port: 1234 }
            }
            const capabilities = [{ 'appium:deviceName': 'baz' }] as WebdriverIO.Capabilities[]
            const launcher = new AppiumLauncher(options, capabilities, {} as any)
            await launcher.onPrepare()

            expect(spawn).toBeCalledWith(
                'cmd',
                [
                    expect.any(String),
                    'path/to/my_custom_appium',
                    '--base-path',
                    '/',
                    '--address',
                    'bar',
                    '--port',
                    '1234'
                ],
                expect.any(Object)
            )

            expect(launcher['_process']).toBeInstanceOf(MockProcess)
            expect(launcher['_logPath']).toBe('./')
            expect(capabilities[0].protocol).toBe('http')
            expect(capabilities[0].hostname).toBe('127.0.0.1')
            expect(capabilities[0].port).toBe(1234)
            expect(capabilities[0].path).toBe('/')
        })

        test('should respect random Appium port', async () => {
            vi.mocked(getPort).mockResolvedValueOnce(567567)
            vi.mocked(os.platform).mockReturnValueOnce('darwin')

            const capabilities = [{ 'appium:deviceName': 'baz' }] as WebdriverIO.Capabilities[]
            const launcher = new AppiumLauncher({}, capabilities, {} as any)
            await launcher.onPrepare()
            expect(spawn).toBeCalledWith(
                'node',
                [
                    expect.any(String),
                    '--base-path',
                    '/',
                    '--port',
                    '567567'
                ],
                expect.any(Object)
            )

            expect(launcher['_process']).toBeInstanceOf(MockProcess)
            expect(capabilities[0].protocol).toBe('http')
            expect(capabilities[0].hostname).toBe('127.0.0.1')
            expect(capabilities[0].port).toBe(567567)
            expect(capabilities[0].path).toBe('/')
        })

        test('should respect custom port and path before Appium port and path', async () => {
            vi.mocked(os.platform).mockReturnValueOnce('darwin')
            const options = {
                logPath: './',
                command: 'path/to/my_custom_appium',
                args: { address: 'bar', port: 1234, basePath: '/foo/bar' }
            }
            const capabilities = [{ port: 4321, 'appium:deviceName': 'baz' }] as WebdriverIO.Capabilities[]
            const launcher = new AppiumLauncher(options, capabilities, {} as any)
            await launcher.onPrepare()
            expect(spawn).toBeCalledWith(
                'path/to/my_custom_appium',
                [
                    '--base-path',
                    '/foo/bar',
                    '--address',
                    'bar',
                    '--port',
                    '1234'
                ],
                expect.any(Object)
            )
            expect(launcher['_process']).toBeInstanceOf(MockProcess)
            expect(launcher['_logPath']).toBe('./')
            expect(capabilities[0].protocol).toBe('http')
            expect(capabilities[0].hostname).toBe('127.0.0.1')
            expect(capabilities[0].port).toBe(4321)
            expect(capabilities[0].path).toBe('/foo/bar')
        })

        test('should set correct config properties for Windows', async () => {
            vi.mocked(os.platform).mockReturnValueOnce('win32')
            const launcher = new AppiumLauncher({
                logPath: './',
                command: 'path/to/my_custom_appium',
                args: { address: 'bar' }
            }, [{
                'appium:automationName': '123'
            }], {} as any)
            await launcher.onPrepare()

            expect(spawn).toBeCalledWith(
                'cmd',
                [
                    '/c',
                    'path/to/my_custom_appium',
                    '--base-path',
                    '/',
                    '--address',
                    'bar',
                    '--port',
                    '4723'
                ],
                expect.any(Object)
            )
            expect(launcher['_appiumCliArgs']).toMatchSnapshot()
        })

        test('should set correct config properties for mac', async () => {
            vi.mocked(os.platform).mockReturnValue('win32')
            const launcher = new AppiumLauncher({
                logPath: './',
                command: 'path/to/my_custom_appium',
                args: { address: 'bar' }
            }, [{
                'appium:automationName': '123'
            }], {} as any)
            await launcher.onPrepare()
            expect(launcher['_appiumCliArgs']).toMatchSnapshot()
        })

        test('should set correct config properties for linux', async () => {
            vi.mocked(os.platform).mockReturnValue('linux')

            const launcher = new AppiumLauncher({
                logPath: './',
                args: { address: 'bar' }
            }, [{
                'appium:automationName': '123'
            }], {} as any)
            await launcher.onPrepare()
            expect(spawn).toBeCalledWith(
                'node',
                [
                    expect.any(String),
                    '--base-path',
                    '/',
                    '--address',
                    'bar',
                    '--port',
                    '4723'
                ],
                expect.any(Object)
            )
            expect(launcher['_appiumCliArgs'].slice(1)).toMatchSnapshot()
        })

        test('should set correct config properties when empty', async () => {
            vi.mocked(os.platform).mockReturnValue('linux')
            const launcher = new AppiumLauncher({}, [{
                'appium:automationName': '123'
            }], {} as any)
            await launcher.onPrepare()

            expect(launcher['_logPath']).toBe(undefined)
            expect(spawn).toBeCalledWith(
                'node',
                [
                    expect.any(String),
                    '--base-path',
                    '/',
                    '--port',
                    '4723'
                ],
                expect.any(Object)
            )
        })

        test('should start Appium', async () => {
            const launcher = new AppiumLauncher({ args: { localTimezone: true } }, [], {} as any)
            await launcher.onPrepare()
        })

        test('should fail if Appium exits', async () => {
            const launcher = new AppiumLauncher({}, [{
                'appium:automationName': '123'
            }], {} as any)
            vi.mocked(spawn).mockReturnValue(new MockFailingProcess(1) as unknown as cp.ChildProcess)

            const error = await launcher.onPrepare().catch((err) => err)
            const expectedError = new Error('Appium exited before timeout (exit code: 1)')
            expect(error).toEqual(expectedError)
        })

        test('should fail and error message if Appium already runs', async () => {
            const launcher = new AppiumLauncher({}, [{
                'appium:automationName': '123'
            }], {} as any)
            vi.mocked(spawn).mockReturnValue(new MockFailingProcess(2) as unknown as cp.ChildProcess)

            const error = await launcher.onPrepare().catch((err) => err)
            const expectedError = new Error('Appium exited before timeout (exit code: 2)\n' +
                "Check that you don't already have a running Appium service.")
            expect(error).toEqual(expectedError)
        })

        test('should fail with Appium error message', async () => {
            const launcher = new AppiumLauncher({}, [{
                'appium:automationName': '123'
            }], {} as any)
            vi.mocked(spawn).mockReturnValue(new MockCustomFailingProcess(2) as unknown as cp.ChildProcess)

            const error = await launcher.onPrepare().catch((err) => err)
            const expectedError = new Error('Error: Uups')
            expect(error).toEqual(expectedError)
        })

        test('should result in an error when args is not of object type', async () => {
            const options = {
                args: []
            }
            // @ts-ignore test invalid param type!
            const launcher = new AppiumLauncher(options, [], {} as any)
            const expectedError = new Error('Args should be an object')
            await expect(launcher.onPrepare()).rejects.toEqual(expectedError)
        })

        test('should not set host, port and path for non Appium capabilities', async () => {
            const options = {
                logPath: './',
                command: 'path/to/my_custom_appium',
                args: { address: 'bar', port: 1234, basePath: '/foo/bar' }
            }
            const capabilities = [{ browserName: 'baz' }] as WebdriverIO.Capabilities[]
            const launcher = new AppiumLauncher(options, capabilities, {} as any)
            launcher['_startAppium'] = vi.fn().mockResolvedValue(new MockProcess())
            await launcher.onPrepare()

            expect(capabilities[0].protocol).toBeUndefined()
            expect(capabilities[0].hostname).toBeUndefined()
            expect(capabilities[0].port).toBeUndefined()
            expect(capabilities[0].path).toBeUndefined()
        })

        test('should not start Appium process if no capability was changed', async () => {
            const options = {
                logPath: './',
                command: 'path/to/my_custom_appium',
                args: { address: 'bar', port: 1234, basePath: '/foo/bar' }
            }
            const capabilities = [{ browserName: 'baz' }] as WebdriverIO.Capabilities[]
            const launcher = new AppiumLauncher(options, capabilities, {} as any)
            launcher['_startAppium'] = vi.fn().mockResolvedValue(new MockProcess())
            await launcher.onPrepare()
            expect(launcher['_process']).toEqual(undefined)
        })

        test('should not set host, port and path for non Appium capabilities using multiremote', async () => {
            const options = {
                logPath: './',
                command: 'path/to/my_custom_appium',
                args: { address: 'bar' }
            }
            const capabilities: Capabilities.RequestedMultiremoteCapabilities = {
                browserA: { capabilities: { browserName: 'baz' } },
                browserB: { capabilities: { 'appium:deviceName': 'baz' } }
            }
            const launcher = new AppiumLauncher(options, capabilities, {} as any)
            await launcher.onPrepare()
            expect(capabilities.browserA.protocol).toBeUndefined()
            expect(capabilities.browserA.hostname).toBeUndefined()
            expect(capabilities.browserA.port).toBeUndefined()
            expect(capabilities.browserA.path).toBeUndefined()
            expect(capabilities.browserB.protocol).toBe('http')
            expect(capabilities.browserB.hostname).toBe('127.0.0.1')
            expect(capabilities.browserB.port).toBe(4723)
            expect(capabilities.browserB.path).toBe('/')
        })

        test('should not set host, port and path for non Appium capabilities using parallel multiremote', async () => {
            const options = {
                logPath: './',
                command: 'path/to/my_custom_appium',
                args: { address: 'bar' }
            }
            const capabilities: Capabilities.RequestedMultiremoteCapabilities[] = [{
                browserA: { port: 1234, capabilities: { 'appium:deviceName': 'baz' } },
                browserB: { capabilities: { browserName: 'baz' } }
            }, {
                browserC: { port: 5678, capabilities: { browserName: 'baz' } },
                browserD: { capabilities: { 'appium:deviceName': 'baz' } }
            }]
            const launcher = new AppiumLauncher(options, capabilities, {} as any)
            await launcher.onPrepare()
            expect(capabilities[0].browserA.protocol).toBe('http')
            expect(capabilities[0].browserA.hostname).toBe('127.0.0.1')
            expect(capabilities[0].browserA.port).toBe(1234)
            expect(capabilities[0].browserA.path).toBe('/')
            expect(capabilities[0].browserB.protocol).toBeUndefined()
            expect(capabilities[0].browserB.hostname).toBeUndefined()
            expect(capabilities[0].browserB.port).toBeUndefined()
            expect(capabilities[0].browserB.path).toBeUndefined()
            expect(capabilities[1].browserC.protocol).toBeUndefined()
            expect(capabilities[1].browserC.hostname).toBeUndefined()
            expect(capabilities[1].browserC.port).toBe(5678)
            expect(capabilities[1].browserC.path).toBeUndefined()
            expect(capabilities[1].browserD.protocol).toBe('http')
            expect(capabilities[1].browserD.hostname).toBe('127.0.0.1')
            expect(capabilities[1].browserD.port).toBe(4723)
            expect(capabilities[1].browserD.path).toBe('/')
        })

        test('should set host and port capabilities for normal multiremote capabilities', async () => {
            const options = {
                logPath: './',
                command: 'path/to/my_custom_appium',
                args: { address: 'bar' }
            }
            const capabilities: Capabilities.RequestedMultiremoteCapabilities = {
                chromiumDriver: {
                    capabilities: {
                        browserName: 'chrome',
                        browserVersion: '133.0.6929.0',  // Have to specify version, otherwise its failing with 404 chrome version not found.
                        'goog:chromeOptions': {
                            args: ['--headless'],
                        },
                    },
                },
                mobileDriver: {
                    capabilities: {
                        platformName: 'iOS',
                        'appium:deviceName': 'iPhone 15',
                        'appium:platformVersion': '17.5',
                        'appium:orientation': 'PORTRAIT',
                        'appium:automationName': 'XCUITest',
                        'appium:app': 'APP_FILE_PATH',
                        'appium:newCommandTimeout': 240,
                        'appium:webviewConnectTimeout': 5000,
                        'appium:autoLaunch': true,
                        'appium:autoAcceptAlerts': false,
                    },
                }
            }
            const launcher = new AppiumLauncher(options, capabilities, {} as any)
            launcher['_startAppium'] = vi.fn().mockResolvedValue(new MockProcess())
            await launcher.onPrepare()
            expect(launcher['_startAppium']).toHaveBeenCalledTimes(1)
        })
    })

    describe('onComplete', () => {
        test('should call treeKill with SIGTERM first', async () => {
            const launcher = new AppiumLauncher({}, [], {} as any)
            await launcher.onPrepare()

            vi.mocked(treeKill).mockClear()
            const mockProcess = new MockProcess2(1234) as unknown as ChildProcessByStdio<null, Readable, Readable>
            launcher['_process'] = mockProcess
            vi.mocked(treeKill).mockImplementation((pid, signal, cb) => {
                expect(pid).toBe(1234)
                expect(signal).toBe('SIGTERM')
                if (cb) { cb() } return undefined
            })
            await launcher.onComplete()
            expect(treeKill).toHaveBeenCalledTimes(1)
            expect(treeKill).toHaveBeenCalledWith(1234, 'SIGTERM', expect.any(Function))
            expect(log.info).toHaveBeenCalledWith('Process and its children successfully terminated')
        })

        test('should try SIGKILL if SIGTERM fails', async () => {
            const launcher = new AppiumLauncher({}, [], {} as any)
            await launcher.onPrepare()
            const mockProcess = new MockProcess2(1234) as unknown as ChildProcessByStdio<null, Readable, Readable>
            launcher['_process'] = mockProcess
            vi.mocked(treeKill)
                .mockImplementationOnce((pid, signal, cb) => {
                    if (cb) { cb(new Error('SIGTERM failed')) }
                    return undefined
                })
                .mockImplementationOnce((pid, signal, cb) => {
                    if (cb) { cb() }
                    return undefined
                })
            await launcher.onComplete()
            expect(treeKill).toHaveBeenCalledWith(1234, 'SIGTERM', expect.any(Function))
            expect(treeKill).toHaveBeenCalledWith(1234, 'SIGKILL', expect.any(Function))
            expect(log.warn).toHaveBeenCalledWith('SIGTERM failed, attempting SIGKILL:', expect.any(Error))
            expect(log.info).toHaveBeenCalledWith('Process and its children successfully terminated')
        })

        test('should try direct process kill if both SIGTERM and SIGKILL fail', async () => {
            const launcher = new AppiumLauncher({}, [], {} as any)
            await launcher.onPrepare()
            const mockProcess = new MockProcess2(1234) as unknown as ChildProcessByStdio<null, Readable, Readable>
            launcher['_process'] = mockProcess
            vi.mocked(treeKill)
                .mockImplementationOnce((pid, signal, cb) => {
                    if (cb) { cb(new Error('SIGTERM failed')) }
                    return undefined
                })
                .mockImplementationOnce((pid, signal, cb) => {
                    if (cb) { cb(new Error('SIGKILL failed')) }
                    return undefined
                })
            await launcher.onComplete()
            expect(treeKill).toHaveBeenCalledWith(1234, 'SIGTERM', expect.any(Function))
            expect(treeKill).toHaveBeenCalledWith(1234, 'SIGKILL', expect.any(Function))
            expect(log.error).toHaveBeenCalledWith('Failed to kill Appium process tree:', expect.any(Error))
            expect(mockProcess.kill).toHaveBeenCalledWith('SIGKILL')
            expect(log.info).toHaveBeenCalledWith('Killed main process directly')
        })

        test('should handle direct kill failure', async () => {
            const launcher = new AppiumLauncher({}, [], {} as any)
            await launcher.onPrepare()
            const mockProcess = new MockProcess2(1234) as unknown as ChildProcessByStdio<null, Readable, Readable>
            vi.spyOn(mockProcess, 'kill').mockImplementation(() => {
                throw new Error('Kill failed')
            })
            launcher['_process'] = mockProcess
            vi.mocked(treeKill)
                .mockImplementationOnce((pid, signal, cb) => {
                    if (cb) { cb(new Error('SIGTERM failed')) }
                    return undefined
                })
                .mockImplementationOnce((pid, signal, cb) => {
                    if (cb) { cb(new Error('SIGKILL failed')) }
                    return undefined
                })
            await launcher.onComplete()
            expect(log.error).toHaveBeenCalledWith('Failed to kill process directly:', expect.any(Error))
        })

        test('should do nothing when process is undefined', async () => {
            const launcher = new AppiumLauncher({}, [], {} as any)
            expect(launcher['_process']).toBe(undefined)
            await launcher.onComplete()
            expect(launcher['_isShuttingDown']).toBe(true)
        })
    })

    describe('_redirectLogStream', () => {
        test('should not write output to file', async () => {
            const launcher = new AppiumLauncher({}, [{ 'appium:deviceName': 'baz' }], {} as any)
            launcher['_redirectLogStream'] = vi.fn()
            await launcher.onPrepare()
            expect(launcher['_redirectLogStream']).not.toBeCalled()
        })

        test('should write output to file', async () => {
            const launcher = new AppiumLauncher({ logPath: './' }, [{ 'appium:deviceName': 'baz' }], {} as any)
            await launcher.onPrepare()

            expect(vi.mocked(fs.createWriteStream).mock.calls[0][0]).toBe('/some/file/path')
            // Since we're awaiting onPrepare, _process should be defined at this point
            const process = launcher['_process']
            expect(process).toBeDefined()
            expect(process?.stdout.pipe).toBeCalled()
            expect(process?.stderr.pipe).toBeCalled()
        })

        test('throws if process is not set', async () => {
            const launcher = new AppiumLauncher({ logPath: './' }, [{ 'appium:deviceName': 'baz' }], {} as any)
            await expect(launcher['_redirectLogStream']('/foo/bar'))
                .rejects
                .toEqual(new Error('No Appium process to redirect log stream'))
        })
    })

    describe('server logging', () => {
        test('should register stdout and stderr listener when log path is not set', async () => {
            const launcher = new AppiumLauncher({}, [{ 'appium:deviceName': 'baz' }], {} as any)
            const mockProcess = new MockProcess()
            launcher['_startAppium'] = vi.fn().mockResolvedValue(mockProcess)
            expect(mockProcess.stdout.on).not.toBeCalled()
            expect(mockProcess.stderr.on).not.toBeCalled()
            await launcher.onPrepare()
            expect(mockProcess.stdout.on).toBeCalled()
            expect(mockProcess.stderr.on).toBeCalled()
        })
    })

    describe('_getAppiumCommand', () => {
        test('should return path to dependency', async () => {
            await expect(AppiumLauncher['_getAppiumCommand']('appium')).resolves.toMatch(/appium$/)
        })

        test('should throw if appium is not installed', async () => {
            vi.mocked(resolve).mockRejectedValue(new Error('Not found'))
            await expect(AppiumLauncher['_getAppiumCommand']('appium')).rejects.toThrow()
        })
    })

    describe('_startAppium', () => {
        test('should propagate error message', async () => {
            const origSpawn = await vi.importActual<typeof cp>('node:child_process').then((m) => m.spawn)
            vi.mocked(spawn).mockImplementationOnce(origSpawn)
            const launcher = new AppiumLauncher({}, [], {} as any)
            await expect(launcher['_startAppium'](
                'node',
                ['-e', '(() => { process.stderr.write(\'something went wrong\\n\'); throw new Error(\'ups\') })()'], 2000
            )).rejects.toEqual(expect.objectContaining({ message: expect.stringContaining('something went wrong') }))
        })

        test('should validate timeout parameter (timeout reach)', async () => {
            const origSpawn = await vi.importActual<typeof cp>('node:child_process').then((m) => m.spawn)
            vi.mocked(spawn).mockImplementationOnce(origSpawn)
            const launcher = new AppiumLauncher({}, [], {} as any)
            await expect(launcher['_startAppium'](
                'node',
                ['-e', '(() => { setTimeout(() => { console.log(JSON.stringify({message: \'done\'})); }, 5000); })()'],
                1000
            )).rejects.toEqual(expect.objectContaining({ message: expect.stringContaining('Timeout: Appium did not start within expected time') }))
        })

        test('should validate timeout parameter (no timeout reach)', async () => {
            const origSpawn = await vi.importActual<typeof cp>('node:child_process').then((m) => m.spawn)
            vi.mocked(spawn).mockImplementationOnce(origSpawn)
            const launcher = new AppiumLauncher({}, [], {} as any)
            await expect(launcher['_startAppium'](
                'node',
                ['-e', '(() => { setTimeout(() => { console.log(JSON.stringify({message: \'Appium REST http interface listener started\'})); }, 3000); })()'],
                10000
            )).resolves.toEqual(expect.objectContaining({ spawnargs: expect.arrayContaining(['-e', expect.any(String)]) }))
        })

        test('should filter out "Debugger attached" message as an error', async () => {
            const stdoutListener = { on: vi.fn(), off: vi.fn(), once: vi.fn() }
            const stderrListener = { on: vi.fn(), off: vi.fn(), once: vi.fn() }
            vi.mocked(spawn).mockReturnValue({
                stdout: { ...stdoutListener },
                stderr: { ...stderrListener },
                on: vi.fn(),
                once: vi.fn(),
                off: vi.fn(),
                kill: vi.fn()
            } as unknown as cp.ChildProcess)

            const mockLogError = vi.spyOn(log, 'error')
            const launcher = new AppiumLauncher({}, [], {} as any)

            launcher['_startAppium']('node', [], 2000)

            const errorHandler = stderrListener.on.mock.calls
                .find((call: string[]) => call[0] === 'data')?.[1]

            errorHandler(Buffer.from('Debugger attached'))
            expect(mockLogError).not.toHaveBeenCalled()
        })

        test('should not fail when Appium outputs WARN messages to stderr', async () => {
            const stdoutListener = { on: vi.fn(), off: vi.fn(), once: vi.fn() }
            const stderrListener = { on: vi.fn(), off: vi.fn(), once: vi.fn() }
            vi.mocked(spawn).mockReturnValue({
                stdout: { ...stdoutListener },
                stderr: { ...stderrListener },
                on: vi.fn(),
                once: vi.fn(),
                off: vi.fn(),
                kill: vi.fn()
            } as unknown as cp.ChildProcess)

            const mockLogError = vi.spyOn(log, 'error')
            const mockLogWarn = vi.spyOn(log, 'warn')
            const launcher = new AppiumLauncher({}, [], {} as any)

            launcher['_startAppium']('node', [], 2000)

            // Get the stderr handler
            const stderrHandler = stderrListener.on.mock.calls
                .find((call: string[]) => call[0] === 'data')?.[1]

            // Simulate a warning message from Appium (e.g., driver version mismatch)
            stderrHandler(Buffer.from('WARN Driver version mismatch'))

            // The warning should be logged as a warning but not cause an error or rejection
            expect(mockLogWarn).toHaveBeenCalled()
            expect(mockLogError).not.toHaveBeenCalled()
        })
    })

    afterEach(() => {
        vi.mocked(os.platform).mockReset()
        consoleSpy.mockRestore()
    })
})
