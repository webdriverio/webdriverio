import ApplitoolsService from '../src'

class BrowserMock {
    constructor () {
        this.addCommand = jest.fn().mockImplementation((name, fn) => {
            this[name] = fn
        })

        this.call = jest.fn().mockImplementation((fn) => fn())
    }
}

describe('wdio-applitools-service', () => {
    beforeEach(() => {
        delete process.env.APPLITOOLS_KEY
        delete global.browser
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

        expect(service.isConfigured).toBe(true)
        expect(service.eyes.setApiKey).toBeCalledWith('foobarenv')
        expect(service.eyes.setServerUrl).toBeCalledWith('foobarenvserver')
        expect(service.viewport).toEqual({ width: 1440, height: 123 })
    })

    it('should prefer options before environment variable', () => {
        const service = new ApplitoolsService({
            key: 'foobar',
            serverUrl: 'foobarserver'
        })
        process.env.APPLITOOLS_KEY = 'foobarenv'
        process.env.APPLITOOLS_SERVER_URL = 'foobarenvserver'
        service.beforeSession()
        expect(service.eyes.setApiKey).toBeCalledWith('foobar')
        expect(service.eyes.setServerUrl).toBeCalledWith('foobarserver')
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
            proxy: proxyOptions
        })

        service.beforeSession()
        expect(service.eyes.setProxy).toBeCalledWith(proxyOptions)
    })

    it('should not set proxy config if not set in options', () => {
        const service = new ApplitoolsService({})
        process.env.APPLITOOLS_KEY = 'foobarenv'

        expect(() => service.beforeSession()).not.toThrow()
        expect(service.eyes.setProxy).not.toBeCalled()
    })

    describe('before hook', () => {
        it('should do nothing if key was not applied', () => {
            const service = new ApplitoolsService({})
            global.browser = new BrowserMock()

            service.before()
            expect(global.browser.addCommand).not.toBeCalled()
        })

        it('should register takeSnapshot command', () => {
            process.env.APPLITOOLS_KEY = 'foobarenv'
            const service = new ApplitoolsService({})
            global.browser = new BrowserMock()

            service.beforeSession()
            service.before()
            expect(global.browser.addCommand).toBeCalled()

            global.browser.takeSnapshot('foobar')
            expect(service.eyes.check).toBeCalledWith('foobar', 'some window')
        })

        it('should throw if takeSnapshot command is used without title', () => {
            process.env.APPLITOOLS_KEY = 'foobarenv'
            const service = new ApplitoolsService({})
            global.browser = new BrowserMock()

            service.beforeSession()
            service.before()
            expect(global.browser.addCommand).toBeCalled()

            expect(() => global.browser.takeSnapshot()).toThrow()
            expect(service.eyes.check).not.toBeCalled()
        })

        it('should register takeRegionSnapshot command', () => {
            process.env.APPLITOOLS_KEY = 'foobarenv'
            const service = new ApplitoolsService({})
            global.browser = new BrowserMock()

            service.beforeSession()
            service.before()
            expect(global.browser.addCommand).toBeCalled()

            global.browser.takeRegionSnapshot('foobar', 'foobarRegion')
            expect(service.eyes.check).toBeCalledWith('foobar', 'foobarRegion')
        })

        it('should register takeRegionSnapshot command with frame', () => {
            process.env.APPLITOOLS_KEY = 'foobarenv'
            const service = new ApplitoolsService({})
            global.browser = new BrowserMock()

            service.beforeSession()
            service.before()
            expect(global.browser.addCommand).toBeCalled()

            global.browser.takeRegionSnapshot('foobar', 'foobarRegion', 'foobarFrame')
            expect(service.eyes.check).toBeCalledWith('foobar', 'foobarRegionWithFrame')
        })

        it('should register if takeRegionSnapshot command is used with null frame', () => {
            process.env.APPLITOOLS_KEY = 'foobarenv'
            const service = new ApplitoolsService({})
            global.browser = new BrowserMock()

            service.beforeSession()
            service.before()
            expect(global.browser.addCommand).toBeCalled()

            global.browser.takeRegionSnapshot('foobar', 'foobarRegion', null)
            expect(service.eyes.check).toBeCalledWith('foobar', 'foobarRegion')
        })

        it('should throw if takeRegionSnapshot command is used without title', () => {
            process.env.APPLITOOLS_KEY = 'foobarenv'
            const service = new ApplitoolsService({})
            global.browser = new BrowserMock()

            service.beforeSession()
            service.before()
            expect(global.browser.addCommand).toBeCalled()

            expect(() => global.browser.takeRegionSnapshot(null, 'foobarRegion')).toThrow()
            expect(service.eyes.check).not.toBeCalled()
        })

        it('should throw if takeRegionSnapshot command is used without region', () => {
            process.env.APPLITOOLS_KEY = 'foobarenv'
            const service = new ApplitoolsService({})
            global.browser = new BrowserMock()

            service.beforeSession()
            service.before()
            expect(global.browser.addCommand).toBeCalled()

            expect(() => global.browser.takeRegionSnapshot('foobar')).toThrow()
            expect(service.eyes.check).not.toBeCalled()
        })

        it('should throw if takeRegionSnapshot command is used with null region', () => {
            process.env.APPLITOOLS_KEY = 'foobarenv'
            const service = new ApplitoolsService({})
            global.browser = new BrowserMock()

            service.beforeSession()
            service.before()
            expect(global.browser.addCommand).toBeCalled()

            expect(() => global.browser.takeRegionSnapshot('foobar', null)).toThrow()
            expect(service.eyes.check).not.toBeCalled()
        })
    })

    describe('beforeTest hook', () => {
        it('should do nothing if key was not applied', () => {
            const service = new ApplitoolsService({})
            global.browser = new BrowserMock()

            service.beforeTest()
            expect(global.browser.call).not.toBeCalled()
        })

        it('should open eyes', () => {
            process.env.APPLITOOLS_KEY = 'foobarenv'
            const service = new ApplitoolsService({})
            global.browser = new BrowserMock()

            service.beforeSession()
            service.beforeTest({ title: 'some title', parent: 'some parent' })

            expect(global.browser.call).toBeCalled()
            expect(service.eyes.open)
                .toBeCalledWith(global.browser, 'some title', 'some parent', { height: 900, width: 1440 })
        })
    })

    describe('afterTest hook', () => {
        it('should do nothing if key was not applied', () => {
            const service = new ApplitoolsService({})
            global.browser = new BrowserMock()

            service.afterTest()
            expect(global.browser.call).not.toBeCalled()
        })

        it('should close eyes', () => {
            process.env.APPLITOOLS_KEY = 'foobarenv'
            const service = new ApplitoolsService({})
            global.browser = new BrowserMock()

            service.beforeSession()
            service.afterTest()

            expect(global.browser.call).toBeCalled()
            expect(service.eyes.close).toBeCalled()
        })
    })

    describe('after hook', () => {
        it('should do nothing if key was not applied', () => {
            const service = new ApplitoolsService({})
            global.browser = new BrowserMock()

            service.after()
            expect(global.browser.call).not.toBeCalled()
        })

        it('should abortIfNotClosed eyes', () => {
            process.env.APPLITOOLS_KEY = 'foobarenv'
            const service = new ApplitoolsService({})
            global.browser = new BrowserMock()

            service.beforeSession()
            service.after()

            expect(global.browser.call).toBeCalled()
            expect(service.eyes.abortIfNotClosed).toBeCalled()
        })
    })
})
