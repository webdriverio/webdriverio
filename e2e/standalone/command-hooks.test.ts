import { afterAll, beforeAll, describe, expect, test } from 'vitest'
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
    const ids: [string, string, string | undefined][] = []
    const hook = (calls: Call[]) => async (name: string, args: unknown[]) => {
        calls.push([name, args])
        await new Promise((resolve) => setTimeout(resolve, 1))
    }

    beforeAll(async () => {
        browser = await startStandaloneChrome({
            beforeCommand: [hook(before), function (this: WebdriverIO.Element, name: string) { ids.push(['before', name, this?.elementId]) }],
            afterCommand: [hook(after), function (this: WebdriverIO.Element, name: string) { ids.push(['after', name, this?.elementId]) }],
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

    const names = (calls: Call[]) => calls.map(([name]) => name)
    // in BiDi, background commands of the session can also run the hooks: read only the given commands
    const only = (calls: Call[], ...commands: string[]) => calls.filter(([name]) => commands.includes(name))

    test('a protocol command runs its hooks once, with its arguments', async () => {
        const button = await browser.$('#button')
        before.length = 0
        after.length = 0
        await button.elementClick(button.elementId)
        expect(only(before, 'elementClick')).toEqual([['elementClick', [button.elementId]]])
        expect(only(after, 'elementClick')).toEqual([['elementClick', [button.elementId]]])
    })

    test.each(['an element', 'a list item'])('setValue of %s gives the hooks its arguments, once', async (kind) => {
        const input = kind === 'an element' ? await browser.$('#name') : (await browser.$$('li input'))[1]
        before.length = 0
        after.length = 0
        await input.setValue('hello')
        expect(only(before, 'setValue')).toEqual([['setValue', ['hello']]])
        expect(only(after, 'setValue')).toEqual([['setValue', ['hello']]])
    })

    test('$ of an element gives the hooks its selector', async () => {
        const box = await browser.$('#box')
        before.length = 0
        after.length = 0
        await box.$('span').getText()
        expect(only(before, '$')).toEqual([['$', ['span']]])
    })

    test('a custom element command gives the hooks its arguments, once', async () => {
        const input = await browser.$('#name')
        before.length = 0
        after.length = 0
        // @ts-expect-error custom command
        await input.valueWith('!')
        expect(only(before, 'valueWith')).toEqual([['valueWith', ['!']]])
        expect(only(after, 'valueWith')).toEqual([['valueWith', ['!']]])
    })

    test('beforeCommand runs before the wait for an element that shows up late, afterCommand after it', async () => {
        await browser.execute(() => { setTimeout(() => document.body.insertAdjacentHTML('beforeend', '<p id="late">late</p>'), 300) })
        const late = await browser.$('#late')
        expect(late.elementId).toBeUndefined()
        ids.length = 0
        expect(await late.getText()).toBe('late')
        expect(ids.filter(([, name]) => name === 'getText')).toEqual([['before', 'getText', undefined], ['after', 'getText', late.elementId]])
    })

    test('async hooks run for every command, with no emit', async () => {
        const box = await browser.$('#box')
        for (let i = 0; i < 3; i++) {
            before.length = 0
            after.length = 0
            await box.getText()
            expect(names(only(before, 'getText'))).toEqual(['getText'])
            expect(names(only(after, 'getText'))).toEqual(['getText'])
            expect(names(before)).not.toContain('emit')
        }
    })
})
