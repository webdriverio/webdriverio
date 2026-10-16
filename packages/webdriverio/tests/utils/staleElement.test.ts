import path from 'node:path'

import { ELEMENT_KEY } from 'webdriver'
import { describe, it, afterEach, beforeEach, expect, vi } from 'vitest'

import { remote } from '../../src/index.js'
import refetchElement from '../../src/utils/refetchElement.js'

vi.mock('fetch')
vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))
/**
 * runs the real refetch: each layer of the element middleware calls it once for a stale element
 */
vi.mock('../../src/utils/refetchElement.js', async (importOriginal) => {
    const actual = await importOriginal<{ default: typeof refetchElement }>()
    return { __esModule: true, default: vi.fn(actual.default) }
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
