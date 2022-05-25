import { describe, expect, test } from 'vitest'
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
        test.only('should be able to handle async', async () => {
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

        test('should be able to overwrite element command', async () => {
            const browser = await remote(remoteConfig)
            browser.overwriteCommand('getAttribute', customElementCommand, true)
            const elem = await browser.$('#foo')

            // @ts-expect-error command overwritten
            expect(await elem.getAttribute('foo', 'bar')).toBe('foo-value foo bar')
        })

        test('should propagate element commands for all prototypes', async () => {
            const browser = await remote(remoteConfig)
            browser.overwriteCommand('getAttribute', customElementCommand, true)
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
            browser.overwriteCommand('getAttribute', customElementCommand, true)
            const elem = await browser.$('#foo')
            const subElem = await elem.$('.subElem')

            // @ts-expect-error command overwritten
            expect(await subElem.getAttribute('bar', 'foo')).toBe('bar-value bar foo')
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
            await expect(() => browser.waitUntil()).toThrow(error1)
            // @ts-expect-error command overwritten
            await expect(browser.url()).rejects.toThrow(error2)
        })

        test('should properly throw exceptions on the element scope', async () => {
            const browser = await remote(remoteConfig)
            browser.overwriteCommand('click', function () {
                throw error1
            }, true)
            browser.overwriteCommand('waitForDisplayed', async function () {
                await browser.$('#foo')
                throw error2
            }, true)
            const elem = await browser.$('#foo')

            await expect(() => elem.click()).toThrow(error1)
            await expect(elem.waitForDisplayed()).rejects.toThrow(error2)
        })
    })

    describe('multiremote', () => {
        test('should allow to overwrite commands', async () => {
            const browser = await multiremote(multiremoteConfig as any)
            browser.overwriteCommand('pause', customBrowserCommand)

            // @ts-expect-error command overwritten
            expect(await browser.pause(10, 10)).toBeGreaterThanOrEqual(20)
        })

        test('should allow to overwrite commands for a single multiremote instance', async () => {
            const browser = await multiremote(multiremoteConfig as any)
            browser.browserA.overwriteCommand('pause', customBrowserCommand)

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
