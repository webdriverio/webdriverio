import BrowserstackLauncher from '../src/launcher'
import Browserstack from 'browserstack-local'
import logger from '@wdio/logger'

const log = logger('test')
const error = new Error('I\'m an error!')

beforeEach(() => {
    log.info.mockClear()
})

describe('onPrepare', () => {
    const options = { browserstackLocal: true }
    const caps = [{}]
    const config = {
        user: 'foobaruser',
        key: '12345'
    }
    const logInfoSpy = jest.spyOn(log, 'info').mockImplementation((string) => string)

    it('should not call local if browserstackLocal is undefined', () => {
        const service = new BrowserstackLauncher({}, caps, {
            user: 'foobaruser',
            key: '12345'
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

    it('should add the "browserstack.local" property to a single capability', async () => {
        const service = new BrowserstackLauncher(options, caps, config)
        global.capabilities = {}

        await service.onPrepare(config, global.capabilities)
        expect(global.capabilities).toEqual({ 'browserstack.local': true })
    })

    it('should add the "browserstack.local" property to an array of capabilities', async () => {
        const service = new BrowserstackLauncher(options, caps, config)
        global.capabilities = [{}, {}, {}]

        await service.onPrepare(config, global.capabilities)
        expect(global.capabilities).toEqual([
            { 'browserstack.local': true },
            { 'browserstack.local': true },
            { 'browserstack.local': true }
        ])
    })

    it('should throw an error if "capabilities" is not an object/array', () => {
        const service = new BrowserstackLauncher(options, caps, config)
        global.capabilities = 1

        expect(() => service.onPrepare(config, global.capabilities))
            .toThrow(TypeError('Capabilities should be an object or Array!'))
    })

    it('should reject if local.start throws an error', () => {
        const service = new BrowserstackLauncher(options, caps, config)
        Browserstack.Local.mockImplementationOnce(function () {
            this.start = jest.fn().mockImplementationOnce((options, cb) => cb(error))
        })

        return expect(service.onPrepare(config, caps)).rejects.toThrow(error)
            .then(() => expect(service.browserstackLocal.start).toHaveBeenCalled())
    })

    it('should successfully resolve if local.start is successful', async () => {
        const service = new BrowserstackLauncher(options, caps, config)

        await service.onPrepare(config, caps)
        expect(service.browserstackLocal.start).toHaveBeenCalled()
        expect(log.info.mock.calls[0][0]).toContain('Browserstack Local successfully started after')
    })

    it('should correctly set up this-binding for local.start', async () => {
        const service = new BrowserstackLauncher(options, caps, config)
        Browserstack.Local.mockImplementationOnce(function () {
            this.start = jest.fn().mockImplementationOnce(function (options, cb) {
                this.addArgs(options)
                cb()
            })
            this.addArgs = jest.fn().mockImplementationOnce(() => undefined)
        })

        await service.onPrepare(config, caps)
        expect(service.browserstackLocal.start).toHaveBeenCalled()
        expect(service.browserstackLocal.addArgs).toHaveBeenCalled()
    })
})

describe('onComplete', () => {
    it('should do nothing if browserstack local is turned on, but not running', () => {
        const service = new BrowserstackLauncher({}, [{}], {})
        service.browserstackLocal = new Browserstack.Local()
        service.browserstackLocal.isRunning.mockImplementationOnce(() => false)
        service.onComplete(null, {})
        expect(service.browserstackLocal.stop).not.toHaveBeenCalled()
    })

    it('should kill the process if forcedStop is true', () => {
        const service = new BrowserstackLauncher({ forcedStop: true }, [{}], {})
        service.browserstackLocal = new Browserstack.Local()
        service.browserstackLocal.pid = 102

        const killSpy = jest.spyOn(process, 'kill').mockImplementationOnce((pid) => pid)
        expect(service.onComplete()).toEqual(102)
        expect(killSpy).toHaveBeenCalled()
        expect(service.browserstackLocal.stop).not.toHaveBeenCalled()
    })

    it('should reject with an error, if local.stop throws an error', () => {
        const service = new BrowserstackLauncher({}, [{}], {})
        service.browserstackLocal = new Browserstack.Local()
        service.browserstackLocal.stop.mockImplementationOnce((cb) => cb(error))
        return expect(service.onComplete(null, {})).rejects.toThrow(error)
            .then(() => expect(service.browserstackLocal.stop).toHaveBeenCalled())
    })

    it('should properly resolve if everything works', () => {
        const service = new BrowserstackLauncher({}, [{}], {})
        service.browserstackLocal = new Browserstack.Local()
        return expect(service.onComplete(null, {})).resolves.toBe(undefined)
            .then(() => expect(service.browserstackLocal.stop).toHaveBeenCalled())
    })
})
