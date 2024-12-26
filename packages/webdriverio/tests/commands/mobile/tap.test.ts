import path from 'node:path'
import { expect, describe, it, afterEach, vi } from 'vitest'
import { remote } from '../../../src/index.js'
import { platform } from 'node:os'

vi.mock('fetch')
vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))

describe('tap test', () => {
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

    it('should call the action command for mobile web when a tap is executed with x and y coordinates', async () => {
        const browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar',
                mobileMode: true,
            } as any
        })
        const elem = await browser.$('#foo')
        const clickSpy = vi.spyOn(elem, 'click').mockResolvedValue(undefined)

        await elem.tap({ x: 50, y: 30 })

        expect(clickSpy).not.toHaveBeenCalled()
        // @ts-expect-error mock implementation
        expect(vi.mocked(fetch).mock.calls[2][0].pathname)
            .toBe('/session/foobar-123/actions')
        expect(JSON.parse(vi.mocked(fetch).mock.calls[2][1]?.body as any).actions[0])
            .toMatchSnapshot()

        clickSpy.mockRestore()
    })

    it('should call the Android mobile tap command for native mobile when a tap is on an elements', async () => {
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

    it('should call the iOS mobile tap command for native mobile when a tap is on an element', async () => {
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

    it('should call the Android mobile tap command for native mobile when a tap is executed with x and y coordinates', async () => {
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

        await elem.tap({ x: 50, y: 30 })

        // @ts-expect-error mock implementation
        expect(vi.mocked(fetch).mock.calls[2][0].pathname)
            .toBe('/session/foobar-123/execute/sync')
        expect(JSON.parse(vi.mocked(fetch).mock.calls[2][1]?.body as any))
            .toMatchSnapshot()

        clickSpy.mockRestore()
    })

    it('should call the iOS mobile tap command for native mobile when a tap is executed with x and y coordinates', async () => {
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

        await elem.tap({ x: 50, y: 30 })

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
                new Error('element click intercepted')
            )
            .mockResolvedValueOnce(undefined)
        const scrollSpy = vi.spyOn(elem, 'scrollIntoView').mockResolvedValue(undefined)

        await elem.tap()

        expect(scrollSpy).toHaveBeenCalledWith({
            direction: undefined,
            maxScrolls: undefined,
            scrollableElement: undefined,
        })

        expect(nativeTapSpy).toHaveBeenCalledTimes(2)

        nativeTapSpy.mockRestore()
        scrollSpy.mockRestore()
    })

    it('should call the scrollIntoView which throws an error', async () => {
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
                new Error('element click intercepted')
            )
            .mockResolvedValueOnce(undefined)
        const scrollSpy = vi.spyOn(elem, 'scrollIntoView')
            .mockRejectedValueOnce(
                new Error('scroll failed')
            )

        await expect(elem.tap()).rejects.toThrow('scroll failed')
        expect(nativeTapSpy).toHaveBeenCalledTimes(1)

        nativeTapSpy.mockRestore()
        scrollSpy.mockRestore()
    })

    it('should throw an error if tap command is called for a desktop session', async () => {
        const browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar',
            } as any
        })
        const elem = await browser.$('#foo')

        await expect(elem.tap()).rejects.toThrow('The tap command is only available for mobile platforms.')
    })

    it('should throw an error if the passed argument to the tap command missing the mandatory x or y value', async () => {
        const browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar',
                mobileMode: true,
            } as any
        })
        const elem = await browser.$('#foo')

        // @ts-expect-error invalid param
        await expect(elem.tap({ x: 1 })).rejects.toThrow('If x is set, then y must be set as well.')
        // @ts-expect-error invalid param
        await expect(elem.tap({ y: 1 })).rejects.toThrow('If y is set, then x must be set as well.')
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
        await expect(elem.tap([])).rejects.toThrow('Options must be an object.')
    })

    afterEach(() => {
        vi.mocked(fetch).mockClear()
    })
})
