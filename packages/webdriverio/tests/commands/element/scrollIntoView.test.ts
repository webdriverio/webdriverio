import path from 'node:path'
import type { Mock } from 'vitest'
import { expect, describe, it, vi, beforeAll, beforeEach } from 'vitest'

import { remote } from '../../../src/index.js'

vi.mock('fetch')
vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))

/**
 * finds the wheel "actions" request body among all fetch calls, since the
 * scrollIntoView flow may also perform an "execute/async" settle-wait call
 * after the wheel action, shifting where it lands among the recorded calls.
 */
const getScrollActionBody = () => {
    const call = vi.mocked(fetch).mock.calls.find(([, requestOptions]) => {
        try {
            return JSON.parse((requestOptions as any)?.body)?.actions?.[0]?.actions?.[0]?.type === 'scroll'
        } catch {
            return false
        }
    })
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
        beforeAll(async () => {
            browser = await remote({
                baseUrl: 'http://foobar.com',
                capabilities: {
                    browserName: 'foobar',
                },
            })
            // @ts-expect-error
            elem = await browser.$('#foo')
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
                scroll: { x: 0, y: 0 }
            })
            await elem.scrollIntoView({ block: 'nearest', inline: 'nearest' })
            // no scroll action should be performed at all: the element already fully
            // covers the viewport on both axes, same as native scrollIntoView would leave it
            expect(vi.mocked(fetch).mock.calls).toHaveLength(0)
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
                scroll: { x: 0, y: 0 }
            })
            await elem.scrollIntoView({ block: 'start', inline: 'start' })
            expect(vi.mocked(fetch).mock.calls).toHaveLength(0)
        })

        it('rounds float delta values', async () => {
            vi.spyOn(browser, 'execute').mockResolvedValueOnce({
                elemRect: { x: 15.34, y: 20.23, height: 30.2344, width: 50.543 },
                viewport: { width: 600.321, height: 800.123 },
                scroll: { x: 0, y: 0 }
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
