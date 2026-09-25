import path from 'node:path'
import { test, expect, vi, afterEach, describe, beforeAll, afterAll } from 'vitest'
import type { Capabilities } from '@wdio/types'

import { multiRemote } from '../src/index.js'

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
        const browser = await multiremote(caps())

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
                    reject(new Error(`timed out waiting for the other multiremote session (ports: ${[...portOf]})`))
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
            const browser = await multiremote(caps())

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
})

let restoreFetch: (() => void) | undefined

afterEach(() => {
    restoreFetch?.()
    restoreFetch = undefined
    vi.mocked(fetch).mockClear()
})
