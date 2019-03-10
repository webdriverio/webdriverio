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
        const service = new ApplitoolsService()

        expect(() => service.beforeSession({})).toThrow()
        expect(() => service.beforeSession({ applitoolsServerUrl: 'foobar' })).toThrow()

        expect(() => service.beforeSession({ applitoolsKey: 'foobar' })).not.toThrow()
        expect(() => service.beforeSession({ applitoolsKey: 'foobar', applitoolsServerUrl: 'foobar' })).not.toThrow()
    })

    it('throws if key does not exist in environment', () => {
        const service = new ApplitoolsService()

        expect(() => service.beforeSession({})).toThrow()
        process.env.APPLITOOLS_KEY = 'foobarenv'
        process.env.APPLITOOLS_SERVER_URL = 'foobarenvserver'
        expect(() => service.beforeSession({ applitools: { viewport: { height: 123 } } })).not.toThrow()

        expect(service.isConfigured).toBe(true)
        expect(service.eyes.setApiKey).toBeCalledWith('foobarenv')
        expect(service.eyes.setServerUrl).toBeCalledWith('foobarenvserver')
        expect(service.viewport).toEqual({ width: 1440, height: 123 })
    })

    describe('before hook', () => {
        it('should do nothing if key was not applied', () => {
            const service = new ApplitoolsService()
            global.browser = new BrowserMock()

            service.before()
            expect(global.browser.addCommand).not.toBeCalled()
        })

        it('should register takeSnapshot command', () => {
            process.env.APPLITOOLS_KEY = 'foobarenv'
            const service = new ApplitoolsService()
            global.browser = new BrowserMock()

            service.beforeSession({})
            service.before()
            expect(global.browser.addCommand).toBeCalled()

            global.browser.takeSnapshot('foobar')
            expect(service.eyes.check).toBeCalledWith('foobar', 'some window')
        })

        it('should throw if takeSnapshot command is used without title', () => {
            process.env.APPLITOOLS_KEY = 'foobarenv'
            const service = new ApplitoolsService()
            global.browser = new BrowserMock()

            service.beforeSession({})
            service.before()
            expect(global.browser.addCommand).toBeCalled()

            expect(() => global.browser.takeSnapshot()).toThrow()
            expect(service.eyes.check).not.toBeCalled()
        })
    })

    describe('beforeTest hook', () => {
        it('should do nothing if key was not applied', () => {
            const service = new ApplitoolsService()
            global.browser = new BrowserMock()

            service.beforeTest()
            expect(global.browser.call).not.toBeCalled()
        })

        it('should open eyes', () => {
            process.env.APPLITOOLS_KEY = 'foobarenv'
            const service = new ApplitoolsService()
            global.browser = new BrowserMock()

            service.beforeSession({})
            service.beforeTest({ title: 'some title', parent: 'some parent' })

            expect(global.browser.call).toBeCalled()
            expect(service.eyes.open)
                .toBeCalledWith(global.browser, 'some title', 'some parent', { height: 123, width: 1440 })
        })
    })

    describe('afterTest hook', () => {
        it('should do nothing if key was not applied', () => {
            const service = new ApplitoolsService()
            global.browser = new BrowserMock()

            service.afterTest()
            expect(global.browser.call).not.toBeCalled()
        })

        it('should close eyes', () => {
            process.env.APPLITOOLS_KEY = 'foobarenv'
            const service = new ApplitoolsService()
            global.browser = new BrowserMock()

            service.beforeSession({})
            service.afterTest()

            expect(global.browser.call).toBeCalled()
            expect(service.eyes.close).toBeCalled()
        })
    })

    describe('after hook', () => {
        it('should do nothing if key was not applied', () => {
            const service = new ApplitoolsService()
            global.browser = new BrowserMock()

            service.after()
            expect(global.browser.call).not.toBeCalled()
        })

        it('should abortIfNotClosed eyes', () => {
            process.env.APPLITOOLS_KEY = 'foobarenv'
            const service = new ApplitoolsService()
            global.browser = new BrowserMock()

            service.beforeSession({})
            service.after()

            expect(global.browser.call).toBeCalled()
            expect(service.eyes.abortIfNotClosed).toBeCalled()
        })
    })
})
