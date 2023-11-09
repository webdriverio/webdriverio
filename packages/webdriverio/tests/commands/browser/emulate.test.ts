import { expect, describe, it, vi } from 'vitest'
import { remote } from '../../../src/index.js'

vi.mock('got')

describe('emulate', () => {
    it('should fail if bidi is not supported', async () => {
        const browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar'
            }
        })

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
            scriptAddPreloadScript: vi.fn(),
            options: {
                beforeCommand: vi.fn(),
                afterCommand: vi.fn()
            }
        }
        await expect(() => browser.emulate.call(fakeScope, 'geolocation')).rejects.toThrow(/Missing geolocation emulation options/)
        await browser.emulate.call(fakeScope, 'geolocation', { latitude: 123, longitude: 456 })
        expect(fakeScope.scriptAddPreloadScript).toBeCalledTimes(1)
        expect(fakeScope.scriptAddPreloadScript).toBeCalledWith({
            functionDeclaration: expect.stringContaining('Object.defineProperty(navigator.geolocation, \'getCurrentPosition\', {')
        })
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
            scriptAddPreloadScript: vi.fn(),
            options: {
                beforeCommand: vi.fn(),
                afterCommand: vi.fn()
            }
        }
        await expect(() => browser.emulate.call(fakeScope, 'userAgent', 123)).rejects.toThrow(/Expected userAgent emulation options to be a string/)
        await browser.emulate.call(fakeScope, 'userAgent', 'foobar')
        expect(fakeScope.scriptAddPreloadScript).toBeCalledTimes(1)
        expect(fakeScope.scriptAddPreloadScript).toBeCalledWith({
            functionDeclaration: expect.stringContaining('Object.defineProperty(navigator, \'userAgent\', {')
        })
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
            scriptAddPreloadScript: vi.fn(),
            options: {
                beforeCommand: vi.fn(),
                afterCommand: vi.fn()
            }
        }
        await expect(() => browser.emulate.call(fakeScope, 'colorScheme', 123)).rejects.toThrow(/Expected "colorScheme" emulation options to be either "light" or "dark"/)
        await browser.emulate.call(fakeScope, 'colorScheme', 'light')
        expect(fakeScope.scriptAddPreloadScript).toBeCalledTimes(1)
        expect(fakeScope.scriptAddPreloadScript).toBeCalledWith({
            functionDeclaration: expect.stringContaining('Object.defineProperty(window, \'matchMedia\', {')
        })
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
            scriptAddPreloadScript: vi.fn(),
            options: {
                beforeCommand: vi.fn(),
                afterCommand: vi.fn()
            }
        }
        await expect(() => browser.emulate.call(fakeScope, 'onLine', 123)).rejects.toThrow(/Expected "onLine" emulation options to be a boolean/)
        await browser.emulate.call(fakeScope, 'onLine', false)
        expect(fakeScope.scriptAddPreloadScript).toBeCalledTimes(1)
        expect(fakeScope.scriptAddPreloadScript).toBeCalledWith({
            functionDeclaration: expect.stringContaining('Object.defineProperty(navigator, \'onLine\', {')
        })
    })
})
