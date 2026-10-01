import path from 'node:path'

import { vi, describe, it, expect, beforeEach, test } from 'vitest'
import { SevereServiceError } from 'webdriverio'
import { ConfigParser } from '@wdio/config/node'

import {
    runLauncherHook,
    runOnCompleteHook,
    runServiceHook,
    getRunnerName,
    getCapabilities,
    shouldEnableTsx,
    looksLikeTypeScriptPath,
} from '../src/utils.js'

vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))

vi.mock('@wdio/config/node', () => ({
    ConfigParser: class ConfigParserMock {
        initialize() { }
        getCapabilities() { }
    }
}))

const { resolveMock } = vi.hoisted(() => ({
    resolveMock: vi.fn((specifier: string) => specifier)
}))
vi.mock('import-meta-resolve', () => ({ resolve: resolveMock }))
vi.mock('tsx', () => ({}))

beforeEach(() => {
    resolveMock.mockClear()
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

        await expect(runServiceHook([
            { onPrepare: hookSuccess },
            // @ts-ignore test invalid parameter
            { onPrepare: 'foobar' },
            { onPrepare: asyncHookSuccess },
            { onPrepare: hookFailing },
        ], 'onPrepare', 1, true, 'abc')).rejects.toThrow(/SevereServiceError[\s\S]*Stopping runner\.\.\./)

        expect(hookSuccess).toBeCalledTimes(1)
        expect(hookFailing).toBeCalledTimes(1)
        expect(slowSetupFn).toBeCalledTimes(1)
        expect(asyncHookSuccess).toBeCalledTimes(1)
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

    it.each(['.ts', '.tsx', '.mts', '.cts'])('should support %s TypeScript config files', async (ext) => {
        const getCapabilitiesMock = vi.spyOn(ConfigParser.prototype, 'getCapabilities')
        getCapabilitiesMock.mockReturnValue([
            { browserName: 'chrome' }
        ] as WebdriverIO.Capabilities)
        expect(await getCapabilities({ option: `/path/to/config${ext}`, capabilities: 0 } as any))
            .toEqual({ capabilities: { browserName: 'chrome' } })
        expect(resolveMock).toHaveBeenCalledWith('tsx', expect.any(String))
    })

    it('should not load tsx for non-TypeScript config files', async () => {
        const getCapabilitiesMock = vi.spyOn(ConfigParser.prototype, 'getCapabilities')
        getCapabilitiesMock.mockReturnValue([
            { browserName: 'chrome' }
        ] as WebdriverIO.Capabilities)
        expect(await getCapabilities({ option: '/path/to/config.js', capabilities: 0 } as any))
            .toEqual({ capabilities: { browserName: 'chrome' } })
        expect(resolveMock).not.toHaveBeenCalled()
    })

    it('should return driver with capabilities for multi-remote config', async () => {
        const getCapabilitiesMock = vi.spyOn(ConfigParser.prototype, 'getCapabilities')
        getCapabilitiesMock.mockReturnValue({
            myChromeBrowser: {
                capabilities: {
                    browserName: 'chrome'
                }
            },
            myFirefoxBrowser: {
                capabilities: {
                    browserName: 'firefox'
                }
            }
        } as WebdriverIO.Capabilities)

        expect(await getCapabilities({ option: '/path/to/config.js', capabilities: 'myChromeBrowser' } as any))
            .toMatchSnapshot()
    })
})

describe('shouldEnableTsx', () => {
    it('detects TypeScript config files and tsConfigPath', () => {
        expect(shouldEnableTsx('/tmp/wdio.conf.ts')).toBe(true)
        expect(shouldEnableTsx('/tmp/wdio.conf.js', { tsConfigPath: './tsconfig.json' })).toBe(true)
        expect(shouldEnableTsx('/tmp/wdio.conf.js')).toBe(false)
    })

    it('detects TypeScript specs and require hooks on the config', () => {
        expect(shouldEnableTsx('/tmp/wdio.conf.js', {}, {
            specs: ['./test/**/*.ts']
        })).toBe(true)
        expect(shouldEnableTsx('/tmp/wdio.conf.js', {}, {
            mochaOpts: { require: ['./helpers/setup.ts'] }
        })).toBe(true)
        expect(shouldEnableTsx('/tmp/wdio.conf.js', {}, {
            specs: ['./test/**/*.js']
        })).toBe(false)
    })

    it('detects TypeScript specs declared on capabilities', () => {
        expect(shouldEnableTsx('/tmp/wdio.conf.js', {}, {}, [{
            browserName: 'chrome',
            specs: ['./e2e/**/*.ts'],
            exclude: ['./e2e/skip.spec.ts']
        } as WebdriverIO.Capabilities])).toBe(false)
        expect(shouldEnableTsx('/tmp/wdio.conf.js', {}, {}, [{
            browserName: 'chrome',
            'wdio:specs': ['./e2e/app.spec.ts']
        } as WebdriverIO.Capabilities])).toBe(true)
        expect(shouldEnableTsx('/tmp/wdio.conf.js', {}, {}, [{
            browserName: 'chrome',
            'wdio:exclude': ['./e2e/skip.spec.ts']
        } as WebdriverIO.Capabilities])).toBe(true)
    })
})

describe('looksLikeTypeScriptPath', () => {
    it('matches common TypeScript path forms', () => {
        expect(looksLikeTypeScriptPath('./foo.ts')).toBe(true)
        expect(looksLikeTypeScriptPath('./foo.tsx')).toBe(true)
        expect(looksLikeTypeScriptPath('./foo/**/*.mts')).toBe(true)
        expect(looksLikeTypeScriptPath('./foo.js')).toBe(false)
    })
})
