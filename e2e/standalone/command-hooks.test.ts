import { afterAll, beforeAll, beforeEach, describe, expect, test } from 'vitest'
import { startStandaloneChrome } from './helpers.js'

const PAGE = 'data:text/html,' + encodeURIComponent(`
    <input id="name">
    <ul><li><input></li><li><input></li></ul>
    <div id="box"><span>inside</span></div>
    <button id="button">button</button>
`)

type Call = [name: string, args: unknown[]]

// async hooks, as a hook that logs or measures: each command runs its hooks once, with its arguments
describe.each([false, true])('command hooks of element commands (classic: %s)', (classic) => {
    let browser: WebdriverIO.Browser
    const before: Call[] = []
    const after: Call[] = []
    const hook = (calls: Call[]) => async (name: string, args: unknown[]) => {
        calls.push([name, args])
        await new Promise((resolve) => setTimeout(resolve, 1))
    }

    beforeAll(async () => {
        browser = await startStandaloneChrome({
            beforeCommand: [hook(before)],
            afterCommand: [hook(after)],
            capabilities: {
                browserName: 'chrome',
                ...(classic ? { 'wdio:enforceWebDriverClassic': true } : {}),
                'goog:chromeOptions': { args: ['--headless=new', '--disable-gpu'] }
            }
        })
        await browser.url(PAGE)
        browser.addCommand('valueWith', async function (this: WebdriverIO.Element, suffix: string) {
            return (await this.getValue()) + suffix
        }, { attachToElement: true })
    })

    afterAll(async () => {
        await browser?.deleteSession()
    })

    beforeEach(() => {
        before.length = 0
        after.length = 0
    })

    const names = (calls: Call[]) => calls.map(([name]) => name)
    const count = (calls: Call[], name: string) => names(calls).filter((n) => n === name).length

    test('a protocol command runs its hooks once, with its arguments', async () => {
        const button = await browser.$('#button')
        before.length = 0
        after.length = 0
        await button.elementClick(button.elementId)
        expect(before).toEqual([['elementClick', [button.elementId]]])
        expect(after).toEqual([['elementClick', [button.elementId]]])
    })

    test.each(['an element', 'a list item'])('setValue of %s gives the hooks its arguments, once', async (kind) => {
        const input = kind === 'an element' ? await browser.$('#name') : (await browser.$$('li input'))[1]
        before.length = 0
        after.length = 0
        await input.setValue('hello')
        expect(before[0]).toEqual(['setValue', ['hello']])
        expect(after.at(-1)).toEqual(['setValue', ['hello']])
        expect(count(before, 'setValue')).toBe(1)
        expect(count(after, 'setValue')).toBe(1)
    })

    test('$ of an element gives the hooks its selector', async () => {
        const box = await browser.$('#box')
        before.length = 0
        after.length = 0
        await box.$('span').getText()
        expect(before[0]).toEqual(['$', ['span']])
        expect(count(before, '$')).toBe(1)
    })

    test('a custom element command gives the hooks its arguments, once', async () => {
        const input = await browser.$('#name')
        before.length = 0
        after.length = 0
        // @ts-expect-error custom command
        await input.valueWith('!')
        expect(before[0]).toEqual(['valueWith', ['!']])
        expect(after.at(-1)).toEqual(['valueWith', ['!']])
        expect(count(before, 'valueWith')).toBe(1)
    })

    test('async hooks run for every command, with no emit', async () => {
        const box = await browser.$('#box')
        for (let i = 0; i < 3; i++) {
            before.length = 0
            after.length = 0
            await box.getText()
            expect(count(before, 'getText')).toBe(1)
            expect(count(after, 'getText')).toBe(1)
            expect(after.length).toBe(before.length)
            expect(names(before)).not.toContain('emit')
        }
    })
})
