import path from 'node:path'
import { beforeEach, describe, expect, it, vi } from 'vitest'
// @ts-expect-error mock feature
import logger from '@wdio/logger'
import Browserstack, { mockStart } from 'browserstack-local'
import got from 'got'
import fs from 'node:fs'

import { version as bstackServiceVersion } from '../package.json'
import BrowserstackLauncher from '../src/launcher.js'
import type { BrowserstackConfig } from '../src/types'

vi.mock(
    '@wdio/logger',
    () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')),
)
vi.mock('browserstack-local')

const log = logger('test')
const error = new Error("I'm an error!")
const sleep = (ms: number = 100) =>
    new Promise((resolve) => setTimeout(resolve, ms))

beforeEach(() => {
    vi.clearAllMocks()
})

describe('onPrepare', () => {
    const options: BrowserstackConfig = { browserstackLocal: true }
    const caps: any = [{}]
    const config = {
        user: 'foobaruser',
        key: '12345',
        capabilities: [],
    }
    const logInfoSpy = vi
        .spyOn(log, 'info')
        .mockImplementation((string) => string)

    it('should not try to upload app is app is undefined', () => {
        const service = new BrowserstackLauncher({} as any, caps, config)
        service.onPrepare()

        expect(logInfoSpy).toHaveBeenCalledWith(
            'app is not defined in browserstack-service config, skipping ...',
        )
    })

    it('should not call local if browserstackLocal is undefined', () => {
        const service = new BrowserstackLauncher({} as any, caps, {
            user: 'foobaruser',
            key: '12345',
            capabilities: [],
        })
        service.onPrepare()

        expect(logInfoSpy).toHaveBeenCalledWith(
            'browserstackLocal is not enabled - skipping...',
        )
        expect(service.browserstackLocal).toBeUndefined()
    })

    it('should not call local if browserstackLocal is false', () => {
        const service = new BrowserstackLauncher(
            {
                browserstackLocal: false,
            } as any,
            caps,
            {
                user: 'foobaruser',
                key: '12345',
                capabilities: [],
            },
        )
        service.onPrepare()

        expect(logInfoSpy).toHaveBeenCalledWith(
            'browserstackLocal is not enabled - skipping...',
        )
        expect(service.browserstackLocal).toBeUndefined()
    })

    it('should add the "app" property to a multiremote capability if no "bstack:options"', async () => {
        const options: BrowserstackConfig = { app: 'bs://<app-id>' }
        const service = new BrowserstackLauncher(options as any, caps, config)
        const capabilities = { samsungGalaxy: { capabilities: {} } }

        await service.onPrepare(config, capabilities)
        expect(capabilities.samsungGalaxy.capabilities).toEqual({
            app: 'bs://<app-id>',
        })
    })

    it('should add the "appium:app" property to a multiremote capability if "bstack:options" present', async () => {
        const options: BrowserstackConfig = { app: 'bs://<app-id>' }
        const service = new BrowserstackLauncher(options as any, caps, config)
        const capabilities = {
            samsungGalaxy: { capabilities: { 'bstack:options': {} } },
        }

        await service.onPrepare(config, capabilities)
        expect(capabilities.samsungGalaxy.capabilities).toEqual({
            'bstack:options': {},
            'appium:app': 'bs://<app-id>',
        })
    })

    it('should add the "appium:app" property to a multiremote capability if any extension cap present', async () => {
        const options: BrowserstackConfig = { app: 'bs://<app-id>' }
        const service = new BrowserstackLauncher(options as any, caps, config)
        const capabilities = {
            samsungGalaxy: { capabilities: { 'appium:chromeOptions': {} } },
        }

        await service.onPrepare(config, capabilities as any)
        expect(capabilities.samsungGalaxy.capabilities).toEqual({
            'appium:app': 'bs://<app-id>',
            'appium:chromeOptions': {},
        })
    })

    it('should add the "app" property to an array of capabilities if no "bstack:options"', async () => {
        const options: BrowserstackConfig = { app: 'bs://<app-id>' }
        const service = new BrowserstackLauncher(options as any, caps, config)
        const capabilities = [{}, {}, {}]

        await service.onPrepare(config, capabilities)
        expect(capabilities).toEqual([
            { app: 'bs://<app-id>' },
            { app: 'bs://<app-id>' },
            { app: 'bs://<app-id>' },
        ])
    })

    it('should add the "appium:app" property to an array of capabilities if "bstack:options" present', async () => {
        const options: BrowserstackConfig = { app: 'bs://<app-id>' }
        const service = new BrowserstackLauncher(options as any, caps, config)
        const capabilities = [
            { 'bstack:options': {} },
            { 'bstack:options': {} },
            { 'bstack:options': {} },
        ]

        await service.onPrepare(config, capabilities)
        expect(capabilities).toEqual([
            { 'bstack:options': {}, 'appium:app': 'bs://<app-id>' },
            { 'bstack:options': {}, 'appium:app': 'bs://<app-id>' },
            { 'bstack:options': {}, 'appium:app': 'bs://<app-id>' },
        ])
    })

    it('should add the "appium:app" property to an array of capabilities if any extension cap present', async () => {
        const options: BrowserstackConfig = { app: 'bs://<app-id>' }
        const service = new BrowserstackLauncher(options as any, caps, config)
        const capabilities = [
            { 'appium:chromeOptions': {} },
            { 'appium:chromeOptions': {} },
        ]

        await service.onPrepare(config, capabilities as any)
        expect(capabilities).toEqual([
            { 'appium:app': 'bs://<app-id>', 'appium:chromeOptions': {} },
            { 'appium:app': 'bs://<app-id>', 'appium:chromeOptions': {} },
        ])
    })

    it('should add the "appium:app" as custom_id of app to capability object', async () => {
        const options: BrowserstackConfig = { app: 'custom_id' }
        const service = new BrowserstackLauncher(options as any, caps, config)
        const capabilities = [
            { 'appium:chromeOptions': {} },
            { 'appium:chromeOptions': {} },
        ]

        await service.onPrepare(config, capabilities as any)
        expect(capabilities).toEqual([
            { 'appium:app': 'custom_id', 'appium:chromeOptions': {} },
            { 'appium:app': 'custom_id', 'appium:chromeOptions': {} },
        ])
    })

    it('should add the "appium:app" as shareable_id of app to capability object', async () => {
        const options: BrowserstackConfig = { app: 'user/custom_id' }
        const service = new BrowserstackLauncher(options as any, caps, config)
        const capabilities = [
            { 'appium:chromeOptions': {} },
            { 'appium:chromeOptions': {} },
        ]

        await service.onPrepare(config, capabilities as any)
        expect(capabilities).toEqual([
            { 'appium:app': 'user/custom_id', 'appium:chromeOptions': {} },
            { 'appium:app': 'user/custom_id', 'appium:chromeOptions': {} },
        ])
    })

    it('should add "appium:app" property with value returned from app upload to capabilities', async () => {
        const options: BrowserstackConfig = { app: '/some/dummy/file.apk' }
        const service = new BrowserstackLauncher(options as any, caps, config)
        const capabilities = [
            { 'bstack:options': {} },
            { 'bstack:options': {} },
            { 'bstack:options': {} },
        ]

        vi.spyOn(fs, 'existsSync').mockReturnValueOnce(true)
        vi.spyOn(service, '_uploadApp').mockImplementation(() =>
            Promise.resolve({ app_url: 'bs://<app-id>' }),
        )

        await service.onPrepare(config, capabilities)
        expect(capabilities).toEqual([
            { 'bstack:options': {}, 'appium:app': 'bs://<app-id>' },
            { 'bstack:options': {}, 'appium:app': 'bs://<app-id>' },
            { 'bstack:options': {}, 'appium:app': 'bs://<app-id>' },
        ])
    })

    it('should upload app if path property present in appConfig', async () => {
        const options: BrowserstackConfig = {
            app: { path: '/path/to/app.apk' },
        }
        const service = new BrowserstackLauncher(options as any, caps, config)
        const capabilities = [
            { 'bstack:options': {} },
            { 'bstack:options': {} },
            { 'bstack:options': {} },
        ]

        vi.spyOn(fs, 'existsSync').mockReturnValueOnce(true)
        vi.spyOn(service, '_uploadApp').mockImplementation(() =>
            Promise.resolve({ app_url: 'bs://<app-id>' }),
        )

        await service.onPrepare(config, capabilities)
        expect(capabilities).toEqual([
            { 'bstack:options': {}, 'appium:app': 'bs://<app-id>' },
            { 'bstack:options': {}, 'appium:app': 'bs://<app-id>' },
            { 'bstack:options': {}, 'appium:app': 'bs://<app-id>' },
        ])
    })

    it('should upload app along with custom_id if path and custom_id property present in appConfig', async () => {
        const options: BrowserstackConfig = {
            app: { path: '/path/to/app.apk', custom_id: 'custom_id' },
        }
        const service = new BrowserstackLauncher(options as any, caps, config)
        const capabilities = [
            { 'bstack:options': {} },
            { 'bstack:options': {} },
            { 'bstack:options': {} },
        ]

        vi.spyOn(fs, 'existsSync').mockReturnValueOnce(true)
        vi.spyOn(service, '_uploadApp').mockImplementation(() =>
            Promise.resolve({
                app_url: 'bs://<app-id>',
                custom_id: 'custom_id',
                shareable_id: 'foobaruser/custom_id',
            }),
        )

        await service.onPrepare(config, capabilities)
        expect(capabilities).toEqual([
            { 'bstack:options': {}, 'appium:app': 'bs://<app-id>' },
            { 'bstack:options': {}, 'appium:app': 'bs://<app-id>' },
            { 'bstack:options': {}, 'appium:app': 'bs://<app-id>' },
        ])
    })

    it('should initialize the opts object, and spawn a new Local instance', async () => {
        const service = new BrowserstackLauncher(options as any, caps, config)
        await service.onPrepare(config, caps)
        expect(service.browserstackLocal).toBeDefined()
    })

    it('should add the "browserstack.local" property to a multiremote capability if no "bstack:options"', async () => {
        const service = new BrowserstackLauncher(options as any, caps, config)
        const capabilities = { chromeBrowser: { capabilities: {} } }

        await service.onPrepare(config, capabilities)
        expect(capabilities.chromeBrowser.capabilities).toEqual({
            'browserstack.local': true,
        })
    })

    it('should add the "local" property to a multiremote capability inside "bstack:options" if "bstack:options" present', async () => {
        const service = new BrowserstackLauncher(options as any, caps, config)
        const capabilities = {
            chromeBrowser: { capabilities: { 'bstack:options': {} } },
        }

        await service.onPrepare(config, capabilities)
        expect(capabilities.chromeBrowser.capabilities).toEqual({
            'bstack:options': { local: true },
        })
    })

    it('should add the "local" property to a multiremote capability inside "bstack:options" if any extension cap present', async () => {
        const service = new BrowserstackLauncher(options as any, caps, config)
        const capabilities = {
            chromeBrowser: { capabilities: { 'goog:chromeOptions': {} } },
        }

        await service.onPrepare(config, capabilities)
        expect(capabilities.chromeBrowser.capabilities).toEqual({
            'bstack:options': { local: true },
            'goog:chromeOptions': {},
        })
    })

    it('should add the "browserstack.local" property to an array of capabilities if no "bstack:options"', async () => {
        const service = new BrowserstackLauncher(options as any, caps, config)
        const capabilities = [{}, {}, {}]

        await service.onPrepare(config, capabilities)
        expect(capabilities).toEqual([
            { 'browserstack.local': true },
            { 'browserstack.local': true },
            { 'browserstack.local': true },
        ])
    })

    it('should add the "local" property to an array of capabilities inside "bstack:options" if "bstack:options" present', async () => {
        const service = new BrowserstackLauncher(options as any, caps, config)
        const capabilities = [
            { 'bstack:options': {} },
            { 'bstack:options': {} },
            { 'bstack:options': {} },
        ]

        await service.onPrepare(config, capabilities)
        expect(capabilities).toEqual([
            { 'bstack:options': { local: true } },
            { 'bstack:options': { local: true } },
            { 'bstack:options': { local: true } },
        ])
    })

    it('should add the "local" property to an array of capabilities inside "bstack:options" if any extension cap present', async () => {
        const service = new BrowserstackLauncher(options as any, caps, config)
        const capabilities = [
            { 'ms:edgeOptions': {} },
            { 'goog:chromeOptions': {} },
            { 'moz:firefoxOptions': {} },
        ]

        await service.onPrepare(config, capabilities)
        expect(capabilities).toEqual([
            { 'bstack:options': { local: true }, 'ms:edgeOptions': {} },
            { 'bstack:options': { local: true }, 'goog:chromeOptions': {} },
            { 'bstack:options': { local: true }, 'moz:firefoxOptions': {} },
        ])
    })

    it('should reject if local.start throws an error', () => {
        const service = new BrowserstackLauncher(options as any, caps, config)
        mockStart.mockImplementationOnce((_: never, cb: Function) => cb(error))

        return expect(service.onPrepare(config, caps))
            .rejects.toThrow(error)
            .then(() =>
                expect(service.browserstackLocal?.start).toHaveBeenCalled(),
            )
    })

    it('should successfully resolve if local.start is successful', async () => {
        const logInfoMock = vi.spyOn(log, 'info')
        const service = new BrowserstackLauncher(options as any, caps, config)

        await service.onPrepare(config, caps)
        expect(service.browserstackLocal?.start).toHaveBeenCalled()
        await sleep(100)
        expect(logInfoMock.mock.calls[1][0]).toContain(
            'Browserstack Local successfully started after',
        )
    })

    it('should correctly set up this-binding for local.start', async () => {
        const service = new BrowserstackLauncher(options as any, caps, config)
        await service.onPrepare(config, caps)
        expect(mockStart).toHaveBeenCalled()
        vi.clearAllMocks()
    })
})

