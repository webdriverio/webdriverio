import path from 'node:path'

import { ELEMENT_KEY } from 'webdriver'
import { describe, it, afterEach, beforeEach, expect, vi } from 'vitest'

import { remote } from '../../src/index.js'
import refetchElement from '../../src/utils/refetchElement.js'
import { waitUntil } from '../../src/commands/browser/waitUntil.js'
import { ELEMENT_NOT_FOUND_AGAIN, WAIT_UNTIL_TIMEOUT } from '../../src/utils/errorCodes.js'

vi.mock('fetch')
vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))
/**
 * runs the real refetch: each layer of the element middleware calls it once for a stale element
 */
vi.mock('../../src/utils/refetchElement.js', async (importOriginal) => {
    const actual = await importOriginal<{ default: typeof refetchElement }>()
    return { __esModule: true, default: vi.fn(actual.default) }
})

/**
 * the real wait: the implicit wait for an element and the wait for an index of a list are
 * waits of `waitUntil`
 */
vi.mock('../../src/commands/browser/waitUntil.js', async (importOriginal) => {
    const actual = await importOriginal<{ waitUntil: typeof waitUntil }>()
    return { ...actual, __esModule: true, waitUntil: vi.fn(actual.waitUntil) }
})

type Fallback = (uri: URL | string, params?: RequestInit) => Promise<Response>

/**
 * A small driver with a page model, so that a test can change the page between two commands:
 * - `light`: CSS selector -> ids of its matches, in the document or an element
 * - `stale`: ids of the elements the page has removed
 *
 * A request for a stale element, or a find in a stale element, fails as in a driver. Every
 * other request goes to the shared fetch mock.
 */
function fakeDriver (fallback: Fallback) {
    const light = new Map<string, string[]>()
    const stale = new Set<string>()

    const reply = (value: unknown, status = 200) => Response.json({ value }, { status })
    const refs = (ids: string[]) => ids.map((id) => ({ [ELEMENT_KEY]: id }))
    const staleError = () => reply({
        error: 'stale element reference',
        message: 'stale element reference: element is not attached to the page document'
    }, 404)

    const handler = async (uri: URL | string, params?: RequestInit) => {
        const { pathname } = typeof uri === 'string' ? new URL(uri) : uri
        const body = params?.body ? JSON.parse(String(params.body)) : undefined

        const find = pathname.match(/\/(?:element\/([^/]+)\/)?(element|elements)$/)
        if (find && params?.method === 'POST') {
            const [, scope, command] = find
            if (stale.has(scope)) {
                return staleError()
            }
            const ids = light.get(body.value) ?? []
            if (command === 'elements') {
                return reply(refs(ids))
            }
            return ids.length
                ? reply({ [ELEMENT_KEY]: ids[0] })
                : reply({ error: 'no such element', message: `no element matches ${body.value}` }, 404)
        }

        if (/\/execute\/(sync|async)$/.test(pathname)) {
            const args: unknown[] = body.args ?? []
            if (args.some((arg) => stale.has((arg as Record<string, string> | null)?.[ELEMENT_KEY]))) {
                return staleError()
            }
        }

        const command = pathname.match(/\/element\/([^/]+)\/(name|text|enabled|clear|value)$/)
        if (command) {
            const [, id, name] = command
            if (stale.has(id)) {
                return staleError()
            }
            return reply(name === 'text' ? `text of ${id}` : name === 'enabled' ? true : name === 'name' ? 'input' : null)
        }

        return fallback(uri, params)
    }

    return { light, stale, handler }
}

let driver: ReturnType<typeof fakeDriver>
let fallback: Fallback

beforeEach(() => {
    fallback = vi.mocked(fetch).getMockImplementation() as Fallback
    driver = fakeDriver(fallback)
    vi.mocked(fetch).mockImplementation(driver.handler as typeof fetch)
})

afterEach(() => {
    vi.mocked(fetch).mockImplementation(fallback as typeof fetch)
})

