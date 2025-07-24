import path from 'node:path'

import { expect, describe, it, vi } from 'vitest'
import { remote } from '../../../src/index.js'

vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))

const browser = await remote({
    baseUrl: 'http://foobar.com',
    capabilities: {
        browserName: 'foobar'
    }
})

describe('emulate', () => {
    it('should fail if bidi is not supported', async () => {
        // @ts-expect-error invalid argument
        await expect(() => browser.emulate('geoLocation', {}))
            .rejects.toThrow(/emulate command is only supported for Bidi/)
    })

    it('should allow to emulate geolocation', async () => {
        const fakeScope = {
            isBidi: true,
            scriptAddPreloadScript: vi.fn().mockResolvedValue({ script: 'foobar' }),
            scriptRemovePreloadScript: vi.fn(),
            options: {
                beforeCommand: vi.fn(),
                afterCommand: vi.fn()
            }
        } as unknown as WebdriverIO.Browser
        fakeScope.emulate = browser.emulate.bind(fakeScope)

        // @ts-expect-error missing argument
        await expect(() => fakeScope.emulate('geolocation')).rejects.toThrow(/Missing geolocation emulation options/)
        const restore = await fakeScope.emulate('geolocation', { latitude: 123, longitude: 456 })
        expect(fakeScope.scriptAddPreloadScript).toBeCalledTimes(1)
        expect(fakeScope.scriptAddPreloadScript).toBeCalledWith({
            functionDeclaration: expect.stringContaining('Object.defineProperty(navigator.geolocation, \'getCurrentPosition\', {')
        })

        expect(restore).toBeInstanceOf(Function)
        await restore()
        expect(fakeScope.scriptRemovePreloadScript).toBeCalledTimes(1)
    })

    it('should allow to emulate userAgent', async () => {
        const fakeScope = {
            isBidi: true,
            scriptAddPreloadScript: vi.fn().mockResolvedValue({ script: 'foobar' }),
            scriptRemovePreloadScript: vi.fn(),
            options: {
                beforeCommand: vi.fn(),
                afterCommand: vi.fn()
            }
        } as unknown as WebdriverIO.Browser
        fakeScope.emulate = browser.emulate.bind(fakeScope)
        // @ts-expect-error invalid argument
        await expect(() => fakeScope.emulate('userAgent', 123)).rejects.toThrow(/Expected userAgent emulation options to be a string/)
        const restore = await fakeScope.emulate('userAgent', 'foobar')
        expect(fakeScope.scriptAddPreloadScript).toBeCalledTimes(1)
        expect(fakeScope.scriptAddPreloadScript).toBeCalledWith({
            functionDeclaration: expect.stringContaining('Object.defineProperty(navigator, \'userAgent\', {')
        })

        expect(restore).toBeInstanceOf(Function)
        await restore()
        expect(fakeScope.scriptRemovePreloadScript).toBeCalledTimes(1)
    })

    it('should allow to emulate colorScheme', async () => {
        const fakeScope = {
            isBidi: true,
            scriptAddPreloadScript: vi.fn().mockResolvedValue({ script: 'foobar' }),
            scriptRemovePreloadScript: vi.fn(),
            options: {
                beforeCommand: vi.fn(),
                afterCommand: vi.fn()
            }
        } as unknown as WebdriverIO.Browser
        fakeScope.emulate = browser.emulate.bind(fakeScope)

        // @ts-expect-error invalid argument
        await expect(() => fakeScope.emulate('colorScheme', 123)).rejects.toThrow(/Expected "colorScheme" emulation options to be either "light" or "dark"/)
        const restore = await fakeScope.emulate('colorScheme', 'light')
        expect(fakeScope.scriptAddPreloadScript).toBeCalledTimes(1)
        expect(fakeScope.scriptAddPreloadScript).toBeCalledWith({
            functionDeclaration: expect.stringContaining('Object.defineProperty(window, \'matchMedia\', {')
        })

        expect(restore).toBeInstanceOf(Function)
        await restore()
        expect(fakeScope.scriptRemovePreloadScript).toBeCalledTimes(1)
    })

    it('should allow to emulate onLine', async () => {
        const browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar'
            }
        })
        const fakeScope = {
            isBidi: true,
            scriptAddPreloadScript: vi.fn().mockResolvedValue({ script: 'foobar' }),
            scriptRemovePreloadScript: vi.fn(),
            options: {
                beforeCommand: vi.fn(),
                afterCommand: vi.fn()
            }
        } as unknown as WebdriverIO.Browser
        fakeScope.emulate = browser.emulate.bind(fakeScope)

        // @ts-expect-error invalid
        await expect(() => fakeScope.emulate('onLine', 123)).rejects.toThrow(/Expected "onLine" emulation options to be a boolean/)
        const restore = await fakeScope.emulate('onLine', false)
        expect(fakeScope.scriptAddPreloadScript).toBeCalledTimes(1)
        expect(fakeScope.scriptAddPreloadScript).toBeCalledWith({
            functionDeclaration: expect.stringContaining('Object.defineProperty(navigator, \'onLine\', {')
        })

        expect(restore).toBeInstanceOf(Function)
        await restore()
        expect(fakeScope.scriptRemovePreloadScript).toBeCalledTimes(1)
    })

    it('should allow to emulate the clock', async () => {
        const now = new Date(2021, 3, 14)
        const browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar'
            }
        })
        const fakeScope = {
            isBidi: true,
            scriptAddPreloadScript: vi.fn().mockResolvedValue({ script: 'foobar' }),
            scriptRemovePreloadScript: vi.fn(),
            addInitScript: vi.fn(),
            executeScript: vi.fn().mockResolvedValue({}),
            execute: vi.fn().mockResolvedValue({}),
            options: {
                beforeCommand: vi.fn(),
                afterCommand: vi.fn()
            },
        } as unknown as WebdriverIO.Browser
        fakeScope.emulate = browser.emulate.bind(fakeScope)

        const clock = await fakeScope.emulate('clock', { now })
        expect(fakeScope.executeScript).toBeCalledTimes(1)
        expect(fakeScope.execute).toBeCalledTimes(1)
        expect(fakeScope.addInitScript).toBeCalledTimes(1)
        expect(fakeScope.scriptAddPreloadScript).toBeCalledTimes(1)
        expect(fakeScope.scriptAddPreloadScript).toBeCalledWith({
            functionDeclaration: ''
        })
        expect(fakeScope.addInitScript).toBeCalledWith(
            expect.any(Function),
            expect.objectContaining({ now: now.getTime() })
        )

        expect(clock.restore).toBeInstanceOf(Function)
        await clock.restore()
        expect(fakeScope.scriptRemovePreloadScript).toBeCalledTimes(1)
    })

    it('should allow to emulate a device', async () => {
        const browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar'
            }
        })
        const fakeScope = {
            isBidi: true,
            scriptAddPreloadScript: vi.fn().mockResolvedValue({ script: 'foobar' }),
            scriptRemovePreloadScript: vi.fn(),
            addInitScript: vi.fn(),
            execute: vi.fn().mockResolvedValue({}),
            setViewport: vi.fn(),
            options: {
                beforeCommand: vi.fn(),
                afterCommand: vi.fn()
            },
        } as unknown as WebdriverIO.Browser
        fakeScope.emulate = browser.emulate.bind(fakeScope)

        const restore = await fakeScope.emulate('device', 'iPhone 8')
        expect(fakeScope.setViewport).toBeCalledTimes(1)
        expect(fakeScope.scriptAddPreloadScript).toBeCalledTimes(1)

        expect(restore).toBeInstanceOf(Function)
        await restore()
        expect(fakeScope.scriptRemovePreloadScript).toBeCalledTimes(1)
        expect(fakeScope.setViewport).toBeCalledTimes(2)
    })
})
