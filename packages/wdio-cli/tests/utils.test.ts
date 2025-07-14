import path from 'node:path'
import cp from 'node:child_process'
import fs from 'node:fs/promises'

import { vi, describe, it, expect, afterEach, beforeEach, test } from 'vitest'
import readDir from 'recursive-readdir'
import { readPackageUp } from 'read-pkg-up'
import { SevereServiceError } from 'webdriverio'
import { ConfigParser } from '@wdio/config/node'

import {
    runLauncherHook,
    runOnCompleteHook,
    runServiceHook,
    getRunnerName,
    findInConfig,
    getCapabilities,
} from '../src/utils.js'

vi.mock('recursive-readdir', () => ({
    default: vi.fn().mockResolvedValue([
        '/foo/bar/loo/page.js.ejs',
        '/foo/bar/example.e2e.js'
    ] as any)
}))
vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))
vi.mock('child_process', () => {
    const m = {
        execSyncRes: 'APPIUM_MISSING',
        execSync: () => m.execSyncRes,
        exec: vi.fn(),
        spawn: vi.fn().mockReturnValue({ on: vi.fn().mockImplementation((ev, fn) => fn(0)) })
    }
    return { default: m }
})

vi.mock('read-pkg-up')

vi.mock('node:fs/promises', () => ({
    default: {
        access: vi.fn().mockRejectedValue(new Error('ENOENT')),
        mkdir: vi.fn(),
        writeFile: vi.fn().mockReturnValue(Promise.resolve())
    }
}))

vi.mock('@wdio/config/node', () => ({
    ConfigParser: class ConfigParserMock {
        initialize() { }
        getCapabilities() { }
    }
}))

beforeEach(() => {
    global.console.log = vi.fn()

    vi.mocked(readPackageUp).mockResolvedValue({
        path: '/foo/package.json',
        packageJson: {
            name: 'cool-test-module',
            type: 'module'
        }
    })
})

describe('runServiceHook', () => {
    const hookSuccess = vi.fn()
    const slowSetupFn = vi.fn()
    const asyncHookSuccess = vi.fn().mockImplementation(() => new Promise<void>(resolve => {
        setTimeout(() => {
            slowSetupFn()
            resolve()
        }, 20)
    }))

    beforeEach(() => {
        hookSuccess.mockClear()
        slowSetupFn.mockClear()
        asyncHookSuccess.mockClear()
    })

    it('run sync and async hooks successfully', async () => {
        await runServiceHook([
            { onPrepare: hookSuccess },
            { onPrepare: asyncHookSuccess },
            // @ts-ignore test invalid parameter
            { onPrepare: 'foobar' },
        ], 'onPrepare', 1, true, 'abc')
        expect(hookSuccess).toBeCalledTimes(1)
        expect(asyncHookSuccess).toBeCalledTimes(1)
        expect(slowSetupFn).toBeCalledTimes(1)
    })

    it('executes all hooks and continues after a hook throws error', async () => {
        const hookFailing = vi.fn().mockImplementation(() => { throw new Error('buhh') })

        await runServiceHook([
            { onPrepare: hookSuccess },
            // @ts-ignore test invalid parameter
            { onPrepare: 'foobar' },
            { onPrepare: asyncHookSuccess },
            { onPrepare: hookFailing },
        ], 'onPrepare', 1, true, 'abc')

        expect(hookSuccess).toBeCalledTimes(1)
        expect(hookFailing).toBeCalledTimes(1)
        expect(slowSetupFn).toBeCalledTimes(1)
        expect(asyncHookSuccess).toBeCalledTimes(1)
    })

    it('executes all hooks and stops after a hook throws SevereServiceError', async () => {
        const hookFailing = vi.fn().mockImplementation(() => { throw new SevereServiceError() })

        try {
            await runServiceHook([
                { onPrepare: hookSuccess },
                // @ts-ignore test invalid parameter
                { onPrepare: 'foobar' },
                { onPrepare: asyncHookSuccess },
                { onPrepare: hookFailing },
            ], 'onPrepare', 1, true, 'abc')
        } catch (err: any) {
            expect(err.message).toEqual(expect.stringContaining('SevereServiceError'))
            expect(err.message).toEqual(expect.stringContaining('Stopping runner...'))
            expect(hookSuccess).toBeCalledTimes(1)
            expect(hookFailing).toBeCalledTimes(1)
            expect(slowSetupFn).toBeCalledTimes(1)
            expect(asyncHookSuccess).toBeCalledTimes(1)
        }
    })
})