const session = () => remote({
    baseUrl: 'http://foobar.com',
    waitforTimeout: 100,
    waitforInterval: 10,
    capabilities: { browserName: 'foobar' }
})

const settle = (promise: Promise<unknown>) => promise.then(
    (value) => ({ value, error: undefined }),
    (error: Error) => ({ value: undefined, error })
)

describe('a command on an element that the page removed', () => {
    /**
     * Each layer of the element middleware finds a stale element again once. An item has as
     * many layers as `$()`, whatever its index: with one more layer for each item, a command on
     * a gone item `[n]` threw after `(n + 1) * 2 * waitforTimeout` (#16070)
     */
    it('is found again as often as $() for a list item, whatever its index', async () => {
        const refetches = async (find: (browser: WebdriverIO.Browser) => Promise<WebdriverIO.Element>, id: string) => {
            const browser = await session()
            driver.light.set('.item', ['elem-a', 'elem-b', 'elem-c'])
            driver.light.set('#ref', ['elem-r'])
            const elem = await find(browser)
            driver.stale.add(id)
            driver.light.set('.item', [])
            driver.light.set('#ref', [])
            vi.mocked(refetchElement).mockClear()

            const { error } = await settle(elem.getText())
            expect(error).toBeInstanceOf(Error)
            return vi.mocked(refetchElement).mock.calls.length
        }

        const reference = await refetches((browser) => browser.$('#ref').getElement(), 'elem-r')
        expect(reference).toBeGreaterThan(0)
        expect([
            await refetches(async (browser) => (await browser.$$('.item'))[0], 'elem-a'),
            await refetches(async (browser) => (await browser.$$('.item'))[2], 'elem-c')
        ]).toEqual([reference, reference])
    })
})

