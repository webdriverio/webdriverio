import fs from 'node:fs/promises'
import path from 'node:path'
import { createRequire } from 'node:module'
import { createServer, type Server } from 'node:http'
import { once } from 'node:events'
import type { AddressInfo } from 'node:net'
import { browser, $, $$, expect } from '@wdio/globals'

const require = createRequire(import.meta.url)

const PAGE = `
<title>Missing list item</title>
<ul id="list"><li>a</li><li>b</li><li>c</li></ul>
<ul id="late"></ul>
<div id="host"></div>
<div id="react-root"></div>
<script src="/react.js"></script><script src="/react-dom.js"></script>
<script>
    document.getElementById('host').attachShadow({ mode: 'open' }).innerHTML = '<p>in shadow</p>'
    window.renderLate = () => setTimeout(() => {
        document.getElementById('late').innerHTML = '<li>a</li><li>b</li><li>c</li>'
    }, 300)
    /**
     * render the list again with new DOM nodes: the elements found before are stale
     */
    window.renderList = (texts) => {
        document.getElementById('list').innerHTML = texts.map((text) => '<li>' + text + '</li>').join('')
    }
    const h = React.createElement
    function Item (props) { return h('li', null, props.text) }
    let setItems
    function App () {
        const [state, setState] = React.useState({ texts: ['a', 'b', 'c'], generation: 0 })
        setItems = (texts) => setState((previous) => ({ texts, generation: previous.generation + 1 }))
        return h('ul', { key: state.generation }, state.texts.map((text, index) => h(Item, { key: index, text })))
    }
    ReactDOM.createRoot(document.getElementById('react-root')).render(h(App))
    window.renderReactList = (texts) => ReactDOM.flushSync(() => setItems(texts))
</script>
`

/**
 * the React 18 UMD builds of the `e2e` package, so the page needs no network (see `test.e2e.ts`)
 */
const REACT_SCRIPTS: Record<string, [string, string]> = {
    '/react.js': ['react-18', 'react.production.min.js'],
    '/react-dom.js': ['react-dom-18', 'react-dom.production.min.js']
}

const WAIT = 1000
const errorOf = (promise: Promise<unknown>) => promise.then(() => undefined, (e: Error) => e)

/**
 * An index that the list of `$$` never reaches gives a "not found" element after
 * `waitforTimeout`, like `$('.missing')`: check commands and negative matchers work, and
 * a command that needs the element throws "Index out of bounds" (#12576).
 */
