import type { FakeTimerInstallOpts } from '@sinonjs/fake-timers'

import { ClockManager } from '../../clock.js'
import { deviceDescriptorsSource, type DeviceName } from '../../deviceDescriptorsSource.js'
import { isBrowsingContext } from '../../utils/index.js'
import { restoreFunctions } from '../../constants.js'
import type { SupportedScopes } from '../../types.js'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type RestoreFunction = () => Promise<any>
type ColorScheme = 'light' | 'dark'

interface EmulationOptions {
    geolocation: Partial<GeolocationCoordinates>
    userAgent: string
    colorScheme: ColorScheme
    onLine: boolean
    device: DeviceName
    clock?: FakeTimerInstallOpts
}

function storeRestoreFunction (browser: WebdriverIO.Browser | WebdriverIO.BrowsingContext, scope: SupportedScopes, fn: RestoreFunction) {
    const key = 'contextId' in browser ? browser.contextId : browser.sessionId
    if (!restoreFunctions.has(key)) {
        restoreFunctions.set(key, new Map())
    }

    const restoreFunctionsList = restoreFunctions.get(key)?.get(scope)
    const updatedList = restoreFunctionsList ? [...restoreFunctionsList, fn] : [fn]
    restoreFunctions.get(key)?.set(scope, updatedList)
}

export async function emulate(scope: 'clock', options?: FakeTimerInstallOpts): Promise<ClockManager>
export async function emulate(scope: 'geolocation', geolocation: Partial<GeolocationCoordinates>): Promise<RestoreFunction>
export async function emulate(scope: 'userAgent', userAgent: string): Promise<RestoreFunction>
export async function emulate(scope: 'device', userAgent: DeviceName): Promise<RestoreFunction>
export async function emulate(scope: 'colorScheme', colorScheme: ColorScheme): Promise<RestoreFunction>
export async function emulate(scope: 'onLine', state: boolean): Promise<RestoreFunction>

/**
 * WebdriverIO allows you to emulate Web APIs using the `emulate` command. These Web APIs can then
 * behave exactly as you specify it. The following scopes are supported:
 *
 * - `geolocation`: Emulate the geolocation API
 * - `userAgent`: Emulate the user agent
 * - `colorScheme`: Emulate the color scheme
 * - `onLine`: Emulate the online status
 * - `device`: Emulate a specific mobile or desktop device
 * - `clock`: Emulate the system clock
 *
 * The `emulate` command returns a function that can be called to reset the emulation. This is useful
 * when you want to reset the emulation after a test or a suite of tests.
 *
 * Read more on this in the [Emulation](/docs/emulation) guidelines.
 *
 * :::info
 *
 * Except for the `clock` scope it is not possible to change the emulated value without reloading the page.
 *
 * :::
 *
 * :::info
 *
 * This feature requires WebDriver Bidi support for the browser. While recent versions of Chrome, Edge
 * and Firefox have such support, Safari __does not__. For updates follow [wpt.fyi](https://wpt.fyi/results/webdriver/tests/bidi/script/add_preload_script/add_preload_script.py?label=experimental&label=master&aligned).
 * Furthermore if you use a cloud vendor for spawning browsers, make sure your vendor also supports WebDriver Bidi.
 *
 * :::
 *
 * The `EmulationOptions` object can have the following properties based on the scope:
 *
 * | Scope         | Options                                          |
 * |---------------|--------------------------------------------------|
 * | `geolocation` | `{ latitude: number, longitude: number }`        |
 * | `userAgent`   | `string`                                         |
 * | `colorScheme` | `'light' \| 'dark'`                              |
 * | `onLine`      | `boolean`                                        |
 * | `clock`       | `FakeTimerInstallOpts`                           |
 *
 * @param {string} scope feature of the browser you like to emulate, can be either `clock`, `geolocation`, `userAgent`, `colorScheme` or `onLine`
 * @param {EmulationOptions} options emulation option for specific scope
 * @example https://github.com/webdriverio/example-recipes/blob/9bff2baf8a0678c6886f8591d9fc8dea201895d3/emulate/example.js#L4-L18
 * @example https://github.com/webdriverio/example-recipes/blob/9bff2baf8a0678c6886f8591d9fc8dea201895d3/emulate/example.js#L20-L36
 * @returns {Function}  a function to reset the emulation
 */