describe('onComplete', () => {
    it('should do nothing if browserstack local is turned on, but not running', () => {
        const service = new BrowserstackLauncher(
            {} as any,
            [{}] as any,
            {} as any,
        )
        service.browserstackLocal = new Browserstack.Local()
        const BrowserstackLocalIsRunningSpy = vi.spyOn(
            service.browserstackLocal,
            'isRunning',
        )
        BrowserstackLocalIsRunningSpy.mockImplementationOnce(() => false)
        service.onComplete()
        expect(service.browserstackLocal.stop).not.toHaveBeenCalled()
    })

    it('should kill the process if forcedStop is true', () => {
        const service = new BrowserstackLauncher(
            { forcedStop: true } as any,
            [{}] as any,
            {} as any,
        )
        service.browserstackLocal = new Browserstack.Local()
        service.browserstackLocal.pid = 102

        const killSpy = vi
            .spyOn(process, 'kill')
            .mockImplementationOnce((pid) => pid as any)
        expect(service.onComplete()).toEqual(102)
        expect(killSpy).toHaveBeenCalled()
        expect(service.browserstackLocal.stop).not.toHaveBeenCalled()
    })

    it('should reject with an error, if local.stop throws an error', () => {
        const service = new BrowserstackLauncher(
            {} as any,
            [{ browserName: '' }] as any,
            {} as any,
        )
        service.browserstackLocal = new Browserstack.Local()
        const BrowserstackLocalStopSpy = vi.spyOn(
            service.browserstackLocal,
            'stop',
        )
        BrowserstackLocalStopSpy.mockImplementationOnce((cb) => cb(error))
        return expect(service.onComplete())
            .rejects.toThrow(error)
            .then(() =>
                expect(service.browserstackLocal?.stop).toHaveBeenCalled(),
            )
    })

    it('should properly resolve if everything works', () => {
        const service = new BrowserstackLauncher(
            {} as any,
            [{}] as any,
            {} as any,
        )
        service.browserstackLocal = new Browserstack.Local()
        return expect(service.onComplete())
            .resolves.toBe(undefined)
            .then(() =>
                expect(service.browserstackLocal?.stop).toHaveBeenCalled(),
            )
    })
})

