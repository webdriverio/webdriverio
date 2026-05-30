import path from 'node:path'
import { expect, describe, it, afterEach, vi } from 'vitest'
import { remote } from '../../../src/index.js'

vi.mock('fetch')
vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))

describe('longPress test', () => {
    it('should call click with correct arguments for valid longPress', async () => {
        const browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar',
                mobileMode: true,
            } as any
        })
        const elem = await browser.$('#foo')
        const clickSpy = vi.spyOn(elem, 'click').mockResolvedValue(undefined)

        await elem.longPress({ duration: 2000, x: 50, y: 30 })

        expect(clickSpy).toHaveBeenCalledWith({
            duration: 2000,
            x: 50,
            y: 30,
        })

        clickSpy.mockRestore()
    })

    it('should throw an error if command is called from a desktop session', async () => {
        const browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar',
            } as any
        })
        const elem = await browser.$('#foo')

        await expect(elem.longPress()).rejects.toThrow('The longPress command is only available for mobile platforms.')
    })

    it('should throw an error if the passed argument is not an options object', async () => {
        const browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar',
                mobileMode: true,
            } as any
        })
        const elem = await browser.$('#foo')

        // @ts-expect-error invalid param
        await expect(elem.longPress([])).rejects.toThrow('Options must be an object')
    })

    it('should use execute command for iOS web context (non-native)', async () => {
        const browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                mobileMode: true,
                platformName: 'iOS',
                browserName: 'Safari',
            } as any
        })
        const elem = await browser.$('#foo')
        const executeSpy = vi.spyOn(browser, 'execute').mockResolvedValue(undefined)

        await elem.longPress({ duration: 2000 })

        expect(executeSpy).toHaveBeenCalledWith(
            expect.any(Function),
            elem,
            2000
        )

        executeSpy.mockRestore()
    })

    it('should use execute command for iOS web context with default duration', async () => {
        const browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                mobileMode: true,
                platformName: 'iOS',
                browserName: 'Safari',
            } as any
        })
        const elem = await browser.$('#foo')

        const executeSpy = vi.spyOn(browser, 'execute').mockResolvedValue(undefined)

        await elem.longPress()

        expect(executeSpy).toHaveBeenCalledWith(
            expect.any(Function),
            elem,
            1500
        )

        executeSpy.mockRestore()
    })

    it('should not use execute command for iOS native context', async () => {
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

        const executeSpy = vi.spyOn(browser, 'execute').mockResolvedValue(undefined)
        const clickSpy = vi.spyOn(elem, 'click').mockResolvedValue(undefined)

        await elem.longPress({ duration: 2000 })

        expect(executeSpy).not.toHaveBeenCalled()
        expect(clickSpy).toHaveBeenCalledWith({
            duration: 2000,
            x: 0,
            y: 0,
        })

        executeSpy.mockRestore()
        clickSpy.mockRestore()
    })

    it('should not use execute command for non-iOS mobile platforms', async () => {
        const browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar',
                mobileMode: true,
                platformName: 'Android',
            } as any
        })
        const elem = await browser.$('#foo')

        const executeSpy = vi.spyOn(browser, 'execute').mockResolvedValue(undefined)
        const clickSpy = vi.spyOn(elem, 'click').mockResolvedValue(undefined)

        await elem.longPress({ duration: 2000 })

        expect(executeSpy).not.toHaveBeenCalled()
        expect(clickSpy).toHaveBeenCalledWith({
            duration: 2000,
            x: 0,
            y: 0,
        })

        executeSpy.mockRestore()
        clickSpy.mockRestore()
    })

    afterEach(() => {
        vi.mocked(fetch).mockClear()
    })
})
