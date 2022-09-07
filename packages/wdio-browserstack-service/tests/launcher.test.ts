import Browserstack from 'browserstack-local'
import logger from '@wdio/logger'
import gotMock from 'got'

import BrowserstackLauncher from '../src/launcher'
import { BrowserstackConfig } from '../src/types'

import fs from 'fs'
import FormData from 'form-data'

// @ts-ignore
import { version as bstackServiceVersion } from '../package.json'
import { servicesVersion } from 'typescript'

interface GotMock extends jest.Mock {
    post: jest.Mock
}

const got = gotMock as unknown as GotMock
const expect = global.expect as unknown as jest.Expect

const log = logger('test')
const error = new Error('I\'m an error!')
const sleep = (ms: number = 100) => new Promise((resolve) => setTimeout(resolve, ms))

beforeEach(() => {
    jest.clearAllMocks()
})

describe('onPrepare', () => {
    const options: BrowserstackConfig = { browserstackLocal: true }
    const caps: any = [{}]
    const config = {
        user: 'foobaruser',
        key: '12345',
        capabilities: []
    }
    const logInfoSpy = jest.spyOn(log, 'info').mockImplementation((string) => string)

    it('should not call local if browserstackLocal is undefined', () => {
        const service = new BrowserstackLauncher({}, caps, {
            user: 'foobaruser',
            key: '12345',
            capabilities: []
        })
        service.onPrepare()

        expect(logInfoSpy).toHaveBeenCalledWith('browserstackLocal is not enabled - skipping...')
        expect(service.browserstackLocal).toBeUndefined()
    })

    it('should not call local if browserstackLocal is false', () => {
        const service = new BrowserstackLauncher({
            browserstackLocal: false
        }, caps, {
            user: 'foobaruser',
            key: '12345',
            capabilities: []
        })
        service.onPrepare()

        expect(logInfoSpy).toHaveBeenCalledWith('browserstackLocal is not enabled - skipping...')
        expect(service.browserstackLocal).toBeUndefined()
    })

    it('should add the "app" property to a multiremote capability if no "bstack:options"', async () => {
        const options: BrowserstackConfig = { app: 'bs://<app-id>' }
        const service = new BrowserstackLauncher(options, caps, config)
        const capabilities = { samsungGalaxy: { capabilities: {} } }

        await service.onPrepare(config, capabilities)
        expect(capabilities.samsungGalaxy.capabilities).toEqual({ 'app': 'bs://<app-id>' })
    })

    it('should add the "appium:app" property to a multiremote capability if "bstack:options" present', async () => {
        const options: BrowserstackConfig = { app: 'bs://<app-id>' }
        const service = new BrowserstackLauncher(options, caps, config)
        const capabilities = { samsungGalaxy: { capabilities: { 'bstack:options': {} } } }

        await service.onPrepare(config, capabilities)
        expect(capabilities.samsungGalaxy.capabilities).toEqual({ 'bstack:options': {}, 'appium:app': 'bs://<app-id>' })
    })

    it('should add the "appium:app" property to a multiremote capability if any extension cap present', async () => {
        const options: BrowserstackConfig = { app: 'bs://<app-id>' }
        const service = new BrowserstackLauncher(options, caps, config)
        const capabilities = { samsungGalaxy: { capabilities: { 'appium:chromeOptions': {} } } }

        await service.onPrepare(config, capabilities)
        expect(capabilities.samsungGalaxy.capabilities).toEqual({ 'appium:app': 'bs://<app-id>', 'appium:chromeOptions': {} })
    })

    it('should add the "app" property to an array of capabilities if no "bstack:options"', async () => {
        const options: BrowserstackConfig = { app: 'bs://<app-id>' }
        const service = new BrowserstackLauncher(options, caps, config)
        const capabilities = [{}, {}, {}]

        await service.onPrepare(config, capabilities)
        expect(capabilities).toEqual([
            { 'app': 'bs://<app-id>' },
            { 'app': 'bs://<app-id>' },
            { 'app': 'bs://<app-id>' }
        ])
    })

    it('should add the "appium:app" property to an array of capabilities if "bstack:options" present', async () => {
        const options: BrowserstackConfig = { app: 'bs://<app-id>' }
        const service = new BrowserstackLauncher(options, caps, config)
        const capabilities = [{ 'bstack:options': {} }, { 'bstack:options': {} }, { 'bstack:options': {} }]

        await service.onPrepare(config, capabilities)
        expect(capabilities).toEqual([
            { 'bstack:options': {}, 'appium:app': 'bs://<app-id>' },
            { 'bstack:options': {}, 'appium:app': 'bs://<app-id>' },
            { 'bstack:options': {}, 'appium:app': 'bs://<app-id>' }
        ])
    })

    it('should add the "appium:app" property to an array of capabilities if any extension cap present', async () => {
        const options: BrowserstackConfig = { app: 'bs://<app-id>' }
        const service = new BrowserstackLauncher(options, caps, config)
        const capabilities = [{ 'appium:chromeOptions': {} }, { 'appium:chromeOptions': {} }]

        await service.onPrepare(config, capabilities)
        expect(capabilities).toEqual([
            { 'appium:app': 'bs://<app-id>', 'appium:chromeOptions': {} },
            { 'appium:app': 'bs://<app-id>', 'appium:chromeOptions': {} }
        ])
    })

    it('should add the "appium:app" as custom_id of app to capability object', async () => {
        const options: BrowserstackConfig = { app: 'custom_id' }
        const service = new BrowserstackLauncher(options, caps, config)
        const capabilities = [{ 'appium:chromeOptions': {} }, { 'appium:chromeOptions': {} }]

        await service.onPrepare(config, capabilities)
        expect(capabilities).toEqual([
            { 'appium:app': 'custom_id', 'appium:chromeOptions': {} },
            { 'appium:app': 'custom_id', 'appium:chromeOptions': {} }
        ])
    })

    it('should add the "appium:app" as shareable_id of app to capability object', async () => {
        const options: BrowserstackConfig = { app: 'user/custom_id' }
        const service = new BrowserstackLauncher(options, caps, config)
        const capabilities = [{ 'appium:chromeOptions': {} }, { 'appium:chromeOptions': {} }]

        await service.onPrepare(config, capabilities)
        expect(capabilities).toEqual([
            { 'appium:app': 'user/custom_id', 'appium:chromeOptions': {} },
            { 'appium:app': 'user/custom_id', 'appium:chromeOptions': {} }
        ])
    })

    it('should add "appium:app" property with value returned from app upload to capabilities', async () => {
        const options: BrowserstackConfig = { app: '/some/dummy/file.apk' }
        const service = new BrowserstackLauncher(options, caps, config)
        const capabilities = [{ 'bstack:options': {} }, { 'bstack:options': {} }, { 'bstack:options': {} }]

        jest.spyOn(fs, 'existsSync').mockReturnValueOnce(true)
        jest.spyOn(service, '_uploadApp').mockImplementation(() => Promise.resolve({ app_url: 'bs://<app-id>' }))

        await service.onPrepare(config, capabilities)
        expect(capabilities).toEqual([
            { 'bstack:options': {}, 'appium:app': 'bs://<app-id>' },
            { 'bstack:options': {}, 'appium:app': 'bs://<app-id>' },
            { 'bstack:options': {}, 'appium:app': 'bs://<app-id>' }
        ])
    })

    it('should initialize the opts object, and spawn a new Local instance', async () => {
        const service = new BrowserstackLauncher(options, caps, config)
        await service.onPrepare(config, caps)
        expect(service.browserstackLocal).toBeDefined()
    })

    it('should add the "browserstack.local" property to a multiremote capability if no "bstack:options"', async () => {
        const service = new BrowserstackLauncher(options, caps, config)
        const capabilities = { chromeBrowser: { capabilities: {} } }

        await service.onPrepare(config, capabilities)
        expect(capabilities.chromeBrowser.capabilities).toEqual({ 'browserstack.local': true })
    })

    it('should add the "local" property to a multiremote capability inside "bstack:options" if "bstack:options" present', async () => {
        const service = new BrowserstackLauncher(options, caps, config)
        const capabilities = { chromeBrowser: { capabilities: { 'bstack:options': {} } } }

        await service.onPrepare(config, capabilities)
        expect(capabilities.chromeBrowser.capabilities).toEqual({ 'bstack:options': { local: true } })
    })

    it('should add the "local" property to a multiremote capability inside "bstack:options" if any extension cap present', async () => {
        const service = new BrowserstackLauncher(options, caps, config)
        const capabilities = { chromeBrowser: { capabilities: { 'goog:chromeOptions': {} } } }

        await service.onPrepare(config, capabilities)
        expect(capabilities.chromeBrowser.capabilities).toEqual({ 'bstack:options': { local: true }, 'goog:chromeOptions': {} })
    })

    it('should add the "browserstack.local" property to an array of capabilities if no "bstack:options"', async () => {
        const service = new BrowserstackLauncher(options, caps, config)
        const capabilities = [{}, {}, {}]

        await service.onPrepare(config, capabilities)
        expect(capabilities).toEqual([
            { 'browserstack.local': true },
            { 'browserstack.local': true },
            { 'browserstack.local': true }
        ])
    })

    it('should add the "local" property to an array of capabilities inside "bstack:options" if "bstack:options" present', async () => {
        const service = new BrowserstackLauncher(options, caps, config)
        const capabilities = [{ 'bstack:options': {} }, { 'bstack:options': {} }, { 'bstack:options': {} }]

        await service.onPrepare(config, capabilities)
        expect(capabilities).toEqual([
            { 'bstack:options': { local: true } },
            { 'bstack:options': { local: true } },
            { 'bstack:options': { local: true } }
        ])
    })

    it('should add the "local" property to an array of capabilities inside "bstack:options" if any extension cap present', async () => {
        const service = new BrowserstackLauncher(options, caps, config)
        const capabilities = [{ 'ms:edgeOptions': {} }, { 'goog:chromeOptions': {} }, { 'moz:firefoxOptions': {} }]

        await service.onPrepare(config, capabilities)
        expect(capabilities).toEqual([
            { 'bstack:options': { local: true }, 'ms:edgeOptions': {} },
            { 'bstack:options': { local: true }, 'goog:chromeOptions': {} },
            { 'bstack:options': { local: true }, 'moz:firefoxOptions': {} }
        ])
    })

    it('should reject if local.start throws an error', () => {
        const service = new BrowserstackLauncher(options, caps, config)
        const BrowserstackLocalStartSpy = jest.spyOn(new Browserstack.Local(), 'start')
        BrowserstackLocalStartSpy.mockImplementationOnce((options, cb) => cb(error))

        return expect(service.onPrepare(config, caps)).rejects.toThrow(error)
            .then(() => expect(service.browserstackLocal?.start).toHaveBeenCalled())
    })

    it('should successfully resolve if local.start is successful', async () => {
        const logInfoMock = jest.spyOn(log, 'info')
        const service = new BrowserstackLauncher(options, caps, config)

        await service.onPrepare(config, caps)
        expect(service.browserstackLocal?.start).toHaveBeenCalled()
        await sleep(100)
        expect(logInfoMock.mock.calls[0][0])
            .toContain('Browserstack Local successfully started after')
    })

    it('should correctly set up this-binding for local.start', async () => {
        const service = new BrowserstackLauncher(options, caps, config)
        const BrowserstackLocalStartSpy = jest.spyOn(new Browserstack.Local(), 'start')
        await service.onPrepare(config, caps)
        expect(BrowserstackLocalStartSpy).toHaveBeenCalled()
        jest.clearAllMocks()
    })
})

