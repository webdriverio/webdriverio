import path from 'node:path'

import { expect, describe, it, vi, beforeEach } from 'vitest'

import { setViewport } from '../../../src/commands/browser/setViewport.js'

vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))
vi.mock('../../../src/session/context.js', () => ({
    getContextManager () {
        return {
            initialize: async () => '',
            getCurrentContext: async () => 'ctx-1',
            getCurrentTopLevelContext: async () => 'ctx-1'
        }
    }
}))

const { remote } = await import('../../../src/index.js')

const browser = await remote({
    baseUrl: 'http://foobar.com',
    capabilities: {
        browserName: 'foobar'
    }
})

const CONTEXTS = ['ctx-1']

function bidiBrowser () {
    const fakeScope = {
        isBidi: true,
        emulationSetGeolocationOverride: vi.fn(),
        emulationSetUserAgentOverride: vi.fn(),
        emulationSetMediaFeaturesOverride: vi.fn(),
        emulationSetNetworkConditions: vi.fn(),
        emulationSetLocaleOverride: vi.fn(),
        emulationSetTimezoneOverride: vi.fn(),
        emulationSetTouchOverride: vi.fn(),
        emulationSetScreenOrientationOverride: vi.fn(),
        emulationSetScreenSettingsOverride: vi.fn(),
        emulationSetViewportMetaOverride: vi.fn(),
        emulationSetTextLayoutModeOverride: vi.fn(),
        emulationSetScriptingEnabled: vi.fn(),
        emulationSetScrollbarTypeOverride: vi.fn(),
        emulationSetForcedColorsModeThemeOverride: vi.fn(),
        browsingContextSetViewport: vi.fn(),
        setViewport: vi.fn(),
        scriptAddPreloadScript: vi.fn().mockResolvedValue({ script: 'foobar' }),
        scriptRemovePreloadScript: vi.fn(),
        addInitScript: vi.fn(),
        executeScript: vi.fn().mockResolvedValue({}),
        execute: vi.fn().mockResolvedValue({}),
        options: {
            beforeCommand: vi.fn(),
            afterCommand: vi.fn()
        }
    } as unknown as WebdriverIO.Browser
    fakeScope.emulate = browser.emulate.bind(fakeScope)
    return fakeScope
}

