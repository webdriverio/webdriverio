import type { Capabilities } from '@wdio/types'
import type { ApplitoolsBrowserAsync } from '../src/types'

import ApplitoolsService from '../src'

const expect = global.expect as unknown as jest.Expect

const caps: Capabilities.Capabilities = {
    browserName: 'chrome'
}

class BrowserMock {
    [key: string]: any;

    constructor () {
        this.addCommand = jest.fn().mockImplementation((name, fn) => {
            this[name] = fn
        })

        this.call = jest.fn().mockImplementation((fn) => fn())
    }
}

function getBrowser () {
    return new BrowserMock() as unknown as ApplitoolsBrowserAsync
}

describe('wdio-applitools-service', () => {
    beforeEach(() => {
        delete process.env.APPLITOOLS_KEY
    })

    it('throws if key does not exist in config', () => {
        let service = new ApplitoolsService({})
        expect(() => service.beforeSession()).toThrow()

        service = new ApplitoolsService({ serverUrl: 'foobar' })
        expect(() => service.beforeSession()).toThrow()

        service = new ApplitoolsService({ key: 'foobar' })
        expect(() => service.beforeSession()).not.toThrow()

        service = new ApplitoolsService({ serverUrl: 'foobar', key: 'foobar' })
        expect(() => service.beforeSession()).not.toThrow()
    })

    it('throws if key does not exist in environment', () => {
        const service = new ApplitoolsService({ viewport: { height: 123 } })

        expect(() => service.beforeSession()).toThrow()
        process.env.APPLITOOLS_KEY = 'foobarenv'
        process.env.APPLITOOLS_SERVER_URL = 'foobarenvserver'
        expect(() => service.beforeSession()).not.toThrow()

        expect(service['_isConfigured']).toBe(true)
        expect(service['_eyes'].setApiKey).toBeCalledWith('foobarenv')
        expect(service['_eyes'].setServerUrl).toBeCalledWith('foobarenvserver')
        expect(service['_viewport']).toEqual({ width: 1440, height: 123 })
    })

    it('should prefer options before environment variable', () => {
        const service = new ApplitoolsService({
            key: 'foobar',
            serverUrl: 'foobarserver'
        })
        process.env.APPLITOOLS_KEY = 'foobarenv'
        process.env.APPLITOOLS_SERVER_URL = 'foobarenvserver'
        service.beforeSession()
        expect(service['_eyes'].setApiKey).toBeCalledWith('foobar')
        expect(service['_eyes'].setServerUrl).toBeCalledWith('foobarserver')
    })

    it('should set proxy config if set in options', () => {
        const proxyOptions = {
            url: 'http://foobarproxy.com:8080',
            username: 'abc',
            password: 'def',
            isHttpOnly: true
        }
        const service = new ApplitoolsService({
            key: 'foobar',
            eyesProxy: proxyOptions
        })

        service.beforeSession()
        expect(service['_eyes'].setProxy).toBeCalledWith(proxyOptions)
    })

    it('should not set proxy config if not set in options', () => {
        const service = new ApplitoolsService({})
        process.env.APPLITOOLS_KEY = 'foobarenv'

        expect(() => service.beforeSession()).not.toThrow()
        expect(service['_eyes'].setProxy).not.toBeCalled()
    })

    describe('before hook', () => {
        it('should do nothing if key was not applied', () => {
            const service = new ApplitoolsService({})
            service.before(caps, [], getBrowser())
            expect(service['_browser']?.addCommand).not.toBeCalled()
        })

        it('should register takeSnapshot command', () => {
            process.env.APPLITOOLS_KEY = 'foobarenv'
            const service = new ApplitoolsService({})

            service.beforeSession()
            service.before(caps, [], getBrowser())
            expect(service['_browser']?.addCommand).toBeCalled()

            service['_browser']?.takeSnapshot('foobar')
            expect(service['_eyes'].check).toBeCalledWith('foobar', 'some window')
        })

        it('should throw if takeSnapshot command is used without title', () => {
            process.env.APPLITOOLS_KEY = 'foobarenv'
            const service = new ApplitoolsService({})

            service.beforeSession()
            service.before(caps, [], getBrowser())
            expect(service['_browser']?.addCommand).toBeCalled()

            // @ts-ignore test undefined title
            expect(() => service['_browser']?.takeSnapshot()).toThrow()
            expect(service['_eyes'].check).not.toBeCalled()
        })

        it('should register takeRegionSnapshot command', () => {
            process.env.APPLITOOLS_KEY = 'foobarenv'
            const service = new ApplitoolsService({})

            service.beforeSession()
            service.before(caps, [], getBrowser())
            expect(service['_browser']?.addCommand).toBeCalled()

            service['_browser']?.takeRegionSnapshot('foobar', 'foobarRegion')
            expect(service['_eyes'].check).toBeCalledWith('foobar', 'foobarRegion')
        })

        it('should register takeRegionSnapshot command with frame', () => {
            process.env.APPLITOOLS_KEY = 'foobarenv'
            const service = new ApplitoolsService({})

            service.beforeSession()
            service.before(caps, [], getBrowser())
            expect(service['_browser']?.addCommand).toBeCalled()

            service['_browser']?.takeRegionSnapshot('foobar', 'foobarRegion', 'foobarFrame')
            expect(service['_eyes'].check).toBeCalledWith('foobar', 'foobarRegionWithFrame')
        })

        it('should register if takeRegionSnapshot command is used with null frame', () => {
            process.env.APPLITOOLS_KEY = 'foobarenv'
            const service = new ApplitoolsService({})

            service.beforeSession()
            service.before(caps, [], getBrowser())
            expect(service['_browser']?.addCommand).toBeCalled()

            // @ts-ignore test missing parameter
            service['_browser']?.takeRegionSnapshot('foobar', 'foobarRegion', null)
            expect(service['_eyes'].check).toBeCalledWith('foobar', 'foobarRegion')
        })

        it('should throw if takeRegionSnapshot command is used without title', () => {
            process.env.APPLITOOLS_KEY = 'foobarenv'
            const service = new ApplitoolsService({})

            service.beforeSession()
            service.before(caps, [], getBrowser())
            expect(service['_browser']?.addCommand).toBeCalled()

            // @ts-ignore test missing parameter
            expect(() => service['_browser']?.takeRegionSnapshot(null, 'foobarRegion')).toThrow()
            expect(service['_eyes'].check).not.toBeCalled()
        })

        it('should throw if takeRegionSnapshot command is used without region', () => {
            process.env.APPLITOOLS_KEY = 'foobarenv'
            const service = new ApplitoolsService({})

            service.beforeSession()
            service.before(caps, [], getBrowser())
            expect(service['_browser']?.addCommand).toBeCalled()

            // @ts-ignore test missing parameter
            expect(() => service['_browser']?.takeRegionSnapshot('foobar')).toThrow()
            expect(service['_eyes'].check).not.toBeCalled()
        })

        it('should throw if takeRegionSnapshot command is used with null region', () => {
            process.env.APPLITOOLS_KEY = 'foobarenv'
            const service = new ApplitoolsService({})

            service.beforeSession()
            service.before(caps, [], getBrowser())
            expect(service['_browser']?.addCommand).toBeCalled()

            // @ts-ignore test missing parameter
            expect(() => service['_browser']?.takeRegionSnapshot('foobar', null)).toThrow()
            expect(service['_eyes'].check).not.toBeCalled()
        })
    })

    describe('beforeTest hook', () => {
        it('should do nothing if key was not applied', () => {
            const service = new ApplitoolsService({})

            service.before(caps, [], getBrowser())
            service.beforeTest({ title: 'some title', parent: 'some parent' })
            expect(service['_browser']?.call).not.toBeCalled()
        })

        it('should open eyes', () => {
            process.env.APPLITOOLS_KEY = 'foobarenv'
            const service = new ApplitoolsService({})

            service.beforeSession()
            service.before(caps, [], getBrowser())
            service.beforeTest({ title: 'some title', parent: 'some parent' })

            expect(service['_browser']?.call).toBeCalled()
            expect(service['_eyes'].open)
                .toBeCalledWith(service['_browser'], 'some title', 'some parent', { height: 900, width: 1440 })
        })
    })

    describe('afterTest hook', () => {
        it('should do nothing if key was not applied', () => {
            const service = new ApplitoolsService({})

            service.before(caps, [], getBrowser())
            service.afterTest()
            expect(service['_browser']?.call).not.toBeCalled()
        })

        it('should close eyes', () => {
            process.env.APPLITOOLS_KEY = 'foobarenv'
            const service = new ApplitoolsService({})

            service.beforeSession()
            service.before(caps, [], getBrowser())
            service.afterTest()

            expect(service['_browser']?.call).toBeCalled()
            expect(service['_eyes'].close).toBeCalled()
        })
    })

    describe('after hook', () => {
        it('should do nothing if key was not applied', () => {
            const service = new ApplitoolsService({})

            service.before(caps, [], getBrowser())
            service.after()
            expect(service['_browser']?.call).not.toBeCalled()
        })

        it('should abortIfNotClosed eyes', () => {
            process.env.APPLITOOLS_KEY = 'foobarenv'
            const service = new ApplitoolsService({})

            service.beforeSession()
            service.before(caps, [], getBrowser())
            service.after()

            expect(service['_browser']?.call).toBeCalled()
            expect(service['_eyes'].abortIfNotClosed).toBeCalled()
        })
    })
})
