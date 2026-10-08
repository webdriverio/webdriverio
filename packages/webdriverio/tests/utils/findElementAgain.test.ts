import path from 'node:path'

import { ELEMENT_KEY } from 'webdriver'
import { describe, it, afterEach, beforeEach, expect, vi } from 'vitest'

import { remote } from '../../src/index.js'
import { StrictSelectorError } from '../../src/utils/strictMode.js'

vi.mock('fetch')
vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))

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
    const staleError = () => reply({
        error: 'stale element reference',
        message: 'element is not attached to the page document'
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
                finds.push(`react ${name}`)
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

        return fallback(uri, params)
    }

    return { light, shadow, react, scripts, stale, finds, findsIn, handler }
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

        it('getText on a stale element throws the stale element error', async () => {
            driver.light.set('.item', ['elem-x', 'elem-a'])
            const elem = (await (await session()).$$('.item'))[1]
            driver.stale.add('elem-a')
            driver.light.set('.item', ['elem-b'])

            const { error } = await settle(elem.getText())
            expect(error?.name).toBe('stale element reference')
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

        it('throws the stale element error when nothing matches', async () => {
            const elem = await staleElement([])
            const { error } = await settle(elem.getText())
            expect(error?.name).toBe('stale element reference')
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
