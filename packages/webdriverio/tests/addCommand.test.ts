import path from 'node:path'
import { describe, test, expect, vi } from 'vitest'
import type { Options, Capabilities } from '@wdio/types'

import { remote, multiremote } from '../src/index.js'

vi.mock('got')
vi.mock('devtools')
vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))

const remoteConfig: Options.WebdriverIO = {
    baseUrl: 'http://foobar.com',
    capabilities: {
        browserName: 'foobar-noW3C'
    }
}

declare global {
    namespace WebdriverIO {
        interface Browser {
            myOtherCustomCommand: (param: string) => Promise<{ param: string, commandResult: string }>
        }

        interface MultiRemoteBrowser {
            myCustomCommand: (arg: any) => Promise<void>
            myOtherCustomCommand: (param: string) => Promise<{ param: string, commandResult: string }>
        }

        interface MultiRemoteElement {
            myCustomOtherOtherCommand: (param: string) => Promise<{ param: string, commandResult: string }>
        }
    }
}

const multiremoteConfig: Capabilities.MultiRemoteCapabilities = {
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
            // @ts-expect-error undefined custom command
            expect(typeof browser.mytest).toBe('function')
            // @ts-expect-error undefined custom command
            expect(await browser.mytest()).toBe('foobar')
        })

        test('should not allow to call custom browser commands on elements', async () => {
            const browser = await remote(remoteConfig)

            browser.addCommand('mytest', customCommand)
            const elem = await browser.$('#foo')
            // @ts-expect-error undefined custom command
            expect(typeof elem.mytest).toBe('undefined')
        })

        test('should still work on browser calls after fetching an element', async () => {
            const browser = await remote(remoteConfig)
            await browser.$('#foo')

            browser.addCommand('myCustomElementCommand', async function (this: WebdriverIO.Browser) {
                return this.execute(function () { return 1 })
            })

            // @ts-expect-error undefined custom command
            expect(await browser.myCustomElementCommand()).toBe(1)
        })

        test('should be able to add a command to an element from the browser', async () => {
            const browser = await remote(remoteConfig)

            browser.addCommand('myCustomElementCommand', async function (this: WebdriverIO.Element) {
                const size = await this.getSize()
                return size.width
            }, true)

            const elem = await browser.$('#foo')

            // @ts-expect-error undefined custom command
            expect(await elem.myCustomElementCommand()).toBe(50)
        })

        test('should allow to add custom commands to elements', async () => {
            const browser = await remote(remoteConfig)
            const elem = await browser.$('#foo')
            elem.addCommand('myCustomElementCommand', async function (this: WebdriverIO.Element) {
                const result = await new Promise(
                    (resolve) => setTimeout(() => resolve('foo'), 1))
                return result + 'bar-' + this.selector
            })

            // @ts-expect-error undefined custom command
            expect(typeof browser.myCustomElementCommand).toBe('undefined')
            // @ts-expect-error undefined custom command
            expect(typeof elem.myCustomElementCommand).toBe('function')
            // @ts-expect-error undefined custom command
            expect(await elem.myCustomElementCommand()).toBe('foobar-#foo')

            const elem2 = await browser.$('#bar')
            // @ts-expect-error undefined custom command
            expect(typeof elem2.myCustomElementCommand).toBe('function')
            // @ts-expect-error undefined custom command
            expect(await elem2.myCustomElementCommand()).toBe('foobar-#bar')
        })

        test('should propagate custom element commands for all prototypes', async () => {
            const browser = await remote(remoteConfig)
            const elem = await browser.$('#foo')

            // @ts-expect-error undefined custom command
            expect(typeof elem.myCustomElementCommand).toBe('undefined')
            elem.addCommand('myCustomElementCommand', async function (this: WebdriverIO.Element) {
                const result = await new Promise(
                    (resolve) => setTimeout(() => resolve('foo'), 1))
                return result + 'bar-' + this.selector + this.index
            })

            const elems = await browser.$$('.someRandomElement')
            // @ts-expect-error undefined custom command
            expect(typeof elems[0].myCustomElementCommand).toBe('function')
            // @ts-expect-error undefined custom command
            expect(typeof elems[1].myCustomElementCommand).toBe('function')
            // @ts-expect-error undefined custom command
            expect(typeof elems[2].myCustomElementCommand).toBe('function')
            // @ts-expect-error undefined custom command
            expect(await elems[0].myCustomElementCommand()).toBe('foobar-.someRandomElement0')
            // @ts-expect-error undefined custom command
            expect(await elems[1].myCustomElementCommand()).toBe('foobar-.someRandomElement1')
            // @ts-expect-error undefined custom command
            expect(await elems[2].myCustomElementCommand()).toBe('foobar-.someRandomElement2')
        })

        test('should propagate custom element commands to sub elements', async () => {
            const browser = await remote(remoteConfig)
            const elem = await browser.$('#foo')

            // @ts-expect-error undefined custom command
            expect(typeof elem.myCustomElementCommand).toBe('undefined')
            elem.addCommand('myCustomElementCommand', async function (this: WebdriverIO.Element) {
                const result = await new Promise(
                    (resolve) => setTimeout(() => resolve('foo'), 1))
                return result + 'bar-' + this.selector
            })

            const subElem = await elem.$('.subElem')
            // @ts-expect-error undefined custom command
            expect(typeof subElem.myCustomElementCommand).toBe('function')
            // @ts-expect-error undefined custom command
            expect(await subElem.myCustomElementCommand()).toBe('foobar-.subElem')
        })

        test('should propagate custom element commands to sub elements of elements call', async () => {
            const browser = await remote(remoteConfig)
            const elems = await browser.$$('.someRandomElement')
            const elem = elems[0]

            // @ts-expect-error undefined custom command
            expect(typeof elem.myCustomElementCommand).toBe('undefined')
            elem.addCommand('myCustomElementCommand', async function (this: WebdriverIO.Element) {
                const result = await new Promise(
                    (resolve) => setTimeout(() => resolve('foo'), 1))
                return result + 'bar-' + this.selector
            })

            const subElem = await elem.$('.subElem')
            // @ts-expect-error undefined custom command
            expect(typeof subElem.myCustomElementCommand).toBe('function')
            // @ts-expect-error undefined custom command
            expect(await subElem.myCustomElementCommand()).toBe('foobar-.subElem')
        })

        test('should propagate custom element commands to sub elements of elements call', async () => {
            const browser = await remote(remoteConfig)
            const elem = await browser.$('#foo')
            const elems = await elem.$$('.someRandomElement')
            const subElem = elems[0]

            // @ts-expect-error undefined custom command
            expect(typeof subElem.myCustomElementCommand).toBe('undefined')
            subElem.addCommand('myCustomElementCommand', async function (this: WebdriverIO.Element) {
                const result = await new Promise(
                    (resolve) => setTimeout(() => resolve('foo'), 1))
                return result + 'bar-' + this.selector
            })

            // @ts-expect-error undefined custom command
            expect(typeof subElem.myCustomElementCommand).toBe('function')
            // @ts-expect-error undefined custom command
            expect(await subElem.myCustomElementCommand()).toBe('foobar-.someRandomElement')
        })

        test('should propagate custom sub element command back to element', async () => {
            const browser = await remote(remoteConfig)
            const elem = await browser.$('#foo')
            const subElem = await elem.$('.subElem')

            // @ts-expect-error undefined custom command
            expect(typeof elem.myCustomElementCommand).toBe('undefined')
            // @ts-expect-error undefined custom command
            expect(typeof subElem.myCustomElementCommand).toBe('undefined')
            subElem.addCommand('myCustomElementCommand', async function (this: WebdriverIO.Element) {
                const result = await new Promise(
                    (resolve) => setTimeout(() => resolve('foo'), 1))
                return result + 'bar-' + this.selector
            })

            // @ts-expect-error undefined custom command
            expect(typeof elem.myCustomElementCommand).toBe('undefined')
            // @ts-expect-error undefined custom command
            expect(typeof subElem.myCustomElementCommand).toBe('function')
            // @ts-expect-error undefined custom command
            expect(await subElem.myCustomElementCommand()).toBe('foobar-.subElem')

            const otherElem = await browser.$('#otherFoo')
            // @ts-expect-error undefined custom command
            expect(typeof otherElem.myCustomElementCommand).toBe('function')
            // @ts-expect-error undefined custom command
            expect(await otherElem.myCustomElementCommand()).toBe('foobar-#otherFoo')
            const otherSubElem = await otherElem.$('.otherSubElem')
            // @ts-expect-error undefined custom command
            expect(typeof otherSubElem.myCustomElementCommand).toBe('function')
            // @ts-expect-error undefined custom command
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

            // @ts-expect-error undefined custom command
            await expect(() => browser.function1()).rejects.toThrow(error1)
            // @ts-expect-error undefined custom command
            await expect(() => browser.function2()).rejects.toThrow(error2)
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
                // @ts-expect-error undefined custom command
                await browser.function1()
            } catch (error) {
                expect(error).toBe(error1)
            }

            try {
                // @ts-expect-error undefined custom command
                await browser.function2()
            } catch (error) {
                expect(error).toBe(error2)
            }
            // @ts-ignore uses expect-webdriverio
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

            // @ts-expect-error undefined custom command
            await expect(elem.function1()).rejects.toThrow(error1)
            // @ts-expect-error undefined custom command
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
                // @ts-expect-error undefined custom command
                await elem.function1()
            } catch (error) {
                expect(error).toBe(error1)
            }

            try {
                // @ts-expect-error undefined custom command
                await elem.function2()
            } catch (error) {
                expect(error).toBe(error2)
            }
            // @ts-ignore uses expect-webdriverio
            expect.assertions(2)
        })
    })

    describe('multiremote', () => {
        test('should allow to register custom commands to multiremote instance', async () => {
            const browser = await multiremote(multiremoteConfig)

            expect(typeof browser.myCustomCommand).toBe('undefined')
            browser.addCommand('myCustomCommand', async function (this: WebdriverIO.Browser, param: any) {
                const commandResult = await this.execute(() => 'foobar')
                return { param, commandResult }
            })

            expect(typeof browser.myCustomCommand).toBe('function')
            // @ts-expect-error undefined custom command
            const { param, commandResult } = await browser.myCustomCommand('barfoo')
            expect(param).toBe('barfoo')
            expect(commandResult).toEqual(['foobar', 'foobar'])
        })

        test('should allow to register custom commands to a single multiremote instance', async () => {
            const browser = await multiremote(multiremoteConfig)

            expect(typeof browser.myOtherCustomCommand).toBe('undefined')
            browser.getInstance('browserA').addCommand('myOtherCustomCommand', async function (this: WebdriverIO.Browser, param: string) {
                const commandResult = await this.execute(() => 'foobar')
                return { param, commandResult }
            })

            expect(typeof browser.myOtherCustomCommand).toBe('undefined')
            expect(typeof browser.getInstance('browserB').myOtherCustomCommand).toBe('undefined')
            expect(typeof browser.getInstance('browserA').myOtherCustomCommand).toBe('function')
            const { param, commandResult } = await browser.getInstance('browserA').myOtherCustomCommand('barfoo')
            expect(param).toBe('barfoo')
            expect(commandResult).toEqual('foobar')
        })

        test('should not allow to call custom multi browser commands on elements', async () => {
            const browser = await multiremote(multiremoteConfig)
            browser.addCommand('myCustomOtherOtherCommand', async function (this: WebdriverIO.Browser, param: any) {
                const commandResult = await this.execute(() => 'foobar')
                return { param, commandResult }
            })

            const elem = await browser.$('#foo')
            expect(typeof elem.myCustomOtherOtherCommand).toBe('undefined')
            // @ts-expect-error undefined custom command
            expect(typeof elem.browserA.myCustomOtherOtherCommand).toBe('undefined')
            // @ts-expect-error undefined custom command
            expect(typeof elem.browserB.myCustomOtherOtherCommand).toBe('undefined')
        })
    })
})
