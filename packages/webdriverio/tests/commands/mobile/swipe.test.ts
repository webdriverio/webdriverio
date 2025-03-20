import path from 'node:path'
import type { Mock, VitestUtils } from 'vitest'
import { beforeEach, expect, describe, it, afterEach, vi, beforeAll } from 'vitest'
import logger from '@wdio/logger'
import { MobileScrollDirection, remote } from '../../../src/index.js'

vi.mock('fetch')
const log = logger('test')
vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))

let browser: WebdriverIO.Browser
let elem: WebdriverIO.Element
let rectSpy: any
let logSpy: any
const defaultAndroidSelector = '//android.widget.ScrollView'

describe('swipe test', () => {
    beforeEach(async () => {
        browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar',
                platformName: 'Android',
                app: 'app',
                mobileMode: true,
                nativeAppMode: true,
            } as any
        })
        // @ts-expect-error
        elem = await browser.$('#scrollableElement')
        rectSpy = vi.spyOn(browser, 'getElementRect').mockResolvedValue({ x: 100, y: 200, width: 300, height: 400 })
        logSpy = vi.spyOn(log, 'warn')
        vi.spyOn(browser, 'pause').mockResolvedValue(0)
        vi.spyOn(browser, '$$')
    })

    it('should log a warning if swipe is called with a "scrollableElement" and "from"', async () => {
        await browser.swipe({
            scrollableElement: elem,
            from: { x: 10, y: 20 },
        })
        expect(logSpy).toHaveBeenCalledWith('`scrollableElement` is provided, so `from` and `to` will be ignored.')
    })

    it('should log a warning if swipe is called with a "scrollableElement" and "to"', async () => {
        await browser.swipe({
            scrollableElement: elem,
            to: { x: 10, y: 20 },
        })
        expect(logSpy).toHaveBeenCalledWith('`scrollableElement` is provided, so `from` and `to` will be ignored.')
    })

    it('should find the default scroll element for Android and can swipe', async () => {
        (browser.$$ as Mock).mockResolvedValue([{
            elementId: 'scrollable-android-element-id',
        }])

        await browser.swipe()
        const [[selector]] = (browser.$$ as Mock).mock.calls
        expect(selector).toEqual(defaultAndroidSelector)
    })

    it('does not find the default scroll element for Android and throws an error', async () => {
        (browser.$$ as Mock).mockResolvedValue([])

        await expect(browser.swipe()).rejects.toThrowErrorMatchingSnapshot()
    })

    it('should be able to swipe based on provided coordinates', async () => {
        await browser.swipe({
            from: { x: 10, y: 20 },
            to: { x: 30, y: 40 },
        })

        expect(rectSpy).not.toBeCalled()
        // @ts-expect-error mock implementation
        expect(vi.mocked(fetch).mock.calls[2][0].pathname)
            .toBe('/session/foobar-123/actions')
        expect(JSON.parse(vi.mocked(fetch).mock.calls[2][1]?.body as any).actions[0])
            .toMatchSnapshot()
    })

    it('should log a warning if swipe percentage is not a number', async () => {
        await browser.swipe({
            direction: 'down',
            // @ts-expect-error invalid param
            percent: 'bar',
            scrollableElement: elem,
        })
        expect(logSpy).toHaveBeenCalledWith('The percentage to swipe should be a number.')
    })

    it('should log a warning if swipe percentage is lower than 0', async () => {
        browser.swipe({
            direction: 'down',
            percent: -1,
            scrollableElement: elem,
        })
        expect(logSpy).toHaveBeenCalledWith('The percentage to swipe should be a number between 0 and 1.')
    })

    it('should log a warning if swipe percentage is bigger than 1', async () => {
        await browser.swipe({
            direction: 'down',
            percent: 98,
            scrollableElement: elem,
        })
        expect(logSpy).toHaveBeenCalledWith('The percentage to swipe should be a number between 0 and 1.')
    })

    const percentages = [0.25, 0.45, 0.5, 0.75, 0.8]
    Object.values(MobileScrollDirection).forEach((direction, index) => {
        const percent = percentages[index % percentages.length]

        it(`should call a swipe ${direction} command with ${percent * 100}% for a scrollable element`, async () => {
            await browser.swipe({
                direction,
                scrollableElement: elem,
                percent,
            })
            expect(rectSpy).toHaveBeenCalledOnce()
            // @ts-expect-error mock implementation
            expect(vi.mocked(fetch).mock.calls[2][0].pathname)
                .toBe('/session/foobar-123/actions')
            expect(JSON.parse(vi.mocked(fetch).mock.calls[2][1]?.body as any).actions[0])
                .toMatchSnapshot()
        })
    })

    it('should call a swipe down command with duration 5000 for a scrollable element', async () => {
        await browser.swipe({
            duration: 5000,
            scrollableElement: elem,
        })

        expect(rectSpy).toHaveBeenCalledOnce()
        // @ts-expect-error mock implementation
        expect(vi.mocked(fetch).mock.calls[2][0].pathname)
            .toBe('/session/foobar-123/actions')
        expect(JSON.parse(vi.mocked(fetch).mock.calls[2][1]?.body as any).actions[0])
            .toMatchSnapshot()
    })

    it('should throw an error a swipe command for direction foo', async () => {
        await expect(
            browser.swipe({
                direction: 'foo' as MobileScrollDirection,
                scrollableElement: elem
            })
        ).rejects.toThrowErrorMatchingSnapshot()
    })

    it('should throw an error if the swipe command is called for a browser session', async () => {
        browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar',
            } as any
        })

        await expect(browser.swipe()).rejects.toThrowErrorMatchingSnapshot()
    })

    afterEach(() => {
        vi.mocked(fetch).mockClear()
        rectSpy.mockRestore()
        logSpy.mockRestore()
    })
})

