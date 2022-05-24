import path from 'path'
import { spawn, ChildProcess } from 'node:child_process'
// @ts-expect-error mock feature
import { mocks } from 'node:module'

import { describe, expect, beforeEach, afterEach, test, vi } from 'vitest'
import {  } from 'fs-extra'
import type { Capabilities, Options } from '@wdio/types'

import AppiumLauncher from '../src/launcher'

vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))
vi.mock('child_process', () => ({
    spawn: vi.fn()
}))
vi.mock('node:module', () => {
    const mocks = {
        'fs-extra': {
            createWriteStream: vi.fn(),
            ensureFileSync: vi.fn()
        }
    }
    const requireFn = vi.fn().mockImplementation((moduleName: keyof typeof mocks) => mocks[moduleName])
    // @ts-expect-error
    requireFn.resolve = vi.fn().mockImplementation((moduleName: keyof typeof mocks) => {
        if (!mocks[moduleName]) {
            throw new Error(`Cannot find module '${moduleName}'`)
        }
        return '/some/path'
    })
    return ({
        mocks,
        createRequire: vi.fn().mockReturnValue(requireFn)
    })
})

class MockProcess {
    removeListener() {}
    kill() {}
    stdout = {
        pipe: vi.fn(),
        on: (event: string, callback: Function) =>{
            callback('[Appium] Welcome to Appium v1.11.1')
            callback('[Appium] Appium REST http interface listener started on localhost:4723')
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
    const { formatCliArgs } = await vi.importActual('../src/utils')
    return {
        getFilePath: vi.fn().mockReturnValue('/some/file/path'),
        formatCliArgs
    }
})

const isWindows = process.platform === 'win32'

describe('Appium launcher', () => {
    const originalPlatform = process.platform
    const consoleSpy = vi.spyOn(global.console, 'error')
    //@ts-ignore spyOn private function
    const getAppiumCommandSpy = vi.spyOn<any>(AppiumLauncher, '_getAppiumCommand')

    beforeEach(() => {
        getAppiumCommandSpy.mockReturnValue('/appium/command/path')
        vi.mocked(spawn).mockClear()
        vi.mocked(spawn).mockReturnValue(new MockProcess() as unknown as ChildProcess)
    })

    describe('onPrepare', () => {
        test('should set correct config properties', async () => {
            const options = {
                logPath: './',
                command:'path/to/my_custom_appium',
                args: { foo: 'bar' }
            }
            const capabilities = [{ port: 1234, capabilities: [] }] as (Capabilities.DesiredCapabilities & Options.WebDriver)[]
            const launcher = new AppiumLauncher(options, capabilities, {} as any)
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
            const capabilities: Capabilities.MultiRemoteCapabilities = {
                browserA: { port: 1234, capabilities: {} },
                browserB: { capabilities: {} }
            }
            const launcher = new AppiumLauncher(options, capabilities, {} as any)
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
            const capabilities: Capabilities.MultiRemoteCapabilities = {
                browserA: { port: 1234, capabilities: {} },
                browserB: { port: 4321, capabilities: { 'bstack:options': {} } }
            }
            const launcher = new AppiumLauncher(options, capabilities, {} as any)
            launcher['_redirectLogStream'] = vi.fn()
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
            const capabilities = [{} as Capabilities.DesiredCapabilities]
            const launcher = new AppiumLauncher(options, capabilities, {} as any)
            launcher['_startAppium'] = vi.fn().mockImplementation(
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
            const capabilities = [{ port: 4321 } as Capabilities.DesiredCapabilities]
            const launcher = new AppiumLauncher(options, capabilities, {} as any)
            launcher['_startAppium'] = vi.fn().mockImplementation(
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
            }, [], {} as any)
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
            }, [], {} as any)
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
            }, [], {} as any)
            await launcher.onPrepare()

            expect(launcher['_command']).toBe('path/to/my_custom_appium')
            expect(launcher['_appiumCliArgs']).toMatchSnapshot()
        })

        test('should set correct config properties when empty', async () => {
            const launcher = new AppiumLauncher({}, [], {} as any)
            await launcher.onPrepare()

            expect(launcher['_logPath']).toBe(undefined)
            if (isWindows) {
                expect(launcher['_command']).toBe('cmd')
            } else {
                expect(launcher['_command']).toBe('node')
            }
        })

        test('should start Appium', async () => {
            const launcher = new AppiumLauncher({ args: { superspeed: true } }, [], {} as any)
            await launcher.onPrepare()
        })

        test('should fail if Appium exits', async () => {
            const launcher = new AppiumLauncher({}, [], {} as any)
            vi.mocked(spawn).mockReturnValue(new MockFailingProcess(1) as unknown as ChildProcess)

            const error = await launcher.onPrepare().catch((err) => err)
            const expectedError = new Error('Appium exited before timeout (exit code: 1)')
            expect(error).toEqual(expectedError)
        })

        test('should fail and error message if Appium already runs', async () => {
            const launcher = new AppiumLauncher({}, [], {} as any)
            vi.mocked(spawn).mockReturnValue(new MockFailingProcess(2) as unknown as ChildProcess)

            const error = await launcher.onPrepare().catch((err) => err)
            const expectedError = new Error('Appium exited before timeout (exit code: 2)\n' +
                "Check that you don't already have a running Appium service.")
            expect(error).toEqual(expectedError)
        })

        test('should fail with Appium error message', async () => {
            const launcher = new AppiumLauncher({}, [], {} as any)
            vi.mocked(spawn).mockReturnValue(new MockCustomFailingProcess(2) as unknown as ChildProcess)

            const error = await launcher.onPrepare().catch((err) => err)
            const expectedError = new Error('Appium exited before timeout (exit code: 2)\nError: Uups')
            expect(error).toEqual(expectedError)
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

            expect(vi.mocked(mocks['fs-extra'].createWriteStream).mock.calls[0][0]).toBe('/some/file/path')
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
                .toBe('/some/path')
        })

        test('should be appium by default', () => {
            expect(() => AppiumLauncher['_getAppiumCommand']())
                .toThrow("Cannot find module 'appium'")
        })
    })

    afterEach(() => {
        consoleSpy.mockRestore()
        Object.defineProperty(process, 'platform', {
            value: originalPlatform
        })
    })
})