describe('constructor', () => {
    const options: BrowserstackConfig = {}
    const config = {
        user: 'foobaruser',
        key: '12345',
        capabilities: [],
    }

    it('should add the "browserstack.wdioService" property to an array of capabilities if no "bstack:options"', async () => {
        const caps: any = [{}, {}]
        new BrowserstackLauncher(options as any, caps, config)

        expect(caps).toEqual([
            { 'browserstack.wdioService': bstackServiceVersion },
            { 'browserstack.wdioService': bstackServiceVersion },
        ])
    })

    it('should add the "wdioService" property to an array of capabilities inside "bstack:options" if "bstack:options" present', async () => {
        const caps: any = [{ 'bstack:options': {} }, { 'bstack:options': {} }]
        new BrowserstackLauncher(options as any, caps, config)

        expect(caps).toEqual([
            { 'bstack:options': { wdioService: bstackServiceVersion } },
            { 'bstack:options': { wdioService: bstackServiceVersion } },
        ])
    })

    it('should add the "wdioService" property to an array of capabilities inside "bstack:options" if any extension cap present', async () => {
        const caps: any = [
            { 'moz:firefoxOptions': {} },
            { 'goog:chromeOptions': {} },
        ]
        new BrowserstackLauncher(options as any, caps, config)

        expect(caps).toEqual([
            {
                'bstack:options': { wdioService: bstackServiceVersion },
                'moz:firefoxOptions': {},
            },
            {
                'bstack:options': { wdioService: bstackServiceVersion },
                'goog:chromeOptions': {},
            },
        ])
    })
})

