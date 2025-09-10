import path from 'node:path'
import type { Mock } from 'vitest'
import { expect, describe, it, vi, beforeAll, beforeEach } from 'vitest'

import { remote } from '../../../src/index.js'

vi.mock('fetch')
vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))

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
            vi.spyOn(browser, 'getWindowSize').mockResolvedValue({ height: 800, width: 600 })
            vi.spyOn(browser, 'getElementRect').mockImplementation(() =>
                elem.getElementRect(elem.elementId).catch(() =>
                    // there is a test forcing `elementId` to be invalid to check the fallback to the web API
                    ({ x: 15, y: 20, height: 30, width: 50 })
                )
            )
        })

        it('scrolls by default the element to the top', async () => {
            await elem.scrollIntoView()
            const optionsVoid = vi.mocked(fetch).mock.calls.slice(-2, -1)[0][1] as any
            expect(JSON.parse(optionsVoid.body)).toMatchSnapshot()
        })

        it('scrolls element when using boolean scroll options', async () => {
            await elem.scrollIntoView(true)
            const optionsTrue = vi.mocked(fetch).mock.calls.slice(-2, -1)[0][1] as any
            expect(JSON.parse(optionsTrue.body)).toMatchSnapshot()
            vi.mocked(fetch).mockClear()
            await elem.scrollIntoView(false)
            const optionsFalse = vi.mocked(fetch).mock.calls.slice(-2, -1)[0][1] as any
            expect(JSON.parse(optionsFalse.body)).toMatchSnapshot()
        })

        it('scrolls element using scroll into view options', async () => {
            await elem.scrollIntoView({ block: 'center', inline: 'center' })
            const optionsCenter = vi.mocked(fetch).mock.calls.slice(-2, -1)[0][1] as any
            expect(JSON.parse(optionsCenter.body)).toMatchSnapshot()
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

        it('rounds float delta values', async () => {
            vi.spyOn(browser, 'getWindowSize').mockResolvedValue({ height: 800.123, width: 600.321 })
            vi.spyOn(browser, 'getElementRect').mockResolvedValue(
                ({ x: 15.34, y: 20.23, height: 30.2344, width: 50.543 }))
            await elem.scrollIntoView({ block: 'center', inline: 'center' })
            const optionsCenter = vi.mocked(fetch).mock.calls.slice(-2, -1)[0][1] as any
            expect(JSON.parse(optionsCenter.body).actions[0].actions[0].deltaX).toBe(0)
            expect(JSON.parse(optionsCenter.body).actions[0].actions[0].deltaY).toBe(0)
            expect(JSON.parse(optionsCenter.body).actions[0].actions[0].y).toBe(-385)
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