describe('one wait for an element that the page removed', () => {
    /**
     * the waits for the element (the implicit wait of `waitForExist`, the wait for the index of
     * a list item) that timed out without it, counted without timing
     */
    const waits = async (command: Promise<unknown>) => {
        vi.mocked(waitUntil).mockClear()
        const outcome = await settle(command)
        const calls = vi.mocked(waitUntil).mock.calls
        const ended = vi.mocked(waitUntil).mock.settledResults.filter((result, i) => {
            const timeoutMsg = String((calls[i][1] as { timeoutMsg?: unknown } | undefined)?.timeoutMsg)
            return result.type === 'rejected' &&
                (result.value as { code?: string } | undefined)?.code === WAIT_UNTIL_TIMEOUT &&
                /still not existing|Index out of bounds/.test(timeoutMsg)
        })
        return { ...outcome, waits: ended.length }
    }
    /**
     * the error of 9.31.9, with a code and the stale element error of the driver as cause
     */
    const expectGone = (error: Error | undefined, message: string) => {
        expect(error?.name).toBe('Error')
        expect(error).toHaveProperty('code', ELEMENT_NOT_FOUND_AGAIN)
        expect(error?.message).toBe(message)
        expect((error?.cause as Error | undefined)?.name).toBe('stale element reference')
    }
    const removedRef = async () => {
        const browser = await session()
        driver.light.set('#ref', ['elem-r'])
        const elem = await browser.$('#ref')
        driver.stale.add('elem-r')
        driver.light.set('#ref', [])
        return elem
    }
    const removedItem = async (index: number) => {
        const browser = await session()
        driver.light.set('.item', ['elem-a', 'elem-b', 'elem-c'])
        const elem = (await browser.$$('.item'))[index]
        driver.stale.add('elem-a').add('elem-b').add('elem-c')
        driver.light.set('.item', [])
        return elem
    }
    const host = async () => {
        const browser = await session()
        driver.light.set('#host', ['host-a'])
        driver.light.set('.child', ['child-a'])
        const parent = await browser.$('#host')
        const child = await parent.$('.child')
        return { parent, child }
    }

    it.each(['isDisplayed', 'isExisting'] as const)('%s of a removed element is false without a wait', async (command) => {
        const elem = await removedRef()
        const { value, error, waits: count } = await waits(elem[command]())
        expect(error).toBeUndefined()
        expect(value).toBe(false)
        expect(count).toBe(0)
    })

    // item [0] is the first match of $(), as in 9.31.9 and on main
    it('isDisplayed of a removed list item [0] is false without a wait', async () => {
        const elem = await removedItem(0)
        const { value, error, waits: count } = await waits(elem.isDisplayed())
        expect(error).toBeUndefined()
        expect(value).toBe(false)
        expect(count).toBe(0)
    })

    // isExisting asks the list again and does not use the stale id
    it('isExisting of a removed list item [2] is false without a wait', async () => {
        const elem = await removedItem(2)
        const { value, error, waits: count } = await waits(elem.isExisting())
        expect(error).toBeUndefined()
        expect(value).toBe(false)
        expect(count).toBe(0)
    })

    // a later item waits for its index, as in 9.31.9 ("Index out of bounds")
    it('isDisplayed of a removed list item [2] waits once and fails', async () => {
        const elem = await removedItem(2)
        const { error, waits: count } = await waits(elem.isDisplayed())
        expectGone(error, 'Can\'t call isDisplayed on element with selector ".item" at index 2 because element wasn\'t found')
        expect(count).toBe(1)
    })

    it('waits once for a removed element', async () => {
        const elem = await removedRef()
        const { error, waits: count } = await waits(elem.getText())
        expectGone(error, 'Can\'t call getText on element with selector "#ref" because element wasn\'t found')
        expect(count).toBe(1)
    })

    it.each([
        [0, 'Can\'t call getText on element with selector ".item" because element wasn\'t found'],
        [2, 'Can\'t call getText on element with selector ".item" at index 2 because element wasn\'t found']
    ])('waits once for a removed list item [%i]', async (index, message) => {
        const elem = await removedItem(index)
        const { error, waits: count } = await waits(elem.getText())
        expectGone(error, message)
        expect(count).toBe(1)
    })

    /**
     * a stale list after a navigation to a page with a shorter list (#15550)
     */
    it('waits once for a list item whose list is now shorter', async () => {
        const elem = await removedItem(2)
        driver.light.set('.item', ['elem-x'])
        const { error, waits: count } = await waits(elem.getText())
        expectGone(error, 'Can\'t call getText on element with selector ".item" at index 2 because element wasn\'t found')
        expect(count).toBe(1)
    })

    /**
     * a page object pattern: a child of a row of a table, whose table the page removed
     */
    it('waits once for a child of a list item whose list was removed', async () => {
        const browser = await session()
        driver.light.set('.row', ['row-a', 'row-b'])
        driver.light.set('.input', ['input-b'])
        const input = await (await browser.$$('.row'))[1].$('.input')
        driver.stale.add('row-a').add('row-b').add('input-b')
        driver.light.set('.row', [])
        vi.mocked(refetchElement).mockClear()

        const { error, waits: count } = await waits(input.getText())
        expectGone(error, 'Can\'t call $ on element with selector ".row" at index 1 because element wasn\'t found')
        expect(count).toBe(1)
        /**
         * the inner layer looks once: the outer layer does not look again
         */
        expect(vi.mocked(refetchElement)).toHaveBeenCalledTimes(1)
    })

    it('waits once for a removed child', async () => {
        const { child } = await host()
        driver.stale.add('child-a')
        driver.light.set('.child', [])
        const { error, waits: count } = await waits(child.getText())
        expectGone(error, 'Can\'t call getText on element with selector ".child" because element wasn\'t found')
        expect(count).toBe(1)
    })

    it('waits once for a child whose parent was removed', async () => {
        const { child } = await host()
        driver.stale.add('host-a').add('child-a')
        driver.light.set('#host', [])
        const { error, waits: count } = await waits(child.getText())
        /**
         * the parent was not found: the message stays about the parent, as in 9.31.9
         */
        expectGone(error, 'Can\'t call $ on element with selector "#host" because element wasn\'t found')
        expect(count).toBe(1)
    })

    /**
     * only the removed element itself is checked without a wait (website/docs/Timeouts.md)
     */
    it.each([
        ['isDisplayed', '$'],
        ['isClickable', '$'],
        /**
         * `isExisting` looks for the child with `$$()` in the parent
         */
        ['isExisting', '$$']
    ] as const)('%s of a child whose parent was removed waits once and fails', async (command, parentCommand) => {
        const { child } = await host()
        driver.stale.add('host-a').add('child-a')
        driver.light.set('#host', [])
        const { error, waits: count } = await waits(child[command]())
        expect(error).toHaveProperty('code', ELEMENT_NOT_FOUND_AGAIN)
        expect(error?.message).toBe(`Can't call ${parentCommand} on element with selector "#host" because element wasn't found`)
        expect(count).toBe(1)
    })

    /**
     * a check (`isDisplayed`) of a removed parent leaves it without an element id
     */
    it('waits once for a child after a check of its removed parent', async () => {
        const { parent, child } = await host()
        driver.stale.add('host-a').add('child-a')
        driver.light.set('#host', [])
        expect(await parent.isExisting()).toBe(false)
        parent.elementId = undefined as unknown as string

        const { error, waits: count } = await waits(child.getText())
        expect(error).toHaveProperty('code', ELEMENT_NOT_FOUND_AGAIN)
        expect(error?.message).toBe('Can\'t call $ on element with selector "#host" because element wasn\'t found')
        expect(count).toBe(1)
    })

    it('waits once in setValue', async () => {
        const browser = await session()
        driver.light.set('#input', ['input-a'])
        const elem = await browser.$('#input')
        driver.stale.add('input-a')
        driver.light.set('#input', [])
        const { error, waits: count } = await waits(elem.setValue('value'))
        expectGone(error, 'Can\'t call setValue on element with selector "#input" because element wasn\'t found')
        expect(count).toBe(1)
    })

    it('waits once in waitForEnabled, with the error of the element as cause', async () => {
        const elem = await removedRef()
        const { error, waits: count } = await waits(elem.waitForEnabled())
        expect(error?.message).toMatch(/^waitUntil condition failed with the following reason: Can't call isEnabled on element with selector "#ref" because element wasn't found/)
        expect(error?.cause).toHaveProperty('code', ELEMENT_NOT_FOUND_AGAIN)
        expect(count).toBe(1)
    })

    it('waits once with a waitforTimeout that is not a whole number', async () => {
        const browser = await remote({
            baseUrl: 'http://foobar.com',
            waitforTimeout: 100.5,
            waitforInterval: 10,
            capabilities: { browserName: 'foobar' }
        })
        driver.light.set('#ref', ['elem-r'])
        const elem = await browser.$('#ref')
        driver.stale.add('elem-r')
        driver.light.set('#ref', [])
        const { error, waits: count } = await waits(elem.getText())
        expect(error).toHaveProperty('code', ELEMENT_NOT_FOUND_AGAIN)
        expect(count).toBe(1)
    })

    it('finds a list item again when the page rendered the list again', async () => {
        const browser = await session()
        driver.light.set('.item', ['elem-a', 'elem-b', 'elem-c'])
        const elem = (await browser.$$('.item'))[1]
        driver.stale.add('elem-a').add('elem-b').add('elem-c')
        driver.light.set('.item', ['elem-x', 'elem-y', 'elem-z'])
        const { value, waits: count } = await waits(elem.getText())
        expect(value).toBe('text of elem-y')
        expect(count).toBe(0)
    })

    /**
     * an element that a command never found keeps its plain error, without code
     */
    it('keeps the plain error of an element that was never found', async () => {
        const browser = await session()
        const { error, waits: count } = await waits(browser.$('#missing').getText())
        expect(error?.message).toBe('Can\'t call getText on element with selector "#missing" because element wasn\'t found')
        expect(error).not.toHaveProperty('code')
        expect(count).toBe(1)
    })
})
