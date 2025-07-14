import path from 'node:path'
import { describe, expect, expectTypeOf, test, vi } from 'vitest'
import type { ClickOptions } from '../src/index.js'
import { remote, multiremote } from '../src/index.js'

vi.mock('fetch')
vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))

const remoteConfig = {
    baseUrl: 'http://foobar.com',
    capabilities: {
        browserName: 'foobar'
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

const customElementCommand = async (origCmd: Function, origCmdArg: any[], arg: any) => {
    const result = await new Promise(
        (resolve) => setTimeout(async () => resolve(await origCmd(origCmdArg)), 1))
    return `${result} ${origCmdArg} ${arg}`
}

const customBrowserCommand = async (origCmd: Function, origCmdArg: number, arg = 0) => {
    const start = Date.now() - 1
    await origCmd(origCmdArg + arg)
    return Date.now() - start
}

describe('overwriteCommand', () => {
    describe('remote', () => {

        describe('given browser scope', () => {

            test('should be able to handle async', async () => {
                const browser = await remote(remoteConfig)
                browser.overwriteCommand('pause', customBrowserCommand)

                // @ts-expect-error command overwritten
                expect(await browser.pause(10, 10)).toBeGreaterThanOrEqual(20)
            })

            test('should be able to handle async', async () => {
                const browser = await remote(remoteConfig)
                browser.overwriteCommand('pause', customBrowserCommand)

                // @ts-expect-error command overwritten
                expect(await browser.pause(10, 10)).toBeGreaterThanOrEqual(20)
            })

            test('should still work on browser calls after fetching an element', async () => {
                const browser = await remote(remoteConfig)
                await browser.$('#foo')
                browser.overwriteCommand('pause', customBrowserCommand)

                expect(await browser.pause(9)).toBeGreaterThanOrEqual(9)
            })

            test('should properly throw exceptions on the browser scope', async () => {
                const browser = await remote(remoteConfig)
                browser.overwriteCommand('waitUntil', function () {
                    throw error1
                })

                browser.overwriteCommand('url', async function () {
                    await browser.$('#foo')
                    throw error2
                })

                // @ts-expect-error command overwritten
                await expect(() => browser.waitUntil()).rejects.toThrow(error1)
                // @ts-expect-error command overwritten
                await expect(browser.url()).rejects.toThrow(error2)
            })

            test('should resolve return type properly', async () => {
                const browser = await remote(remoteConfig)
                let origCommand
                browser.overwriteCommand(
                    'pause',
                    async function (originalFunction /* (milliseconds?: number | undefined) => Promise<void> */) {
                        origCommand = originalFunction

                        const promise: Promise<void> = originalFunction(10)
                        return await promise
                    },
                    false,
                )

                await expect(browser.pause()).resolves.toBeUndefined()
                expect(origCommand).toBeDefined()
            })

            test('should get a ts error and runtime error when trying to overwrite an non-existing command', async () => {
                const browser = await remote(remoteConfig)

                expect(() => browser.overwriteCommand(
                    // @ts-expect-error cannot overwrite non-existing command
                    'click',
                    async function () {}
                )).toThrow('overwriteCommand: no command to be overwritten: click')
            })

            test('should infer properly the argument this of the func to the Browser type', async () => {
                const browser = await remote(remoteConfig)
                vi.spyOn(browser, 'scroll')

                browser.overwriteCommand('pause', async function (this) {
                    this.scroll(0, 100)
                })

                await browser.pause(10)

                expect(browser.scroll).toHaveBeenCalledTimes(1)
            })
        })
        describe('given element scope', () => {
            const isElementScope = true

            test('should propagate element commands for all prototypes', async () => {
                const browser = await remote(remoteConfig)
                browser.overwriteCommand('getAttribute', customElementCommand, isElementScope)
                const elems = await browser.$$('.someRandomElement')

                // @ts-expect-error command overwritten
                expect(await elems[0].getAttribute('0', 'q')).toBe('0-value 0 q')
                // @ts-expect-error command overwritten
                expect(await elems[1].getAttribute('1', 'w')).toBe('1-value 1 w')
                // @ts-expect-error command overwritten
                expect(await elems[2].getAttribute('2', 'e')).toBe('2-value 2 e')
            })

            test('should propagate element commands to sub elements', async () => {
                const browser = await remote(remoteConfig)
                browser.overwriteCommand('getAttribute', customElementCommand, isElementScope)
                const elem = await browser.$('#foo')
                const subElem = await elem.$('.subElem')

                // @ts-expect-error command overwritten
                expect(await subElem.getAttribute('bar', 'foo')).toBe('bar-value bar foo')
            })

            test('should be able to overwrite element command', async () => {
                const browser = await remote(remoteConfig)
                browser.overwriteCommand('getAttribute', customElementCommand, isElementScope)
                const elem = await browser.$('#foo')

                // @ts-expect-error command overwritten
                expect(await elem.getAttribute('foo', 'bar')).toBe('foo-value foo bar')
            })

            test('should properly throw exceptions on the element scope', async () => {
                const browser = await remote(remoteConfig)
                browser.overwriteCommand('click', function () {
                    throw error1
                }, isElementScope)
                browser.overwriteCommand('waitForDisplayed', async function () {
                    await browser.$('#foo')
                    throw error2
                }, isElementScope)
                const elem = await browser.$('#foo')

                await expect(() => elem.click()).rejects.toThrow(error1)
                await expect(elem.waitForDisplayed()).rejects.toThrow(error2)
            })

            test('should resolve the return of the original command function type properly', async () => {

                const browser = await remote(remoteConfig)

                browser.overwriteCommand(
                    'getText',
                    async function (originalFunction /* Expecting return a Promise<string> */) {

                        const text: string = await originalFunction()
                        return text + ' - overwritten'
                    },
                    isElementScope,
                )

                const element = await browser.$('.someRandomElement')
                vi.spyOn(element, 'getElementText').mockResolvedValue('some text')

                expect(await element.getText()).toBe('some text - overwritten')
            })

            test('should resolve the parameters of the original command function type properly', async () => {
                const browser = await remote(remoteConfig)
                let origFunction
                browser.overwriteCommand(
                    'click',
                    async function (originalFunction /* Expecting the type to be (options: Partial<ClickOptions>) => Promise<void> */) {
                        origFunction = originalFunction
                        expectTypeOf<Parameters<typeof originalFunction>[0]>().toEqualTypeOf<Partial<ClickOptions> | undefined>()

                        const clickOptions: Partial<ClickOptions> = { skipRelease: true }
                        return originalFunction(clickOptions)
                    },
                    isElementScope,
                )

                const element = await browser.$('.someRandomElement')

                await expect(element.click()).resolves.toBeUndefined()
                expect(origFunction).toBeDefined()
            })

            test('should resolve the this parameters type by inference automatically', async () => {
                const browser = await remote(remoteConfig)
                browser.overwriteCommand(
                    'click',
                    async function (this /* Expect to be WebdriverIO.Element */ ) {
                        return this.getText()
                    },
                    isElementScope,
                )

                const element = await browser.$('.someRandomElement')
                vi.spyOn(element, 'getText')
                vi.spyOn(element, 'getElementText').mockResolvedValue('some text')

                expect(await element.click()).toBe('some text')
                expect(element.getText).toHaveBeenCalledTimes(1)
            })

            test('should get a ts error error when trying to overwrite an non-existing command', async () => {
                const browser = await remote(remoteConfig)

                browser.overwriteCommand(
                    // @ts-expect-error cannot overwrite non-existing command
                    'press',
                    async function () {},
                    isElementScope)
            })
        })
    })

    describe('multiremote', () => {
        test('should allow to overwrite commands', async () => {
            const browser = await multiremote(multiremoteConfig as any)
            browser.overwriteCommand('pause', customBrowserCommand)

            // @ts-expect-error command overwritten
            expect(await browser.pause(10, 10)).toBeGreaterThanOrEqual(20)
        })

        test.skip('should allow to overwrite commands for a single multiremote instance', async () => {
            const browser = await multiremote(multiremoteConfig as any)
            browser.getInstance('browserA').overwriteCommand('pause', customBrowserCommand)

            // @ts-expect-error command overwritten
            expect(await browser.browserA.pause(10, 10)).toBeGreaterThanOrEqual(20)
            // @ts-expect-error command overwritten
            expect(await browser.browserB.pause(10)).toBe(undefined)

            const results = await browser.pause(10)
            expect(results[0]).toBeGreaterThanOrEqual(10)
            expect(results[1]).toBe(undefined)
        })

        test('should be able to overwrite element command in multiremote mode', async () => {
            const browser = await multiremote(multiremoteConfig as any)
            browser.overwriteCommand('getAttribute', customElementCommand, true)
            const elem = await browser.$('#foo')

            // @ts-expect-error command overwritten
            expect(await elem.getAttribute('foo', 'bar')).toEqual([
                'foo-value foo bar', 'foo-value foo bar'
            ])
        })
    })
})
