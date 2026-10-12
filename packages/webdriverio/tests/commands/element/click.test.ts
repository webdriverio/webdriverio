import path from 'node:path'
import { expect, describe, it, afterEach, vi } from 'vitest'

import { getBrowserObject } from '@wdio/utils'

import { remote } from '../../../src/index.js'
import { click } from '../../../src/commands/element/click.js'
import { bidiAssertClickable, bidiGetRect, isBidiCommandsEnabled } from '../../../src/utils/bidi/elementCommands.js'

vi.mock('fetch')
vi.mock('@wdio/utils', async (importOriginal) => {
    const actual = await importOriginal<{ getBrowserObject: (element: WebdriverIO.Element) => WebdriverIO.Browser }>()
    return { ...actual, getBrowserObject: vi.fn(actual.getBrowserObject) }
})
vi.mock('../../../src/utils/bidi/elementCommands.js', async (importOriginal) => {
    const actual = await importOriginal<Record<string, unknown>>()
    return { ...actual, isBidiCommandsEnabled: vi.fn(() => false), bidiAssertClickable: vi.fn(async () => undefined), bidiGetRect: vi.fn(async () => ({ x: 0, y: 0, width: 100, height: 100 })) }
})
vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))

describe('click test', () => {
    it('should allow to left click on an element without passing a button type', async () => {
        const browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar'
            }
        })
        const elem = await browser.$('#foo')
        vi.spyOn(browser, 'execute').mockResolvedValue('hit')

        await elem.click()
        // @ts-expect-error mock implementation
        expect(vi.mocked(fetch).mock.calls[2][0].pathname)
            .toBe('/session/foobar-123/element/some-elem-123/click')
    })

    it('should allow to left click on an element by passing a button type', async () => {
        const browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar'
            }
        })
        const elem = await browser.$('#foo')
        vi.spyOn(browser, 'execute').mockResolvedValue('hit')

        await elem.click({ button: 'left' })
        // @ts-expect-error mock implementation
        expect(vi.mocked(fetch).mock.calls[2][0].pathname)
            .toBe('/session/foobar-123/actions')
        expect(JSON.parse(vi.mocked(fetch).mock.calls[2][1]?.body as any).actions[0]).toMatchSnapshot()

        vi.mocked(fetch).mockClear()
        await elem.click({ button: 0 })
        // @ts-expect-error mock implementation
        expect(vi.mocked(fetch).mock.calls[0][0].pathname)
            .toBe('/session/foobar-123/actions')
        expect(JSON.parse(vi.mocked(fetch).mock.calls[0][1]?.body as any).actions[0]).toMatchSnapshot()
    })

    it('should allow to right click on an element', async () => {
        const browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar'
            }
        })
        const elem = await browser.$('#foo')
        vi.spyOn(browser, 'execute').mockResolvedValue('hit')
        await elem.click({ button: 'right' })
        // @ts-expect-error mock implementation
        expect(vi.mocked(fetch).mock.calls[2][0].pathname)
            .toBe('/session/foobar-123/actions')
        expect(
            JSON.parse(vi.mocked(fetch).mock.calls[2][1]?.body as any).actions[0]
        ).toMatchSnapshot()

        vi.mocked(fetch).mockClear()
        await elem.click({ button: 2 })
        // @ts-expect-error mock implementation
        expect(vi.mocked(fetch).mock.calls[0][0].pathname)
            .toBe('/session/foobar-123/actions')
        expect(
            JSON.parse(vi.mocked(fetch).mock.calls[0][1]?.body as any).actions[0]
        ).toMatchSnapshot()
    })

    it('should allow to middle click on an element', async () => {
        const browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar'
            }
        })
        const elem = await browser.$('#foo')
        vi.spyOn(browser, 'execute').mockResolvedValue('hit')
        await elem.click({ button: 'middle' })
        // @ts-expect-error mock implementation
        expect(vi.mocked(fetch).mock.calls[2][0].pathname)
            .toBe('/session/foobar-123/actions')
        expect(JSON.parse(vi.mocked(fetch).mock.calls[2][1]?.body as any).actions[0])
            .toMatchSnapshot()

        vi.mocked(fetch).mockClear()
        await elem.click({ button: 1 })
        // @ts-expect-error mock implementation
        expect(vi.mocked(fetch).mock.calls[0][0].pathname)
            .toBe('/session/foobar-123/actions')
        expect(JSON.parse(vi.mocked(fetch).mock.calls[0][1]?.body as any).actions[0])
            .toMatchSnapshot()
    })

    it('should allow to left click on an element with an offset without passing a button type', async () => {
        const browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar'
            }
        })
        const elem = await browser.$('#foo')
        vi.spyOn(browser, 'execute').mockResolvedValue('hit')
        await elem.click({ y: 15 })
        // @ts-expect-error mock implementation
        expect(vi.mocked(fetch).mock.calls[3][0].pathname)
            .toBe('/session/foobar-123/actions')
        expect(JSON.parse(vi.mocked(fetch).mock.calls[3][1]?.body as any).actions).toMatchSnapshot()
    })

    it('should allow to right click on an element with an offset and passing a button type', async () => {
        const browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar'
            }
        })
        const elem = await browser.$('#foo')
        vi.spyOn(browser, 'execute').mockResolvedValue('hit')
        await elem.click({ button: 2, x: 20, y: 15 })
        // @ts-expect-error mock implementation
        expect(vi.mocked(fetch).mock.calls[3][0].pathname)
            .toBe('/session/foobar-123/actions')
        expect(JSON.parse(vi.mocked(fetch).mock.calls[3][1]?.body as any).actions[0].actions[0].type)
            .toBe('pointerMove')
        expect(JSON.parse(vi.mocked(fetch).mock.calls[3][1]?.body as any).actions[0].actions[0].x)
            .toBe(20)
        expect(JSON.parse(vi.mocked(fetch).mock.calls[3][1]?.body as any).actions[0].actions[0].y)
            .toBe(15)
        expect(JSON.parse(vi.mocked(fetch).mock.calls[3][1]?.body as any).actions[0].actions[2])
            .toStrictEqual({ type: 'pause', duration: 0 })
        expect(JSON.parse(vi.mocked(fetch).mock.calls[3][1]?.body as any).actions[0].actions[1])
            .toMatchSnapshot()
        expect(JSON.parse(vi.mocked(fetch).mock.calls[3][1]?.body as any).actions[0].actions[3])
            .toStrictEqual({ type: 'pointerUp', button: 2 })
    })

    it('should to send a duration to execute a longPress on a mobile device', async () => {
        const browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar',
                mobileMode: true,
            } as any
        })
        const elem = await browser.$('#foo')
        vi.spyOn(browser, 'execute').mockResolvedValue('hit')
        await elem.click({ duration: 1000 })
        // @ts-expect-error mock implementation
        expect(vi.mocked(fetch).mock.calls[2][0].pathname)
            .toBe('/session/foobar-123/actions')
        expect(JSON.parse(vi.mocked(fetch).mock.calls[2][1]?.body as any).actions[0])
            .toMatchSnapshot()
        expect(JSON.parse(vi.mocked(fetch).mock.calls[2][1]?.body as any).actions[0].actions[2])
            .toStrictEqual({ type: 'pause', duration: 1000 })
    })

    it('should throw an error if the passed argument is not an options object', async () => {
        const browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar'
            }
        })
        const elem = await browser.$('#foo')
        vi.spyOn(browser, 'execute').mockResolvedValue('hit')

        // @ts-expect-error invalid param
        await expect(elem.click([])).rejects.toThrow('Options must be an object')
    })

    it('should throw an error if no valid coordinates are passed', async () => {
        const browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar'
            }
        })
        const elem = await browser.$('#foo')
        vi.spyOn(browser, 'execute').mockResolvedValue('hit')

        // @ts-expect-error invalid param
        await expect(elem.click({ x: 'not-supported' })).rejects.toThrow('Coordinates must be integers')
    })

    it('should throw an error if no valid button type is passed', async () => {
        const browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar'
            }
        })
        const elem = await browser.$('#foo')
        vi.spyOn(browser, 'execute').mockResolvedValue('hit')

        // @ts-expect-error invalid param
        await expect(elem.click({ button: 'not-supported' })).rejects.toThrow('Button type not supported.')
    })

    it('should not call releaseAction when skipRelease is true', async () => {
        const browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar',
            }
        })
        const elem = await browser.$('#foo')
        vi.spyOn(browser, 'execute').mockResolvedValue('hit')
        await elem.click({ button: 'right' })

        expect(vi.mocked(fetch).mock.calls.length)
            .toBe(4)
        // @ts-expect-error mock implementation
        expect(vi.mocked(fetch).mock.calls[3][0].pathname)
            .toBe('/session/foobar-123/actions')
        expect(vi.mocked(fetch).mock.calls[3][1]?.method)
            .toBe('DELETE')

        vi.mocked(fetch).mockClear()
        await elem.click({ button: 'right', skipRelease: true })
        expect(vi.mocked(fetch).mock.calls.length).toBe(1) // only action call
    })

    it('resolves the browser once on the BiDi path', async () => {
        const browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar'
            }
        })
        vi.mocked(isBidiCommandsEnabled).mockReturnValue(true)
        const elem = await browser.$('#foo')

        const chain = { move: vi.fn(), down: vi.fn(), pause: vi.fn(), up: vi.fn(), perform: vi.fn().mockResolvedValue(undefined) }
        chain.move.mockReturnValue(chain)
        chain.down.mockReturnValue(chain)
        chain.pause.mockReturnValue(chain)
        chain.up.mockReturnValue(chain)
        vi.mocked(getBrowserObject).mockImplementation(() => (
            { isMobile: false, action: vi.fn().mockReturnValue(chain) } as any
        ))

        vi.mocked(isBidiCommandsEnabled).mockClear()
        await elem.click()
        const checkedBrowser = vi.mocked(isBidiCommandsEnabled).mock.calls[0][0] as any
        expect(checkedBrowser.action).toHaveBeenCalledOnce()
        expect(chain.perform).toHaveBeenCalledOnce()
    })

    describe('bidi commands enabled', () => {
        async function setup() {
            const browser = await remote({ baseUrl: 'http://foobar.com', capabilities: { browserName: 'foobar' } })
            vi.mocked(isBidiCommandsEnabled).mockReturnValue(true)
            const elem = await browser.$('#foo')
            const chain = { move: vi.fn(), down: vi.fn(), pause: vi.fn(), up: vi.fn(), perform: vi.fn().mockResolvedValue(undefined) }
            for (const k of ['move', 'down', 'pause', 'up'] as const) { chain[k].mockReturnValue(chain) }
            const getElementRect = vi.fn().mockResolvedValue({ width: 100, height: 100 })
            vi.mocked(getBrowserObject).mockImplementation(() => (
                { isMobile: false, action: vi.fn().mockReturnValue(chain), getElementRect } as any
            ))
            return { elem, chain, getElementRect }
        }

        it('moves with duration 0 on the default click', async () => {
            const { elem, chain } = await setup()
            await elem.click()
            expect(chain.move).toHaveBeenCalledWith(expect.objectContaining({ x: 0, y: 0, duration: 0 }))
        })

        it('reads the rect for offsets through BiDi, not the classic endpoint', async () => {
            const { elem, getElementRect } = await setup()
            vi.mocked(bidiGetRect).mockClear()
            await elem.click({ x: 5 })
            expect(bidiGetRect).toHaveBeenCalledWith(elem)
            expect(getElementRect).not.toHaveBeenCalled()
        })

        it('keeps the default move duration for click({ x })', async () => {
            const { elem, chain } = await setup()
            await elem.click({ x: 5 })
            expect(chain.move.mock.calls[0][0]).not.toHaveProperty('duration')
        })

        it('keeps the default move duration for click({ button })', async () => {
            const { elem, chain } = await setup()
            await elem.click({ button: 'right' })
            expect(chain.move.mock.calls[0][0]).not.toHaveProperty('duration')
        })

        it('runs the intercept check once, before the actions, only on the default click', async () => {
            const { elem, chain } = await setup()
            const order: string[] = []
            vi.mocked(bidiAssertClickable).mockImplementationOnce(async () => { order.push('check') })
            chain.perform.mockImplementation(async () => { order.push('perform') })
            await elem.click()
            expect(bidiAssertClickable).toHaveBeenCalledOnce()
            expect(order).toEqual(['check', 'perform'])
            vi.mocked(bidiAssertClickable).mockClear()
            await elem.click({ x: 5 })
            expect(bidiAssertClickable).not.toHaveBeenCalled()
        })

        it('throws element click intercepted without performing actions or retrying', async () => {
            const { elem, chain } = await setup()
            const error = Object.assign(new Error('element click intercepted: Element <a> is not clickable at point (1, 2). Other element would receive the click: <div>'), { name: 'element click intercepted' })
            vi.mocked(bidiAssertClickable).mockRejectedValueOnce(error)
            await expect(elem.click()).rejects.toThrow('element click intercepted')
            expect(bidiAssertClickable).toHaveBeenCalledOnce()
            expect(chain.perform).not.toHaveBeenCalled()
        })

        it('does not perform actions when the target is not interactable', async () => {
            const { elem, chain } = await setup()
            const error = Object.assign(new Error('element not interactable: element has zero size'), { name: 'element not interactable' })
            vi.mocked(bidiAssertClickable).mockRejectedValueOnce(error)
            await expect(elem.click()).rejects.toThrow()
            expect(chain.perform).not.toHaveBeenCalled()
        })
    })

    afterEach(() => {
        vi.mocked(fetch).mockClear()
        vi.mocked(isBidiCommandsEnabled).mockReset().mockReturnValue(false)
        vi.mocked(getBrowserObject).mockReset()
        vi.mocked(bidiAssertClickable).mockClear()
    })

    describe('bring the element under the pointer before a click with options', () => {
        const setup = async () => {
            const browser = await remote({
                baseUrl: 'http://foobar.com',
                capabilities: {
                    browserName: 'foobar'
                }
            })
            const elem = await browser.$('#foo')
            const scrollIntoView = vi.spyOn(elem, 'scrollIntoView').mockResolvedValue(undefined)
            const execute = vi.spyOn(browser, 'execute').mockResolvedValue(undefined)
            vi.mocked(fetch).mockClear()
            return { elem, scrollIntoView, execute }
        }
        const actionCalls = () => vi.mocked(fetch).mock.calls
            .map((call, i) => ({ pathname: (call[0] as URL).pathname, method: call[1]?.method, order: vi.mocked(fetch).mock.invocationCallOrder[i] }))
            .filter(({ pathname }) => pathname === '/session/foobar-123/actions')

        it('should check and scroll in one execute before the pointer action', async () => {
            const { elem, scrollIntoView, execute } = await setup()

            await elem.click({ button: 'left' })
            expect(execute).toHaveBeenCalledTimes(1)
            expect(execute.mock.calls[0][2]).toEqual({ x: 0, y: 0 })
            expect(execute.mock.invocationCallOrder[0]).toBeLessThan(actionCalls()[0].order)
            expect(scrollIntoView).not.toHaveBeenCalled()
            expect(actionCalls().map(({ method }) => method)).toEqual(['POST', 'DELETE'])
        })

        it('should give the click offset to the check', async () => {
            const { elem, execute } = await setup()

            await elem.click({ x: 20, y: 15 })
            expect(execute.mock.calls[0][2]).toEqual({ x: 20, y: 15 })
        })

        it('should keep held keys: no action before the click', async () => {
            const { elem, execute } = await setup()

            await elem.click({ button: 'left', skipRelease: true })
            expect(execute).toHaveBeenCalledTimes(1)
            expect(actionCalls().map(({ method }) => method)).toEqual(['POST'])
        })

        it('should still click when the element could not be checked', async () => {
            const { elem, execute } = await setup()
            execute.mockRejectedValueOnce(new Error('stale element reference'))

            await elem.click({ button: 'left' })
            expect(actionCalls().filter(({ method }) => method === 'POST')).toHaveLength(1)
        })

        it('should not check or scroll for a click without options outside Firefox', async () => {
            const { elem, scrollIntoView, execute } = await setup()

            await elem.click()
            expect(execute).not.toHaveBeenCalled()
            expect(scrollIntoView).not.toHaveBeenCalled()
        })

        describe('the script in the page', () => {
            type Rect = { x: number, y: number, width: number, height: number }
            const CENTER = { block: 'center', inline: 'center', behavior: 'instant' }
            const END = { block: 'end', inline: 'nearest', behavior: 'instant' }
            const START = { block: 'start', inline: 'nearest', behavior: 'instant' }

            /**
             * runs the script that click gives to execute, on a fake page: the element
             * has `rects[i]` after `i` scrolls, and `hitAt(x, y, scrolls)` is the top
             * element at a point
             */
            const runInPage = async (options: {
                rects: (Rect | undefined)[]
                hitAt: (elem: object, x: number, y: number, scrolls: number) => unknown
                offset?: { x: number, y: number }
                visibilityState?: string
            }) => {
                const { elem: element, execute } = await setup()
                await element.click(options.offset ?? {})
                const script = execute.mock.calls[0][0] as unknown as (elem: unknown, offset: { x: number, y: number }) => Promise<void> | undefined

                const scrolls: unknown[] = []
                const elem = {
                    scrollIntoView: (scroll: unknown) => scrolls.push(scroll),
                    getClientRects: () => {
                        const rect = options.rects[Math.min(scrolls.length, options.rects.length - 1)]
                        return rect ? [{ ...rect, left: rect.x, top: rect.y, right: rect.x + rect.width, bottom: rect.y + rect.height }] : []
                    }
                }
                const points: number[][] = []
                const frames: (() => void)[] = []
                const page = globalThis as unknown as { window?: unknown, document?: unknown, requestAnimationFrame?: unknown }
                const saved = { window: page.window, document: page.document }
                page.window = { innerWidth: 1000, innerHeight: 800 }
                page.document = {
                    visibilityState: options.visibilityState ?? 'visible',
                    elementFromPoint: (x: number, y: number) => {
                        points.push([x, y])
                        return options.hitAt(elem, x, y, scrolls.length)
                    }
                }
                // stays until afterEach: the first frame callback asks for the second frame
                page.requestAnimationFrame = (callback: () => void) => frames.push(callback)
                let result: Promise<void> | undefined
                try {
                    result = script(elem, options.offset ?? { x: 0, y: 0 })
                } finally {
                    page.window = saved.window
                    page.document = saved.document
                }
                return { scrolls, points, result, frames }
            }
            afterEach(() => {
                delete (globalThis as { requestAnimationFrame?: unknown }).requestAnimationFrame
            })

            const inView = { x: 100, y: 100, width: 100, height: 40 }
            const other = { parentNode: null }

            it('does not scroll or wait when the element is hit', async () => {
                const { scrolls, points, result, frames } = await runInPage({ rects: [inView], hitAt: (elem) => elem })
                expect(scrolls).toEqual([])
                expect(points).toEqual([[150, 120]])
                expect(result).toBeUndefined()
                expect(frames).toHaveLength(0)
            })

            it('scrolls to the center, then to the bottom and the top while the element is not hit', async () => {
                const afterCenter = await runInPage({ rects: [inView], hitAt: (elem, x, y, n) => n >= 1 ? elem : other })
                expect(afterCenter.scrolls).toEqual([CENTER])
                expect(afterCenter.points).toEqual([[150, 120], [150, 120]])

                // a sticky header covers the center of a small scroll container
                const afterEnd = await runInPage({ rects: [inView], hitAt: (elem, x, y, n) => n >= 2 ? elem : other })
                expect(afterEnd.scrolls).toEqual([CENTER, END])

                // a sticky footer covers the center and the bottom
                const afterStart = await runInPage({ rects: [inView], hitAt: (elem, x, y, n) => n >= 3 ? elem : other })
                expect(afterStart.scrolls).toEqual([CENTER, END, START])

                const never = await runInPage({ rects: [inView], hitAt: () => other })
                expect(never.scrolls).toEqual([CENTER, END, START])
            })

            it('waits for two animation frames after a scroll, so the scroll events fire before the click', async () => {
                const { result, frames } = await runInPage({ rects: [inView], hitAt: () => other })
                let resolved = false
                result!.then(() => { resolved = true })
                await Promise.resolve()
                expect(resolved).toBe(false)

                expect(frames).toHaveLength(1)
                frames[0]()
                await Promise.resolve()
                expect(resolved).toBe(false)

                expect(frames).toHaveLength(2)
                frames[1]()
                await result
                expect(resolved).toBe(true)
            })

            it('does not wait longer than 100 ms when no animation frame comes', async () => {
                vi.useFakeTimers()
                try {
                    const { result } = await runInPage({ rects: [inView], hitAt: () => other })
                    let resolved = false
                    result!.then(() => { resolved = true })
                    await vi.advanceTimersByTimeAsync(99)
                    expect(resolved).toBe(false)
                    await vi.advanceTimersByTimeAsync(1)
                    expect(resolved).toBe(true)
                } finally {
                    vi.useRealTimers()
                }
            })

            it('does not wait on a hidden page, which gets no animation frame', async () => {
                const { scrolls, result, frames } = await runInPage({ rects: [inView], hitAt: () => other, visibilityState: 'hidden' })
                expect(scrolls).toEqual([CENTER, END, START])
                expect(result).toBeUndefined()
                expect(frames).toHaveLength(0)
            })

            it('does not hit-test a point outside the window', async () => {
                const below = { x: 100, y: 3000, width: 100, height: 40 }
                const { scrolls, points } = await runInPage({ rects: [below, inView], hitAt: (elem) => elem })
                expect(scrolls).toEqual([CENTER])
                expect(points).toEqual([[150, 120]])
            })

            it('does not scroll an element without a box', async () => {
                const { scrolls, points } = await runInPage({ rects: [undefined], hitAt: (elem) => elem })
                expect(scrolls).toEqual([])
                expect(points).toEqual([])
            })

            it('hits the element through a descendant and through a shadow root', async () => {
                const child = await runInPage({ rects: [inView], hitAt: (elem) => ({ parentNode: elem }) })
                expect(child.scrolls).toEqual([])

                const shadow = await runInPage({ rects: [inView], hitAt: (elem) => ({
                    parentNode: null,
                    shadowRoot: { elementFromPoint: () => ({ parentNode: { parentNode: null, host: elem } }) }
                }) })
                expect(shadow.scrolls).toEqual([])
            })

            it('with an offset, scrolls an element that the window clips and hit-tests the click point', async () => {
                const clipped = { x: 100, y: -40, width: 100, height: 100 }
                const whole = { x: 100, y: 100, width: 100, height: 100 }
                const { scrolls, points } = await runInPage({ rects: [clipped, whole], hitAt: (elem) => elem, offset: { x: 0, y: 40 } })
                expect(scrolls).toEqual([CENTER])
                expect(points).toEqual([[150, 190]])

                const onElement = await runInPage({ rects: [whole], hitAt: (elem) => elem, offset: { x: 0, y: 40 } })
                expect(onElement.scrolls).toEqual([])
                expect(onElement.points).toEqual([[150, 190]])

                const outside = await runInPage({ rects: [whole], hitAt: (elem) => elem, offset: { x: 0, y: 80 } })
                expect(outside.points).toEqual([[150, 150]])
            })
        })
    })

    const nativeScope = (context: Record<string, unknown>, perform = vi.fn()) => {
        const action = {
            move: vi.fn().mockReturnThis(),
            down: vi.fn().mockReturnThis(),
            pause: vi.fn().mockReturnThis(),
            up: vi.fn().mockReturnThis(),
            perform
        }
        return {
            elementId: 'native-elem',
            isMobile: true,
            ...context,
            execute: vi.fn(),
            scrollIntoView: vi.fn(),
            action: vi.fn(() => action),
            perform
        }
    }

    it.each([
        ['a native mobile context', { isNativeContext: true }],
        ['a Windows app', { isNativeContext: false, isWindowsApp: true }],
        ['a Mac app', { isNativeContext: false, isMacApp: true }]
    ])('should not check or scroll in %s', async (_, context) => {
        const scope = nativeScope(context)

        await click.call(scope as never, { button: 'left' })
        expect(scope.execute).not.toHaveBeenCalled()
        expect(scope.scrollIntoView).not.toHaveBeenCalled()
        expect(scope.perform).toHaveBeenCalled()
    })

    it('should check and scroll in a mobile browser', async () => {
        const scope = nativeScope({ isNativeContext: false })

        await click.call(scope as never, { button: 'left' })
        expect(scope.execute).toHaveBeenCalledTimes(1)
        expect(scope.perform).toHaveBeenCalled()
    })

    describe('click without options in Firefox', () => {
        const scope = (isFirefox: boolean) => ({
            elementId: 'some-elem',
            isFirefox,
            execute: vi.fn(),
            elementClick: vi.fn()
        })

        it('should bring the element into view before the WebDriver click', async () => {
            const elem = scope(true)

            await click.call(elem as never)
            expect(elem.execute).toHaveBeenCalledTimes(1)
            expect(elem.execute.mock.calls[0][2]).toEqual({ x: 0, y: 0 })
            expect(elem.execute.mock.invocationCallOrder[0]).toBeLessThan(elem.elementClick.mock.invocationCallOrder[0])
            expect(elem.elementClick).toHaveBeenCalledWith('some-elem')
        })

        it('should still click when the element could not be checked', async () => {
            const elem = scope(true)
            elem.execute.mockRejectedValueOnce(new Error('stale element reference'))

            await click.call(elem as never)
            expect(elem.elementClick).toHaveBeenCalledTimes(1)
        })

        it('should send only the WebDriver click in other browsers', async () => {
            const elem = scope(false)

            await click.call(elem as never)
            expect(elem.execute).not.toHaveBeenCalled()
            expect(elem.elementClick).toHaveBeenCalledTimes(1)
        })
    })

    describe('click without options that something intercepts', () => {
        const intercepted = (name: string, message: string) => Object.assign(new Error(message), { name })
        const scope = (error: Error, context: Record<string, unknown> = {}) => ({
            elementId: 'some-elem',
            isFirefox: false,
            ...context,
            execute: vi.fn(),
            scrollIntoView: vi.fn(),
            elementClick: vi.fn().mockRejectedValueOnce(error).mockResolvedValueOnce(undefined)
        })

        it.each([
            ['ChromeDriver', intercepted('element click intercepted', 'element click intercepted: Element <button> is not clickable at point (50, 20)')],
            ['geckodriver', intercepted('element click intercepted', 'Element <button> is not clickable at point (50,20) because another element <div> obscures it')],
            ['safaridriver', intercepted('click intercepted', 'click intercepted')]
        ])('should bring the element under the pointer and click again (%s)', async (_, error) => {
            const elem = scope(error)

            await click.call(elem as never)
            expect(elem.execute).toHaveBeenCalledTimes(1)
            expect(elem.execute.mock.calls[0][2]).toEqual({ x: 0, y: 0 })
            expect(elem.execute.mock.invocationCallOrder[0]).toBeGreaterThan(elem.elementClick.mock.invocationCallOrder[0])
            expect(elem.execute.mock.invocationCallOrder[0]).toBeLessThan(elem.elementClick.mock.invocationCallOrder[1])
            expect(elem.elementClick).toHaveBeenCalledTimes(2)
            expect(elem.scrollIntoView).not.toHaveBeenCalled()
        })

        it('should throw other errors without a second click', async () => {
            const elem = scope(intercepted('element not interactable', 'element not interactable'))

            await expect(click.call(elem as never)).rejects.toThrow('element not interactable')
            expect(elem.execute).not.toHaveBeenCalled()
            expect(elem.elementClick).toHaveBeenCalledTimes(1)
        })

        it('should scroll with the scrollIntoView command in a native app', async () => {
            const elem = scope(intercepted('element click intercepted', 'element click intercepted'), { isMobile: true, isNativeContext: true })

            await click.call(elem as never)
            expect(elem.execute).not.toHaveBeenCalled()
            expect(elem.scrollIntoView).toHaveBeenCalledWith({ block: 'center', inline: 'center' })
            expect(elem.elementClick).toHaveBeenCalledTimes(2)
        })
    })

    it('should scroll to the center and click again when the pointer action fails', async () => {
        const perform = vi.fn()
            .mockRejectedValueOnce(new Error('move target out of bounds'))
            .mockResolvedValueOnce(undefined)
        const scope = nativeScope({ isMobile: false }, perform)
        scope.execute.mockResolvedValueOnce('hit')

        await click.call(scope as never, { button: 'left' })
        expect(scope.scrollIntoView).toHaveBeenCalledWith({ block: 'center', inline: 'center' })
        expect(perform).toHaveBeenCalledTimes(2)
    })
})
