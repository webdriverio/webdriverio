import path from 'node:path'
import type { Mock } from 'vitest'
import { expect, describe, it, vi, beforeAll, beforeEach, afterEach } from 'vitest'

import { remote } from '../../../src/index.js'

vi.mock('fetch')
vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))

/**
 * finds the wheel "actions" request body among all fetch calls, since the
 * scrollIntoView flow may also perform an "execute/async" settle-wait call
 * after the wheel action, shifting where it lands among the recorded calls.
 *
 * When the element starts off-screen/clipped, scrollIntoView performs the wheel
 * scroll in two steps: a zero-delta probe (dispatched with `origin: this` purely
 * to trigger the browser's native cross-shadow-DOM "scroll into view" resolution)
 * followed by the real, non-zero delta that reaches the requested alignment. The
 * last matching call is the one that carries the actual scroll amount.
 */
const getScrollActionBody = () => {
    const calls = vi.mocked(fetch).mock.calls.filter(([, requestOptions]) => {
        try {
            return JSON.parse((requestOptions as any)?.body)?.actions?.[0]?.actions?.[0]?.type === 'scroll'
        } catch {
            return false
        }
    })
    const call = calls[calls.length - 1]
    return JSON.parse((call![1] as any).body)
}

describe('scrollIntoView test', () => {
    let browser: WebdriverIO.Browser
    let elem: WebdriverIO.Element
    const defaultIOSSelector = '-ios predicate string:type == "XCUIElementTypeApplication"'
    const defaultAndroidSelector = '//android.widget.ScrollView'

    beforeEach(() => {
        vi.mocked(fetch).mockClear()
    })

    describe('desktop', () => {
        let originalElementId: unknown

        // several tests below use `vi.spyOn(browser, 'execute').mockResolvedValueOnce(...)`
        // or mutate `elem.elementId` to a sentinel value to trigger a mocked failure; without
        // restoring between tests, both leak into later tests - queued "once" return values
        // get consumed by the wrong `execute()` call, and the sentinel elementId changes how
        // the mocked fetch responds to *every* subsequent command on `elem`. (`customResponses`
        // and the simulated scroll position reset automatically before every test - see the
        // `beforeEach` registered in `__mocks__/fetch.ts` itself.)
        afterEach(() => {
            if (vi.isMockFunction(browser.execute)) {
                (browser.execute as ReturnType<typeof vi.fn>).mockRestore()
            }
            elem.elementId = originalElementId as string
        })

        beforeAll(async () => {
            browser = await remote({
                baseUrl: 'http://foobar.com',
                capabilities: {
                    browserName: 'foobar',
                },
            })
            // @ts-expect-error
            elem = await browser.$('#foo')
            originalElementId = elem.elementId
        })

        it('scrolls by default the element to the top', async () => {
            await elem.scrollIntoView()
            expect(getScrollActionBody()).toMatchSnapshot()
        })

        it('scrolls element when using boolean scroll options', async () => {
            await elem.scrollIntoView(true)
            expect(getScrollActionBody()).toMatchSnapshot()
            vi.mocked(fetch).mockClear()
            await elem.scrollIntoView(false)
            expect(getScrollActionBody()).toMatchSnapshot()
        })

        it('scrolls element using scroll into view options', async () => {
            await elem.scrollIntoView({ block: 'center', inline: 'center' })
            expect(getScrollActionBody()).toMatchSnapshot()
        })

        it('does not move an axis that is already fully visible when using "nearest"', async () => {
            await elem.scrollIntoView({ block: 'start', inline: 'nearest' })
            const scrollActionInline = getScrollActionBody().actions[0].actions[0]
            expect(scrollActionInline.deltaX).toBe(0)
            expect(scrollActionInline.deltaY).toBe(20)

            vi.mocked(fetch).mockClear()

            await elem.scrollIntoView({ block: 'nearest', inline: 'start' })
            const scrollActionBlock = getScrollActionBody().actions[0].actions[0]
            expect(scrollActionBlock.deltaY).toBe(0)
            expect(scrollActionBlock.deltaX).toBe(15)
        })

        it('does not move an axis when the element is larger than the viewport and already spans both of its edges using "nearest"', async () => {
            vi.spyOn(browser, 'execute').mockResolvedValueOnce({
                // element starts above/left of the viewport and ends below/right of it;
                // deliberately off-center so a "nearest of start/center/end" fallback
                // (the bug) would compute a non-zero delta instead of leaving it in place
                elemRect: { x: -30, y: -30, width: 200, height: 200 },
                viewport: { width: 100, height: 100 },
                scroll: { x: 0, y: 0 },
                isPainted: true
            })
            await elem.scrollIntoView({ block: 'nearest', inline: 'nearest' })
            // no scroll action should be performed at all: the element already fully
            // covers the viewport on both axes, same as native scrollIntoView would leave it
            expect(vi.mocked(fetch).mock.calls).toHaveLength(0)
        })

        describe('off-screen element (element-origin probe path)', () => {
            const offScreenRect = {
                elemRect: { x: 15, y: 2000, height: 30, width: 50 },
                viewport: { width: 600, height: 800 },
                scroll: { x: 0, y: 0 },
                isPainted: false
            }
            // once "scrolled into view", the element is genuinely painted at its new position
            const visibleRect = (y: number) => ({ ...offScreenRect, elemRect: { ...offScreenRect.elemRect, y }, isPainted: true })

            const hasWebApiFallbackCall = () => vi.mocked(fetch).mock.calls.some(([, requestOptions]) => {
                try {
                    return JSON.parse((requestOptions as any)?.body)?.script?.includes('elem.scrollIntoView(options2)')
                } catch {
                    return false
                }
            })

            it('sends a zero-delta probe with an element origin first, then the real delta, and does not fall back', async () => {
                // element starts off-screen, then "native pre-scroll" (simulated here by the
                // remeasure after the probe) brings it near the top, then the final delta
                // finishes centering it - all without ever leaving the viewport again
                vi.spyOn(browser, 'execute')
                    .mockResolvedValueOnce(offScreenRect)
                    .mockResolvedValueOnce(visibleRect(400))
                    .mockResolvedValueOnce(visibleRect(385))

                await elem.scrollIntoView({ block: 'center', inline: 'center' })

                const scrollCalls = vi.mocked(fetch).mock.calls.filter(([, requestOptions]) => {
                    try {
                        return JSON.parse((requestOptions as any)?.body)?.actions?.[0]?.actions?.[0]?.type === 'scroll'
                    } catch {
                        return false
                    }
                })
                expect(scrollCalls).toHaveLength(2)

                const probeAction = JSON.parse((scrollCalls[0][1] as any).body).actions[0].actions[0]
                expect(probeAction).toMatchObject({ deltaX: 0, deltaY: 0 })
                expect(probeAction.origin).toEqual({ 'element-6066-11e4-a52e-4f735466cecf': 'some-elem-123' })

                const realAction = JSON.parse((scrollCalls[1][1] as any).body).actions[0].actions[0]
                expect(realAction.deltaY).not.toBe(0)

                expect(hasWebApiFallbackCall()).toBe(false)
            })

            it('falls back to the Web API when the wheel action reports success but nothing actually moved', async () => {
                // simulates a WebDriver implementation (e.g. geckodriver) that resolves the
                // wheel action's element origin without performing any native pre-scroll:
                // every measurement returns the exact same, unmoved rect
                vi.spyOn(browser, 'execute')
                    .mockResolvedValueOnce(offScreenRect)
                    .mockResolvedValueOnce(offScreenRect)
                    .mockResolvedValueOnce(offScreenRect)
                // @ts-expect-error mock feature
                elem.elementId = { scrollIntoView: 'mockFunction' }

                await elem.scrollIntoView({ block: 'center', inline: 'center' })

                expect(hasWebApiFallbackCall()).toBe(true)
            })

            it('falls back to the Web API when the element moved but still is not fully visible', async () => {
                // the wheel action did move the element (ruling out the "nothing moved" case)
                // but it's still hanging off the bottom of the viewport afterward
                vi.spyOn(browser, 'execute')
                    .mockResolvedValueOnce(offScreenRect)
                    .mockResolvedValueOnce(offScreenRect)
                    .mockResolvedValueOnce({ ...offScreenRect, elemRect: { ...offScreenRect.elemRect, y: 900 } })
                // @ts-expect-error mock feature
                elem.elementId = { scrollIntoView: 'mockFunction' }

                await elem.scrollIntoView({ block: 'center', inline: 'center' })

                expect(hasWebApiFallbackCall()).toBe(true)
            })

            it('takes the probe path (not the fast path) for an element that is geometrically inside the viewport but clipped by a nested scroll container', async () => {
                // a layout rect fully inside the 600x800 viewport - a window-bounds-only
                // check would call this "already visible" and wrongly take the fast path,
                // applying the pre-scroll delta directly and risking the exact overshoot the
                // probe exists to avoid. `isPainted: false` is the ground truth here: the
                // element isn't actually painted at this position (e.g. clipped by a nested
                // `overflow` container smaller than the viewport)
                const clippedButInBoundsRect = {
                    elemRect: { x: 15, y: 300, height: 30, width: 50 },
                    viewport: { width: 600, height: 800 },
                    scroll: { x: 0, y: 0 },
                    isPainted: false
                }
                vi.spyOn(browser, 'execute')
                    .mockResolvedValueOnce(clippedButInBoundsRect)
                    .mockResolvedValueOnce({ ...clippedButInBoundsRect, elemRect: { ...clippedButInBoundsRect.elemRect, y: 100 }, isPainted: true })
                    .mockResolvedValueOnce({ ...clippedButInBoundsRect, elemRect: { ...clippedButInBoundsRect.elemRect, y: 385 }, isPainted: true })

                await elem.scrollIntoView({ block: 'center', inline: 'center' })

                const scrollCalls = vi.mocked(fetch).mock.calls.filter(([, requestOptions]) => {
                    try {
                        return JSON.parse((requestOptions as any)?.body)?.actions?.[0]?.actions?.[0]?.type === 'scroll'
                    } catch {
                        return false
                    }
                })
                // two calls (probe + real delta) proves the two-phase path was taken, not
                // the single-wheel fast path a window-bounds-only check would have picked
                expect(scrollCalls).toHaveLength(2)
                const probeAction = JSON.parse((scrollCalls[0][1] as any).body).actions[0].actions[0]
                expect(probeAction).toMatchObject({ deltaX: 0, deltaY: 0 })

                expect(hasWebApiFallbackCall()).toBe(false)
            })

            it('does not skip straight to returning for a clipped element whose "nearest" delta computes to zero', async () => {
                // `computeDelta`'s "nearest" branch decides an axis needs no delta using the
                // same window-bounds arithmetic `isPainted` exists to correct for - so a
                // clipped-but-in-bounds element can compute a (0, 0) delta on the very first
                // measurement despite `isPainted: false`. Trusting that delta alone would
                // return immediately, skipping both the probe and the Web API fallback, and
                // scrollIntoView would do nothing at all for a genuinely invisible element.
                const clippedZeroDeltaRect = {
                    elemRect: { x: 15, y: 20, height: 30, width: 50 },
                    viewport: { width: 600, height: 800 },
                    scroll: { x: 0, y: 0 },
                    isPainted: false
                }
                vi.spyOn(browser, 'execute')
                    .mockResolvedValueOnce(clippedZeroDeltaRect)
                    .mockResolvedValueOnce({ ...clippedZeroDeltaRect, isPainted: true })
                    .mockResolvedValueOnce({ ...clippedZeroDeltaRect, isPainted: true })

                await elem.scrollIntoView({ block: 'nearest', inline: 'nearest' })

                const scrollCalls = vi.mocked(fetch).mock.calls.filter(([, requestOptions]) => {
                    try {
                        return JSON.parse((requestOptions as any)?.body)?.actions?.[0]?.actions?.[0]?.type === 'scroll'
                    } catch {
                        return false
                    }
                })
                // the zero-delta probe must still have been sent, proving the early return
                // didn't fire just because the "nearest" delta happened to be (0, 0)
                expect(scrollCalls).toHaveLength(1)
                const probeAction = JSON.parse((scrollCalls[0][1] as any).body).actions[0].actions[0]
                expect(probeAction).toMatchObject({ deltaX: 0, deltaY: 0 })

                expect(hasWebApiFallbackCall()).toBe(false)
            })
        })

        it('skips the origin probe when the element already starts within the viewport', async () => {
            await elem.scrollIntoView({ block: 'center', inline: 'center' })
            const scrollCalls = vi.mocked(fetch).mock.calls.filter(([, requestOptions]) => {
                try {
                    return JSON.parse((requestOptions as any)?.body)?.actions?.[0]?.actions?.[0]?.type === 'scroll'
                } catch {
                    return false
                }
            })
            expect(scrollCalls).toHaveLength(1)
        })

        it('waits for the scroll to settle after performing the wheel action', async () => {
            await elem.scrollIntoView()
            const { calls } = vi.mocked(fetch).mock

            const actionsIndex = calls.findIndex(([url]) => (url as URL).pathname?.endsWith('/actions'))
            const settleIndex = calls.findIndex(([url]) => (url as URL).pathname?.endsWith('/execute/async'))

            expect(actionsIndex).toBeGreaterThanOrEqual(0)
            expect(settleIndex).toBeGreaterThan(actionsIndex)
            expect(JSON.parse((calls[settleIndex][1] as any).body).script)
                .toEqual(expect.stringContaining('stableFrames'))
        })

        it('does not wait for settle when the wheel action fails and falls back to the Web API', async () => {
            // @ts-expect-error mock feature
            vi.mocked(fetch).customResponseFor(/\/actions/, { error: 'invalid parameter' })
            // @ts-expect-error mock feature
            elem.elementId = { scrollIntoView: 'mockFunction' }
            await elem.scrollIntoView({})
            const hasSettleCall = vi.mocked(fetch).mock.calls.some(([url]) => (url as URL).pathname?.endsWith('/execute/async'))
            expect(hasSettleCall).toBe(false)
        })

        it('falls back using Web API if scroll action fails', async () => {
            // @ts-expect-error mock feature
            vi.mocked(fetch).customResponseFor(/\/actions/, { error: 'invalid parameter' })
            // @ts-expect-error mock feature
            elem.elementId = { scrollIntoView: 'mockFunction' }
            await elem.scrollIntoView({})
            // @ts-expect-error mock implementation
            expect(vi.mocked(fetch).mock.calls.pop()![0]!.href.endsWith('/execute/sync'))
                .toBe(true)
        })

        it('skips the wheel action when the element is already positioned as requested', async () => {
            vi.spyOn(browser, 'execute').mockResolvedValueOnce({
                elemRect: { x: 0, y: 0, height: 10, width: 10 },
                viewport: { width: 100, height: 100 },
                scroll: { x: 0, y: 0 },
                isPainted: true
            })
            await elem.scrollIntoView({ block: 'start', inline: 'start' })
            expect(vi.mocked(fetch).mock.calls).toHaveLength(0)
        })

        it('rounds float delta values', async () => {
            vi.spyOn(browser, 'execute').mockResolvedValueOnce({
                elemRect: { x: 15.34, y: 20.23, height: 30.2344, width: 50.543 },
                viewport: { width: 600.321, height: 800.123 },
                scroll: { x: 0, y: 0 },
                isPainted: true
            })
            await elem.scrollIntoView({ block: 'center', inline: 'center' })
            const scrollAction = getScrollActionBody().actions[0].actions[0]
            expect(scrollAction.deltaX).toBe(-260)
            expect(scrollAction.deltaY).toBe(-365)
            expect(scrollAction.x).toBe(0)
            expect(scrollAction.y).toBe(0)
        })

    })

    describe('mobile web', () => {
        beforeAll(async () => {
            browser = await remote({
                baseUrl: 'http://foobar.com',
                capabilities: {
                    browserName: 'foobar',
                    mobileMode: true
                } as any
            })
            // @ts-expect-error
            elem = await browser.$('#foo')
            // @ts-expect-error mock feature
            elem.elementId = { scrollIntoView: 'mockFunction'  }
        })

        beforeEach(() => {
            vi.mocked(fetch).mockClear()
        })

        it('scrolls by default the element to the top', async () => {
            await elem.scrollIntoView()
            const { calls } = vi.mocked(fetch).mock
            expect(calls).toHaveLength(1)
            const [[executeCallUrl, executeCallOptions]] = calls as any
            expect(executeCallUrl.pathname).toEqual('/session/foobar-123/execute/sync')
            expect(JSON.parse(executeCallOptions.body).script).toEqual(
                expect.stringContaining('return ((elem, options2) => elem.scrollIntoView(options2)).apply(null, arguments)'))
            expect(JSON.parse(executeCallOptions.body).args).toHaveLength(2)
            expect(JSON.parse(executeCallOptions.body).args[1]).toEqual({ block: 'start', inline: 'nearest' })
        })

        it('scrolls element when using boolean scroll options', async () => {
            await elem.scrollIntoView(true)
            const { calls } = vi.mocked(fetch).mock
            expect(calls).toHaveLength(1)
            const [[executeCallUrl, executeCallOptions]] = calls as any
            expect(executeCallUrl.pathname).toEqual('/session/foobar-123/execute/sync')
            expect(JSON.parse(executeCallOptions.body).script).toEqual(
                expect.stringContaining('return ((elem, options2) => elem.scrollIntoView(options2)).apply(null, arguments)'))
            expect(JSON.parse(executeCallOptions.body).args).toHaveLength(2)
            expect(JSON.parse(executeCallOptions.body).args[1]).toEqual(true)
        })

        it('scrolls element using scroll into view options', async () => {
            await elem.scrollIntoView({ block: 'end', inline: 'center' })
            const { calls } = vi.mocked(fetch).mock
            expect(calls).toHaveLength(1)
            const [[executeCallUrl, executeCallOptions]] = calls as any
            expect(executeCallUrl.pathname).toEqual('/session/foobar-123/execute/sync')
            expect(JSON.parse(executeCallOptions.body).script).toEqual(
                expect.stringContaining('return ((elem, options2) => elem.scrollIntoView(options2)).apply(null, arguments)'))
            expect(JSON.parse(executeCallOptions.body).args).toHaveLength(2)
            expect(JSON.parse(executeCallOptions.body).args[1]).toEqual({ block: 'end', inline: 'center' })
        })
    })

    describe('mobile native app', () => {
        beforeAll(async () => {
            browser = await remote({
                capabilities: {
                    mobileMode: true,
                    nativeAppMode: true,
                    platformName: 'iOS',
                    platformVersion: '16',
                    deviceName: 'iphone',
                    app: 'foo.ipa',
                } as any
            })
            // @ts-expect-error
            elem = await browser.$('#foo')
            // @ts-expect-error mock feature
            elem.elementId = { scrollIntoView: 'mockFunction' }
        })

        beforeEach(() => {
            vi.mocked(fetch).mockClear()
            vi.spyOn(browser, 'pause').mockResolvedValue(undefined)
            vi.spyOn(browser, '$$')
        })

        it('no scroll is needed', async () => {
            // Set some spy values
            (browser.$$ as Mock).mockResolvedValue([{
                elementId: 'scrollable-element-id',
                isDisplayed: vi.fn().mockResolvedValue(true),
            }])
            vi.spyOn(elem, 'isDisplayed').mockResolvedValueOnce(true)

            await elem.scrollIntoView()

            // call the mobileScrollUntilVisible but no scroll is needed
            const { calls } = vi.mocked(fetch).mock
            expect(calls).toHaveLength(0)
        })

        it('scrolls by default the element to the top', async () => {
            // Set some spy values
            (browser.$$ as Mock).mockResolvedValue([{
                elementId: 'scrollable-element-id',
                isDisplayed: vi.fn().mockResolvedValue(true),
            }])
            const isDisplayedSpy = vi.spyOn(elem, 'isDisplayed').mockResolvedValueOnce(false).mockResolvedValueOnce(true)
            const swipeSpy = vi.spyOn(browser, 'swipe').mockResolvedValue(undefined)

            await elem.scrollIntoView()

            // call the mobileScrollUntilVisible
            expect(isDisplayedSpy).toBeCalledTimes(2)
            expect(swipeSpy).toBeCalledTimes(1)
            expect(swipeSpy).toBeCalledWith({ direction: 'up' })

            swipeSpy.mockRestore()
            isDisplayedSpy.mockRestore()
        })

        it('scrolls to the left with some options', async () => {
            // Set some spy values
            (browser.$$ as Mock).mockResolvedValue([{
                elementId: 'scrollable-element-id',
                isDisplayed: vi.fn().mockResolvedValue(true),
            }])
            const isDisplayedSpy = vi.spyOn(elem, 'isDisplayed').mockResolvedValueOnce(false).mockResolvedValueOnce(true)
            const swipeSpy = vi.spyOn(browser, 'swipe').mockResolvedValue(undefined)

            await elem.scrollIntoView({
                direction: 'left',
                duration: 3000,
                percent: 0.5,
            })

            // call the mobileScrollUntilVisible
            expect(isDisplayedSpy).toBeCalledTimes(2)
            expect(swipeSpy).toBeCalledTimes(1)
            expect(swipeSpy).toBeCalledWith({ direction: 'left', duration: 3000, percent: 0.5 })
            swipeSpy.mockRestore()
            isDisplayedSpy.mockRestore()
        })

        it('does not find the element after max 5 scrolls', async () => {
            // Set some spy values
            (browser.$$ as Mock).mockResolvedValue([{
                elementId: 'scrollable-element-id',
                isDisplayed: vi.fn().mockResolvedValue(true),
            }])
            const isDisplayedSpy = vi.spyOn(elem, 'isDisplayed').mockResolvedValue(false)
            const swipeSpy = vi.spyOn(browser, 'swipe').mockResolvedValue(undefined)

            try {
                await elem.scrollIntoView({ maxScrolls: 5 })
            } catch (err: any) {
                // call the mobileScrollUntilVisible 5 times for the max scrolls
                expect(isDisplayedSpy).toBeCalledTimes(5)
                expect(swipeSpy).toBeCalledTimes(5)
                expect(err.message).toMatchSnapshot()
            }
        })
    })
})
