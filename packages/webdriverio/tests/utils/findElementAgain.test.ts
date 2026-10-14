import path from 'node:path'

import { ELEMENT_KEY } from 'webdriver'
import { describe, it, afterEach, beforeEach, expect, vi } from 'vitest'

import { remote } from '../../src/index.js'
import { StrictSelectorError } from '../../src/utils/strictMode.js'
import { itemOf } from '../../src/utils/findElementAgain.js'
import refetchElement from '../../src/utils/refetchElement.js'
import implicitWait from '../../src/utils/implicitWait.js'
import { isStaleElementError } from '../../src/utils/index.js'
import { ELEMENT_NOT_FOUND_AGAIN } from '../../src/utils/elementNotFound.js'

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
 * the real implicit wait: each call that rejects with "wasn't found" is one wait for an element
 * that ended without it
 */
vi.mock('../../src/utils/implicitWait.js', async (importOriginal) => {
    const actual = await importOriginal<{ default: typeof implicitWait }>()
    return { ...actual, __esModule: true, default: vi.fn(actual.default) }
})

const CHROME_STALE_MESSAGE = 'stale element reference: element is not attached to the page document'
const SHADOW_ELEMENT_KEY = 'shadow-6066-11e4-a52e-4f735466cecf'

type Fallback = (uri: URL | string, params?: RequestInit) => Promise<Response>
interface ReactComponent { id: string, name: string, props?: Record<string, unknown> }

/**
 * A small driver with a page model, so that a test can change the page
 * between two commands:
 * - `light`: CSS selector -> ids of its matches, in the document or an element
 * - `shadow`: CSS selector -> ids of its matches in a shadow root
 * - `react`: the React components on the page
 * - `scripts`: name of a function selector or custom strategy -> ids it returns
 *   (a script that gets a stale element fails, as in a driver)
 * - `stale`: ids of the elements the page has replaced
 *
 * `finds` records each find request, `findsIn` the same with the element or
 * shadow root it searched in, or the elements a script got. A find in a stale element, or in the shadow root
 * of a stale element, fails as in a driver. Every other request goes to the
 * shared fetch mock.
 */
