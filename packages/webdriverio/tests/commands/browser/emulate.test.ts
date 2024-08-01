import path from 'node:path'

import { expect, describe, it, vi } from 'vitest'
import { remote } from '../../../src/index.js'

vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))

describe('emulate', () => {
    it('should fail if bidi is not supported', async () => {
        const browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar'
            }
        })

        // @ts-expect-error invalid argument
        await expect(() => browser.emulate('geoLocation', {}))
            .rejects.toThrow(/emulate command is only supported for Bidi/)
    })

    it('should allow to emulate geolocation', async () => {
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
        } as any as WebdriverIO.Browser

        // @ts-expect-error missing argument
        await expect(() => browser.emulate.call(fakeScope, 'geolocation')).rejects.toThrow(/Missing geolocation emulation options/)
        const restore = await browser.emulate.call(fakeScope, 'geolocation', { latitude: 123, longitude: 456 })
        expect(fakeScope.scriptAddPreloadScript).toBeCalledTimes(1)
        expect(fakeScope.scriptAddPreloadScript).toBeCalledWith({
            functionDeclaration: expect.stringContaining('Object.defineProperty(navigator.geolocation, \'getCurrentPosition\', {')
        })

        expect(restore).toBeInstanceOf(Function)
        await restore()
        expect(fakeScope.scriptRemovePreloadScript).toBeCalledTimes(1)
    })

    it('should allow to emulate userAgent', async () => {
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
        } as any as WebdriverIO.Browser
        // @ts-expect-error invalid argument
        await expect(() => browser.emulate.call(fakeScope, 'userAgent', 123)).rejects.toThrow(/Expected userAgent emulation options to be a string/)
        const restore = await browser.emulate.call(fakeScope, 'userAgent', 'foobar')
        expect(fakeScope.scriptAddPreloadScript).toBeCalledTimes(1)
        expect(fakeScope.scriptAddPreloadScript).toBeCalledWith({
            functionDeclaration: expect.stringContaining('Object.defineProperty(navigator, \'userAgent\', {')
        })

        expect(restore).toBeInstanceOf(Function)
        await restore()
        expect(fakeScope.scriptRemovePreloadScript).toBeCalledTimes(1)
    })

    it('should allow to emulate colorScheme', async () => {
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
        } as any as WebdriverIO.Browser

        // @ts-expect-error invalid argument
        await expect(() => browser.emulate.call(fakeScope, 'colorScheme', 123)).rejects.toThrow(/Expected "colorScheme" emulation options to be either "light" or "dark"/)
        const restore = await browser.emulate.call(fakeScope, 'colorScheme', 'light')
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
        } as any as WebdriverIO.Browser

        // @ts-expect-error invalid
        await expect(() => browser.emulate.call(fakeScope, 'onLine', 123)).rejects.toThrow(/Expected "onLine" emulation options to be a boolean/)
        const restore = await browser.emulate.call(fakeScope, 'onLine', false)
        expect(fakeScope.scriptAddPreloadScript).toBeCalledTimes(1)
        expect(fakeScope.scriptAddPreloadScript).toBeCalledWith({
            functionDeclaration: expect.stringContaining('Object.defineProperty(navigator, \'onLine\', {')
        })

        expect(restore).toBeInstanceOf(Function)
        await restore()
        expect(fakeScope.scriptRemovePreloadScript).toBeCalledTimes(1)
    })

    it('should allow to emulate the clock', async () => {
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
            options: {
                beforeCommand: vi.fn(),
                afterCommand: vi.fn()
            }
        } as any as WebdriverIO.Browser

        const restore = await browser.emulate.call(fakeScope, 'clock', { now: new Date(2021, 3, 14) })
        expect(fakeScope.execute).toBeCalledTimes(2)
        expect(fakeScope.addInitScript).toBeCalledTimes(1)
        expect(fakeScope.scriptAddPreloadScript).toBeCalledTimes(1)
        expect(fakeScope.scriptAddPreloadScript).toBeCalledWith({
            functionDeclaration: expect.stringContaining('function hijackMethod(target, method, clock) ')
        })
        expect(fakeScope.addInitScript).toBeCalledWith(
            expect.any(Function),
            expect.objectContaining({ now: 1618383600000 })) // (new Date(2021, 3, 14)).getTime()

        expect(restore).toBeInstanceOf(Function)
        await restore()
        expect(fakeScope.scriptRemovePreloadScript).toBeCalledTimes(1)
    })
})
