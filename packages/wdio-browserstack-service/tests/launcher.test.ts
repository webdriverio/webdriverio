import Browserstack from 'browserstack-local'
import logger from '@wdio/logger'

import BrowserstackLauncher from '../src/launcher'
import { BrowserstackConfig } from '../src/types'

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

    it('should initialize the opts object, and spawn a new Local instance', async () => {
        const service = new BrowserstackLauncher(options, caps, config)
        await service.onPrepare(config, caps)
        expect(service.browserstackLocal).toBeDefined()
    })

    it('should add the "browserstack.local" property to a multiremote capability', async () => {
        const service = new BrowserstackLauncher(options, caps, config)
        const capabilities = { chromeBrowser: { capabilities: {} } }

        await service.onPrepare(config, capabilities)
        expect(capabilities.chromeBrowser.capabilities).toEqual({ 'bstack:options': { local: true } })
    })

    it('should add the "browserstack.local" property to an array of capabilities', async () => {
        const service = new BrowserstackLauncher(options, caps, config)
        const capabilities = [{}, {}, {}]

        await service.onPrepare(config, capabilities)
        expect(capabilities).toEqual([
            { 'bstack:options': { local: true } },
            { 'bstack:options': { local: true } },
            { 'bstack:options': { local: true } }
        ])
    })

    it('should throw an error if "capabilities" is not an object/array', () => {
        const service = new BrowserstackLauncher(options, caps, config)
        const capabilities = 1

        expect(() => service.onPrepare(config, capabilities as any))
            .toThrow(TypeError('Capabilities should be an object or Array!'))
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
