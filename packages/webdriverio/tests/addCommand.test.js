import { remote, multiremote } from '../src'

const remoteConfig = {
    baseUrl: 'http://foobar.com',
    capabilities: {
        browserName: 'foobar-noW3C'
    }
}

const multiremoteConfig = {
    browserA: {
        logLevel: 'debug',
        capabilities: {
            browserName: 'chrome'
        }
    },
    browserB: {
        logLevel: 'debug',
        port: 4445,
        capabilities: {
            browserName: 'firefox'
        }
    }
}

const error1 = Error('Thrown 1!')
const error2 = new Error('Thrown 2!')

const customCommand = async () => {
    const result = await new Promise(
        (resolve) => setTimeout(() => resolve('foo'), 1))
    return result + 'bar'
}

describe('addCommand', () => {
    describe('remote', () => {
        test('should be able to handle async', async () => {
            const browser = await remote(remoteConfig)

            browser.addCommand('mytest', customCommand)
            expect(typeof browser.mytest).toBe('function')
            expect(await browser.mytest()).toBe('foobar')
        })

        test('should not allow to call custom browser commands on elements', async () => {
            const browser = await remote(remoteConfig)

            browser.addCommand('mytest', customCommand)
            const elem = await browser.$('#foo')
            expect(typeof elem.mytest).toBe('undefined')
        })

        test('should still work on browser calls after fetching an element', async () => {
            const browser = await remote(remoteConfig)
            await browser.$('#foo')

            browser.addCommand('myCustomElementCommand', async function () {
                return this.execute(function () {return 1})
            })

            expect(await browser.myCustomElementCommand()).toBe(1)
        })

        test('should be able to add a command to and element from the browser', async () => {
            const browser = await remote(remoteConfig)

            browser.addCommand('myCustomElementCommand', async function () {
                return this.execute(function () {return 1})
            }, true)

            const elem = await browser.$('#foo')

            expect(await elem.myCustomElementCommand()).toBe(1)
        })

        test('should allow to add custom commands to elements', async () => {
            const browser = await remote(remoteConfig)
            const elem = await browser.$('#foo')
            elem.addCommand('myCustomElementCommand', async function () {
                const result = await new Promise(
                    (resolve) => setTimeout(() => resolve('foo'), 1))
                return result + 'bar-' + this.selector
            })

            expect(typeof browser.myCustomElementCommand).toBe('undefined')
            expect(typeof elem.myCustomElementCommand).toBe('function')
            expect(await elem.myCustomElementCommand()).toBe('foobar-#foo')

            const elem2 = await browser.$('#bar')
            expect(typeof elem2.myCustomElementCommand).toBe('function')
            expect(await elem2.myCustomElementCommand()).toBe('foobar-#bar')
        })

        test('should propagate custom element commands for all prototypes', async () => {
            const browser = await remote(remoteConfig)
            const elem = await browser.$('#foo')

            expect(typeof elem.myCustomElementCommand).toBe('undefined')
            elem.addCommand('myCustomElementCommand', async function () {
                const result = await new Promise(
                    (resolve) => setTimeout(() => resolve('foo'), 1))
                return result + 'bar-' + this.selector + this.index
            })

            const elems = await browser.$$('.someRandomElement')
            expect(typeof elems[0].myCustomElementCommand).toBe('function')
            expect(typeof elems[1].myCustomElementCommand).toBe('function')
            expect(typeof elems[2].myCustomElementCommand).toBe('function')
            expect(await elems[0].myCustomElementCommand()).toBe('foobar-.someRandomElement0')
            expect(await elems[1].myCustomElementCommand()).toBe('foobar-.someRandomElement1')
            expect(await elems[2].myCustomElementCommand()).toBe('foobar-.someRandomElement2')
        })

        test('should propagate custom element commands to sub elements', async () => {
            const browser = await remote(remoteConfig)
            const elem = await browser.$('#foo')

            expect(typeof elem.myCustomElementCommand).toBe('undefined')
            elem.addCommand('myCustomElementCommand', async function () {
                const result = await new Promise(
                    (resolve) => setTimeout(() => resolve('foo'), 1))
                return result + 'bar-' + this.selector
            })

            const subElem = await elem.$('.subElem')
            expect(typeof subElem.myCustomElementCommand).toBe('function')
            expect(await subElem.myCustomElementCommand()).toBe('foobar-.subElem')
        })

        test('should propagate custom element commands to sub elements of elements call', async () => {
            const browser = await remote(remoteConfig)
            const elems = await browser.$$('.someRandomElement')
            const elem = elems[0]

            expect(typeof elem.myCustomElementCommand).toBe('undefined')
            elem.addCommand('myCustomElementCommand', async function () {
                const result = await new Promise(
                    (resolve) => setTimeout(() => resolve('foo'), 1))
                return result + 'bar-' + this.selector
            })

            const subElem = await elem.$('.subElem')
            expect(typeof subElem.myCustomElementCommand).toBe('function')
            expect(await subElem.myCustomElementCommand()).toBe('foobar-.subElem')
        })

        test('should propagate custom element commands to sub elements of elements call', async () => {
            const browser = await remote(remoteConfig)
            const elem = await browser.$('#foo')
            const elems = await elem.$$('.someRandomElement')
            const subElem = elems[0]

            expect(typeof subElem.myCustomElementCommand).toBe('undefined')
            subElem.addCommand('myCustomElementCommand', async function () {
                const result = await new Promise(
                    (resolve) => setTimeout(() => resolve('foo'), 1))
                return result + 'bar-' + this.selector
            })

            expect(typeof subElem.myCustomElementCommand).toBe('function')
            expect(await subElem.myCustomElementCommand()).toBe('foobar-.someRandomElement')
        })

        test('should propagate custom sub element command back to element', async () => {
            const browser = await remote(remoteConfig)
            const elem = await browser.$('#foo')
            const subElem = await elem.$('.subElem')

            expect(typeof elem.myCustomElementCommand).toBe('undefined')
            expect(typeof subElem.myCustomElementCommand).toBe('undefined')
            subElem.addCommand('myCustomElementCommand', async function () {
                const result = await new Promise(
                    (resolve) => setTimeout(() => resolve('foo'), 1))
                return result + 'bar-' + this.selector
            })

            expect(typeof elem.myCustomElementCommand).toBe('undefined')
            expect(typeof subElem.myCustomElementCommand).toBe('function')
            expect(await subElem.myCustomElementCommand()).toBe('foobar-.subElem')

            const otherElem = await browser.$('#otherFoo')
            expect(typeof otherElem.myCustomElementCommand).toBe('function')
            expect(await otherElem.myCustomElementCommand()).toBe('foobar-#otherFoo')
            const otherSubElem = await otherElem.$('.otherSubElem')
            expect(typeof otherSubElem.myCustomElementCommand).toBe('function')
            expect(await otherSubElem.myCustomElementCommand()).toBe('foobar-.otherSubElem')
        })

        test('should properly throw exceptions on the browser scope', async () => {
            const browser = await remote(remoteConfig)
            browser.addCommand('function1', function () {
                throw error1
            })

            browser.addCommand('function2', function () {
                browser.$('#foo')
                throw error2
            })

            await expect(() => browser.function1()).toThrow(error1)
            await expect(() => browser.function2()).toThrow(error2)
        })

        test('should be able to catch exceptions from the element scope', async () => {
            const browser = await remote(remoteConfig)
            browser.addCommand('function1', function () {
                throw error1
            })

            browser.addCommand('function2', function () {
                browser.$('#foo')
                throw error2
            })

            try {
                await browser.function1()
            } catch (error) {
                expect(error).toBe(error1)
            }

            try {
                await browser.function2()
            } catch (error) {
                expect(error).toBe(error2)
            }
            expect.assertions(2)
        })

        test('should properly throw exceptions on the element scope', async () => {
            const browser = await remote(remoteConfig)
            browser.addCommand('function1', function () {
                throw error1
            }, true)
            browser.addCommand('function2', function () {
                browser.$('#foo')
                throw error2
            }, true)
            const elem = await browser.$('#foo')

            await expect(elem.function1()).rejects.toThrow(error1)
            await expect(elem.function2()).rejects.toThrow(error2)
        })

        test('should be able to catch exceptions from the element scope', async () => {
            const browser = await remote(remoteConfig)
            browser.addCommand('function1', function () {
                throw error1
            }, true)
            browser.addCommand('function2', function () {
                browser.$('#foo')
                throw error2
            }, true)
            const elem = await browser.$('#foo')

            try {
                await elem.function1()
            } catch (error) {
                expect(error).toBe(error1)
            }

            try {
                await elem.function2()
            } catch (error) {
                expect(error).toBe(error2)
            }
            expect.assertions(2)
        })
    })

    describe('multiremote', () => {
        test('should allow to register custom commands to multiremote instance', async () => {
            const browser = await multiremote(multiremoteConfig)

            expect(typeof browser.myCustomCommand).toBe('undefined')
            browser.addCommand('myCustomCommand', async function (param) {
                const commandResult = await this.execute(() => 'foobar')
                return { param, commandResult }
            })

            expect(typeof browser.myCustomCommand).toBe('function')
            const { param, commandResult } = await browser.myCustomCommand('barfoo')
            expect(param).toBe('barfoo')
            expect(commandResult).toEqual(['foobar', 'foobar'])
        })

        test('should allow to register custom commands to a single multiremote instance', async () => {
            const browser = await multiremote(multiremoteConfig)

            expect(typeof browser.myOtherCustomCommand).toBe('undefined')
            browser.browserA.addCommand('myOtherCustomCommand', async function (param) {
                const commandResult = await this.execute(() => 'foobar')
                return { param, commandResult }
            })

            expect(typeof browser.myOtherCustomCommand).toBe('undefined')
            expect(typeof browser.browserB.myOtherCustomCommand).toBe('undefined')
            expect(typeof browser.browserA.myOtherCustomCommand).toBe('function')
            const { param, commandResult } = await browser.browserA.myOtherCustomCommand('barfoo')
            expect(param).toBe('barfoo')
            expect(commandResult).toEqual('foobar')
        })

        test('should not allow to call custom multi browser commands on elements', async () => {
            const browser = await multiremote(multiremoteConfig)
            browser.addCommand('myCustomOtherOtherCommand', async function (param) {
                const commandResult = await this.execute(() => 'foobar')
                return { param, commandResult }
            })

            const elem = await browser.$('#foo')
            expect(typeof elem.myCustomOtherOtherCommand).toBe('undefined')
            expect(typeof elem.browserA.myCustomOtherOtherCommand).toBe('undefined')
            expect(typeof elem.browserB.myCustomOtherOtherCommand).toBe('undefined')
        })
    })
})