describe('an index that the list of $$ never reaches', () => {
    let server: Server
    let waitforTimeout: number | undefined

    before(async () => {
        server = createServer((request, response) => {
            const script = REACT_SCRIPTS[request.url || '']
            if (script) {
                response.setHeader('Content-Type', 'text/javascript; charset=utf-8')
                const [pkg, file] = script
                return fs.readFile(path.join(path.dirname(require.resolve(`${pkg}/package.json`)), 'umd', file), 'utf8')
                    .then((source) => response.end(source))
            }
            response.setHeader('Content-Type', 'text/html; charset=utf-8')
            response.end(PAGE)
        })
        server.listen(0, '127.0.0.1')
        await once(server, 'listening')
        waitforTimeout = browser.options.waitforTimeout
        browser.options.waitforTimeout = WAIT
    })

    beforeEach(async () => {
        await browser.url(`http://127.0.0.1:${(server.address() as AddressInfo).port}/`)
    })

    after(async () => {
        browser.options.waitforTimeout = waitforTimeout
        const closed = new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()))
        server.closeAllConnections()
        await closed
    })

    it('gives a not found element instead of an error', async () => {
        const item = await $$('#list li')[5]
        expect(item.elementId).toBeUndefined()
        expect(item.index).toBe(5)
        expect(item.error?.message).toBe('Index out of bounds! $$(#list li) returned only 3 elements.')
    })

    it('gives false for isDisplayed and isExisting', async () => {
        expect(await $$('#list li')[5].isDisplayed()).toBe(false)
        expect(await $$('#list li')[5].isExisting()).toBe(false)
    })

    it('resolves a reverse wait', async () => {
        expect(await $$('#list li')[5].waitForDisplayed({ reverse: true })).toBe(true)
    })

    it('passes the negative matchers of the issue', async () => {
        await expect($$('#list li')[5]).not.toBeDisplayed()
        await expect($$('#list li')[5]).not.toExist()
    })

    it('throws "Index out of bounds" for a command that needs the element, after one wait', async () => {
        const started = Date.now()
        const error = await errorOf($$('#list li')[5].click())
        const elapsed = Date.now() - started

        expect(error?.message).toContain('Index out of bounds! $$(#list li) returned only 3 elements.')
        /**
         * the index waits once; the implicit wait of the command does not wait again
         */
        expect(elapsed).toBeGreaterThanOrEqual(WAIT)
        expect(elapsed).toBeLessThan(2 * WAIT)
    })

    it('gives the same not found element for shadow$$', async () => {
        expect(await $('#host').shadow$$('p')[2].isDisplayed()).toBe(false)
        const error = await errorOf($('#host').shadow$$('p')[2].getText())
        expect(error?.message).toContain('Index out of bounds!')
    })

    it('gives the same not found element for the list of a held browsing context', async function () {
        if (!browser.isBidi) {
            return this.skip()
        }
        const context = await browser.url(`http://127.0.0.1:${(server.address() as AddressInfo).port}/`)
        expect(await context.$$('#list li')[5].isDisplayed()).toBe(false)
        const error = await errorOf(context.$$('#list li')[5].click())
        expect(error?.message).toContain('Index out of bounds! $$(#list li) returned only 3 elements.')
    })

    it('still waits for a list that loads later', async () => {
        await browser.execute(() => (window as unknown as { renderLate (): void }).renderLate())
        expect(await $$('#late li')[2].getText()).toBe('c')
    })

    it('still waits for a matcher on an item that appears later', async () => {
        await browser.execute(() => (window as unknown as { renderLate (): void }).renderLate())
        await expect($$('#late li')[2]).toBeDisplayed()
    })

    /**
     * Each list command, in each state of its item, with the checks of the issue and a
     * command. Each check runs on a new element, because a check can change the element
     * object (for example `isDisplayed` removes the id of an element it finds missing).
     */
    describe('the matrix of list commands, item states and checks', () => {
        type Kind = '$$' | 'custom$$' | 'react$$'
        type State = 'in range' | 'never reached' | 'stale with the same length' | 'stale in a shorter list'
        type Page = { renderList (texts: string[]): void, renderReactList (texts: string[]): void }

        const renderPlain = (texts: string[]) => browser.execute((texts) => (window as unknown as Page).renderList(texts), texts)
        const renderReact = (texts: string[]) => browser.execute((texts) => (window as unknown as Page).renderReactList(texts), texts)
        const LISTS: Record<Kind, { list: () => ReturnType<typeof $$>, render: (texts: string[]) => Promise<unknown> }> = {
            '$$': { list: () => $$('#list li'), render: renderPlain },
            'custom$$': { list: () => browser.custom$$('listItems'), render: renderPlain },
            'react$$': { list: () => browser.react$$('Item'), render: renderReact }
        }
        const ABC = ['a', 'b', 'c']
        /**
         * the element of the state, found on a list `a, b, c`
         */
        const STATES: Record<State, (kind: Kind) => Promise<WebdriverIO.Element>> = {
            'in range': async (kind) => {
                await LISTS[kind].render(ABC)
                return LISTS[kind].list()[1].getElement()
            },
            'never reached': async (kind) => {
                await LISTS[kind].render(ABC)
                return LISTS[kind].list()[5].getElement()
            },
            'stale with the same length': async (kind) => {
                await LISTS[kind].render(ABC)
                const items = await LISTS[kind].list()
                await LISTS[kind].render(['x', 'y', 'z'])
                return items[1]
            },
            'stale in a shorter list': async (kind) => {
                await LISTS[kind].render(ABC)
                const items = await LISTS[kind].list()
                await LISTS[kind].render(['x'])
                return items[2]
            }
        }
        const CHECKS: Record<string, (elem: WebdriverIO.Element) => Promise<unknown>> = {
            isExisting: (elem: WebdriverIO.Element) => elem.isExisting(),
            'waitForExist reverse': (elem: WebdriverIO.Element) => elem.waitForExist({ reverse: true, timeout: 500 }),
            isDisplayed: (elem: WebdriverIO.Element) => elem.isDisplayed(),
            getText: (elem: WebdriverIO.Element) => elem.getText()
        }
        /**
         * the value of a check, `stale` for a stale element error, or `error: <message>`
         */
        const outcomeOf = (promise: Promise<unknown>) => promise.then(
            (value) => value,
            (error: Error) => error.name === 'stale element reference' ? 'stale' : `error: ${error.message}`
        )
        const STILL_EXISTING = expect.stringMatching(/^error: element .* still existing after 500ms/)
        const OUT_OF_BOUNDS = expect.stringMatching(/^error: Index out of bounds!/)
        const expected = (kind: Kind, state: State) => {
            switch (state) {
            case 'in range':
                return { isExisting: true, 'waitForExist reverse': STILL_EXISTING, isDisplayed: true, getText: 'b' }
            case 'never reached':
                /**
                 * a `custom$$` list still throws, see "Limitations and follow-up" in #16041
                 */
                return kind === 'custom$$'
                    ? { isExisting: OUT_OF_BOUNDS, 'waitForExist reverse': OUT_OF_BOUNDS, isDisplayed: OUT_OF_BOUNDS, getText: OUT_OF_BOUNDS }
                    : { isExisting: false, 'waitForExist reverse': true, isDisplayed: false, getText: OUT_OF_BOUNDS }
            case 'stale with the same length':
                return {
                    isExisting: true,
                    'waitForExist reverse': STILL_EXISTING,
                    /**
                     * BiDi gives `false` for a stale element without looking for it again,
                     * as on `main`: not part of this matrix
                     */
                    isDisplayed: browser.isBidi ? expect.anything() : true,
                    getText: 'y'
                }
            case 'stale in a shorter list':
                return {
                    isExisting: false,
                    'waitForExist reverse': true,
                    /**
                     * Classic looks for the stale element again and throws its stale element
                     * error, BiDi gives `false`, both as on `main`
                     */
                    isDisplayed: browser.isBidi ? false : 'stale',
                    getText: 'stale'
                }
            }
        }

        before(async () => {
            await browser.addLocatorStrategy('listItems', () => [...document.querySelectorAll<HTMLElement>('#list li')])
        })

        beforeEach(async () => {
            await browser.waitUntil(() => browser.execute(() => document.querySelectorAll('#react-root li').length === 3))
        })

        for (const kind of Object.keys(LISTS) as Kind[]) {
            for (const state of Object.keys(STATES) as State[]) {
                it(`${kind}, ${state}`, async () => {
                    const actual: Record<string, unknown> = {}
                    for (const [check, run] of Object.entries(CHECKS)) {
                        actual[check] = await outcomeOf(STATES[state](kind).then(run))
                    }
                    expect(actual).toEqual(expected(kind, state))
                })
            }
        }
    })
})
