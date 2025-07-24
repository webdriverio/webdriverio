import path from 'node:path'
import { expect, describe, it, afterEach, vi } from 'vitest'
import logger from '@wdio/logger'
import { remote } from '../../../src/index.js'

vi.mock('fetch')
const log = logger('test')
vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))

describe('element tap test', () => {
    it('should log a warning when the tap command for mobile web is executed and options are provided', async () => {
        const logSpy = vi.spyOn(log, 'warn')
        const browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar',
                mobileMode: true,
            } as any
        })
        const elem = await browser.$('#foo')
        const clickSpy = vi.spyOn(elem, 'click').mockResolvedValue(undefined)

        await elem.tap({ maxScrolls: 3 })

        expect(clickSpy).toHaveBeenCalledWith()
        expect(logSpy).toHaveBeenCalledWith('The options object is not supported in Web environments and will be ignored.')

        clickSpy.mockRestore()
    })

    it('should call the click command for mobile web when a tap is executed where no options are provided', async () => {
        const browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar',
                mobileMode: true,
            } as any
        })
        const elem = await browser.$('#foo')
        const clickSpy = vi.spyOn(elem, 'click').mockResolvedValue(undefined)

        await elem.tap()

        expect(clickSpy).toHaveBeenCalledWith()

        clickSpy.mockRestore()
    })

    it('should call the Android mobile tap command for native mobile', async () => {
        const browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                platformName: 'Android',
                app: 'app',
                mobileMode: true,
                nativeAppMode: true,
            } as any
        })
        const elem = await browser.$('#foo')
        const clickSpy = vi.spyOn(elem, 'click').mockResolvedValue(undefined)

        await elem.tap()

        // @ts-expect-error mock implementation
        expect(vi.mocked(fetch).mock.calls[2][0].pathname)
            .toBe('/session/foobar-123/execute/sync')
        expect(JSON.parse(vi.mocked(fetch).mock.calls[2][1]?.body as any))
            .toMatchSnapshot()

        clickSpy.mockRestore()
    })

    it('should call the iOS mobile tap command for native mobile', async () => {
        const browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                platformName: 'iOS',
                app: 'app',
                mobileMode: true,
                nativeAppMode: true,
            } as any
        })
        const elem = await browser.$('#foo')
        const clickSpy = vi.spyOn(elem, 'click').mockResolvedValue(undefined)

        await elem.tap()

        // @ts-expect-error mock implementation
        expect(vi.mocked(fetch).mock.calls[2][0].pathname)
            .toBe('/session/foobar-123/execute/sync')
        expect(JSON.parse(vi.mocked(fetch).mock.calls[2][1]?.body as any))
            .toMatchSnapshot()

        clickSpy.mockRestore()
    })

    it('should call the scrollIntoView command when the element is not in view', async () => {
        const browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                platformName: 'Android',
                mobileMode: true,
                nativeAppMode: true,
            } as any
        })
        const elem = await browser.$('#foo')
        const nativeTapSpy = vi.spyOn(browser, 'execute')
            .mockRejectedValueOnce(
                new Error('no such element')
            )
            .mockResolvedValueOnce(undefined)
        const scrollSpy = vi.spyOn(elem, 'scrollIntoView').mockResolvedValue(undefined)

        await elem.tap()

        expect(scrollSpy).toHaveBeenCalledWith({})
        expect(nativeTapSpy).toHaveBeenCalledTimes(2)

        nativeTapSpy.mockRestore()
        scrollSpy.mockRestore()
    })

    it('should call the scrollIntoView which throws a mocked error and the execution stops', async () => {
        const browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                platformName: 'Android',
                mobileMode: true,
                nativeAppMode: true,
            } as any
        })
        const elem = await browser.$('#foo')
        const nativeTapSpy = vi.spyOn(browser, 'execute')
            .mockRejectedValueOnce(
                new Error('no such element')
            )
        const scrollSpy = vi.spyOn(elem, 'scrollIntoView')
            .mockRejectedValueOnce(
                new Error('scroll failed')
            )

        await expect(elem.tap()).rejects.toThrow('scroll failed')
        expect(nativeTapSpy).toHaveBeenCalledTimes(1)

        nativeTapSpy.mockRestore()
        scrollSpy.mockRestore()
    })

    it('should call the scrollIntoView which throws a `Element not found within scroll limit of` error', async () => {
        const browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                platformName: 'Android',
                mobileMode: true,
                nativeAppMode: true,
            } as any
        })
        const elem = await browser.$('#foo')
        const nativeTapSpy = vi.spyOn(browser, 'execute')
            .mockRejectedValueOnce(
                new Error('no such element')
            )
            .mockResolvedValueOnce(undefined)
        const scrollSpy = vi.spyOn(elem, 'scrollIntoView')
            .mockRejectedValueOnce(
                new Error('Element not found within scroll limit of')
            )

        await expect(elem.tap()).rejects.toThrowErrorMatchingSnapshot()
        expect(nativeTapSpy).toHaveBeenCalledTimes(1)

        nativeTapSpy.mockRestore()
        scrollSpy.mockRestore()
    })

    it('should call the scrollIntoView which throws a `Default scrollable element` error', async () => {
        const browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                platformName: 'Android',
                mobileMode: true,
                nativeAppMode: true,
            } as any
        })
        const elem = await browser.$('#foo')
        const nativeTapSpy = vi.spyOn(browser, 'execute')
            .mockRejectedValueOnce(
                new Error('no such element')
            )
            .mockResolvedValueOnce(undefined)
        const scrollSpy = vi.spyOn(elem, 'scrollIntoView')
            .mockRejectedValueOnce(
                new Error('Default scrollable element \'`-ios predicate string:type == "XCUIElementTypeApplication`\' was not found')
            )

        await expect(elem.tap()).rejects.toThrowErrorMatchingSnapshot()
        expect(nativeTapSpy).toHaveBeenCalledTimes(1)

        nativeTapSpy.mockRestore()
        scrollSpy.mockRestore()
    })

    it('should call the scrollIntoView which throws a `Default scrollable element` error for an unknown default selector', async () => {
        const browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                platformName: 'Android',
                mobileMode: true,
                nativeAppMode: true,
            } as any
        })
        const elem = await browser.$('#foo')
        const nativeTapSpy = vi.spyOn(browser, 'execute')
            .mockRejectedValueOnce(
                new Error('no such element')
            )
            .mockResolvedValueOnce(undefined)
        const scrollSpy = vi.spyOn(elem, 'scrollIntoView')
            .mockRejectedValueOnce(
                new Error('Default scrollable element `foo-bar` was not found')
            )

        await expect(elem.tap()).rejects.toThrowErrorMatchingSnapshot()
        expect(nativeTapSpy).toHaveBeenCalledTimes(1)

        nativeTapSpy.mockRestore()
        scrollSpy.mockRestore()
    })

    afterEach(() => {
        vi.mocked(fetch).mockClear()
    })
})

