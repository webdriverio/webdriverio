import { afterAll, beforeAll, describe, expect, test } from 'vitest'
import { startStandaloneChrome } from './helpers.js'

/**
 * Inputs whose value can't be typed. Each records the events it got, so
 * the test sees what a page listening to them would.
 */
const PAGE = 'data:text/html,' + encodeURIComponent(`
    <input id="range" type="range" min="0" max="100" step="1" value="50">
    <input id="stepped" type="range" min="0" max="100" step="10" value="50">
    <input id="date" type="date">
    <input id="datetime" type="datetime-local">
    <input id="month" type="month">
    <input id="week" type="week">
    <input id="time" type="time">
    <input id="color" type="color">
    <input id="text" type="text">
    <input id="number" type="number">
    <input id="disabled" type="date" disabled>
    <script>
        window.events = {}
        for (const input of document.querySelectorAll('input')) {
            for (const name of ['input', 'change']) {
                input.addEventListener(name, () => {
                    (window.events[input.id] ??= []).push(name)
                })
            }
        }
    </script>
`)

describe.each([false, true])('setValue on input types (classic: %s)', (classic) => {
    let browser: WebdriverIO.Browser

    beforeAll(async () => {
        browser = await startStandaloneChrome(classic
            ? { capabilities: { browserName: 'chrome', 'wdio:enforceWebDriverClassic': true, 'goog:chromeOptions': { args: ['--headless=new', '--disable-gpu'] } } }
            : {}
        )
        await browser.url(PAGE)
    })

    afterAll(async () => {
        await browser?.deleteSession()
    })

    const events = (id: string) => browser.execute((key) => (window as unknown as { events: Record<string, string[]> }).events[key] ?? [], id)

    test.each([
        ['range', '67', '67'],
        ['range', 0, '0'],
        ['date', '2026-10-04', '2026-10-04'],
        ['datetime', '2026-10-04T14:30', '2026-10-04T14:30'],
        ['month', '2026-10', '2026-10'],
        ['week', '2026-W40', '2026-W40'],
        ['time', '14:30', '14:30'],
        ['color', '#ff8800', '#ff8800'],
        ['text', 'hello world', 'hello world'],
        ['number', 42, '42']
    ])('#%s takes %s', async (id, value, expected) => {
        const input = await browser.$(`#${id}`)
        await input.setValue(value)
        expect(await input.getValue()).toBe(expected)
        // typed text fires `change` when the field loses focus, a picked value right away
        const typed = id === 'text' || id === 'number'
        expect(await events(id)).toEqual(expect.arrayContaining(typed ? ['input'] : ['input', 'change']))
    })

    test('a range input takes the nearest allowed value', async () => {
        const input = await browser.$('#stepped')
        await input.setValue('67')
        expect(await input.getValue()).toBe('70')
    })

    test('setValue replaces the previous value', async () => {
        const input = await browser.$('#date')
        await input.setValue('2026-10-04')
        await input.setValue('2027-01-31')
        expect(await input.getValue()).toBe('2027-01-31')
    })

    test('a disabled input is not changed', async () => {
        const input = await browser.$('#disabled')
        await expect(input.setValue('2026-10-04')).rejects.toThrow()
        expect(await input.getValue()).toBe('')
        expect(await events('disabled')).toEqual([])
    })
})
