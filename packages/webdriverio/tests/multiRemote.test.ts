import path from 'node:path'
import { test, expect, vi, afterEach, describe, beforeAll, afterAll } from 'vitest'
import type { Capabilities } from '@wdio/types'

import { multiRemote } from '../src/index.js'
import { MultiRemoteMock } from '../src/multiRemoteMock.js'

vi.mock('fetch')
vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))

const caps = (): Capabilities.RequestedMultiRemoteCapabilities => ({
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
})

describe('Multi-Remote tests', () => {
    describe('$$', () => {
        test('returns a MultiRemoteElementArray without any opt-in', async () => {
            const browser = await multiRemote(caps())

            const elements = await browser.$$('#foo')

            expect(Array.isArray(elements)).toBe(true)
            expect(elements.selector).toBe('#foo')
            expect(elements.foundWith).toBe('$$')
            expect(elements.parent).toBeDefined()
            expect(elements.isMultiRemote).toBe(true)
        })

        test('gives every entry the instances of the multi-remote browser', async () => {
            const browser = await multiRemote(caps())

            const elements = await browser.$$('#foo')

            expect(elements.length).toBeGreaterThan(0)
            for (const element of elements) {
                expect([...element.instances].sort()).toEqual(['browserA', 'browserB'])
            }
        })

        test('gives no element to an instance that finds fewer elements (#15845)', async () => {
            const browser = await multiRemote(caps())
            vi.spyOn(browser.getInstance('browserB'), 'findElements')
                .mockResolvedValue([{ 'element-6066-11e4-a52e-4f735466cecf': 'some-elem-123' }])

            const elements = await browser.$$('#foo')

            expect(elements).toHaveLength(3)
            expect(elements[0].getInstance('browserB').elementId).toBe('some-elem-123')
            expect(() => elements[1].getInstance('browserB')).toThrow('Multi-remote object has no instance named "browserB"')
            expect(() => elements[2].getInstance('browserB')).toThrow('Multi-remote object has no instance named "browserB"')
            expect(elements[2].getInstance('browserA').elementId).toBe('some-elem-789')
        })

        describe('entry that the first instance does not have', () => {
            const cardsSelector = () => document.querySelectorAll('.card') as unknown as HTMLElement[]

            /**
             * browserA finds 1 card, browserB finds 2: the selector is a function,
             * so the entries cannot take the selector of the list
             */
            const findCards = async () => {
                const browser = await multiRemote(caps())
                vi.spyOn(browser.getInstance('browserA'), 'execute')
                    .mockResolvedValue([{ 'element-6066-11e4-a52e-4f735466cecf': 'a-0' }])
                vi.spyOn(browser.getInstance('browserB'), 'execute')
                    .mockResolvedValue([
                        { 'element-6066-11e4-a52e-4f735466cecf': 'b-0' },
                        { 'element-6066-11e4-a52e-4f735466cecf': 'b-1' }
                    ])
                const cards = await browser.$$(cardsSelector)
                return { browser, cards }
            }

            test('takes the selector of the instance that has the element', async () => {
                const { cards } = await findCards()

                expect(cards).toHaveLength(2)
                expect(cards[1].selector).toBe(cardsSelector)
            })

            test('does not query the page of the browsers', async () => {
                const { browser, cards } = await findCards()
                const findOnPage = ['browserA', 'browserB'].map((name) => vi.spyOn(browser.getInstance(name), 'findElements'))

                await expect(cards[1].$$('span.price')).rejects.toThrow('Multi-remote object has no instance named "browserA"')
                for (const find of findOnPage) {
                    expect(find).not.toHaveBeenCalled()
                }
            })

            test('queries inside the element after select()', async () => {
                const { browser, cards } = await findCards()
                const findOnPage = vi.spyOn(browser.getInstance('browserB'), 'findElements')
                const findInCard = vi.spyOn(cards[1].getInstance('browserB'), 'findElementsFromElement')

                const prices = await cards[1].select('browserB').$$('span.price')

                expect(prices.isMultiRemote).toBe(true)
                expect(findInCard).toHaveBeenCalledTimes(1)
                expect(findOnPage).not.toHaveBeenCalled()
            })
        })

        test('gives the entries of custom$$ the strategy of their elements as selector', async () => {
            const browser = await multiRemote(caps())
            browser.addLocatorStrategy('test', (selector: string) => [
                { 'element-6066-11e4-a52e-4f735466cecf': `${selector}-0` }
            ] as unknown as HTMLElement[])

            const list = await browser.custom$$('test', '.foo')

            expect(list[0].selector).toEqual(list[0].getInstance('browserA').selector)
            expect((list[0].selector as unknown as { strategyName: string }).strategyName).toBe('test')
        })

        test('gives an empty list when no instance finds an element', async () => {
            const browser = await multiRemote(caps())
            for (const name of ['browserA', 'browserB']) {
                vi.spyOn(browser.getInstance(name), 'findElements').mockResolvedValue([])
            }

            const elements = await browser.$$('#foo')

            expect(elements).toHaveLength(0)
            expect(elements.isMultiRemote).toBe(true)
        })

        test('gives no element to an instance that finds fewer elements in a list of an element query', async () => {
            const browser = await multiRemote(caps())
            const parent = await browser.$('#parent')
            vi.spyOn(parent.getInstance('browserA'), 'findElementsFromElement').mockResolvedValue([
                { 'element-6066-11e4-a52e-4f735466cecf': 'a-0' },
                { 'element-6066-11e4-a52e-4f735466cecf': 'a-1' }
            ])
            vi.spyOn(parent.getInstance('browserB'), 'findElementsFromElement').mockResolvedValue([
                { 'element-6066-11e4-a52e-4f735466cecf': 'b-0' }
            ])

            const elements = await parent.$$('#foo')

            expect(elements).toHaveLength(2)
            expect(elements[0].getInstance('browserB').elementId).toBe('b-0')
            expect(elements[1].getInstance('browserA').elementId).toBe('a-1')
            expect(() => elements[1].getInstance('browserB')).toThrow('Multi-remote object has no instance named "browserB"')
        })

        describe('index past the end of a loaded list', () => {
            const elementRefs = (count: number) => Array.from(
                { length: count },
                (_, index) => ({ 'element-6066-11e4-a52e-4f735466cecf': `elem-${index}` })
            )

            /**
             * Every instance finds 2 elements, then 3 elements from the query
             * number `foundFrom` on.
             */
            const growingElements = (browser: WebdriverIO.MultiRemoteBrowser, foundFrom: number) => (
                ['browserA', 'browserB'].map((name) => {
                    let queries = 0
                    return vi.spyOn(browser.getInstance(name), 'findElements')
                        .mockImplementation(async () => elementRefs(++queries >= foundFrom ? 3 : 2))
                })
            )

            test('gives one multi-remote element when the element appears', async () => {
                const browser = await multiRemote(caps())
                const [findA, findB] = growingElements(browser, 3)

                const elements = await browser.$$('#foo')
                const element = await elements[2]

                expect(Array.isArray(element)).toBe(false)
                expect(element.isMultiRemote).toBe(true)
                expect(element.getInstance('browserA').elementId).toBe('elem-2')
                expect(element.getInstance('browserB').elementId).toBe('elem-2')
                expect(findA.mock.calls).toHaveLength(3)
                expect(findB.mock.calls).toHaveLength(3)
            })

            test('gives one multi-remote element for a list of an element query', async () => {
                const browser = await multiRemote(caps())
                const parent = await browser.$('#parent')
                const [findA, findB] = ['browserA', 'browserB'].map((name) => {
                    let queries = 0
                    return vi.spyOn(parent.getInstance(name), 'findElementsFromElement')
                        .mockImplementation(async () => elementRefs(++queries >= 3 ? 3 : 2))
                })

                const elements = await parent.$$('#foo')
                const element = await elements[2]

                expect(Array.isArray(element)).toBe(false)
                expect(element.isMultiRemote).toBe(true)
                expect(element.getInstance('browserB').elementId).toBe('elem-2')
                expect(findA.mock.calls).toHaveLength(3)
                expect(findB.mock.calls).toHaveLength(3)
            })

            test('rejects when the element does not appear', async () => {
                const browser = await multiRemote(caps())
                for (const name of ['browserA', 'browserB']) {
                    browser.getInstance(name).options.waitforTimeout = 50
                }
                growingElements(browser, Number.POSITIVE_INFINITY)

                const elements = await browser.$$('#foo')

                await expect(elements[2]).rejects.toThrow('Index out of bounds! $$(#foo) returned only 2 elements.')
            })

            test('waits for every instance with its own timeout', async () => {
                const browser = await multiRemote(caps())
                browser.getInstance('browserA').options.waitforTimeout = 50
                browser.getInstance('browserB').options.waitforTimeout = 2000
                let queriesA = 0
                vi.spyOn(browser.getInstance('browserA'), 'findElements')
                    .mockImplementation(async () => elementRefs(++queriesA >= 2 ? 3 : 2))
                const start = Date.now()
                vi.spyOn(browser.getInstance('browserB'), 'findElements')
                    .mockImplementation(async () => elementRefs(Date.now() - start >= 300 ? 3 : 2))

                const elements = await browser.$$('#foo')
                const element = await elements[2]

                expect(element.getInstance('browserA').elementId).toBe('elem-2')
                expect(element.getInstance('browserB').elementId).toBe('elem-2')
            })

            test('gives one multi-remote element for a list chained on a pending element query', async () => {
                const childElements = /\/element\/[^/]+\/elements$/
                const fetchMock = fetch as unknown as { customResponseFor: (pattern: RegExp, response: unknown) => void, resetCustomResponses: () => void }
                fetchMock.customResponseFor(childElements, { value: elementRefs(2) })
                const browser = await multiRemote(caps())

                const elements = await browser.$('#parent').$$('#foo')
                expect(elements).toHaveLength(2)
                setTimeout(() => fetchMock.customResponseFor(childElements, { value: elementRefs(3) }), 50)
                const element = await elements[2]

                expect(Array.isArray(element)).toBe(false)
                expect(element.isMultiRemote).toBe(true)
                expect(element.getInstance('browserA').elementId).toBe('elem-2')
                expect(element.getInstance('browserB').elementId).toBe('elem-2')
                fetchMock.resetCustomResponses()
            })

            test('waits on a list that is not loaded yet', async () => {
                const browser = await multiRemote(caps())
                growingElements(browser, 3)

                const element = await browser.$$('#foo')[2]

                expect(Array.isArray(element)).toBe(false)
                expect(element.isMultiRemote).toBe(true)
                expect(element.getInstance('browserA').elementId).toBe('elem-2')
                expect(element.getInstance('browserB').elementId).toBe('elem-2')
            })

            test('waits only on the selected instances', async () => {
                const browser = await multiRemote(caps())
                const [findA, findB] = growingElements(browser, 3)

                const elements = await browser.select('browserB').$$('#foo')
                const element = await elements[2]

                expect(element.instances).toEqual(['browserB'])
                expect(element.getInstance('browserB').elementId).toBe('elem-2')
                expect(() => element.getInstance('browserA')).toThrow('Multi-remote object has no instance named "browserA"')
                expect(findA).not.toHaveBeenCalled()
                expect(findB.mock.calls).toHaveLength(3)
            })

            test('waits only on the instances of a selected parent element', async () => {
                const browser = await multiRemote(caps())
                const parent = (await browser.$('#parent')).select('browserB')
                let queries = 0
                const findB = vi.spyOn(parent.getInstance('browserB'), 'findElementsFromElement')
                    .mockImplementation(async () => elementRefs(++queries >= 3 ? 3 : 2))

                const elements = await parent.$$('#foo')
                const element = await elements[2]

                expect(element.instances).toEqual(['browserB'])
                expect(element.getInstance('browserB').elementId).toBe('elem-2')
                expect(findB.mock.calls).toHaveLength(3)
            })

            test('does not wait for an index past the end of a slice', async () => {
                const browser = await multiRemote(caps())
                const [findA, findB] = growingElements(browser, 3)

                const elements = await browser.$$('#foo')
                const sliced = elements.slice(0, 1)

                expect(sliced[2]).toBeUndefined()
                expect(findA.mock.calls).toHaveLength(1)
                expect(findB.mock.calls).toHaveLength(1)
            })

            test('rejects when one instance does not find the element', async () => {
                const browser = await multiRemote(caps())
                browser.getInstance('browserB').options.waitforTimeout = 50
                let queriesA = 0
                vi.spyOn(browser.getInstance('browserA'), 'findElements')
                    .mockImplementation(async () => elementRefs(++queriesA >= 2 ? 3 : 2))
                vi.spyOn(browser.getInstance('browserB'), 'findElements')
                    .mockResolvedValue(elementRefs(2))

                const elements = await browser.$$('#foo')

                await expect(elements[2]).rejects.toThrow('Index out of bounds! $$(#foo) returned only 2 elements.')
            })
        })

        test('keeps isMultiRemote when $$ is chained from an element query', async () => {
            const browser = await multiRemote(caps())

            const elements = await browser.$('#foo').$$('#bar')

            expect(Array.isArray(elements)).toBe(true)
            expect(elements.isMultiRemote).toBe(true)
            expect(elements.foundWith).toBe('$$')
            expect(elements.selector).toBe('#bar')
            expect(elements.length).toBeGreaterThan(0)
            expect(elements[0].isMultiRemote).toBe(true)
        })

        test('exposes the async array helpers', async () => {
            const browser = await multiRemote(caps())

            const elements = await browser.$$('#foo')

            expect(typeof elements.map).toBe('function')
            expect(typeof elements.filter).toBe('function')
            expect(typeof elements.forEach).toBe('function')
            expect(typeof elements.getElements).toBe('function')
            expect(await elements.getElements()).toBe(elements)
        })
    })

    test('should add locator strategy on multi-remote and propagate to instances (#15540)', async () => {
        const browser = await multiRemote(caps())
        const strategy = (selector: string) => document.querySelector(selector) as HTMLElement

        expect(() => browser.addLocatorStrategy('selectHeader', strategy)).not.toThrow()
        expect(browser.strategies.get('selectHeader')).toBe(strategy)
        expect(browser.getInstance('browserA').strategies.get('selectHeader')).toBe(strategy)
        expect(browser.getInstance('browserB').strategies.get('selectHeader')).toBe(strategy)

        expect(() => browser.addLocatorStrategy('selectHeader', strategy))
            .toThrow('Strategy selectHeader already exists')

        expect(browser.strategies).toBeInstanceOf(Map)
    })

    test('should preserve the strategies map across select() (#15540)', async () => {
        const browser = await multiRemote(caps())
        const strategy = (selector: string) => document.querySelector(selector) as HTMLElement
        browser.addLocatorStrategy('selectHeader', strategy)

        const selected = browser.select('browserA', 'browserB')
        expect(selected.strategies).toEqual(browser.strategies)
        expect(selected.strategies.get('selectHeader')).toBe(strategy)
    })

    test('keeps instances in capability order and off the client', async () => {
        const browser = await multiRemote(caps())

        expect(browser.instances).toEqual(['browserA', 'browserB'])
        expect(Object.hasOwn(browser, 'browserA')).toBe(false)
        expect(Object.hasOwn(browser, 'browserB')).toBe(false)
        expect(browser['browserA' as 'getInstance']).toBeUndefined()

        const elem = await browser.$('#foo')
        expect(elem.instances).toEqual(['browserA', 'browserB'])
        expect(Object.hasOwn(elem, 'browserA')).toBe(false)
        expect(elem['browserA' as 'getInstance']).toBeUndefined()
        expect(elem.getInstance('browserA').elementId).toBe('some-elem-123')
    })

    test('keeps capability order when the later session finishes first', async () => {
        const fetchMock = vi.mocked(fetch)
        const original = fetchMock.getMockImplementation()
        if (!original) {
            throw new Error('fetch mock implementation is missing')
        }
        restoreFetch = () => {
            fetchMock.mockImplementation(original)
        }

        let releaseChromeSession!: () => void
        const chromeSessionHeld = new Promise<void>((resolve) => {
            releaseChromeSession = resolve
        })
        let releaseChromeCommand!: () => void
        const chromeCommandHeld = new Promise<void>((resolve) => {
            releaseChromeCommand = resolve
        })
        let chromeSessionWaiting = false
        let chromeCommandWaiting = false
        const sessionFinished: string[] = []
        const commandFinished: string[] = []
        /**
         * The first capability has no port, so unit tests pin it to the skipped
         * driver port. Remember each session's port from the new-session request
         * and use that to tell the later command responses apart.
         */
        const portOf = new Map<string, string>()

        const waitUntil = (ready: () => boolean) => new Promise<void>((resolve, reject) => {
            const started = Date.now()
            const check = () => {
                if (ready()) {
                    resolve()
                    return
                }
                if (Date.now() - started > 2000) {
                    reject(new Error(`timed out waiting for the other multi-remote session (ports: ${[...portOf]})`))
                    return
                }
                setImmediate(check)
            }
            check()
        })

        fetchMock.mockImplementation(async (uri: unknown, params?: { body?: { toString(): string }, method?: string }) => {
            const url = typeof uri === 'string' ? new URL(uri) : uri as URL
            let browserName: string | undefined
            try {
                browserName = params?.body
                    ? JSON.parse(params.body.toString()).capabilities?.alwaysMatch?.browserName
                    : undefined
            } catch {
                browserName = undefined
            }
            const isNewSession = url.pathname === '/session' && params?.method === 'POST'
            const isExecute = url.pathname.endsWith('/execute/sync')

            if (isNewSession && browserName) {
                portOf.set(browserName, url.port)
            }
            if (isNewSession && browserName === 'chrome') {
                chromeSessionWaiting = true
                await chromeSessionHeld
            }
            if (isExecute && url.port === portOf.get('chrome')) {
                chromeCommandWaiting = true
                await chromeCommandHeld
                commandFinished.push('browserA')
                return Response.json({ value: 'browserA' })
            }
            if (isExecute && url.port === portOf.get('firefox')) {
                await waitUntil(() => chromeCommandWaiting)
                commandFinished.push('browserB')
                queueMicrotask(releaseChromeCommand)
                return Response.json({ value: 'browserB' })
            }

            if (isNewSession && browserName === 'firefox') {
                await waitUntil(() => chromeSessionWaiting)
            }
            const response = await original(uri as RequestInfo, params as RequestInit)
            if (isNewSession && browserName === 'firefox') {
                sessionFinished.push('browserB')
                setImmediate(releaseChromeSession)
            }
            if (isNewSession && browserName === 'chrome') {
                sessionFinished.push('browserA')
            }
            return response
        })

        try {
            const browser = await multiRemote(caps())

            expect(sessionFinished).toEqual(['browserB', 'browserA'])
            expect(browser.instances).toEqual(['browserA', 'browserB'])

            const result = await browser.execute(() => 'ignored')
            expect(commandFinished).toEqual(['browserB', 'browserA'])
            expect(result).toEqual(['browserA', 'browserB'])
        } finally {
            fetchMock.mockImplementation(original)
        }
    })

    test('should run command on all instances', async () => {
        const browser = await multiRemote(caps())

        expect(browser.getInstance('browserA')).toBeDefined()
        expect(browser.getInstance('browserB')).toBeDefined()
        expect(() => browser.getInstance('missing')).toThrow(
            'Multi-remote object has no instance named "missing"'
        )

        const result = await browser.execute(() => 'foobar')
        expect(result).toEqual(['foobar', 'foobar'])

        expect((vi.mocked(fetch).mock.calls[0][0] as any).pathname).toBe('/session')
        expect((vi.mocked(fetch).mock.calls[0][1] as any).method).toBe('POST')
        expect((vi.mocked(fetch).mock.calls[1][0] as any).pathname).toBe('/session')
        expect((vi.mocked(fetch).mock.calls[1][1] as any).method).toBe('POST')
        expect((vi.mocked(fetch).mock.calls[2][0] as any).pathname)
            .toBe('/session/foobar-123/execute/sync')
        expect((vi.mocked(fetch).mock.calls[2][1] as any).method).toBe('POST')
        expect((vi.mocked(fetch).mock.calls[3][0] as any).pathname)
            .toBe('/session/foobar-123/execute/sync')
        expect((vi.mocked(fetch).mock.calls[3][1] as any).method).toBe('POST')
    })

    test('should properly create stub instance', async () => {
        const params = caps()
        Object.values(params).forEach(cap => { cap.automationProtocol = './protocol-stub.js' })
        const browser = await multiRemote(params, { automationProtocol: './protocol-stub.js' })
        expect(browser.$).toBeUndefined()
        expect(browser.options).toBeUndefined()
        expect(browser.commandList).toHaveLength(0)
        expect(browser.getInstance('browserA')).toBeDefined()
        expect(browser.getInstance('browserB')).toBeDefined()
        expect(browser.getInstance('browserA').$).toBeUndefined()
        expect(browser.getInstance('browserA').$).toBeUndefined()
    })

    test('should allow to call on elements', async () => {
        const browser = await multiRemote(caps())

        const elem = await browser.$('#foo')
        expect(elem.getInstance('browserA')).toBeDefined()
        expect(elem.getInstance('browserB')).toBeDefined()
        expect(elem.getInstance('browserA').elementId).toBe('some-elem-123')
        expect(elem.getInstance('browserB').elementId).toBe('some-elem-123')
        expect(() => elem.getInstance('selector')).toThrow(
            'Multi-remote object has no instance named "selector"'
        )
        expect(() => elem.getInstance('click')).toThrow(
            'Multi-remote object has no instance named "click"'
        )

        // @ts-expect-error invalid params
        const result = await elem.getSize()
        expect(result).toEqual([{ width: 50, height: 30 }, { width: 50, height: 30 }])

        expect((vi.mocked(fetch).mock.calls[2][0] as any).pathname)
            .toEqual('/session/foobar-123/element')
        expect((vi.mocked(fetch).mock.calls[3][0] as any).pathname)
            .toEqual('/session/foobar-123/element')
        expect((vi.mocked(fetch).mock.calls[4][0] as any).pathname)
            .toEqual('/session/foobar-123/element/some-elem-123/rect')
        expect((vi.mocked(fetch).mock.calls[5][0] as any).pathname)
            .toEqual('/session/foobar-123/element/some-elem-123/rect')
    })

    test('should be able to fetch multiple elements', async () => {
        const browser = await multiRemote(caps())

        const elems = await browser.$$('#foo')
        expect(elems).toHaveLength(3)

        // @ts-expect-error invalid params
        const size = await elems[0].getSize()
        expect(size).toEqual([{ width: 50, height: 30 }, { width: 50, height: 30 }])
    })

    test('should be able to add a command to and element in multi-remote', async () => {
        const browser = await multiRemote(caps())

        // @ts-expect-error untyped custom command
        browser.addCommand('myCustomElementCommand', async function (this: WebdriverIO.MultiRemoteBrowser) {
        // @ts-expect-error invalid params
            const size = await this.getSize()
            return size.width
        }, { attachToElement: true })

        const elem = await browser.$('#foo')

        // @ts-expect-error untyped custom command
        expect(await elem.getInstance('browserA').myCustomElementCommand()).toBe(50)
        // @ts-expect-error untyped custom command
        expect(await elem.getInstance('browserB').myCustomElementCommand()).toBe(50)
        // @ts-expect-error untyped custom command
        expect(await elem.myCustomElementCommand()).toEqual([50, 50])
    })

    test('should be able to overwrite command to and element in multi-remote', async () => {
        const browser = await multiRemote(caps())

        // @ts-expect-error untyped custom command
        browser.overwriteCommand('getSize', async function (
            this: WebdriverIO.MultiRemoteBrowser,
            origCmd: any
        ) {
            let size = await origCmd()
            size = { width: size.width / 10, height: size.height / 10 }
            return size
        }, { attachToElement: true })

        const elem = await browser.$('#foo')

        // @ts-expect-error invalid params
        const sizes = await elem.getSize()
        const sizeA = await elem.getInstance('browserA').getSize()
        const sizeB = await elem.getInstance('browserB').getSize()
        const result = { width: 5, height: 3 }

        expect(sizes).toEqual([result, result])
        expect(sizeA).toEqual(result)
        expect(sizeB).toEqual(result)
    })

    describe('single element queries', () => {
        const elementStrategy = (selector: string) => (
            { 'element-6066-11e4-a52e-4f735466cecf': `${selector}-foobar` }
        ) as unknown as HTMLElement

        const expectMultiRemoteElement = (element: WebdriverIO.MultiRemoteElement, elementId: string) => {
            expect(element.isMultiRemote).toBe(true)
            expect(element.instances).toEqual(['browserA', 'browserB'])
            expect(element.getInstance('browserA').elementId).toBe(elementId)
            expect(element.getInstance('browserB').elementId).toBe(elementId)
            expect(element.select('browserB').instances).toEqual(['browserB'])
        }

        test('custom$ on the browser gives a multi-remote element', async () => {
            const browser = await multiRemote(caps())
            browser.addLocatorStrategy('test', elementStrategy)

            expectMultiRemoteElement(await browser.custom$('test', '.foo'), '.foo-foobar')
        })

        test('custom$ on an element gives a multi-remote element', async () => {
            const browser = await multiRemote(caps())
            browser.addLocatorStrategy('test', elementStrategy)
            const parent = await browser.$('#parent')

            expectMultiRemoteElement(await parent.custom$('test', '.foo'), '.foo-foobar')
        })

        test('custom$ rejects when an instance has no such strategy', async () => {
            const browser = await multiRemote(caps())
            browser.getInstance('browserA').addLocatorStrategy('only-a', elementStrategy)

            await expect(browser.custom$('only-a', '.foo')).rejects.toThrow('No strategy found for only-a')
        })

        test('react$ on the browser gives a multi-remote element', async () => {
            const browser = await multiRemote(caps())

            expectMultiRemoteElement(await browser.react$('myComp'), 'some-elem-123')
        })

        test('react$ on an element gives a multi-remote element', async () => {
            const browser = await multiRemote(caps())
            const parent = await browser.$('#parent')

            expectMultiRemoteElement(await parent.react$('myComp'), 'some-elem-123')
        })

        test('shadow$ on an element gives a multi-remote element', async () => {
            const browser = await multiRemote(caps())
            const host = await browser.$('#host')

            expectMultiRemoteElement(await host.shadow$('#inner'), 'some-shadow-sub-elem-321')
        })

        test('shadow$ chained on $ gives a multi-remote element', async () => {
            const browser = await multiRemote(caps())

            expectMultiRemoteElement(await browser.$('#host').shadow$('#inner'), 'some-shadow-sub-elem-321')
        })

        test('the element of a query runs the next query on each instance', async () => {
            const browser = await multiRemote(caps())
            const host = await browser.$('#host')

            const inner = await host.shadow$('#inner')
            const child = await inner.$('#child')

            expect(child.isMultiRemote).toBe(true)
            expect(child.getInstance('browserA').parent).toBe(inner.getInstance('browserA'))
            expect(child.getInstance('browserB').parent).toBe(inner.getInstance('browserB'))
        })

        test('nextElement gives a multi-remote element', async () => {
            const browser = await multiRemote(caps())
            const element = await browser.$('#foo')

            expectMultiRemoteElement(await element.nextElement(), 'some-next-elem')
        })

        test('previousElement gives a multi-remote element', async () => {
            const browser = await multiRemote(caps())
            const element = await browser.$('#foo').$('#bar')

            expectMultiRemoteElement(await element.previousElement(), 'some-previous-elem')
        })

        test('parentElement gives a multi-remote element', async () => {
            const browser = await multiRemote(caps())
            const element = await browser.$('#foo').$('#bar')

            expectMultiRemoteElement(await element.parentElement(), 'some-parent-elem')
        })

        test('nextElement chained on $ gives a multi-remote element', async () => {
            const browser = await multiRemote(caps())

            expectMultiRemoteElement(await browser.$('#foo').nextElement(), 'some-next-elem')
        })
    })

    describe('list queries', () => {
        const ELEMENT_KEY = 'element-6066-11e4-a52e-4f735466cecf'
        /**
         * the strategy is sent as source text, so it cannot use variables from outside
         */
        const twoElements = (selector: string) => [0, 1].map(
            (index) => ({ 'element-6066-11e4-a52e-4f735466cecf': `${selector}-${index}` })
        ) as unknown as HTMLElement[]
        const oneElement = (selector: string) => [
            { 'element-6066-11e4-a52e-4f735466cecf': `${selector}-0` }
        ] as unknown as HTMLElement[]

        const expectMultiRemoteList = (
            list: WebdriverIO.MultiRemoteElementArray,
            metadata: { selector: string, foundWith: string, props: unknown[], parent: unknown },
            elementIds: string[]
        ) => {
            expect(list.isMultiRemote).toBe(true)
            expect(list.selector).toBe(metadata.selector)
            expect(list.foundWith).toBe(metadata.foundWith)
            expect(list.props).toEqual(metadata.props)
            expect(list.parent).toBe(metadata.parent)
            expect(list).toHaveLength(elementIds.length)
            elementIds.forEach((elementId, index) => {
                expect(list[index].isMultiRemote).toBe(true)
                expect(list[index].instances).toEqual(['browserA', 'browserB'])
                expect(list[index].getInstance('browserA').elementId).toBe(elementId)
                expect(list[index].getInstance('browserB').elementId).toBe(elementId)
            })
            expect(list[0].select('browserB').instances).toEqual(['browserB'])
        }

        test('custom$$ on the browser gives a multi-remote list', async () => {
            const browser = await multiRemote(caps())
            browser.addLocatorStrategy('test', twoElements)

            const list = await browser.custom$$('test', '.foo')

            expectMultiRemoteList(list, { selector: 'test', foundWith: 'custom$$', props: ['.foo'], parent: browser }, ['.foo-0', '.foo-1'])
        })

        test('custom$$ on an element gives a multi-remote list', async () => {
            const browser = await multiRemote(caps())
            browser.addLocatorStrategy('test', twoElements)
            const parent = await browser.$('#parent')

            const list = await parent.custom$$('test', '.foo')

            expectMultiRemoteList(list, { selector: 'test', foundWith: 'custom$$', props: ['.foo'], parent }, ['.foo-0', '.foo-1'])
        })

        test('custom$$ rejects when an instance has no such strategy', async () => {
            const browser = await multiRemote(caps())
            browser.getInstance('browserA').addLocatorStrategy('only-a', twoElements)

            await expect(browser.custom$$('only-a', '.foo')).rejects.toThrow('No strategy found for only-a')
        })

        test('react$$ on the browser gives a multi-remote list', async () => {
            const browser = await multiRemote(caps())

            const list = await browser.react$$('myComp', { props: { some: 'props' } })

            expectMultiRemoteList(
                list,
                { selector: 'myComp', foundWith: 'react$$', props: [{ props: { some: 'props' } }], parent: browser },
                ['some-elem-123', 'some-elem-456', 'some-elem-789']
            )
        })

        test('react$$ on an element gives a multi-remote list', async () => {
            const browser = await multiRemote(caps())
            const parent = await browser.$('#parent')

            const list = await parent.react$$('myComp')

            expectMultiRemoteList(
                list,
                { selector: 'myComp', foundWith: 'react$$', props: [], parent },
                ['some-elem-123', 'some-elem-456', 'some-elem-789']
            )
        })

        test('shadow$$ on an element gives a multi-remote list', async () => {
            const browser = await multiRemote(caps())
            const host = await browser.$('#host')

            const list = await host.shadow$$('#inner')

            expectMultiRemoteList(
                list,
                { selector: '#inner', foundWith: 'shadow$$', props: [], parent: host },
                ['some-shadow-sub-elem-321', 'some-sub-shadow-elem-456', 'some-sub-shadow-elem-789']
            )
        })

        test('shadow$$ chained on $ gives a multi-remote list', async () => {
            const browser = await multiRemote(caps())

            const list = await browser.$('#host').shadow$$('#inner')

            expect(list.isMultiRemote).toBe(true)
            expect(list.foundWith).toBe('shadow$$')
            expect(list[0].getInstance('browserB').elementId).toBe('some-shadow-sub-elem-321')
        })

        test('gives no element to an instance that finds fewer elements', async () => {
            const browser = await multiRemote(caps())
            browser.getInstance('browserA').addLocatorStrategy('test', twoElements)
            browser.getInstance('browserB').addLocatorStrategy('test', oneElement)

            const list = await browser.custom$$('test', '.foo')

            expect(list).toHaveLength(2)
            expect(list[1].getInstance('browserA').elementId).toBe('.foo-1')
            expect(() => list[1].getInstance('browserB')).toThrow('Multi-remote object has no instance named "browserB"')
        })

        test('keeps the instance order of select()', async () => {
            const browser = await multiRemote(caps())
            browser.getInstance('browserA').addLocatorStrategy('test', oneElement)
            browser.getInstance('browserB').addLocatorStrategy('test', twoElements)

            const list = await browser.select('browserB', 'browserA').custom$$('test', '.foo')

            expect(list).toHaveLength(2)
            expect(list[0].instances).toEqual(['browserB', 'browserA'])
            expect(list[1].getInstance('browserB').elementId).toBe('.foo-1')
            expect(() => list[1].getInstance('browserA')).toThrow('Multi-remote object has no instance named "browserA"')
        })

        test('queries the list again with parent[foundWith](selector, ...props)', async () => {
            const browser = await multiRemote(caps())

            const list = await browser.react$$('myComp', { props: { some: 'props' }, state: { some: 'state' } })
            const parent = list.parent as unknown as Record<string, (...args: unknown[]) => WebdriverIO.MultiRemoteElementArray>
            const again = await parent[list.foundWith](list.selector, ...list.props)

            expect(again.isMultiRemote).toBe(true)
            expect(again.props).toEqual([{ props: { some: 'props' }, state: { some: 'state' } }])
            expect(again).toHaveLength(3)
        })

        test('runs the strategy of each instance again with the same arguments for an index past the end', async () => {
            const browser = await multiRemote(caps())
            browser.addLocatorStrategy('test', oneElement)
            const executes = ['browserA', 'browserB'].map((name) => {
                const instance = browser.getInstance(name)
                const strategy = instance.strategies.get('test')
                let queries = 0
                return vi.spyOn(instance, 'execute').mockImplementation((async (script: unknown) => (
                    script === strategy
                        ? Array.from({ length: ++queries > 1 ? 2 : 1 }, (_, index) => ({ [ELEMENT_KEY]: `${name}-${index}` }))
                        : undefined
                )) as never)
            })

            const list = await browser.custom$$('test', '.foo')
            expect(list).toHaveLength(1)
            const element = await list[1]

            expect(element.isMultiRemote).toBe(true)
            expect(element.getInstance('browserA').elementId).toBe('browserA-1')
            expect(element.getInstance('browserB').elementId).toBe('browserB-1')
            for (const execute of executes) {
                expect(execute.mock.calls.map(([, ...args]) => args)).toEqual([['.foo'], ['.foo']])
            }
        })
    })

    describe('select', () => {
        test('should preserve filtered instances when chaining $ on a selected element', async () => {
            const browser = await multiRemote(caps())

            const h1 = await browser.$('#foo')

            // narrow to browserA only
            const selectedH1 = h1.select('browserA')
            expect(selectedH1.instances).toEqual(['browserA'])

            // Should preserve the instance scope when chaining $() on a selected element
            const child = await selectedH1.$('#child')
            expect(child.instances).toEqual(['browserA'])
        })

        test('carries custom commands onto the selected browser', async () => {
            const browser = await multiRemote(caps())

            // @ts-expect-error untyped custom command
            browser.addCommand('myCustomCommand', async function () {
                return 'from the custom command'
            })

            const selected = browser.select('browserA')

            // @ts-expect-error untyped custom command
            expect(typeof selected.myCustomCommand).toBe('function')
            // the selected browser answers exactly as the one it was narrowed from
            // @ts-expect-error untyped custom command
            expect(await selected.myCustomCommand()).toEqual(await browser.myCustomCommand())
        })

        test('carries element-scope custom commands onto the selected browser', async () => {
            const browser = await multiRemote(caps())

            // @ts-expect-error untyped custom command
            browser.addCommand('myCustomElementCommand', async function () {
                return 'from the element command'
            }, { attachToElement: true })

            const selected = browser.select('browserA')
            const elem = await selected.$('#foo')

            // @ts-expect-error untyped custom command
            expect(typeof elem.myCustomElementCommand).toBe('function')
            // @ts-expect-error untyped custom command
            expect(await elem.myCustomElementCommand()).toEqual(['from the element command'])
        })

        test('keeps addLocatorStrategy available on the selected browser', async () => {
            const browser = await multiRemote(caps())
            const strategy = (selector: string) => document.querySelector(selector) as HTMLElement
            browser.addLocatorStrategy('selectHeader', strategy)

            const selected = browser.select('browserA')

            expect(typeof selected.addLocatorStrategy).toBe('function')
            expect(selected.strategies.get('selectHeader')).toBe(strategy)
        })

        test('should throw an error when select matches nothing', async () => {
            const browser = await multiRemote(caps())

            const h1 = await browser.$('#foo')

            expect(() => h1.select('nonExistentBrowser')).toThrowError('None of the following requested instances are valid: nonExistentBrowser')
        })
    })

    describe('mock', () => {
        function stubInstanceMocks(browser: WebdriverIO.MultiRemoteBrowser) {
            const mocks = {
                browserA: { calls: [{ id: 'browserA' }] } as WebdriverIO.Mock,
                browserB: { calls: [{ id: 'browserB' }] } as WebdriverIO.Mock
            }
            const browserA = browser.getInstance('browserA')
            const browserB = browser.getInstance('browserB')
            if (!browserA || !browserB) {
                throw new Error('expected both multi-remote instances')
            }
            vi.spyOn(browserA, 'mock').mockResolvedValue(mocks.browserA)
            vi.spyOn(browserB, 'mock').mockResolvedValue(mocks.browserB)
            return mocks
        }

        test('returns a MultiRemoteMock keyed by instance name', async () => {
            const browser = await multiRemote(caps())
            const mocks = stubInstanceMocks(browser)

            const mock = await browser.mock('**/api', { method: 'GET' })

            expect(mock).toBeInstanceOf(MultiRemoteMock)
            expect(Array.isArray(mock)).toBe(false)
            expect(mock.isMultiRemote).toBe(true)
            expect(mock.instances).toEqual(['browserA', 'browserB'])
            expect(mock.getInstance('browserA')).toBe(mocks.browserA)
            expect(mock.getInstance('browserB')).toBe(mocks.browserB)
            expect(mock.getInstance('browserA').calls).toEqual([{ id: 'browserA' }])
            expect(() => mock.getInstance('missing')).toThrow(
                'Multi-remote object has no instance named "missing"'
            )
            expect(browser.getInstance('browserA')?.mock).toHaveBeenCalledWith('**/api', { method: 'GET' })
            expect(browser.getInstance('browserB')?.mock).toHaveBeenCalledWith('**/api', { method: 'GET' })
        })

        test('follows select() order instead of the parent instance order', async () => {
            const browser = await multiRemote(caps())
            stubInstanceMocks(browser)

            const mock = await browser.select('browserB', 'browserA').mock('**/api')

            expect(browser.instances).toEqual(['browserA', 'browserB'])
            expect(mock.instances).toEqual(['browserB', 'browserA'])
            expect(mock.getInstance('browserA').calls).toEqual([{ id: 'browserA' }])
            expect(mock.getInstance('browserB').calls).toEqual([{ id: 'browserB' }])
        })
    })
})

let restoreFetch: (() => void) | undefined

afterEach(() => {
    restoreFetch?.()
    restoreFetch = undefined
    vi.mocked(fetch).mockClear()
})
