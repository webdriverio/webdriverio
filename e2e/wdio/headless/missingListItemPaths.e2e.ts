import { createServer, type Server } from 'node:http'
import { once } from 'node:events'
import type { AddressInfo } from 'node:net'
import { browser, expect } from '@wdio/globals'

import { row, outcome, type Item } from './missingListItemOutcome.js'

const PAGE = `
<title>Missing list item paths</title>
<ul id="list"><li>a</li><li>b</li><li>c</li></ul>
<ul id="other"><li class="other">o</li></ul>
<ul id="late"></ul>
<div id="host"></div>
<iframe id="frame" srcdoc="<ul id='frame-list'><li>x</li></ul>"></iframe>
<script>
    document.getElementById('host').attachShadow({ mode: 'open' }).innerHTML = '<p>1</p><p>2</p>'
    window.timers = []
    window.renderLate = (delay) => window.timers.push(setTimeout(() => {
        document.getElementById('late').innerHTML = [0, 1, 2, 3, 4, 5].map((i) => '<li>l' + i + '</li>').join('')
    }, delay))
    window.resetLate = () => {
        window.timers.forEach(clearTimeout)
        window.timers = []
        document.getElementById('late').innerHTML = ''
    }
</script>
`

/**
 * the index wait of `$$(selector)[index]` (`waitforTimeout`); no list here ever reaches its index
 */
const WAIT = 200

const CHECKS = {
    'isExisting': (item: Item) => item.isExisting(),
    'isDisplayed': (item: Item) => item.isDisplayed(),
    'isClickable': (item: Item) => item.isClickable(),
    'waitForExist reverse': (item: Item) => item.waitForExist({ reverse: true, timeout: WAIT }),
    'waitForDisplayed reverse': (item: Item) => item.waitForDisplayed({ reverse: true, timeout: WAIT }),
    'getText': (item: Item) => item.getText(),
    'click': (item: Item) => item.click(),
    'not.toExist': (item: Item) => expect(item).not.toExist({ wait: WAIT }),
    'not.toBeDisplayed': (item: Item) => expect(item).not.toBeDisplayed({ wait: WAIT }),
    'toExist': (item: Item) => expect(item).toExist({ wait: WAIT }),
    'not.toBeEnabled': (item: Item) => expect(item).not.toBeEnabled({ wait: WAIT }),
}
type Row = Record<keyof typeof CHECKS, string>

const every = (label: string) => Object.fromEntries(Object.keys(CHECKS).map((check) => [check, label])) as Row

/**
 * `$('#missing')`: the behavior that #12576 asks for an index that the list never reaches
 */
const REFERENCE: Row = {
    'isExisting': 'false',
    'isDisplayed': 'false',
    'isClickable': 'false',
    'waitForExist reverse': 'true',
    'waitForDisplayed reverse': 'true',
    'getText': 'can\'t call getText on #missing',
    'click': 'can\'t call click on #missing',
    'not.toExist': 'ok',
    'not.toBeDisplayed': 'ok',
    'toExist': 'assertion fails',
    'not.toBeEnabled': 'can\'t call isEnabled on #missing',
}

/**
 * the "not found" item: the checks as `$('#missing')`, and a command that needs the
 * element throws the "Index out of bounds" error of the index wait
 */
const NOT_FOUND_ITEM: Row = {
    ...REFERENCE,
    'getText': 'Index out of bounds',
    'click': 'Index out of bounds',
    'not.toBeEnabled': 'Index out of bounds',
}

/**
 * a derived list gives no item for an index past its end (current behavior, its own
 * follow-up): a command throws, `not.toExist` passes, the other matchers fail
 */
const NO_ITEM = (commandError: string): Row => ({
    ...every(commandError),
    'not.toExist': 'ok',
    'not.toBeDisplayed': 'assertion fails',
    'toExist': 'assertion fails',
    'not.toBeEnabled': 'assertion fails',
})