describe('onComplete', () => {
    it('should do nothing if browserstack local is turned on, but not running', () => {
        const service = new BrowserstackLauncher({}, [{}] as any, {} as any)
        service.browserstackLocal = new Browserstack.Local()
        const BrowserstackLocalIsRunningSpy = jest.spyOn(service.browserstackLocal, 'isRunning')
        BrowserstackLocalIsRunningSpy.mockImplementationOnce(() => false)
        service.onComplete()
        expect(service.browserstackLocal.stop).not.toHaveBeenCalled()
    })

    it('should kill the process if forcedStop is true', () => {
        const service = new BrowserstackLauncher({ forcedStop: true }, [{}] as any, {} as any)
        service.browserstackLocal = new Browserstack.Local()
        service.browserstackLocal.pid = 102

        const killSpy = jest.spyOn(process, 'kill').mockImplementationOnce((pid) => pid as any)
        expect(service.onComplete()).toEqual(102)
        expect(killSpy).toHaveBeenCalled()
        expect(service.browserstackLocal.stop).not.toHaveBeenCalled()
    })

    it('should reject with an error, if local.stop throws an error', () => {
        const service = new BrowserstackLauncher({}, [{ browserName: '' }] as any, {} as any)
        service.browserstackLocal = new Browserstack.Local()
        const BrowserstackLocalStopSpy = jest.spyOn(service.browserstackLocal, 'stop')
        BrowserstackLocalStopSpy.mockImplementationOnce((cb) => cb(error))
        return expect(service.onComplete()).rejects.toThrow(error)
            .then(() => expect(service.browserstackLocal?.stop).toHaveBeenCalled())
    })

    it('should properly resolve if everything works', () => {
        const service = new BrowserstackLauncher({}, [{}] as any, {} as any)
        service.browserstackLocal = new Browserstack.Local()
        return expect(service.onComplete()).resolves.toBe(undefined)
            .then(() => expect(service.browserstackLocal?.stop).toHaveBeenCalled())
    })
})

