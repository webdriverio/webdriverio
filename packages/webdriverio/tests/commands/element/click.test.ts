import path from 'node:path'
import { expect, describe, it, afterEach, vi } from 'vitest'

import { remote } from '../../../src/index.js'
import { click } from '../../../src/commands/element/click.js'

vi.mock('fetch')
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

    afterEach(() => {
        vi.mocked(fetch).mockClear()
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

        it('should not check or scroll for a click without options', async () => {
            const { elem, scrollIntoView, execute } = await setup()

            await elem.click()
            expect(execute).not.toHaveBeenCalled()
            expect(scrollIntoView).not.toHaveBeenCalled()
        })

        describe('the script in the page', () => {
            type Rect = { x: number, y: number, width: number, height: number }
            const NEAREST = { block: 'nearest', inline: 'nearest', behavior: 'instant' }
            const CENTER = { block: 'center', inline: 'center', behavior: 'instant' }

            /**
             * runs the script that click gives to execute, on a fake page: the element
             * has `rects[i]` after `i` scrolls, and `hitAt(x, y, scrolls)` is the top
             * element at a point
             */
            const runInPage = async (options: {
                rects: (Rect | undefined)[]
                hitAt: (elem: object, x: number, y: number, scrolls: number) => unknown
                offset?: { x: number, y: number }
            }) => {
                const { elem: element, execute } = await setup()
                await element.click(options.offset ?? {})
                const script = execute.mock.calls[0][0] as unknown as (elem: unknown, offset: { x: number, y: number }) => void

                const scrolls: unknown[] = []
                const elem = {
                    scrollIntoView: (scroll: unknown) => scrolls.push(scroll),
                    getClientRects: () => {
                        const rect = options.rects[Math.min(scrolls.length, options.rects.length - 1)]
                        return rect ? [{ ...rect, left: rect.x, top: rect.y, right: rect.x + rect.width, bottom: rect.y + rect.height }] : []
                    }
                }
                const points: number[][] = []
                const page = globalThis as unknown as { window?: unknown, document?: unknown }
                const saved = { window: page.window, document: page.document }
                page.window = { innerWidth: 1000, innerHeight: 800 }
                page.document = { elementFromPoint: (x: number, y: number) => {
                    points.push([x, y])
                    return options.hitAt(elem, x, y, scrolls.length)
                } }
                try {
                    script(elem, options.offset ?? { x: 0, y: 0 })
                } finally {
                    page.window = saved.window
                    page.document = saved.document
                }
                return { scrolls, points }
            }
            const inView = { x: 100, y: 100, width: 100, height: 40 }
            const other = { parentNode: null }

            it('does not scroll when the element is hit', async () => {
                const { scrolls, points } = await runInPage({ rects: [inView], hitAt: (elem) => elem })
                expect(scrolls).toEqual([])
                expect(points).toEqual([[150, 120]])
            })

            it('scrolls just into view, then to the center while the element is not hit', async () => {
                const afterNearest = await runInPage({ rects: [inView], hitAt: (elem, x, y, n) => n >= 1 ? elem : other })
                expect(afterNearest.scrolls).toEqual([NEAREST])

                const afterCenter = await runInPage({ rects: [inView], hitAt: (elem, x, y, n) => n >= 2 ? elem : other })
                expect(afterCenter.scrolls).toEqual([NEAREST, CENTER])

                const never = await runInPage({ rects: [inView], hitAt: () => other })
                expect(never.scrolls).toEqual([NEAREST, CENTER])
            })

            it('does not hit-test a point outside the window', async () => {
                const below = { x: 100, y: 3000, width: 100, height: 40 }
                const { scrolls, points } = await runInPage({ rects: [below, inView], hitAt: (elem) => elem })
                expect(scrolls).toEqual([NEAREST])
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
                expect(scrolls).toEqual([NEAREST])
                expect(points).toEqual([[150, 190]])

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