describe('_updateCaps', () => {
    const options: BrowserstackConfig = { browserstackLocal: true }
    const caps: any = [{}]
    const config = {
        user: 'foobaruser',
        key: '12345',
        capabilities: [],
    }

    it('should throw an error if "capabilities" is not an object/array', () => {
        const service = new BrowserstackLauncher(options as any, caps, config)
        const capabilities = 1

        expect(() => service._updateCaps(capabilities as any, 'local')).toThrow(
            TypeError('Capabilities should be an object or Array!'),
        )
    })
})

describe('_validateApp', () => {
    const caps: any = [{}]
    const config = {
        user: 'foobaruser',
        key: '12345',
        capabilities: [],
    }

    it('should use id as app value', async () => {
        const options: BrowserstackConfig = { app: { id: 'bs://<app-id>' } }
        const service = new BrowserstackLauncher(options as any, caps, config)

        const app: any = await service._validateApp(options.app as any)
        expect(app).toEqual({ app: 'bs://<app-id>', custom_id: undefined })
    })

    it('should throw error if more than two property passed in appConfig', async () => {
        const options: BrowserstackConfig = {
            app: { custom_id: 'custom_id', id: 'bs://<app-id>' },
        }
        const service = new BrowserstackLauncher(options as any, caps, config)

        try {
            await service._validateApp(options.app as any)
        } catch (e) {
            expect(e.message).toEqual(`keys ${Object.keys(
                options.app as any,
            )} can't co-exist as app values, use any one property from
                            {id<string>, path<string>, custom_id<string>, shareable_id<string>}, only "path" and "custom_id" can co-exist.`)
        }
    })

    it('should throw error if property not matches path and custom_id in appConfig', async () => {
        const options: BrowserstackConfig = {
            app: { custom_id: 'custom_id', id: 'bs://<app-id>' },
        }
        const service = new BrowserstackLauncher(options as any, caps, config)

        try {
            await service._validateApp(options.app as any)
        } catch (e) {
            expect(e.message).toEqual(`keys ${Object.keys(
                options.app as any,
            )} can't co-exist as app values, use any one property from
                            {id<string>, path<string>, custom_id<string>, shareable_id<string>}, only "path" and "custom_id" can co-exist.`)
        }
    })
})

describe('_uploadApp', () => {
    const options: BrowserstackConfig = { app: '/path/to/app.apk' }
    const caps: any = [{}]
    const config = {
        user: 'foobaruser',
        key: '12345',
        capabilities: [],
    }
    vi.mock('got')

    got.post = vi.fn().mockReturnValue({
        json: () => Promise.resolve({ app_url: 'bs://<app-id>' }),
    })

    it('should upload the app and return app_url', async () => {
        const service = new BrowserstackLauncher(options as any, caps, config)
        const res = await service._uploadApp(options.app as any)
        expect(res).toEqual({ app_url: 'bs://<app-id>' })
    })
})