function fakeDriver (fallback: Fallback) {
    const light = new Map<string, string[]>()
    const shadow = new Map<string, string[]>()
    const react: ReactComponent[] = []
    const scripts = new Map<string, string[]>()
    const stale = new Set<string>()
    const finds: string[] = []
    const findsIn: string[] = []

    const reply = (value: unknown, status = 200) => Response.json({ value }, { status })
    const refs = (ids: string[]) => ids.map((id) => ({ [ELEMENT_KEY]: id }))
    /**
     * the message of a stale element error. By default only its name says that it is one, as
     * from Appium and other drivers; Chrome also puts it in the message
     */
    const options = { staleMessage: 'element is not attached to the page document' }
    const staleError = () => reply({
        error: 'stale element reference',
        message: options.staleMessage
    }, 404)

    const handler = async (uri: URL | string, params?: RequestInit) => {
        const { pathname } = typeof uri === 'string' ? new URL(uri) : uri
        const body = params?.body ? JSON.parse(String(params.body)) : undefined

        const find = pathname.match(/\/(?:element\/([^/]+)\/|shadow\/root-([^/]+)\/)?(element|elements)$/)
        if (find && params?.method === 'POST') {
            const [, scope, shadowHost, command] = find
            if (stale.has(scope) || stale.has(shadowHost)) {
                return staleError()
            }
            const ids = (shadowHost ? shadow : light).get(body.value) ?? []
            finds.push(`${command} ${body.value}`)
            findsIn.push(`${command} ${body.value} in ${shadowHost ? `shadow root of ${shadowHost}` : scope ?? 'document'}`)
            if (command === 'elements') {
                return reply(refs(ids))
            }
            return ids.length
                ? reply({ [ELEMENT_KEY]: ids[0] })
                : reply({ error: 'no such element', message: `no element matches ${body.value}` }, 404)
        }

        const shadowRoot = pathname.match(/\/element\/([^/]+)\/shadow$/)
        if (shadowRoot) {
            return stale.has(shadowRoot[1]) ? staleError() : reply({ [SHADOW_ELEMENT_KEY]: `root-${shadowRoot[1]}` })
        }

        if (/\/execute\/(sync|async)$/.test(pathname)) {
            /**
             * as a driver, fail for a script that gets a stale element
             */
            const args: unknown[] = body.args ?? []
            if (args.some((arg) => stale.has((arg as Record<string, string> | null)?.[ELEMENT_KEY]))) {
                return staleError()
            }
            const script: string = body.script
            if (script.includes('function react$')) {
                const [name, props = {}] = body.args
                const ids = react
                    .filter((component) => component.name === name &&
                        Object.entries(props).every(([key, value]) => component.props?.[key] === value))
                    .map(({ id }) => id)
                const reactScope = (body.args[3] as Record<string, string> | undefined)?.[ELEMENT_KEY]
                finds.push(`react ${name}`)
                findsIn.push(`react ${name} in ${reactScope ?? 'document'}`)
                if (script.includes('function react$$')) {
                    return reply(refs(ids))
                }
                return reply(ids.length ? { [ELEMENT_KEY]: ids[0] } : { message: `no component matches ${name}` })
            }
            if (script.includes('waitToLoadReact')) {
                return reply(null)
            }
            for (const [name, ids] of scripts) {
                if (script.includes(name)) {
                    const elementArgs = args
                        .map((arg) => (arg as Record<string, string> | null)?.[ELEMENT_KEY])
                        .filter(Boolean)
                    finds.push(`script ${name}`)
                    findsIn.push(`script ${name} with ${elementArgs.join(', ') || 'no element'}`)
                    return reply(refs(ids))
                }
            }
        }

        const command = pathname.match(/\/element\/([^/]+)\/(name|text)$/)
        if (command) {
            const [, id, name] = command
            if (stale.has(id)) {
                return staleError()
            }
            return reply(name === 'name' ? 'li' : `text of ${id}`)
        }

        /**
         * any other command on an element that the page replaced fails as in a driver
         */
        const elementCommand = pathname.match(/\/element\/([^/]+)\//)
        if (elementCommand && stale.has(elementCommand[1])) {
            return staleError()
        }

        return fallback(uri, params)
    }

    return { light, shadow, react, scripts, stale, finds, findsIn, handler, options }
}

let driver: ReturnType<typeof fakeDriver>
let fallback: Fallback

beforeEach(() => {
    fallback = vi.mocked(fetch).getMockImplementation() as Fallback
    driver = fakeDriver(fallback)
    /**
     * the scripts match nothing until a test renders their elements
     */
    for (const name of ['scriptItem', 'scriptList', 'customItem', 'customList']) {
        driver.scripts.set(name, [])
    }
    vi.mocked(fetch).mockImplementation(driver.handler as typeof fetch)
})

afterEach(() => {
    vi.mocked(fetch).mockImplementation(fallback as typeof fetch)
})

/**
 * The unit test bootstrap turns strict mode off, so each session sets
 * `strictSelectors` itself.
 */
const session = async (strictSelectors = true) => {
    const browser = await remote({
        baseUrl: 'http://foobar.com',
        strictSelectors,
        waitforTimeout: 100,
        waitforInterval: 10,
        capabilities: { browserName: 'foobar' }
    })
    browser.addLocatorStrategy('customItem', function customItem () { return [] as unknown as HTMLElement })
    browser.addLocatorStrategy('customList', function customList () { return [] as unknown as HTMLElement })
    return browser
}

const settle = (promise: Promise<unknown>) => promise.then(
    (value) => ({ value, error: undefined }),
    (error: Error) => ({ value: undefined, error })
)

/**
 * an Android data matcher, sent as the JSON of the object
 */
const MATCHER = { name: 'hasEntry', args: ['title', 'Item'] }

function scriptItem () { return document.querySelector('.item') as HTMLElement }
function scriptList () { return Array.from(document.querySelectorAll('.item')) as HTMLElement[] }

const components = (ids: string[], props?: Record<string, unknown>) => ids.map((id) => ({ id, name: 'Item', props }))

interface Kind {
    kind: string
    /**
     * whether the query throws for several matches, a list query never does
     */
    strict?: boolean
    /**
     * queries the element, the page decides if it is found
     */
    find: (browser: WebdriverIO.Browser) => Promise<WebdriverIO.Element>
    /**
     * puts elements with these ids on the page, as the matches of the query
     */
    render: (ids: string[]) => void
}

/**
 * every command that returns a single element
 */
const SINGLE_KINDS: Kind[] = [{
    kind: '$(selector)',
    strict: true,
    find: (browser) => browser.$('.item').getElement(),
    render: (ids) => driver.light.set('.item', ids)
}, {
    kind: '$(function)',
    strict: true,
    find: (browser) => browser.$(scriptItem).getElement(),
    render: (ids) => driver.scripts.set('scriptItem', ids)
}, {
    kind: '$(matcher object)',
    strict: true,
    find: (browser) => browser.$(MATCHER as unknown as string).getElement(),
    render: (ids) => driver.light.set(JSON.stringify(MATCHER), ids)
}, {
    kind: 'browser.custom$',
    find: (browser) => browser.custom$('customItem').getElement(),
    render: (ids) => driver.scripts.set('customItem', ids)
}, {
    kind: 'element.custom$',
    find: (browser) => {
        driver.light.set('#form', ['form'])
        return browser.$('#form').custom$('customItem').getElement()
    },
    render: (ids) => driver.scripts.set('customItem', ids)
}, {
    kind: 'shadow$',
    find: (browser) => {
        driver.light.set('#host', ['host'])
        return browser.$('#host').shadow$('.item').getElement()
    },
    render: (ids) => driver.shadow.set('.item', ids)
}, {
    kind: 'browser.react$',
    find: (browser) => browser.react$('Item').getElement(),
    render: (ids) => driver.react.splice(0, Infinity, ...components(ids))
}, {
    kind: 'element.react$',
    find: (browser) => {
        driver.light.set('#app', ['app'])
        return browser.$('#app').react$('Item').getElement()
    },
    render: (ids) => driver.react.splice(0, Infinity, ...components(ids))
}, {
    /**
     * another `Item` comes first, so finding it again without the props
     * resolves the wrong component
     */
    kind: 'react$ with props',
    find: (browser) => browser.react$('Item', { props: { color: 'blue' } }).getElement(),
    render: (ids) => driver.react.splice(0, Infinity, ...components(['red-item'], { color: 'red' }), ...components(ids, { color: 'blue' }))
}]

/**
 * every command that returns a list, the test uses the element at index 1
 */
const LIST_KINDS: Kind[] = [{
    kind: '$$(selector)',
    find: async (browser) => (await browser.$$('.item'))[1],
    render: (ids) => driver.light.set('.item', ids)
}, {
    kind: '$$(function)',
    find: async (browser) => (await browser.$$(scriptList))[1],
    render: (ids) => driver.scripts.set('scriptList', ids)
}, {
    kind: '$$(matcher object)',
    find: async (browser) => (await browser.$$(MATCHER as unknown as string))[1],
    render: (ids) => driver.light.set(JSON.stringify(MATCHER), ids)
}, {
    kind: 'browser.custom$$',
    find: async (browser) => (await browser.custom$$('customList'))[1],
    render: (ids) => driver.scripts.set('customList', ids)
}, {
    kind: 'element.custom$$',
    find: async (browser) => {
        driver.light.set('#form', ['form'])
        return (await browser.$('#form').custom$$('customList'))[1]
    },
    render: (ids) => driver.scripts.set('customList', ids)
}, {
    kind: 'shadow$$',
    find: async (browser) => {
        driver.light.set('#host', ['host'])
        return (await browser.$('#host').shadow$$('.item'))[1]
    },
    render: (ids) => driver.shadow.set('.item', ids)
}, {
    kind: 'react$$ with props',
    find: async (browser) => (await browser.react$$('Item', { props: { color: 'blue' } }))[1],
    render: (ids) => driver.react.splice(0, Infinity, ...components(['red-item'], { color: 'red' }), ...components(ids, { color: 'blue' }))
}]

/**
 * every path that finds an element again, and what it gives when it finds
 * the element with the id `id`
 */
const PATHS = [{
    path: 'isDisplayed (hasElementId)',
    run: (elem: WebdriverIO.Element) => elem.isDisplayed(),
    result: () => true,
    setsElementId: true
}, {
    path: 'getText (implicitWait)',
    run: (elem: WebdriverIO.Element) => elem.getText(),
    result: (id: string) => `text of ${id}`,
    setsElementId: true
}, {
    path: 'waitForExist',
    run: (elem: WebdriverIO.Element) => elem.waitForExist(),
    result: () => true,
    setsElementId: true
}, {
    path: 'isExisting',
    run: (elem: WebdriverIO.Element) => elem.isExisting(),
    result: () => true,
    setsElementId: false
}]

/**
 * the same paths on an element the page replaced: the element has a stale
 * element id. `isExisting` only counts the matches, so it keeps the id.
 */
const STALE_PATHS = PATHS.map((path) => path.path.startsWith('getText')
    ? { ...path, path: 'getText (refetchElement)' }
    : path.path.startsWith('isDisplayed')
        ? { ...path, path: 'isDisplayed (refetchElement)' }
        : path)

describe('finding an element again', () => {
    describe.each(SINGLE_KINDS)('$kind', ({ find, render, strict }) => {
        it.each(PATHS)('$path finds it once it is on the page', async ({ run, result, setsElementId }) => {
            const elem = await find(await session())
            expect(elem.elementId).toBeUndefined()

            render(['elem-b'])
            expect(await run(elem)).toBe(result('elem-b'))
            expect(elem.elementId).toBe(setsElementId ? 'elem-b' : undefined)
        })

        it(strict ? 'throws a StrictSelectorError when it appears more than once' : 'takes the first match when it appears more than once', async () => {
            const elem = await find(await session())
            render(['elem-b', 'elem-c'])

            const { value, error } = await settle(elem.getText())
            if (strict) {
                expect(error).toBeInstanceOf(StrictSelectorError)
                return
            }
            expect(value).toBe('text of elem-b')
        })

        it.each(STALE_PATHS)('$path finds it again after the page replaced it', async ({ run, result, setsElementId }) => {
            render(['elem-a'])
            const elem = await find(await session())
            expect(elem.elementId).toBe('elem-a')

            driver.stale.add('elem-a')
            render(['elem-b'])
            expect(await run(elem)).toBe(result('elem-b'))
            const elementId = setsElementId ? 'elem-b' : 'elem-a'
            expect(elem.elementId).toBe(elementId)
            expect(elem[ELEMENT_KEY]).toBe(elementId)
        })
    })

    describe.each(LIST_KINDS)('$kind', ({ find, render }) => {
        it.each(STALE_PATHS)('$path finds it again at the same index after the page replaced it', async ({ run, result, setsElementId }) => {
            render(['elem-x', 'elem-a'])
            const elem = await find(await session())
            expect(elem.elementId).toBe('elem-a')

            driver.stale.add('elem-a')
            render(['elem-b', 'elem-c', 'elem-d'])
            expect(await run(elem)).toBe(result('elem-c'))
            const elementId = setsElementId ? 'elem-c' : 'elem-a'
            expect(elem.elementId).toBe(elementId)
            expect(elem[ELEMENT_KEY]).toBe(elementId)
        })

        /**
         * an element of a list without an element id, as `$$` gives for a DOM
         * node of the browser runner that isn't on the page anymore
         */
        it.each(PATHS)('$path finds it again at the same index when it has no element id', async ({ run, result, setsElementId }) => {
            render(['elem-x', 'elem-a'])
            const elem = await find(await session())
            // @ts-expect-error simulate an element of a list without an element id
            delete elem.elementId

            render(['elem-b', 'elem-c', 'elem-d'])
            expect(await run(elem)).toBe(result('elem-c'))
            expect(elem.elementId).toBe(setsElementId ? 'elem-c' : undefined)
        })
    })

    /**
     * every kind with an element as parent, where the page also replaced the
     * parent: the parent is found again first, through the middleware of the
     * command that runs on it
     */
    describe.each([{
        kind: '$(parent).$(selector)',
        parent: '#form',
        find: (browser: WebdriverIO.Browser) => browser.$('#form').$('.item').getElement(),
        render: (ids: string[]) => driver.light.set('.item', ids)
    }, {
        kind: '$(parent).$$(selector)[1]',
        parent: '#form',
        list: true,
        find: async (browser: WebdriverIO.Browser) => (await browser.$('#form').$$('.item'))[1],
        render: (ids: string[]) => driver.light.set('.item', ids)
    }, {
        kind: 'shadow$',
        parent: '#host',
        find: (browser: WebdriverIO.Browser) => browser.$('#host').shadow$('.item').getElement(),
        render: (ids: string[]) => driver.shadow.set('.item', ids)
    }, {
        kind: 'shadow$$[1]',
        parent: '#host',
        list: true,
        find: async (browser: WebdriverIO.Browser) => (await browser.$('#host').shadow$$('.item'))[1],
        render: (ids: string[]) => driver.shadow.set('.item', ids)
    }, {
        kind: 'element.react$',
        parent: '#app',
        find: (browser: WebdriverIO.Browser) => browser.$('#app').react$('Item').getElement(),
        render: (ids: string[]) => driver.react.splice(0, Infinity, ...components(ids))
    }, {
        kind: 'element.custom$',
        parent: '#form',
        find: (browser: WebdriverIO.Browser) => browser.$('#form').custom$('customItem').getElement(),
        render: (ids: string[]) => driver.scripts.set('customItem', ids)
    }, {
        kind: 'element.custom$$[1]',
        parent: '#form',
        list: true,
        find: async (browser: WebdriverIO.Browser) => (await browser.$('#form').custom$$('customList'))[1],
        render: (ids: string[]) => driver.scripts.set('customList', ids)
    }])('$kind in a parent the page replaced', ({ parent, list, find, render }) => {
        const replaceParent = () => {
            driver.stale.add('parent-a')
            driver.light.set(parent, ['parent-b'])
        }

        if (!list) {
            it.each(PATHS)('$path finds it once it is on the page', async ({ run, result, setsElementId }) => {
                driver.light.set(parent, ['parent-a'])
                const elem = await find(await session())
                expect(elem.elementId).toBeUndefined()

                replaceParent()
                render(['elem-b'])
                expect(await run(elem)).toBe(result('elem-b'))
                expect(elem.elementId).toBe(setsElementId ? 'elem-b' : undefined)
                expect(driver.findsIn.at(-1)).toContain('parent-b')
            })
        }

        it.each(STALE_PATHS)('$path finds it again after the page replaced it', async ({ run, result, setsElementId }) => {
            driver.light.set(parent, ['parent-a'])
            render(list ? ['elem-x', 'elem-a'] : ['elem-a'])
            const elem = await find(await session())
            expect(elem.elementId).toBe('elem-a')

            driver.stale.add('elem-a')
            replaceParent()
            render(list ? ['elem-y', 'elem-b'] : ['elem-b'])
            expect(await run(elem)).toBe(result('elem-b'))
            expect(elem.elementId).toBe(setsElementId ? 'elem-b' : 'elem-a')
            expect(driver.findsIn.at(-1)).toContain('parent-b')
        })
    })

    describe('an element of a list whose index is past the end of the list', () => {
        const shortList = async () => {
            driver.light.set('.item', ['elem-x', 'elem-a'])
            const elem = (await (await session()).$$('.item'))[1]
            // @ts-expect-error simulate an element of a list without an element id
            delete elem.elementId
            driver.light.set('.item', ['elem-b'])
            return elem
        }

        it('isDisplayed is false and does not wait', async () => {
            const elem = await shortList()
            const start = Date.now()
            expect(await elem.isDisplayed()).toBe(false)
            expect(Date.now() - start).toBeLessThan(100)
        })

        it('isExisting is false', async () => {
            const elem = await shortList()
            expect(await elem.isExisting()).toBe(false)
        })

        it('waitForExist waits for the index and times out', async () => {
            const elem = await shortList()
            const { error } = await settle(elem.waitForExist())
            expect(error?.message).toContain('still not existing')
        })

        it('getText waits for the index and throws that the element was not found', async () => {
            const elem = await shortList()
            const { error } = await settle(elem.getText())
            expect(error?.message).toContain('wasn\'t found')
        })

        it('waitForExist with reverse is true once the list is shorter than its index', async () => {
            driver.light.set('.item', ['elem-x', 'elem-a'])
            const elem = (await (await session()).$$('.item'))[1]
            driver.light.set('.item', ['elem-b'])

            expect(await elem.waitForExist({ reverse: true })).toBe(true)
        })

        it('getText on a stale element throws that it was not found again', async () => {
            driver.light.set('.item', ['elem-x', 'elem-a'])
            const elem = (await (await session()).$$('.item'))[1]
            driver.stale.add('elem-a')
            driver.light.set('.item', ['elem-b'])

            const { error } = await settle(elem.getText())
            expect(error?.name).toBe(ELEMENT_NOT_FOUND_AGAIN)
        })
    })

    /**
     * `$$(selector)[index]` waits `waitforTimeout` (100 ms here) for the index. When the
     * list never reaches it, the item is a "not found" element, like `$(selector)` (#12576)
     */
    describe('an index of $$() that the list never reaches', () => {
        beforeEach(() => {
            driver.light.set('.item', ['elem-a'])
        })

        it('gives a not found element after the wait, not an error', async () => {
            const browser = await session()
            const start = Date.now()
            const elem = await browser.$$('.item')[3]
            expect(Date.now() - start).toBeGreaterThanOrEqual(90)
            expect(elem.elementId).toBeUndefined()
            expect(elem.index).toBe(3)
            expect((elem.error as Error).message).toBe('Index out of bounds! $$(.item) returned only 1 elements.')
        })

        it('isDisplayed and isExisting are false', async () => {
            const browser = await session()
            expect(await browser.$$('.item')[3].isDisplayed()).toBe(false)
            expect(await browser.$$('.item')[3].isExisting()).toBe(false)
        })

        it('waitForDisplayed with reverse is true', async () => {
            const browser = await session()
            expect(await browser.$$('.item')[3].waitForDisplayed({ reverse: true })).toBe(true)
        })

        /**
         * A lookup that waits (`waitForExist`, the implicit wait, the refetch of a stale item)
         * rejects as before when the index is still missing; only `$$(selector)[index]`
         * itself gives the not found element
         */
        it('gives the same not found element for custom$$, with the strategy of the list', async () => {
            const browser = await session()
            driver.scripts.set('customList', ['elem-a'])
            const elem = await browser.custom$$('customList')[3]
            expect(elem.elementId).toBeUndefined()
            expect(elem.index).toBe(3)
            expect(elem.selector).toMatchObject({ strategyName: 'customList', strategyArguments: [] })
            expect(await browser.custom$$('customList')[3].isExisting()).toBe(false)
            expect(await browser.custom$$('customList')[3].isDisplayed()).toBe(false)
            const { error } = await settle(elem.click())
            expect(error?.message).toBe('Index out of bounds! $$(customList) returned only 1 elements.')

            driver.scripts.set('customList', ['elem-a', 'elem-b', 'elem-c', 'elem-d'])
            expect(await elem.isExisting()).toBe(true)
        })

        it('gives the not found element of element.custom$$ its parent as the last strategy argument', async () => {
            const browser = await session()
            driver.light.set('#host', ['host-a'])
            driver.scripts.set('customList', ['elem-a'])
            const elem = await browser.$('#host').custom$$('customList')[3]
            expect(elem.elementId).toBeUndefined()

            expect(await elem.isExisting()).toBe(false)
            expect(driver.findsIn.at(-1)).toBe('script customList with host-a')
        })

        it('waitForExist rejects when it saw the index but the lookup after it does not find it', async () => {
            const browser = await session()
            const elem = await browser.$$('.item')[3]
            vi.spyOn(elem, 'isExisting').mockResolvedValueOnce(true)

            const { error } = await settle(elem.waitForExist())
            expect(error?.message).toBe('Index out of bounds! $$(.item) returned only 1 elements.')
            expect(elem.elementId).toBeUndefined()
            expect((elem.error as Error).message).toBe('Index out of bounds! $$(.item) returned only 1 elements.')
        })

        it('the implicit wait of an item without element id gives the same error as before', async () => {
            const browser = await session()
            driver.light.set('.item', ['elem-a', 'elem-b', 'elem-c', 'elem-d'])
            const elem = await browser.$$('.item')[3]
            driver.light.set('.item', ['elem-a'])
            elem.elementId = undefined as unknown as string
            vi.spyOn(elem, 'waitForExist').mockResolvedValueOnce(true)

            const { error } = await settle(elem.getText())
            expect(error?.message).toBe('Can\'t call getText on element with selector ".item" because element wasn\'t found')
        })

        it('a stale item of a list that is shorter now throws that it was not found again', async () => {
            const browser = await session()
            driver.light.set('.item', ['elem-a', 'elem-b', 'elem-c', 'elem-d'])
            const elem = await browser.$$('.item')[3]
            driver.stale.add('elem-d')
            driver.light.set('.item', ['elem-a'])

            const { error } = await settle(elem.getText())
            expect(error?.name).toBe(ELEMENT_NOT_FOUND_AGAIN)
        })

        it('a command throws "Index out of bounds" after one lookup, without a second wait', async () => {
            const browser = await session()
            const elem = await browser.$$('.item')[3]
            const waitForExist = vi.spyOn(elem, 'waitForExist')
            const finds = driver.findsIn.length

            const { error } = await settle(elem.click())
            expect(error?.message).toBe('Index out of bounds! $$(.item) returned only 1 elements.')
            expect(waitForExist).not.toHaveBeenCalled()
            expect(driver.findsIn.slice(finds)).toEqual(['elements .item in document'])
        })

        /**
         * the item is the same object after the list reaches its index: a command finds it
         * once more, as `isExisting()` does, and keeps its element id
         */
        it('a command uses the item once the list reaches its index, without a second wait', async () => {
            const browser = await session()
            const elem = await browser.$$('.item')[3]
            const waitForExist = vi.spyOn(elem, 'waitForExist')
            driver.light.set('.item', ['elem-a', 'elem-b', 'elem-c', 'elem-d'])
            const finds = driver.findsIn.length

            expect(await elem.getText()).toBe('text of elem-d')
            expect(waitForExist).not.toHaveBeenCalled()
            expect(driver.findsIn.slice(finds)).toEqual(['elements .item in document'])
            expect(elem.elementId).toBe('elem-d')
            expect(elem.error).toBeUndefined()

            expect(await elem.getText()).toBe('text of elem-d')
            expect(driver.findsIn.slice(finds)).toEqual(['elements .item in document'])
        })

        it('a command uses the item after isExisting() saw it', async () => {
            const browser = await session()
            const elem = browser.$$('.item')[3]
            expect(await elem.isExisting()).toBe(false)
            driver.light.set('.item', ['elem-a', 'elem-b', 'elem-c', 'elem-d'])

            expect(await elem.isExisting()).toBe(true)
            expect(await elem.getText()).toBe('text of elem-d')
        })

        /**
         * an `async` overwrite of `$$` gives a promise, not the element list: its index
         * gives the same not found item as a plain `$$`
         */
        it('gives the same not found item for the list of an async overwrite of $$', async () => {
            const browser = await session()
            browser.overwriteCommand('$$', async (original$$, selector) => original$$(selector))

            expect(await browser.$$('.item')[0].getText()).toBe('text of elem-a')
            const elem = await browser.$$('.item')[3]
            expect(elem.elementId).toBeUndefined()
            expect(elem.index).toBe(3)
            expect(await browser.$$('.item')[3].isExisting()).toBe(false)
            expect(await browser.$$('.item')[3].isDisplayed()).toBe(false)
            const { error } = await settle(browser.$$('.item')[3].click())
            expect(error?.message).toBe('Index out of bounds! $$(.item) returned only 1 elements.')

            driver.light.set('.item', ['elem-a', 'elem-b', 'elem-c', 'elem-d'])
            expect(await elem.getText()).toBe('text of elem-d')
        })

        it('gives the same not found item for a custom command whose name ends with $$', async () => {
            const browser = await session()
            browser.addCommand('items$$', function (this: WebdriverIO.Browser, selector: string) {
                return this.$$(selector)
            })
            const items$$ = (selector: string) => (browser as unknown as { items$$ (selector: string): WebdriverIO.ElementArray }).items$$(selector)

            expect(await items$$('.item')[0].getText()).toBe('text of elem-a')
            expect(await items$$('.item')[3].isExisting()).toBe(false)
            const { error } = await settle(items$$('.item')[3].click())
            expect(error?.message).toBe('Index out of bounds! $$(.item) returned only 1 elements.')
        })

        it('a command uses the item of a custom$$ list once the strategy reaches its index', async () => {
            const browser = await session()
            driver.light.set('#host', ['host-a'])
            driver.scripts.set('customList', ['elem-a'])
            const elem = await browser.$('#host').custom$$('customList')[3]
            driver.scripts.set('customList', ['elem-a', 'elem-b', 'elem-c', 'elem-d'])

            expect(await elem.getText()).toBe('text of elem-d')
            expect(driver.findsIn.at(-1)).toBe('script customList with host-a')
        })
    })

    /**
     * The page replaced the item of a list: a command gets a stale element error, and the
     * item is found again at its index without the wait of `$$(selector)[index]`. When the
     * list is shorter now, the item is "not found", like `$(selector)` when the page removed
     * its element: a check gives its answer at once, a command that needs the element waits
     * for it and then throws that it was not found again (#12576, #16072)
     */
    describe('a stale item of a list that no longer reaches its index', () => {
        const goneItem = async () => {
            const browser = await session()
            driver.light.set('.item', ['elem-a', 'elem-b', 'elem-c'])
            const elem = (await browser.$$('.item'))[2]
            driver.stale.add('elem-c')
            driver.light.set('.item', ['elem-x'])
            return elem
        }

        it('isDisplayed is false, without a wait for the index', async () => {
            const elem = await goneItem()
            const finds = driver.findsIn.length
            expect(await elem.isDisplayed()).toBe(false)
            /**
             * one lookup finds the item again, one more is the lookup of `isDisplayed` for a
             * not found element. The wait for the index would look every `waitforInterval`
             */
            expect(driver.findsIn.slice(finds)).toEqual(['elements .item in document', 'elements .item in document'])
        })

        it('waitForDisplayed with reverse is true', async () => {
            const elem = await goneItem()
            expect(await elem.waitForDisplayed({ reverse: true, timeout: 50 })).toBe(true)
        })

        it('is found again once at its index, as a not found item', async () => {
            const elem = await goneItem()
            const finds = driver.findsIn.length

            const item = await refetchElement(elem, 'isDisplayed')
            expect(item.elementId).toBeUndefined()
            expect(item.index).toBe(2)
            expect(item.selector).toBe('.item')
            expect(item.error?.message).toBe('element with selector ".item" has no match at index 2')
            expect(driver.findsIn.slice(finds)).toEqual(['elements .item in document'])
        })

        it('getText waits for the item and throws that it was not found again', async () => {
            const elem = await goneItem()
            const { error } = await settle(elem.getText())
            expect(error?.name).toBe(ELEMENT_NOT_FOUND_AGAIN)
        })

        it('getText uses the item when the list reaches its index again while it waits', async () => {
            const elem = await goneItem()
            setTimeout(() => driver.light.set('.item', ['elem-x', 'elem-y', 'elem-z']), 30)
            expect(await elem.getText()).toBe('text of elem-z')
        })

        /**
         * Each layer of the element middleware finds a stale element again once. An item
         * has as many layers as `$()`, whatever its index: with one more layer for each
         * item, a command on a gone item `[n]` threw after `(n + 1) * 2 * waitforTimeout`
         */
        it('is found again as often as $() when it is stale, whatever its index', async () => {
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
                expect(error?.name).toBe(ELEMENT_NOT_FOUND_AGAIN)
                return vi.mocked(refetchElement).mock.calls.length
            }

            const reference = await refetches((browser) => browser.$('#ref').getElement(), 'elem-r')
            expect(reference).toBeGreaterThan(0)
            expect([
                await refetches(async (browser) => (await browser.$$('.item'))[0], 'elem-a'),
                await refetches(async (browser) => (await browser.$$('.item'))[2], 'elem-c')
            ]).toEqual([reference, reference])
        })

        it('a stale item whose index the list still reaches is found again', async () => {
            const elem = await goneItem()
            driver.light.set('.item', ['elem-x', 'elem-y', 'elem-z'])
            expect(await elem.isDisplayed()).toBe(true)
            expect(await elem.getText()).toBe('text of elem-z')
        })
    })

    /**
     * A command on an element that the page removed waits `waitforTimeout` once for it, also
     * when the command runs other commands on it, or on its children (#16072). The tests count
     * the implicit waits that ended without the element, not the time.
     */
    describe('one wait for an element that the page removed', () => {
        const waits = async (command: Promise<unknown>) => {
            vi.mocked(implicitWait).mockClear()
            const outcome = await settle(command)
            const ended = vi.mocked(implicitWait).mock.settledResults.filter((result) =>
                result.type === 'rejected' && /wasn't found/.test(String((result.value as Error | undefined)?.message)))
            return { ...outcome, waits: ended.length }
        }
        /**
         * the error of a command on an element that the page removed
         */
        const expectGone = (error?: Error) => {
            expect(error?.name).toBe(ELEMENT_NOT_FOUND_AGAIN)
            expect(error?.message).toMatch(/wasn't found/)
        }
        const removedHost = async () => {
            const browser = await session()
            driver.light.set('#host', ['host-a'])
            driver.light.set('.child', ['child-a'])
            const host = await browser.$('#host')
            const child = await host.$('.child')
            return { browser, host, child }
        }
        const removedRef = async () => {
            const browser = await session()
            driver.light.set('#ref', ['elem-r'])
            const elem = await browser.$('#ref')
            driver.stale.add('elem-r')
            driver.light.set('#ref', [])
            return elem
        }

        it('waits once for a removed list item', async () => {
            const browser = await session()
            driver.light.set('.item', ['elem-a', 'elem-b', 'elem-c'])
            const elem = (await browser.$$('.item'))[2]
            driver.stale.add('elem-c')
            driver.light.set('.item', [])

            const { error, waits: count } = await waits(elem.getText())
            expectGone(error)
            expect(count).toBe(1)
        })

        it('waits once for a removed child', async () => {
            const { child } = await removedHost()
            driver.stale.add('child-a')
            driver.light.set('.child', [])

            const { error, waits: count } = await waits(child.getText())
            expectGone(error)
            expect(count).toBe(1)
        })

        it('waits once for a child whose parent was removed', async () => {
            const { child } = await removedHost()
            driver.stale.add('host-a')
            driver.stale.add('child-a')
            driver.light.set('#host', [])

            const { error, waits: count } = await waits(child.getText())
            expectGone(error)
            expect(count).toBe(1)
        })

        /**
         * a check (`isDisplayed`) of a gone parent leaves it without an element id
         */
        it('waits once for a child after isDisplayed of its removed parent', async () => {
            const { host, child } = await removedHost()
            driver.stale.add('host-a')
            driver.stale.add('child-a')
            driver.light.set('#host', [])
            host.elementId = undefined as unknown as string

            const { error, waits: count } = await waits(child.getText())
            expectGone(error)
            expect(count).toBe(1)
        })

        it('waits once for a command of the host that clicks a stale child', async () => {
            const { browser, child } = await removedHost()
            browser.addCommand('clickKept', function () {
                return child.click()
            }, { attachToElement: true })
            /**
             * an element gets the commands that were added before it
             */
            const host = await browser.$('#host')
            driver.stale.add('child-a')
            driver.light.set('.child', [])

            // @ts-expect-error undefined custom command
            const { error, waits: count } = await waits(host.clickKept())
            expectGone(error)
            expect(count).toBe(1)
        })

        it('types into the input that the page renders again when clearing it', async () => {
            const browser = await session()
            driver.light.set('#ref', ['elem-r'])
            const elem = await browser.$('#ref')
            const handler = vi.mocked(fetch).getMockImplementation()!
            const typedInto: string[] = []
            vi.mocked(fetch).mockImplementation((async (uri: URL | string, params?: RequestInit) => {
                const url = String(uri)
                if (url.endsWith('/element/elem-r/clear')) {
                    driver.stale.add('elem-r')
                    driver.light.set('#ref', ['elem-r2'])
                    return Response.json({ value: null })
                }
                const typed = url.match(/\/element\/([^/]+)\/value$/)
                if (typed && !driver.stale.has(typed[1])) {
                    typedInto.push(typed[1])
                    return Response.json({ value: null })
                }
                return handler(uri, params)
            }) as typeof fetch)

            const { error, waits: count } = await waits(elem.setValue('x'))
            expect(error).toBeUndefined()
            expect(typedInto).toEqual(['elem-r2'])
            expect(count).toBe(0)
        })

        /**
         * with Chrome's message, the error of `waitUntil` that wraps the stale error is a stale
         * error too, and its layers would look again
         */
        it('waits once for waitForEnabled of a removed element', async () => {
            driver.options.staleMessage = CHROME_STALE_MESSAGE
            const elem = await removedRef()
            vi.mocked(refetchElement).mockClear()
            const { error, waits: count } = await waits(elem.waitForEnabled())
            expect(error).toBeInstanceOf(Error)
            expect(count).toBe(1)
            /**
             * the layers of the wait do not look again (and run the wait again)
             */
            expect(vi.mocked(refetchElement).mock.calls.map(([, commandName]) => commandName)).toEqual(['isElementEnabled'])
        })

        /**
         * after the wait for the child, a check of the child would find the removed parent again
         * through the middleware of the parent, and wait for it again (#16072 review)
         */
        it('does not wait for a removed parent again after the wait for a child without an element id', async () => {
            const lookups = async (run: (child: WebdriverIO.Element) => Promise<unknown>) => {
                const browser = await session()
                driver.stale.delete('host-a')
                driver.light.set('#host', ['host-a'])
                const host = await browser.$('#host')
                const child = await host.$('.missing')
                driver.stale.add('host-a')
                driver.light.set('#host', [])
                vi.mocked(refetchElement).mockClear()
                await settle(run(child))
                return vi.mocked(refetchElement).mock.calls.length
            }

            const wait = await lookups((child) => child.waitForExist())
            expect(wait).toBeGreaterThan(0)
            expect(await lookups((child) => child.getText())).toBe(wait)
        })

        it('waits once when the page removes the element between two inner commands', async () => {
            const browser = await session()
            browser.addCommand('textThenClick', async function (this: WebdriverIO.Element) {
                await this.getText()
                driver.stale.add('elem-r')
                driver.light.set('#ref', [])
                return this.click()
            }, { attachToElement: true })
            driver.light.set('#ref', ['elem-r'])
            const elem = await browser.$('#ref')

            // @ts-expect-error undefined custom command
            const { error, waits: count } = await waits(elem.textThenClick())
            expectGone(error)
            expect(count).toBe(1)
        })

        it('waits once for a child of a removed shadow host', async () => {
            const browser = await session()
            driver.light.set('#host', ['host-a'])
            driver.shadow.set('.x', ['shadow-x'])
            const child = await browser.$('#host').shadow$('.x').getElement()
            driver.stale.add('host-a')
            driver.stale.add('shadow-x')
            driver.light.set('#host', [])

            const { error, waits: count } = await waits(child.getText())
            expectGone(error)
            expect(count).toBe(1)
        })

        it('waits once for shadow$ of a removed host', async () => {
            const browser = await session()
            driver.light.set('#host', ['host-a'])
            driver.shadow.set('.x', ['shadow-x'])
            const host = await browser.$('#host').getElement()
            driver.stale.add('host-a')
            driver.light.set('#host', [])

            const { error, waits: count } = await waits(host.shadow$('.x').getText())
            expectGone(error)
            expect(count).toBe(1)
        })

        it('waits once for a stale element error that only its name identifies', async () => {
            const elem = await removedRef()
            const { error, waits: count } = await waits(elem.getText())
            expectGone(error)
            expect(isStaleElementError(error)).toBe(false)
            expect(count).toBe(1)
        })

        /**
         * the lookup of `isDisplayed` inside `isClickable` waits for the removed parent: the
         * check does not wait for it again (#16072 review)
         */
        it('waits once for a check of a child whose parent was removed', async () => {
            const { child } = await removedHost()
            driver.stale.add('host-a')
            driver.stale.add('child-a')
            driver.light.set('#host', [])

            const { error, waits: count } = await waits(child.isClickable())
            expectGone(error)
            expect(count).toBe(1)
        })

        /**
         * a page object command of a container: the lookup of its child waits for the removed
         * container, and the container command does not wait for it again (#16072 review)
         */
        it('waits once for a command of a container that the page removed', async () => {
            const browser = await session()
            browser.addCommand('childText', function (this: WebdriverIO.Element) {
                return this.$('.child').getText()
            }, { attachToElement: true })
            driver.light.set('#host', ['host-a'])
            driver.light.set('.child', ['child-a'])
            const host = await browser.$('#host')
            // @ts-expect-error undefined custom command
            expect(await host.childText()).toBe('text of child-a')
            driver.stale.add('host-a')
            driver.stale.add('child-a')
            driver.light.set('#host', [])

            // @ts-expect-error undefined custom command
            const { error, waits: count } = await waits(host.childText())
            expectGone(error)
            expect(count).toBe(1)
        })

        it('fails both commands that run at the same time on a removed element', async () => {
            const elem = await removedRef()
            const results = await Promise.allSettled([elem.getText(), elem.getAttribute('id')])
            expect(results.map((result) => result.status)).toEqual(['rejected', 'rejected'])
            for (const result of results) {
                expectGone((result as PromiseRejectedResult).reason)
            }
        })

        /**
         * Each poll of a wait on the element looks for it again: the element can come back
         * before the timeout of the wait (#16072 final review)
         */
        describe('a wait that polls the element', () => {
            const later = (ms: number, change: () => void) => setTimeout(change, ms)

            it('waitForEnabled with a long timeout finds the element that comes back', async () => {
                const elem = await removedRef()
                later(250, () => driver.light.set('#ref', ['elem-r2']))
                expect(await elem.waitForEnabled({ timeout: 1000 })).toBe(true)
            })

            it('waitUntil of the element finds the element that comes back', async () => {
                const elem = await removedRef()
                later(250, () => driver.light.set('#ref', ['elem-r2']))
                expect(await elem.waitUntil(async function (this: WebdriverIO.Element) {
                    return await this.getText() === 'text of elem-r2'
                }, { timeout: 1000 })).toBe(true)
            })

            it('waitUntil of the element finds an element that is late and then replaced', async () => {
                const browser = await session()
                const elem = await browser.$('#late')
                later(150, () => driver.light.set('#late', ['late-1']))
                later(300, () => {
                    driver.stale.add('late-1')
                    driver.light.set('#late', ['late-2'])
                })
                expect(await elem.waitUntil(async function (this: WebdriverIO.Element) {
                    return await this.getText() === 'text of late-2'
                }, { timeout: 1000 })).toBe(true)
            })

            it('a command that starts while the wait runs finds the element that came back', async () => {
                const elem = await removedRef()
                later(150, () => driver.light.set('#ref', ['elem-r2']))
                const wait = settle(elem.waitForEnabled({ timeout: 600 }))
                await new Promise((resolve) => setTimeout(resolve, 250))
                expect(await elem.getText()).toBe('text of elem-r2')
                expect((await wait).error).toBeUndefined()
            })
        })

        /**
         * a command of the element catches its failure, the page has the element again, and the
         * command uses the element without a new lookup: its own layer finds it again, as on
         * `main` (#16072 second final review)
         */
        describe('a command of the element that uses it again after a caught failure', () => {
            const commandOfGoneElement = async (secondUse: (elem: WebdriverIO.Element, browser: WebdriverIO.Browser) => Promise<unknown>) => {
                const browser = await session()
                browser.addCommand('useAgain', async function (this: WebdriverIO.Element) {
                    await this.getText().catch(() => 'caught')
                    driver.light.set('#ref', ['elem-r2'])
                    return secondUse(this, browser)
                }, { attachToElement: true })
                driver.light.set('#ref', ['elem-r'])
                const elem = await browser.$('#ref')
                driver.stale.add('elem-r')
                driver.light.set('#ref', [])
                // @ts-expect-error undefined custom command
                return elem.useAgain()
            }

            it('recovers when it runs a script with the element', async () => {
                const scriptGot: string[] = []
                await commandOfGoneElement(async (elem, browser) => {
                    await browser.execute((el) => el, elem as unknown as HTMLElement)
                    scriptGot.push(elem.elementId)
                })
                expect(scriptGot).toEqual(['elem-r2'])
            })

            it('recovers when it runs a protocol command with the element id', async () => {
                expect(await commandOfGoneElement((elem) => elem.getElementText(elem.elementId))).toBe('text of elem-r2')
            })
        })

        it('a command of the element answers a check at once after it caught a failure of the element', async () => {
            const browser = await session()
            browser.addCommand('textOrGone', async function (this: WebdriverIO.Element) {
                const text = await this.getText().catch(() => 'no text')
                const displayed = await this.isDisplayed()
                const gone = await this.waitForDisplayed({ reverse: true, timeout: 300 })
                return { text, displayed, gone }
            }, { attachToElement: true })
            driver.light.set('#ref', ['elem-r'])
            const elem = await browser.$('#ref')
            driver.stale.add('elem-r')
            driver.light.set('#ref', [])

            // @ts-expect-error undefined custom command
            expect(await elem.textOrGone()).toEqual({ text: 'no text', displayed: false, gone: true })
        })

        it('waits once for waitForStable of a removed element', async () => {
            driver.options.staleMessage = CHROME_STALE_MESSAGE
            const elem = await removedRef()
            vi.mocked(refetchElement).mockClear()
            const { error, waits: count } = await waits(elem.waitForStable())
            /**
             * `waitForStable` throws a new error with the message of the error of its check
             */
            expect(error?.message).toMatch(/wasn't found/)
            expect(count).toBe(1)
            expect(vi.mocked(refetchElement).mock.calls.map(([, commandName]) => commandName)).toEqual(['isStable'])
        })
    })

    describe('a chain of elements the page replaced', () => {
        it('finds each element of the chain again with its own command', async () => {
            driver.light.set('#host', ['host-a'])
            driver.shadow.set('.item', ['elem-a'])
            const elem = await (await session()).$('#host').shadow$('.item').getElement()

            driver.stale.add('host-a')
            driver.stale.add('elem-a')
            driver.light.set('#host', ['host-b'])
            driver.shadow.set('.item', ['elem-b'])
            expect(await elem.getText()).toBe('text of elem-b')
            expect(elem.elementId).toBe('elem-b')
            expect(driver.findsIn.at(-1)).toBe('element .item in shadow root of host-b')
        })

        it('runs the custom strategy of an element.custom$ element in the parent that was found again', async () => {
            driver.light.set('#form', ['form-a'])
            driver.scripts.set('customItem', ['elem-a'])
            const elem = await (await session()).$('#form').custom$('customItem').getElement()

            driver.stale.add('form-a')
            driver.stale.add('elem-a')
            driver.light.set('#form', ['form-b'])
            driver.scripts.set('customItem', ['elem-b'])
            expect(await elem.getText()).toBe('text of elem-b')

            /**
             * and once more, now that the element has the new parent
             */
            driver.stale.add('form-b')
            driver.stale.add('elem-b')
            driver.light.set('#form', ['form-c'])
            driver.scripts.set('customItem', ['elem-c'])
            expect(await elem.getText()).toBe('text of elem-c')
            expect(driver.findsIn.at(-1)).toBe('script customItem with form-c')
        })

        it('keeps an element the user gave to a browser.custom$ strategy', async () => {
            const browser = await session()
            driver.light.set('#root', ['root'])
            const root = await browser.$('#root').getElement()
            driver.scripts.set('customItem', ['elem-a'])
            const elem = await browser.custom$('customItem', root).getElement()

            driver.stale.add('elem-a')
            driver.scripts.set('customItem', ['elem-b'])
            expect(await elem.getText()).toBe('text of elem-b')
            expect(driver.findsIn.at(-1)).toBe('script customItem with root')
        })

        it('finds an element in an element of a list again', async () => {
            driver.light.set('li', ['li-x', 'li-a'])
            driver.light.set('span', ['elem-a'])
            const item = (await (await session()).$$('li'))[1]
            const elem = await item.$('span').getElement()

            driver.stale.add('li-a')
            driver.stale.add('elem-a')
            driver.light.set('li', ['li-y', 'li-b'])
            driver.light.set('span', ['elem-b'])
            expect(await elem.getText()).toBe('text of elem-b')
            expect(driver.findsIn.at(-1)).toBe('elements span in li-b')
        })

        it('keeps the strictness of each element of the chain', async () => {
            driver.light.set('form', ['form-a'])
            driver.light.set('button', ['elem-a'])
            const elem = await (await session()).$('form', { strict: false }).$('button').getElement()

            driver.stale.add('elem-a')
            driver.light.set('form', ['form-b', 'form-c'])
            driver.light.set('button', ['elem-b'])
            expect(await elem.getText()).toBe('text of elem-b')
            expect(driver.findsIn.at(-1)).toBe('elements button in form-b')

            driver.stale.add('elem-b')
            driver.light.set('button', ['elem-c', 'elem-d'])
            const { error } = await settle(elem.getText())
            expect(error).toBeInstanceOf(StrictSelectorError)
        })
    })

    it('throws the stale element error for an element of $$(element references), which has no selector to run again', async () => {
        const elem = (await (await session()).$$([{ [ELEMENT_KEY]: 'elem-x' }, { [ELEMENT_KEY]: 'elem-a' }] as never))[1]
        expect(elem.elementId).toBe('elem-a')
        driver.stale.add('elem-a')

        const { error } = await settle(elem.getText())
        expect(error?.name).toBe('stale element reference')
    })

    it('throws the stale element error for an element reference, which has no selector to run again', async () => {
        const elem = await (await session()).$({ [ELEMENT_KEY]: 'elem-a' } as never).getElement()
        driver.stale.add('elem-a')

        const { error } = await settle(elem.getText())
        expect(error?.name).toBe('stale element reference')
    })
})

/**
 * Each path keeps the strictness the element was queried with: a strict
 * element throws for several matches, all others take the first match.
 */
describe('finding an element again in strict mode', () => {
    const ORIGINS = [
        { origin: '$() with strict mode on', strictSelectors: true, options: undefined, strict: true },
        { origin: '$({ strict: false }) with strict mode on', strictSelectors: true, options: { strict: false }, strict: false },
        { origin: '$({ strict: true }) with strict mode off', strictSelectors: false, options: { strict: true }, strict: true },
        { origin: '$() with strict mode off', strictSelectors: false, options: undefined, strict: false },
    ] as const

    /**
     * the element is queried while the page has no match, so it has no
     * element id, and each path finds it again once the page changed
     */
    describe.each([{
        path: 'isDisplayed (hasElementId)',
        run: (elem: WebdriverIO.Element) => elem.isDisplayed(),
        found: true,
        notFound: (outcome: { value: unknown, error?: Error }) => expect(outcome.value).toBe(false)
    }, {
        path: 'getText (implicitWait)',
        run: (elem: WebdriverIO.Element) => elem.getText(),
        found: 'text of elem-b',
        notFound: (outcome: { value: unknown, error?: Error }) => expect(outcome.error?.message).toContain('wasn\'t found')
    }, {
        path: 'waitForExist',
        run: (elem: WebdriverIO.Element) => elem.waitForExist(),
        found: true,
        notFound: (outcome: { value: unknown, error?: Error }) => expect(outcome.error?.message).toContain('still not existing')
    }])('$path on an element that was not on the page', ({ run, found, notFound }) => {
        describe.each(ORIGINS)('$origin', ({ strictSelectors, options, strict }) => {
            const lazyElement = async () => {
                const elem = await (await session(strictSelectors)).$('button', options).getElement()
                expect(elem.elementId).toBeUndefined()
                expect(elem.strict).toBe(strict)
                return elem
            }

            it('is not found when nothing matches', async () => {
                const elem = await lazyElement()
                notFound(await settle(run(elem)))
                expect(elem.elementId).toBeUndefined()
            })

            it('resolves the only match', async () => {
                const elem = await lazyElement()
                driver.light.set('button', ['elem-b'])
                expect(await run(elem)).toBe(found)
                expect(elem.elementId).toBe('elem-b')
            })

            it(strict ? 'throws a StrictSelectorError for several matches' : 'resolves the first of several matches', async () => {
                const elem = await lazyElement()
                driver.light.set('button', ['elem-b', 'elem-c'])
                const outcome = await settle(run(elem))
                if (strict) {
                    expect(outcome.error).toBeInstanceOf(StrictSelectorError)
                    expect(elem.elementId).toBeUndefined()
                    return
                }
                expect(outcome.error).toBeUndefined()
                expect(outcome.value).toBe(found)
                expect(elem.elementId).toBe('elem-b')
                /**
                 * `isExisting` counts the matches with `elements`, the element
                 * itself is found with a single `element` request
                 */
                expect(driver.finds.at(-1)).toBe('element button')
            })
        })
    })

    /**
     * the element was found, then the page replaced it, so the next command
     * gets a stale element error and `refetchElement` finds it again
     */
    describe.each(ORIGINS)('getText (refetchElement) on $origin the page replaced', ({ strictSelectors, options, strict }) => {
        const staleElement = async (after: string[]) => {
            driver.light.set('button', ['elem-a'])
            const elem = await (await session(strictSelectors)).$('button', options).getElement()
            expect(elem.elementId).toBe('elem-a')
            driver.stale.add('elem-a')
            driver.light.set('button', after)
            return elem
        }

        it('throws that it was not found again when nothing matches', async () => {
            const elem = await staleElement([])
            const { error } = await settle(elem.getText())
            expect(error?.name).toBe(ELEMENT_NOT_FOUND_AGAIN)
        })

        it('resolves the only match', async () => {
            const elem = await staleElement(['elem-b'])
            expect(await elem.getText()).toBe('text of elem-b')
            expect(elem.elementId).toBe('elem-b')
        })

        it(strict ? 'throws a StrictSelectorError for several matches' : 'resolves the first of several matches', async () => {
            const elem = await staleElement(['elem-b', 'elem-c'])
            const outcome = await settle(elem.getText())
            if (strict) {
                expect(outcome.error).toBeInstanceOf(StrictSelectorError)
                return
            }
            expect(outcome.value).toBe('text of elem-b')
            expect(elem.elementId).toBe('elem-b')
        })
    })

    /**
     * `isExisting` checks presence and doesn't find the element itself, so it
     * doesn't apply strictness. The violation shows once the element is used.
     */
    it('isExisting is true for a strict element with several matches', async () => {
        const elem = await (await session()).$('button').getElement()
        driver.light.set('button', ['elem-b', 'elem-c'])

        expect(await elem.isExisting()).toBe(true)
        expect(elem.elementId).toBeUndefined()
        await expect(elem.getText()).rejects.toThrow(StrictSelectorError)
    })
})

/**
 * the selector of a `custom$` / `custom$$` element is the strategy reference, an object:
 * the messages show the strategy name, not `[object Object]`
 */
describe('the selector of a custom strategy element in messages', () => {
    it('names the strategy in the timeout message of a wait command', async () => {
        const browser = await session()
        const { error } = await settle(browser.custom$('customItem').waitForExist({ timeout: 50 }))
        expect(error?.message).toBe('element ("custom$(customItem)") still not existing after 50ms')

        driver.scripts.set('customList', ['elem-a'])
        const { error: reverse } = await settle(browser.custom$$('customList')[0].waitForDisplayed({ reverse: true, timeout: 50 }))
        expect(reverse?.message).toBe('element ("custom$$(customList)") still displayed after 50ms')
    })

    it('names the strategy when a command is called on an element that was not found', async () => {
        const browser = await session()
        const { error } = await settle(browser.custom$('customItem').click())
        expect(error?.message).toBe('Can\'t call click on element with selector "custom$(customItem)" because element wasn\'t found')
    })

    it('names the strategy when a missing element is passed to execute', async () => {
        const browser = await session()
        const elem = await browser.custom$('customItem')
        const { error } = await settle(browser.execute((el) => el, elem as unknown as HTMLElement))
        expect(error?.message).toBe('The element with selector "custom$(customItem)" you are trying to pass into the execute method wasn\'t found')
    })

    it('keeps a string selector as it is', async () => {
        const browser = await session()
        const { error } = await settle(browser.$('.missing').waitForExist({ timeout: 50 }))
        expect(error?.message).toBe('element (".missing") still not existing after 50ms')
    })
})

describe('itemOf', () => {
    const strategy = function items () { return [] }
    const browser = { strategies: new Map([['items', strategy]]) } as unknown as WebdriverIO.Browser
    const element = { parent: browser, [Symbol.for('wdio.kind')]: 'element' } as unknown as WebdriverIO.Element
    const FLAGS = { isShadowElement: false, isReactElement: false }

    it('gives the selector and the flags of the items of a list command', () => {
        expect(itemOf('$$', '.item', [], browser)).toEqual({ selector: '.item', props: FLAGS })
        expect(itemOf('shadow$$', '.item', [], element)).toEqual({ selector: '.item', props: { isShadowElement: true, isReactElement: false } })
    })

    it('gives the React options of a react$$ list', () => {
        const reactOptions = { props: { a: 1 }, state: {} }
        expect(itemOf('react$$', 'Item', [reactOptions], browser)).toEqual({ selector: 'Item', props: { isShadowElement: false, isReactElement: true, reactOptions } })
        expect(itemOf('react$$', 'Item', [], browser)).toEqual({ selector: 'Item', props: { isShadowElement: false, isReactElement: true } })
    })

    it('gives the strategy reference of a custom$$ item, with the element as its last argument', () => {
        expect(itemOf('custom$$', 'items', ['a'], browser)).toEqual({
            selector: { strategy, strategyName: 'items', strategyArguments: ['a'] },
            props: FLAGS
        })
        expect(itemOf('custom$$', 'items', ['a'], element)).toEqual({
            selector: { strategy, strategyName: 'items', strategyArguments: ['a', element] },
            props: FLAGS
        })
    })

    it('gives undefined for a list whose items cannot be found again', () => {
        expect(itemOf('custom$$', 'unknown', [], browser)).toBeUndefined()
        expect(itemOf('$$', [{ 'element-6066-11e4-a52e-4f735466cecf': 'id' }], [], browser)).toBeUndefined()
        expect(itemOf('$$', undefined, [], browser)).toBeUndefined()
        expect(itemOf('constructor', '.item', [], browser)).toBeUndefined()
    })
})