describe('constructor', () => {
    const options: BrowserstackConfig = { }
    const config = {
        user: 'foobaruser',
        key: '12345',
        capabilities: []
    }

    it('should add the "browserstack.wdioService" property to an array of capabilities if no "bstack:options"', async () => {
        const caps: any = [{}, {}]
        new BrowserstackLauncher(options, caps, config)

        expect(caps).toEqual([
            { 'browserstack.wdioService': bstackServiceVersion },
            { 'browserstack.wdioService': bstackServiceVersion }
        ])
    })

    it('should add the "wdioService" property to an array of capabilities inside "bstack:options" if "bstack:options" present', async () => {
        const caps: any = [{ 'bstack:options': {} }, { 'bstack:options': {} }]
        new BrowserstackLauncher(options, caps, config)

        expect(caps).toEqual([
            { 'bstack:options': { wdioService: bstackServiceVersion } },
            { 'bstack:options': { wdioService: bstackServiceVersion } }
        ])
    })

    it('should add the "wdioService" property to an array of capabilities inside "bstack:options" if any extension cap present', async () => {
        const caps: any = [{ 'moz:firefoxOptions': {} }, { 'goog:chromeOptions': {} }]
        new BrowserstackLauncher(options, caps, config)

        expect(caps).toEqual([
            { 'bstack:options': { wdioService: bstackServiceVersion }, 'moz:firefoxOptions': {} },
            { 'bstack:options': { wdioService: bstackServiceVersion }, 'goog:chromeOptions': {} }
        ])
    })
})

describe('_updateCaps', () => {
    const options: BrowserstackConfig = { browserstackLocal: true }
    const caps: any = [{}]
    const config = {
        user: 'foobaruser',
        key: '12345',
        capabilities: []
    }

    it('should throw an error if "capabilities" is not an object/array', () => {
        const service = new BrowserstackLauncher(options, caps, config)
        const capabilities = 1

        expect(() => service._updateCaps(capabilities as any, 'local'))
            .toThrow(TypeError('Capabilities should be an object or Array!'))
    })
})

// describe('_uploadApp', () => {
//     const options: BrowserstackConfig = { app: 'bs://<app-id>' }
//     const caps: any = [{}]
//     const config = {
//         user: 'foobaruser',
//         key: '12345',
//         capabilities: []
//     }

//     it('should upload the app and return app_url', async() => {
//         const service = new BrowserstackLauncher(options, caps, config)
//         await service._uploadApp(options.app)
//         expect(got.post).toHaveBeenCalledWith(
//             'https://api-cloud.browserstack.com/app-automate/upload',
//             { username: 'foo', password: 'bar', body: 'json' })
//     })
// })