describe('emulate', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('should fail if bidi is not supported', async () => {
        // @ts-expect-error invalid argument
        await expect(() => browser.emulate('geoLocation', {}))
            .rejects.toThrow(/emulate command is only supported for Bidi/)
    })

    it('should emulate geolocation coordinates and clear them', async () => {
        const fakeScope = bidiBrowser()
        // @ts-expect-error missing argument
        await expect(() => fakeScope.emulate('geolocation')).rejects.toThrow(/Missing geolocation emulation options/)
        // @ts-expect-error missing coordinates
        await expect(() => fakeScope.emulate('geolocation', {})).rejects.toThrow(/latitude/)

        const restore = await fakeScope.emulate('geolocation', {
            latitude: 52.52,
            longitude: 13.405,
            accuracy: 10,
            altitude: 30,
            altitudeAccuracy: 1,
            heading: 90,
            speed: 2
        })
        expect(fakeScope.emulationSetGeolocationOverride).toBeCalledWith({
            coordinates: {
                latitude: 52.52,
                longitude: 13.405,
                accuracy: 10,
                altitude: 30,
                altitudeAccuracy: 1,
                heading: 90,
                speed: 2
            },
            contexts: CONTEXTS
        })

        await restore()
        expect(fakeScope.emulationSetGeolocationOverride).toBeCalledWith({
            coordinates: null,
            contexts: CONTEXTS
        })
    })

    it('should emulate a geolocation position error', async () => {
        const fakeScope = bidiBrowser()
        // @ts-expect-error invalid error
        await expect(() => fakeScope.emulate('geolocation', { error: 'denied' })).rejects.toThrow(/positionUnavailable/)

        const restore = await fakeScope.emulate('geolocation', { error: 'positionUnavailable' })
        expect(fakeScope.emulationSetGeolocationOverride).toBeCalledWith({
            error: { type: 'positionUnavailable' },
            contexts: CONTEXTS
        })
        await restore()
        expect(fakeScope.emulationSetGeolocationOverride).toBeCalledWith({
            coordinates: null,
            contexts: CONTEXTS
        })
    })

    it.each([
        {
            scope: 'userAgent' as const,
            invalid: 123,
            invalidMessage: /Expected userAgent emulation options to be a string/,
            value: 'foobar',
            method: 'emulationSetUserAgentOverride' as const,
            params: { userAgent: 'foobar', contexts: CONTEXTS },
            clear: { userAgent: null, contexts: CONTEXTS }
        },
        {
            scope: 'colorScheme' as const,
            invalid: 123,
            invalidMessage: /Expected "colorScheme" emulation options to be either "light" or "dark"/,
            value: 'light' as const,
            method: 'emulationSetMediaFeaturesOverride' as const,
            params: { features: { 'prefers-color-scheme': 'light' }, contexts: CONTEXTS },
            clear: { features: null, contexts: CONTEXTS }
        },
        {
            scope: 'media' as const,
            invalid: 'reduce',
            invalidMessage: /object of media features/,
            value: { prefersReducedMotion: 'reduce' as const, hover: 'none' as const },
            method: 'emulationSetMediaFeaturesOverride' as const,
            params: { features: { 'prefers-reduced-motion': 'reduce', hover: 'none' }, contexts: CONTEXTS },
            clear: { features: null, contexts: CONTEXTS }
        },
        {
            scope: 'onLine' as const,
            invalid: 123,
            invalidMessage: /Expected "onLine" emulation options to be a boolean/,
            value: false,
            method: 'emulationSetNetworkConditions' as const,
            params: { networkConditions: { type: 'offline' }, contexts: CONTEXTS },
            clear: { networkConditions: null, contexts: CONTEXTS }
        },
        {
            scope: 'locale' as const,
            invalid: '',
            invalidMessage: /non-empty string/,
            value: 'fr-FR',
            method: 'emulationSetLocaleOverride' as const,
            params: { locale: 'fr-FR', contexts: CONTEXTS },
            clear: { locale: null, contexts: CONTEXTS }
        },
        {
            scope: 'timezone' as const,
            invalid: '',
            invalidMessage: /non-empty string/,
            value: 'Pacific/Honolulu',
            method: 'emulationSetTimezoneOverride' as const,
            params: { timezone: 'Pacific/Honolulu', contexts: CONTEXTS },
            clear: { timezone: null, contexts: CONTEXTS }
        },
        {
            scope: 'touch' as const,
            invalid: 0,
            invalidMessage: /integer >= 1/,
            value: 2,
            method: 'emulationSetTouchOverride' as const,
            params: { maxTouchPoints: 2, contexts: CONTEXTS },
            clear: { maxTouchPoints: null, contexts: CONTEXTS }
        },
        {
            scope: 'orientation' as const,
            invalid: { natural: 'portrait', type: 'sideways' },
            invalidMessage: /orientation/,
            value: { natural: 'portrait' as const, type: 'portrait-primary' as const },
            method: 'emulationSetScreenOrientationOverride' as const,
            params: {
                screenOrientation: { natural: 'portrait', type: 'portrait-primary' },
                contexts: CONTEXTS
            },
            clear: { screenOrientation: null, contexts: CONTEXTS }
        },
        {
            scope: 'screen' as const,
            invalid: { width: -1, height: 10 },
            invalidMessage: /width/,
            value: { width: 800, height: 600 },
            method: 'emulationSetScreenSettingsOverride' as const,
            params: { screenArea: { width: 800, height: 600 }, contexts: CONTEXTS },
            clear: { screenArea: null, contexts: CONTEXTS }
        },
        {
            scope: 'viewportMeta' as const,
            invalid: false,
            invalidMessage: /true/,
            value: true as const,
            method: 'emulationSetViewportMetaOverride' as const,
            params: { viewportMeta: true, contexts: CONTEXTS },
            clear: { viewportMeta: null, contexts: CONTEXTS }
        },
        {
            scope: 'textLayout' as const,
            invalid: 'desktop',
            invalidMessage: /mobile/,
            value: 'mobile' as const,
            method: 'emulationSetTextLayoutModeOverride' as const,
            params: { textLayoutMode: 'mobile', contexts: CONTEXTS },
            clear: { textLayoutMode: null, contexts: CONTEXTS }
        },
        {
            scope: 'scripting' as const,
            invalid: true,
            invalidMessage: /false/,
            value: false as const,
            method: 'emulationSetScriptingEnabled' as const,
            params: { enabled: false, contexts: CONTEXTS },
            clear: { enabled: null, contexts: CONTEXTS }
        },
        {
            scope: 'scrollbar' as const,
            invalid: 'hidden',
            invalidMessage: /classic/,
            value: 'overlay' as const,
            method: 'emulationSetScrollbarTypeOverride' as const,
            params: { scrollbarType: 'overlay', contexts: CONTEXTS },
            clear: { scrollbarType: null, contexts: CONTEXTS }
        },
        {
            scope: 'forcedColors' as const,
            invalid: 'active',
            invalidMessage: /light/,
            value: 'dark' as const,
            method: 'emulationSetForcedColorsModeThemeOverride' as const,
            params: { theme: 'dark', contexts: CONTEXTS },
            clear: { theme: null, contexts: CONTEXTS }
        }
    ])('should emulate $scope and clear it', async ({ scope, invalid, invalidMessage, value, method, params, clear }) => {
        const fakeScope = bidiBrowser()
        const call = fakeScope.emulate as (scope: string, value: unknown) => Promise<() => Promise<unknown>>
        await expect(() => call(scope, invalid)).rejects.toThrow(invalidMessage)

        const restore = await call(scope, value)
        expect(fakeScope[method]).toBeCalledWith(params)
        expect(restore).toBeInstanceOf(Function)

        await restore()
        expect(fakeScope[method]).toBeCalledWith(clear)
    })

    it('should clear the network override when coming back online', async () => {
        const fakeScope = bidiBrowser()
        const restore = await fakeScope.emulate('onLine', true)
        expect(fakeScope.emulationSetNetworkConditions).toBeCalledWith({
            networkConditions: null,
            contexts: CONTEXTS
        })
        await restore()
        expect(fakeScope.emulationSetNetworkConditions).toBeCalledTimes(2)
    })

    it('should allow to emulate the clock', async () => {
        const now = new Date(2021, 3, 14)
        const fakeScope = bidiBrowser()

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

    it('should emulate a mobile device from its descriptor', async () => {
        const fakeScope = bidiBrowser()
        // @ts-expect-error invalid argument
        await expect(() => fakeScope.emulate('device', 123)).rejects.toThrow(/Expected "device" emulation options to be a string/)
        await expect(() => fakeScope.emulate('device', 'not a phone' as 'iPhone 8')).rejects.toThrow(/Unknown device name/)

        const restore = await fakeScope.emulate('device', 'iPhone 8')
        expect(fakeScope.emulationSetUserAgentOverride).toBeCalledWith({
            userAgent: expect.stringContaining('iPhone'),
            contexts: CONTEXTS
        })
        expect(fakeScope.browsingContextSetViewport).toBeCalledWith({
            context: 'ctx-1',
            viewport: { width: 375, height: 667 },
            devicePixelRatio: 2
        })
        expect(fakeScope.emulationSetTouchOverride).toBeCalledWith({ maxTouchPoints: 1, contexts: CONTEXTS })
        expect(fakeScope.emulationSetTextLayoutModeOverride).toBeCalledWith({ textLayoutMode: 'mobile', contexts: CONTEXTS })
        expect(fakeScope.emulationSetViewportMetaOverride).toBeCalledWith({ viewportMeta: true, contexts: CONTEXTS })
        expect(fakeScope.emulationSetScreenSettingsOverride).not.toBeCalled()
        expect(fakeScope.emulationSetScreenOrientationOverride).not.toBeCalled()

        await restore()
        expect(fakeScope.emulationSetUserAgentOverride).toBeCalledWith({ userAgent: null, contexts: CONTEXTS })
        expect(fakeScope.browsingContextSetViewport).toBeCalledWith({
            context: 'ctx-1',
            viewport: { width: 1280, height: 720 },
            devicePixelRatio: 1
        })
        expect(fakeScope.emulationSetTouchOverride).toBeCalledWith({ maxTouchPoints: null, contexts: CONTEXTS })
        expect(fakeScope.emulationSetTextLayoutModeOverride).toBeCalledWith({ textLayoutMode: null, contexts: CONTEXTS })
        expect(fakeScope.emulationSetViewportMetaOverride).toBeCalledWith({ viewportMeta: null, contexts: CONTEXTS })
    })

    it('should put back the previous viewport and user agent when device emulation is rejected', async () => {
        const fakeScope = bidiBrowser()
        await setViewport.call(fakeScope, { width: 1000, height: 800, devicePixelRatio: 1.5 })
        await fakeScope.emulate('userAgent', 'Previous-UA')
        await fakeScope.emulate('touch', 4)
        fakeScope.emulationSetViewportMetaOverride = vi.fn().mockRejectedValue(new Error('unknown command'))

        await expect(fakeScope.emulate('device', 'iPhone 8')).rejects.toThrow(/unknown command/)
        expect(fakeScope.emulationSetUserAgentOverride).toHaveBeenLastCalledWith({
            userAgent: 'Previous-UA',
            contexts: CONTEXTS
        })
        expect(fakeScope.browsingContextSetViewport).toHaveBeenLastCalledWith({
            context: 'ctx-1',
            viewport: { width: 1000, height: 800 },
            devicePixelRatio: 1.5
        })
        expect(fakeScope.emulationSetTouchOverride).toHaveBeenLastCalledWith({ maxTouchPoints: 4, contexts: CONTEXTS })
        expect(fakeScope.emulationSetTextLayoutModeOverride).toHaveBeenLastCalledWith({ textLayoutMode: null, contexts: CONTEXTS })
        expect(fakeScope.emulationSetViewportMetaOverride).toHaveBeenCalledTimes(1)
    })

    it('should keep a newer override when an older restore runs', async () => {
        const fakeScope = bidiBrowser()
        const older = await fakeScope.emulate('userAgent', 'A')
        await fakeScope.emulate('userAgent', 'B')
        await older()
        expect(fakeScope.emulationSetUserAgentOverride).not.toHaveBeenCalledWith({ userAgent: null, contexts: CONTEXTS })

        const newer = await fakeScope.emulate('userAgent', 'C')
        await newer()
        expect(fakeScope.emulationSetUserAgentOverride).toHaveBeenCalledWith({ userAgent: null, contexts: CONTEXTS })
    })

    it('should clear touch and mobile layout for a desktop device', async () => {
        const fakeScope = bidiBrowser()
        await fakeScope.emulate('device', 'Desktop Chrome')
        expect(fakeScope.emulationSetTouchOverride).toBeCalledWith({ maxTouchPoints: null, contexts: CONTEXTS })
        expect(fakeScope.emulationSetTextLayoutModeOverride).toBeCalledWith({ textLayoutMode: null, contexts: CONTEXTS })
        expect(fakeScope.emulationSetViewportMetaOverride).toBeCalledWith({ viewportMeta: null, contexts: CONTEXTS })
    })

    it('should reject an unknown scope', async () => {
        const fakeScope = bidiBrowser()
        // @ts-expect-error invalid scope
        await expect(() => fakeScope.emulate('nope')).rejects.toThrow(/Invalid scope "nope"/)
    })
})