test('runLauncherHook handles array of functions', () => {
    const hookSuccess = vi.fn()
    const hookFailing = vi.fn().mockImplementation(() => { throw new Error('buhh') })

    runLauncherHook([hookSuccess, hookFailing], 1, 2, 3, 4, 5, 6)
    expect(hookSuccess).toBeCalledTimes(1)
    expect(hookSuccess).toHaveBeenCalledWith(1, 2, 3, 4, 5, 6)
    expect(hookFailing).toBeCalledTimes(1)
    expect(hookFailing).toHaveBeenCalledWith(1, 2, 3, 4, 5, 6)
})

test('runLauncherHook handles async functions', async () => {
    const hookSuccess = () => new Promise(resolve => setTimeout(resolve, 31))

    const start = Date.now()
    await runLauncherHook([hookSuccess], {}, {})
    expect(Date.now() - start).toBeGreaterThanOrEqual(30)
})

test('runLauncherHook handles a single function', () => {
    const hookSuccess = vi.fn()

    runLauncherHook(hookSuccess, 1, 2, 3, 4, 5, 6)
    expect(hookSuccess).toBeCalledTimes(1)
    expect(hookSuccess).toHaveBeenCalledWith(1, 2, 3, 4, 5, 6)
})

test('runOnCompleteHook handles array of functions', () => {
    const hookSuccess = vi.fn()
    const secondHook = vi.fn()

    runOnCompleteHook([hookSuccess, secondHook], { capabilities: [] }, {}, 0, {} as any)
    expect(hookSuccess).toBeCalledTimes(1)
    expect(secondHook).toBeCalledTimes(1)
})

test('runOnCompleteHook handles async functions', async () => {
    const hookSuccess = () => new Promise(resolve => setTimeout(resolve, 31))

    const start = Date.now()
    await runOnCompleteHook([hookSuccess], { capabilities: [] }, {}, 0, {} as any)
    expect(Date.now() - start).toBeGreaterThanOrEqual(30)
})

test('runOnCompleteHook handles a single function', () => {
    const hookSuccess = vi.fn()

    runOnCompleteHook(hookSuccess, { capabilities: [] }, {}, 0, {} as any)
    expect(hookSuccess).toBeCalledTimes(1)
})

test('runOnCompleteHook with no failure returns 0', async () => {
    const hookSuccess = vi.fn()
    const hookFailing = vi.fn()

    const result = await runOnCompleteHook([hookSuccess, hookFailing], { capabilities: [] }, {}, 0, {} as any)

    expect(result).not.toContain(1)
    expect(hookSuccess).toBeCalledTimes(1)
    expect(hookFailing).toBeCalledTimes(1)
})

test('runOnCompleteHook with failure returns 1', async () => {
    const hookSuccess = vi.fn()
    const hookFailing = vi.fn().mockImplementation(() => { throw new Error('buhh') })

    const result = await runOnCompleteHook([hookSuccess, hookFailing], { capabilities: [] }, {}, 0, {} as any)

    expect(result).toContain(1)
    expect(hookSuccess).toBeCalledTimes(1)
    expect(hookFailing).toBeCalledTimes(1)
})

test('runOnCompleteHook fails with SevereServiceError', async () => {
    const hookSuccess = vi.fn()
    const hookFailing = vi.fn().mockImplementation(() => { throw new SevereServiceError('buhh') })

    const result = await runOnCompleteHook([hookSuccess, hookFailing], { capabilities: [] }, {}, 0, {} as any)
        .catch(() => 'some error')

    expect(result).toBe('some error')
    expect(hookSuccess).toBeCalledTimes(1)
    expect(hookFailing).toBeCalledTimes(1)
})

