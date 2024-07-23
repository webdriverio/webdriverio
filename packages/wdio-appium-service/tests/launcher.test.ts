import fs from 'node:fs'
import url from 'node:url'
import path from 'node:path'
import { spawn } from 'node:child_process'
import type cp from 'node:child_process'
import getPort from 'get-port'

import { describe, expect, beforeEach, afterEach, test, vi } from 'vitest'
import { resolve } from 'import-meta-resolve'
import type { Capabilities, Options } from '@wdio/types'

import AppiumLauncher from '../src/launcher.js'

vi.mock('node:fs', () => ({
    default: {
        createWriteStream: vi.fn()
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
vi.mock('import-meta-resolve', () => ({ resolve: vi.fn().mockResolvedValue(
    url.pathToFileURL(path.resolve(process.cwd(), '/', 'foo', 'bar', 'appium')))
}))

vi.mock('get-port', () => ({
    default: vi.fn().mockResolvedValue(4723)
}))

class MockProcess {
    removeListener() {}
    kill() {}
    stdout = {
        pipe: vi.fn(),
        on: (event: string, callback: Function) =>{
            callback('[Appium] Welcome to Appium v1.11.1')
            callback('[Appium] Appium REST http interface listener started on 127.0.0.1:4723')
        } }
    stderr = {
        pipe: vi.fn(), once: vi.fn()
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
        pipe: vi.fn(),
        on: vi.fn()
    }
}

class MockCustomFailingProcess extends MockFailingProcess {
    stderr = { pipe: vi.fn(), once: vi.fn().mockImplementation((event, cb) => cb(new Error('Uups'))) }
}

vi.mock('../src/utils', async () => {
    const { formatCliArgs } = await vi.importActual('../src/utils.js') as any
    return {
        getFilePath: vi.fn().mockReturnValue('/some/file/path'),
        formatCliArgs
    }
})

const isWindows = process.platform === 'win32'

describe('Appium launcher', () => {
    const originalPlatform = process.platform
    const consoleSpy = vi.spyOn(global.console, 'error')

    beforeEach(() => {
        vi.mocked(spawn).mockClear()
        vi.mocked(spawn).mockReturnValue(new MockProcess() as unknown as cp.ChildProcess)
    })

    describe('onPrepare', () => {
        test('should set correct config properties', async () => {
            const options = {
                logPath: './',
                command:'path/to/my_custom_appium',
                args: { address: 'bar', defaultCapabilities: { 'foo': 'bar' } },
            }
            const capabilities = [{ port: 1234, deviceName: 'baz' }] as (Capabilities.DesiredCapabilities & Options.WebDriver)[]
            const launcher = new AppiumLauncher(options, capabilities, {} as any)
            await launcher.onPrepare()

            expect(launcher['_process']).toBeInstanceOf(MockProcess)
            expect(launcher['_logPath']).toBe('./')
            if (isWindows) {
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
            } else {
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
            }

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
            const capabilities: Capabilities.MultiRemoteCapabilities = {
                browserA: { port: 1234, capabilities: { deviceName: 'baz' } },
                browserB: { capabilities: { deviceName: 'baz' } }
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
            const capabilities: Capabilities.MultiRemoteCapabilities = {
                browserA: { port: 1234, capabilities: { browserName: 'chrome' } },
                browserB: { capabilities: { deviceName: 'baz' } }
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
            const capabilities: Capabilities.MultiRemoteCapabilities[] = [{
                browserA: { port: 1234, capabilities: { deviceName: 'baz' } },
                browserB: { capabilities: { deviceName: 'baz' } }
            }, {
                browserC: { port: 5678, capabilities: { deviceName: 'baz' } },
                browserD: { capabilities: { deviceName: 'baz' } }
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
                logPath : './',
                args : { address: 'foo' },
                installArgs : { bar : 'bar' },
            }
            const capabilities: Capabilities.MultiRemoteCapabilities = {
                browserA: { port: 1234, capabilities: { deviceName: 'baz' } },
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

        test('should respect custom Appium port', async () => {
            const options = {
                logPath: './',
                command: 'path/to/my_custom_appium',
                args: { address:'bar', port: 1234 }
            }
            const capabilities = [{ deviceName: 'baz' } as Capabilities.DesiredCapabilities]
            const launcher = new AppiumLauncher(options, capabilities, {} as any)
            await launcher.onPrepare()

            if (isWindows) {
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
            } else {
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
            }

            expect(launcher['_process']).toBeInstanceOf(MockProcess)
            expect(launcher['_logPath']).toBe('./')
            expect(capabilities[0].protocol).toBe('http')
            expect(capabilities[0].hostname).toBe('127.0.0.1')
            expect(capabilities[0].port).toBe(1234)
            expect(capabilities[0].path).toBe('/')
        })

        test('should respect random Appium port', async () => {
            vi.mocked(getPort).mockResolvedValueOnce(567567)

            const capabilities = [{ deviceName: 'baz' } as Capabilities.DesiredCapabilities]
            const launcher = new AppiumLauncher({}, capabilities, {} as any)
            await launcher.onPrepare()

            if (isWindows) {
                expect(spawn).toBeCalledWith(
                    'cmd',
                    [
                        '/c',
                        'node',
                        expect.any(String),
                        '--base-path',
                        '/',
                        '--port',
                        '567567'
                    ],
                    expect.any(Object)
                )
            } else {
                expect(spawn).toBeCalledWith(
                    'node',
                    [
                        '/foo/bar/appium',
                        '--base-path',
                        '/',
                        '--port',
                        '567567'
                    ],
                    expect.any(Object)
                )
            }

            expect(launcher['_process']).toBeInstanceOf(MockProcess)
            expect(capabilities[0].protocol).toBe('http')
            expect(capabilities[0].hostname).toBe('127.0.0.1')
            expect(capabilities[0].port).toBe(567567)
            expect(capabilities[0].path).toBe('/')
        })

        test('should respect custom port and path before Appium port and path', async () => {
            const options = {
                logPath: './',
                command: 'path/to/my_custom_appium',
                args: { address: 'bar', port: 1234, basePath: '/foo/bar' }
            }
            const capabilities = [{ port: 4321, deviceName: 'baz' } as Capabilities.DesiredCapabilities]
            const launcher = new AppiumLauncher(options, capabilities, {} as any)
            await launcher.onPrepare()

            if (isWindows) {
                expect(spawn).toBeCalledWith(
                    'cmd',
                    [
                        expect.any(String),
                        'path/to/my_custom_appium',
                        '--base-path',
                        '/foo/bar',
                        '--address',
                        'bar',
                        '--port',
                        '1234'
                    ],
                    expect.any(Object)
                )
            } else {
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
            }

            expect(launcher['_process']).toBeInstanceOf(MockProcess)
            expect(launcher['_logPath']).toBe('./')
            expect(capabilities[0].protocol).toBe('http')
            expect(capabilities[0].hostname).toBe('127.0.0.1')
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
                args: { address: 'bar' }
            }, [], {} as any)
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
            Object.defineProperty(process, 'platform', {
                value: 'darwin'
            })

            const launcher = new AppiumLauncher({
                logPath: './',
                command: 'path/to/my_custom_appium',
                args: { address: 'bar' }
            }, [], {} as any)
            await launcher.onPrepare()
            expect(launcher['_appiumCliArgs']).toMatchSnapshot()
        })

        test('should set correct config properties for linux', async () => {
            Object.defineProperty(process, 'platform', {
                value: 'linux'
            })

            const launcher = new AppiumLauncher({
                logPath: './',
                args: { address: 'bar' }
            }, [], {} as any)
            await launcher.onPrepare()

            if (isWindows) {
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
            } else {
                expect(spawn).toBeCalledWith(
                    'node',
                    [
                        '/foo/bar/appium',
                        '--base-path',
                        '/',
                        '--address',
                        'bar',
                        '--port',
                        '4723'
                    ],
                    expect.any(Object)
                )
            }
            expect(launcher['_appiumCliArgs'].slice(1)).toMatchSnapshot()
        })

        test('should set correct config properties when empty', async () => {
            const launcher = new AppiumLauncher({}, [], {} as any)
            await launcher.onPrepare()

            expect(launcher['_logPath']).toBe(undefined)
            if (isWindows) {
                expect(spawn).toBeCalledWith(
                    'cmd',
                    [
                        '/c',
                        'node',
                        expect.any(String),
                        '--base-path',
                        '/',
                        '--port',
                        '4723'
                    ],
                    expect.any(Object)
                )
            } else {
                expect(spawn).toBeCalledWith(
                    'node',
                    [
                        '/foo/bar/appium',
                        '--base-path',
                        '/',
                        '--port',
                        '4723'
                    ],
                    expect.any(Object)
                )
            }
        })

        test('should start Appium', async () => {
            const launcher = new AppiumLauncher({ args: { localTimezone: true } }, [], {} as any)
            await launcher.onPrepare()
        })

        test('should fail if Appium exits', async () => {
            const launcher = new AppiumLauncher({}, [], {} as any)
            vi.mocked(spawn).mockReturnValue(new MockFailingProcess(1) as unknown as cp.ChildProcess)

            const error = await launcher.onPrepare().catch((err) => err)
            const expectedError = new Error('Appium exited before timeout (exit code: 1)')
            expect(error).toEqual(expectedError)
        })

        test('should fail and error message if Appium already runs', async () => {
            const launcher = new AppiumLauncher({}, [], {} as any)
            vi.mocked(spawn).mockReturnValue(new MockFailingProcess(2) as unknown as cp.ChildProcess)

            const error = await launcher.onPrepare().catch((err) => err)
            const expectedError = new Error('Appium exited before timeout (exit code: 2)\n' +
                "Check that you don't already have a running Appium service.")
            expect(error).toEqual(expectedError)
        })

        test('should fail with Appium error message', async () => {
            const launcher = new AppiumLauncher({}, [], {} as any)
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
            const capabilities = [{ browserName: 'baz' } as Capabilities.DesiredCapabilities]
            const launcher = new AppiumLauncher(options, capabilities, {} as any)
            launcher['_startAppium'] = vi.fn().mockResolvedValue(new MockProcess())
            await launcher.onPrepare()

            expect(launcher['_process']).toBeInstanceOf(MockProcess)
            expect(launcher['_logPath']).toBe('./')
            expect(capabilities[0].protocol).toBeUndefined()
            expect(capabilities[0].hostname).toBeUndefined()
            expect(capabilities[0].port).toBeUndefined()
            expect(capabilities[0].path).toBeUndefined()
        })

        test('should not set host, port and path for non Appium capabilities using multiremote', async () => {
            const options = {
                logPath: './',
                command: 'path/to/my_custom_appium',
                args: { address: 'bar' }
            }
            const capabilities: Capabilities.MultiRemoteCapabilities = {
                browserA: { capabilities: { browserName: 'baz' } },
                browserB: { capabilities: { deviceName: 'baz' } }
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
            const capabilities: Capabilities.MultiRemoteCapabilities[] = [{
                browserA: { port: 1234, capabilities: { deviceName: 'baz' } },
                browserB: { capabilities: { browserName: 'baz' } }
            }, {
                browserC: { port: 5678, capabilities: { browserName: 'baz' } },
                browserD: { capabilities: { deviceName: 'baz' } }
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
    })

    describe('onComplete', () => {
        test('should call process.kill', async () => {
            const launcher = new AppiumLauncher({}, [], {} as any)
            await launcher.onPrepare()
            launcher['_process']!.kill = vi.fn()
            launcher.onComplete()
            expect(launcher['_process']!.kill).toBeCalled()
        })

        test('should not call process.kill', () => {
            const launcher = new AppiumLauncher({}, [], {} as any)
            expect(launcher['_process']).toBe(undefined)
            launcher.onComplete()
            expect(launcher['_process']).toBe(undefined)
        })
    })

    describe('_redirectLogStream', () => {
        test('should not write output to file', async () => {
            const launcher = new AppiumLauncher({}, [], {} as any)
            launcher['_redirectLogStream'] = vi.fn()
            await launcher.onPrepare()
            expect(launcher['_redirectLogStream']).not.toBeCalled()
        })

        test('should write output to file', async () => {
            const launcher = new AppiumLauncher({ logPath: './' }, [], {} as any)
            await launcher.onPrepare()

            expect(vi.mocked(fs.createWriteStream).mock.calls[0][0]).toBe('/some/file/path')
            expect(launcher['_process']!.stdout.pipe).toBeCalled()
            expect(launcher['_process']!.stderr.pipe).toBeCalled()
        })

        test('throws if process is not set', async () => {
            const launcher = new AppiumLauncher({ logPath: './' }, [], {} as any)
            await expect(launcher['_redirectLogStream']('/foo/bar')).rejects.toEqual(new Error('No Appium process to redirect log stream'))
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
    })

    afterEach(() => {
        consoleSpy.mockRestore()
        Object.defineProperty(process, 'platform', {
            value: originalPlatform
        })
    })
})