/**
 * A baseline of every way to get an item of a list, for an index that the list never
 * reaches (#12576), compared with `$('#missing')`. A row that differs from the reference
 * says why. Each check runs on a new item.
 */
describe('an index that the list never reaches, by entry path', () => {
    let server: Server
    let url: string
    let page: WebdriverIO.BrowsingContext | undefined
    let waitforTimeout: number | undefined

    before(async () => {
        server = createServer((_, response) => {
            response.setHeader('Content-Type', 'text/html; charset=utf-8')
            response.end(PAGE)
        })
        server.listen(0, '127.0.0.1')
        await once(server, 'listening')
        url = `http://127.0.0.1:${(server.address() as AddressInfo).port}/`
        waitforTimeout = browser.options.waitforTimeout
        browser.options.waitforTimeout = WAIT
        await browser.addLocatorStrategy('pathItems', () => [...document.querySelectorAll<HTMLElement>('#list li')])
        /**
         * on an element, `custom$$` gives the element to the strategy as its last argument
         */
        await browser.addLocatorStrategy('pathItemsIn', (...args: unknown[]) => [...(args[args.length - 1] as HTMLElement).querySelectorAll<HTMLElement>('li')])
    })

    beforeEach(async () => {
        const context = await browser.url(url)
        page = browser.isBidi ? context as WebdriverIO.BrowsingContext : undefined
    })

    after(async () => {
        browser.options.waitforTimeout = waitforTimeout
        const closed = new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()))
        server.closeAllConnections()
        await closed
    })

    const item = (value: unknown): [Item] => [value as Item]
    /**
     * the type of a pending list has no `at()` and no `slice()`, but the list has them
     */
    const list = (selector: string) => browser.$$(selector) as unknown as WebdriverIO.ElementArray
    const ENTRIES: Array<[string, () => Promise<[Item]> | [Item], Row, { bidiOnly?: boolean }?]> = [
        ['reference: $(\'#missing\')', () => item(browser.$('#missing')), REFERENCE],
        ['$$(selector)[5]', () => item(browser.$$('#list li')[5]), NOT_FOUND_ITEM],
        ['(await $$(selector))[5]', async () => item((await browser.$$('#list li'))[5]), NOT_FOUND_ITEM],
        ['$$(selector).at(5)', () => item(list('#list li').at(5)), NOT_FOUND_ITEM],
        ['(await $$(selector)).at(5)', async () => item((await browser.$$('#list li')).at(5)), NOT_FOUND_ITEM],
        ['$$(selector)[0] of an empty list', () => item(browser.$$('#none li')[0]), NOT_FOUND_ITEM],
        ['$$(xpath)[5]', () => item(browser.$$('//ul[@id="list"]/li')[5]), NOT_FOUND_ITEM],
        ['$$(function)[5]', () => item(browser.$$(() => [...document.querySelectorAll<HTMLElement>('#list li')])[5]), NOT_FOUND_ITEM],
        ['$$(\'>>>selector\')[5]', () => item(browser.$$('>>>#list li')[5]), NOT_FOUND_ITEM, { bidiOnly: true }],
        ['$(parent).$$(selector)[5]', () => item(browser.$('#list').$$('li')[5]), NOT_FOUND_ITEM],
        ['(await $(parent)).$$(selector)[5]', async () => item((await browser.$('#list')).$$('li')[5]), NOT_FOUND_ITEM],
        ['custom$$(strategy)[5]', () => item(browser.custom$$('pathItems')[5]), NOT_FOUND_ITEM],
        ['$(parent).custom$$(strategy)[5]', () => item(browser.$('#list').custom$$('pathItemsIn')[5]), NOT_FOUND_ITEM],
        ['$(host).shadow$$(selector)[5]', () => item(browser.$('#host').shadow$$('p')[5]), NOT_FOUND_ITEM],
        ['$$([elements of one selector])[5]', async () => {
            const elements = await browser.$$('#list li')
            return item(browser.$$([elements[0], elements[1]])[5])
        }, NOT_FOUND_ITEM],
        /**
         * current behavior, a follow-up changes it: a list of elements without one
         * selector cannot find its items again
         */
        ['$$([elements of different selectors])[5]', async () => {
            const elements = [await browser.$('#list li:first-child'), await browser.$('.other')]
            return item(browser.$$(elements)[5])
        }, every('selector needs to be typeof string or function')],
        /**
         * current behavior, a follow-up changes it: a derived list and a negative index
         * give no item
         */
        ['$$(selector).slice(0, 2)[3]', () => item(list('#list li').slice(0, 2)[3]), NO_ITEM('Element could not be found')],
        ['(await $$(selector).filter(fn))[3]', async () => item((await browser.$$('#list li').filter(() => true))[3]), NO_ITEM('the item is undefined')],
        ['$$(selector).at(-5)', () => item(list('#list li').at(-5)), NO_ITEM('Element could not be found')],
        /**
         * the same as a child of a missing element, `$('#missing').$('li')` (#13253)
         */
        ['reference: $(\'#missing\').$(selector)', () => item(browser.$('#missing').$('li')), every('can\'t call $ on #missing')],
        ['$(\'#missing\').$$(selector)[0]', () => item(browser.$('#missing').$$('li')[0]), every('can\'t call $$ on #missing')],
        ['$(\'#missing\').shadow$$(selector)[0]', () => item(browser.$('#missing').shadow$$('p')[0]), every('can\'t call shadow$$ on #missing')],
        ['$$(selector)[5].$(child)', () => item(browser.$$('#list li')[5].$('span')), every('Index out of bounds')],
        ['$$(selector)[5].$$(child)[0]', () => item(browser.$$('#list li')[5].$$('span')[0]), every('Index out of bounds')],
        ['$$(selector)[5].nextElement()', () => item(browser.$$('#list li')[5].nextElement()), every('Index out of bounds')],
    ]

    for (const [name, entry, expected, { bidiOnly = false } = {}] of ENTRIES) {
        it(name, async function () {
            if (bidiOnly && !browser.isBidi) {
                return this.skip()
            }
            expect(await row(entry, CHECKS)).toEqual(expected)
        })
    }

    it('$$(selector)[5] in a frame', async () => {
        const FRAME_CHECKS = {
            isExisting: CHECKS.isExisting,
            isDisplayed: CHECKS.isDisplayed,
            'not.toExist': CHECKS['not.toExist'],
            'not.toBeDisplayed': CHECKS['not.toBeDisplayed'],
            click: CHECKS.click,
        }
        const expected = { isExisting: 'false', isDisplayed: 'false', 'not.toExist': 'ok', 'not.toBeDisplayed': 'ok', click: 'Index out of bounds' }
        if (page) {
            const frame = await page.frame({ selector: '#frame' })
            expect(await row(() => item(frame.$$('#frame-list li')[5]), FRAME_CHECKS)).toEqual(expected)
            return
        }
        await browser.switchFrame(browser.$('#frame'))
        try {
            expect(await row(() => item(browser.$$('#frame-list li')[5]), FRAME_CHECKS)).toEqual(expected)
        } finally {
            await browser.switchFrame(null)
        }
    })

    it('$$(selector)[5] of a held browsing context', async function () {
        if (!page) {
            return this.skip()
        }
        const context = page
        expect(await row(() => item(context.$$('#list li')[5]), CHECKS)).toEqual(NOT_FOUND_ITEM)
    })

    /**
     * The item is not found after the index wait, then the list reaches the index, and the
     * same item object is used again. Reference: a `$()` resolved before the element appears.
     */
    describe('the item appears after the index wait', () => {
        const LATE = '#late li:nth-child(6)'
        const LATE_ENTRIES: Array<[string, () => Promise<[Item]>]> = [
            ['reference: $(selector)', async () => {
                const late = browser.$(LATE)
                await late.getElement()
                return item(late)
            }],
            ['$$(selector)[5]', async () => {
                const late = browser.$$('#late li')[5]
                await late.getElement()
                return item(late)
            }],
            ['(await $$(selector))[5]', async () => {
                const late = (await browser.$$('#late li'))[5]
                await late.getElement()
                return item(late)
            }],
        ]

        const renderLate = (delay: number) => browser.execute((delay) => (window as unknown as { renderLate (delay: number): void }).renderLate(delay), delay)
        const resetLate = () => browser.execute(() => (window as unknown as { resetLate (): void }).resetLate())

        /**
         * the item is in the page before the step
         */
        const BEFORE_STEP: Record<string, (late: Item) => Promise<unknown>> = {
            'isExisting, then getText': async (late) => [await late.isExisting(), await late.getText()],
            'isExisting, then click': async (late) => [await late.isExisting(), await late.click().then(() => 'clicked')],
            'toExist, then getText': async (late) => { await expect(late).toExist({ wait: 1000 }); return late.getText() },
            'waitUntil(isExisting), then getText': async (late) => { await browser.waitUntil(() => late.isExisting(), { timeout: 1000 }); return late.getText() },
            'waitForExist, then getText': async (late) => { await late.waitForExist({ timeout: 1000 }); return late.getText() },
            'isDisplayed, then getText': async (late) => [await late.isDisplayed(), await late.getText()],
            'getText': (late) => late.getText(),
        }

        for (const [name, entry] of LATE_ENTRIES) {
            it(`${name}: the item is there before the step`, async () => {
                const result: Record<string, string> = {}
                for (const [step, run] of Object.entries(BEFORE_STEP)) {
                    await resetLate()
                    const [late] = await entry()
                    await renderLate(0)
                    await browser.waitUntil(() => browser.execute(() => document.querySelectorAll('#late li').length === 6))
                    result[step] = await outcome(() => run(late))
                }
                expect(result).toEqual({
                    'isExisting, then getText': '[true,"l5"]',
                    'isExisting, then click': '[true,"clicked"]',
                    'toExist, then getText': '"l5"',
                    'waitUntil(isExisting), then getText': '"l5"',
                    'waitForExist, then getText': '"l5"',
                    'isDisplayed, then getText': '[true,"l5"]',
                    'getText': '"l5"',
                })
            })
        }

        /**
         * the item appears 1 s after the step starts. A command on the not found item does
         * not wait a second time (its index already waited), the implicit wait of `$()` does
         */
        const DURING_STEP: Record<string, (late: Item) => Promise<unknown>> = {
            'getText': (late) => late.getText(),
            'isExisting, then getText': async (late) => [await late.isExisting(), await late.getText()],
            'toExist, then getText': async (late) => { await expect(late).toExist({ wait: 3000 }); return late.getText() },
            'waitForExist, then getText': async (late) => { await late.waitForExist({ timeout: 3000 }); return late.getText() },
        }

        for (const [name, entry] of LATE_ENTRIES) {
            it(`${name}: the item appears during the step`, async () => {
                const isReference = name.startsWith('reference')
                /**
                 * the implicit wait of the reference must outlast the 1 s delay
                 */
                browser.options.waitforTimeout = isReference ? 3000 : WAIT
                const result: Record<string, string> = {}
                try {
                    for (const [step, run] of Object.entries(DURING_STEP)) {
                        await resetLate()
                        const [late] = await entry()
                        await renderLate(1000)
                        result[step] = await outcome(() => run(late))
                    }
                } finally {
                    browser.options.waitforTimeout = WAIT
                }
                expect(result).toEqual(isReference
                    ? {
                        'getText': '"l5"',
                        'isExisting, then getText': '[false,"l5"]',
                        'toExist, then getText': '"l5"',
                        'waitForExist, then getText': '"l5"',
                    }
                    : {
                        'getText': 'Index out of bounds',
                        'isExisting, then getText': 'Index out of bounds',
                        'toExist, then getText': '"l5"',
                        'waitForExist, then getText': '"l5"',
                    })
            })
        }
    })
})