test('getRunnerName', () => {
    expect(getRunnerName({ 'appium:appPackage': 'foobar' })).toBe('foobar')
    expect(getRunnerName({ 'appium:appWaitActivity': 'foobar' })).toBe('foobar')
    expect(getRunnerName({ 'appium:app': 'foobar' })).toBe('foobar')
    expect(getRunnerName({ 'appium:platformName': 'foobar' })).toBe('foobar')
    expect(getRunnerName({ browserName: 'foobar' })).toBe('foobar')
    expect(getRunnerName({ platformName: 'foobar' })).toBe('foobar')
    expect(getRunnerName({})).toBe('undefined')
    expect(getRunnerName()).toBe('undefined')
    // @ts-ignore test invalid parameter
    expect(getRunnerName({ foo: {} })).toBe('undefined')
    // @ts-ignore test invalid parameter
    expect(getRunnerName({ foo: { capabilities: [] }, bar: {} })).toBe('undefined')
    // @ts-ignore test invalid parameter
    expect(getRunnerName({ foo: { capabilities: [] } })).toBe('MultiRemote')
})

describe('findInConfig', () => {
    it('finds text for services', () => {
        const str = "services: ['foo', 'bar'],"

        expect(findInConfig(str, 'service')).toMatchObject([
            'services: [\'foo\', \'bar\']'
        ])
    })

    it('finds text for frameworks', () => {
        const str = "framework: 'mocha'"

        expect(findInConfig(str, 'framework')).toMatchObject([
            "framework: 'mocha'"
        ])
    })
})

describe('getCapabilities', () => {
    it('should return driver with capabilities for android', async () => {
        expect(await getCapabilities({ option: 'foo.apk' } as any)).toMatchSnapshot()
        expect(await getCapabilities({ option: 'android' } as any)).toMatchSnapshot()
    })

    it('should return driver with capabilities for ios', async () => {
        expect(await getCapabilities({ option: 'foo.app', deviceName: 'fooName', udid: 'num', platformVersion: 'fooNum' } as any))
            .toMatchSnapshot()
        expect(await getCapabilities({ option: 'ios' } as any)).toMatchSnapshot()
    })

    it('should return driver with capabilities for desktop', async () => {
        expect(await getCapabilities({ option: 'chrome' } as any)).toMatchSnapshot()
    })

    it('should throw config not found error', async () => {
        const initializeMock = vi.spyOn(ConfigParser.prototype, 'initialize')
        initializeMock.mockImplementationOnce(() => {
            const error: any = new Error('ups')
            error.code = 'MODULE_NOT_FOUND'
            return Promise.reject(error)
        })
        await expect(() => getCapabilities({ option: './test.js', capabilities: 2 } as any))
            .rejects.toThrowErrorMatchingSnapshot()
        initializeMock.mockImplementationOnce(async () => { throw new Error('ups') })
        await expect(() => getCapabilities({ option: './test.js', capabilities: 2 } as any))
            .rejects.toThrowErrorMatchingSnapshot()
    })

    it('should throw capability not provided', async () => {
        await expect(() => getCapabilities({ option: '/path/to/config.js' } as any))
            .rejects.toThrowErrorMatchingSnapshot()
    })

    it('should through capability not found', async () => {
        const cap = { browserName: 'chrome' }
        const getCapabilitiesMock = vi.spyOn(ConfigParser.prototype, 'getCapabilities')
        getCapabilitiesMock.mockReturnValue([cap, cap, cap, cap, cap])
        await expect(() => getCapabilities({ option: '/path/to/config.js', capabilities: 5 } as any))
            .rejects.toThrowErrorMatchingSnapshot()
    })

    it('should get capability from wdio.conf.js', async () => {
        const autoCompileMock = vi.spyOn(ConfigParser.prototype, 'initialize')
        const getCapabilitiesMock = vi.spyOn(ConfigParser.prototype, 'getCapabilities')
        getCapabilitiesMock.mockReturnValue([
            { browserName: 'chrome' },
            {
                browserName: 'firefox',
                specs: ['/path/to/some/specs.js']
            },
            {
                maxInstances: 5,
                browserName: 'chrome',
                'goog:chromeOptions': { 'args': ['window-size=8000,1200'] }
            }
        ] as WebdriverIO.Capabilities)
        expect(await getCapabilities({ option: '/path/to/config.js', capabilities: 2 } as any))
            .toMatchSnapshot()
        expect(autoCompileMock).toBeCalledTimes(1)
    })
})

afterEach(() => {
    vi.mocked(console.log).mockRestore()
    vi.mocked(readDir).mockClear()
    vi.mocked(fs.writeFile).mockClear()
    vi.mocked(cp.spawn).mockClear()
    vi.mocked(fs.mkdir).mockClear()
})