describe('screen tap test', () => {
    it('should call the Android mobile tap command for native mobile', async () => {
        const browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                platformName: 'Android',
                app: 'app',
                mobileMode: true,
                nativeAppMode: true,
            } as any
        })

        await browser.tap({ x: 10, y: 20 })

        // @ts-expect-error mock implementation
        expect(vi.mocked(fetch).mock.calls[1][0].pathname)
            .toBe('/session/foobar-123/execute/sync')
        expect(JSON.parse(vi.mocked(fetch).mock.calls[1][1]?.body as any))
            .toMatchSnapshot()
    })

    it('should call the iOS mobile tap command for native mobile', async () => {
        const browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                platformName: 'iOS',
                app: 'app',
                mobileMode: true,
                nativeAppMode: true,
            } as any
        })

        await browser.tap({ x: 10, y: 20 })

        // @ts-expect-error mock implementation
        expect(vi.mocked(fetch).mock.calls[1][0].pathname)
            .toBe('/session/foobar-123/execute/sync')
        expect(JSON.parse(vi.mocked(fetch).mock.calls[1][1]?.body as any))
            .toMatchSnapshot()
    })

    it('should call the action command for mobile web when a tap is executed with x and y coordinates', async () => {
        const browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                platformName: 'iOS',
                browserName: 'foobar',
                mobileMode: true,
            } as any
        })

        await browser.tap({ x: 10, y: 20 })

        // @ts-expect-error mock implementation
        expect(vi.mocked(fetch).mock.calls[1][0].pathname)
            .toBe('/session/foobar-123/actions')
        expect(JSON.parse(vi.mocked(fetch).mock.calls[1][1]?.body as any).actions[0])
            .toMatchSnapshot()
    })

    afterEach(() => {
        vi.mocked(fetch).mockClear()
    })
})

describe('generic error test', () => {
    it('should throw an error if tap command is called for a desktop session', async () => {
        const browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar',
            } as any
        })
        const elem = await browser.$('#foo')

        await expect(elem.tap()).rejects.toThrowErrorMatchingSnapshot()
    })

    it('should throw an error if the passed argument to the tap command is not an options object', async () => {
        const browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar',
                mobileMode: true,
            } as any
        })
        const elem = await browser.$('#foo')

        // @ts-expect-error invalid param
        await expect(elem.tap([])).rejects.toThrowErrorMatchingSnapshot()
    })

    it('should throw an error if only x or y is provided', async () => {
        const browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar',
                mobileMode: true,
            } as any
        })
        const elem = await browser.$('#foo')

        await expect(elem.tap({ x: 50 })).rejects.toThrowErrorMatchingSnapshot()
        await expect(elem.tap({ y: 50 })).rejects.toThrowErrorMatchingSnapshot()
    })

    it('should throw an error if x and y are provided along with other arguments', async () => {
        const browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar',
                mobileMode: true,
            } as any
        })
        const elem = await browser.$('#foo')

        await expect(elem.tap({ x: 50, y: 100, direction: 'down' })).rejects.toThrowErrorMatchingSnapshot()
    })

    it('should throw an error if invalid coordinates are provided for screen tap', async () => {
        const browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                platformName: 'Android',
                mobileMode: true,
                nativeAppMode: true,
            } as any
        })

        await expect(browser.tap({ x: -10, y: 50 }))
            .rejects.toThrow('The x value must be positive.')
    })

    it('should throw an error if invalid coordinates are provided for screen tap', async () => {
        const browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                platformName: 'Android',
                mobileMode: true,
                nativeAppMode: true,
            } as any
        })

        await expect(browser.tap({ x: 10, y: -50 }))
            .rejects.toThrow('The y value must be positive.')
    })

    it('should throw an error if invalid coordinates are provided for screen tap', async () => {
        const browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                platformName: 'Android',
                mobileMode: true,
                nativeAppMode: true,
            } as any
        })

        await expect(browser.tap({ x: -10, y: -50 }))
            .rejects.toThrow('The x and y values must be positive.')
    })

    afterEach(() => {
        vi.mocked(fetch).mockClear()
    })
})