export async function emulate<Scope extends SupportedScopes> (
    this: WebdriverIO.Browser | WebdriverIO.BrowsingContext,
    scope: Scope,
    options: EmulationOptions[Scope]
) {
    const isBrowser = !isBrowsingContext(this)
    const browser = isBrowser ? this : this.browser
    const page = this as WebdriverIO.BrowsingContext

    if (!browser.isBidi) {
        throw new Error('emulate command is only supported for Bidi')
    }

    if (scope === 'geolocation') {
        if (!options) {
            throw new Error('Missing geolocation emulation options')
        }

        const patchedFn = options instanceof Error
            ? `cbError(new Error(${JSON.stringify(options.message)}))`
            : `cbSuccess({
                coords: ${JSON.stringify(options)},
                timestamp: Date.now()
            })`
        const res = await browser.scriptAddPreloadScript({
            contexts: isBrowser ? [] : [page.contextId],
            functionDeclaration: /*js*/`() => {
                Object.defineProperty(navigator.geolocation, 'getCurrentPosition', {
                    value: (cbSuccess, cbError) => ${patchedFn}
                })
            }`
        })
        const resetFn = async () => browser.scriptRemovePreloadScript({ script: res.script })
        storeRestoreFunction(this, 'geolocation', resetFn)
        return resetFn
    }

    if (scope === 'userAgent') {
        if (typeof options !== 'string') {
            throw new Error(`Expected userAgent emulation options to be a string, received ${typeof options}`)
        }

        const res = await browser.scriptAddPreloadScript({
            contexts: isBrowser ? [] : [page.contextId],
            functionDeclaration: /*js*/`() => {
                Object.defineProperty(navigator, 'userAgent', {
                    value: ${JSON.stringify(options)}
                })
            }`
        })
        const resetFn = async () => {
            return browser.scriptRemovePreloadScript({ script: res.script })
        }
        storeRestoreFunction(this, 'userAgent', resetFn)
        return resetFn
    }

    if (scope === 'clock') {
        const clock = new ClockManager(this)
        await clock.install(options as FakeTimerInstallOpts)
        storeRestoreFunction(this, 'clock', clock.restore.bind(clock))
        return clock
    }

    if (scope === 'colorScheme') {
        if (options !== 'light' && options !== 'dark') {
            throw new Error(`Expected "colorScheme" emulation options to be either "light" or "dark", received "${options}"`)
        }

        const res = await browser.scriptAddPreloadScript({
            contexts: isBrowser ? [] : [page.contextId],
            functionDeclaration: /*js*/`() => {
                const originalMatchMedia = window.matchMedia
                Object.defineProperty(window, 'matchMedia', {
                    value: (query) => {
                        const colorSchemeQuery = query.match(/\\(prefers-color-scheme:(\\s)*(dark|light)\\)/i)
                        if (colorSchemeQuery) {
                            const result = originalMatchMedia(query)
                            Object.defineProperty(result, 'matches', {
                                value: colorSchemeQuery[2] === "${options}",
                                configurable: true
                            })
                            return result
                        }

                        return originalMatchMedia(query)
                    },
                    configurable: true
                })
            }`
        })
        const resetFn = async () => browser.scriptRemovePreloadScript({ script: res.script })
        storeRestoreFunction(this, 'colorScheme', resetFn)
        return resetFn
    }

    if (scope === 'onLine') {
        if (typeof options !== 'boolean') {
            throw new Error(`Expected "onLine" emulation options to be a boolean, received "${typeof options}"`)
        }

        const res = await browser.scriptAddPreloadScript({
            contexts: isBrowser ? [] : [page.contextId],
            functionDeclaration: /*js*/`() => {
                Object.defineProperty(navigator, 'onLine', {
                    value: ${options}
                })
            }`
        })
        const resetFn = async () => browser.scriptRemovePreloadScript({ script: res.script })
        storeRestoreFunction(this, 'onLine', resetFn)
        return resetFn
    }

    if (scope === 'device') {
        if (typeof options !== 'string') {
            throw new Error(`Expected "device" emulation options to be a string, received "${typeof options}"`)
        }

        const device = deviceDescriptorsSource[options as DeviceName]
        if (!device) {
            throw new Error(`Unknown device name "${options}", please use one of the following: ${Object.keys(deviceDescriptorsSource).join(', ')}`)
        }

        const [restoreUserAgent] = await Promise.all([
            this.emulate('userAgent', device.userAgent),
            isBrowser
                ? browser.setViewport({
                    ...device.viewport,
                    devicePixelRatio: device.deviceScaleFactor
                })
                : page.setViewport({
                    ...device.viewport,
                    devicePixelRatio: device.deviceScaleFactor
                })
        ])

        const desktopViewport = deviceDescriptorsSource['Desktop Chrome']
        const restoreFn = async () => Promise.all([
            restoreUserAgent(),
            isBrowser
                ? browser.setViewport({
                    ...desktopViewport.viewport,
                    devicePixelRatio: desktopViewport.deviceScaleFactor
                })
                : page.setViewport({
                    ...desktopViewport.viewport,
                    devicePixelRatio: desktopViewport.deviceScaleFactor
                })
        ])

        return restoreFn
    }

    throw new Error(`Invalid scope "${scope}", expected one of "geolocation", "userAgent", "colorScheme", "onLine", "device" or "clock"`)
}
