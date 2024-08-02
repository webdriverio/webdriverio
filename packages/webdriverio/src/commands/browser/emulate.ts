import type { FakeTimerInstallOpts } from '@sinonjs/fake-timers'

import { type SupportedScopes, restoreFunctions, ClockManager } from '../../clock.js'

type RestoreFunction = () => Promise<any>
type ColorScheme = 'light' | 'dark'

interface EmulationOptions {
    geolocation: Partial<GeolocationCoordinates>
    userAgent: string
    colorScheme: ColorScheme
    onLine: boolean
    clock?: FakeTimerInstallOpts
}

function storeRestoreFunction (browser: WebdriverIO.Browser, scope: SupportedScopes, fn: RestoreFunction) {
    if (!restoreFunctions.has(browser)) {
        restoreFunctions.set(browser, new Map())
    }

    const restoreFunctionsList = restoreFunctions.get(browser)?.get(scope)
    const updatedList = restoreFunctionsList ? [...restoreFunctionsList, fn] : [fn]
    restoreFunctions.get(browser)?.set(scope, updatedList)
}

export async function emulate(scope: 'clock', options?: FakeTimerInstallOpts): Promise<ClockManager>
export async function emulate(scope: 'geolocation', geolocation: Partial<GeolocationCoordinates>): Promise<RestoreFunction>
export async function emulate(scope: 'userAgent', userAgent: string): Promise<RestoreFunction>
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
 * Based on the scope you can pass different options:
 *
 * | Scope         | Options                                          |
 * |---------------|--------------------------------------------------|
 * | `geolocation` | `{ latitude: number, longitude: number }`        |
 * | `userAgent`   | `string`                                         |
 * | `colorScheme` | `'light' | 'dark'`                                 |
 * | `onLine`      | `boolean`                                        |
 * | `clock`       | `FakeTimerInstallOpts` |
 *
 * The `FakeTimerInstallOpts` object can have the following properties:
 *
 * ```ts
 * interface FakeTimerInstallOpts {
 *    // Installs fake timers with the specified unix epoch
 *    // @default: 0
 *    now?: number | Date | undefined;

 *    // An array with names of global methods and APIs to fake. By default, WebdriverIO
 *    // does not replace `nextTick()` and `queueMicrotask()`. For instance,
 *    // `browser.emulate('clock', { toFake: ['setTimeout', 'nextTick'] })` will fake only
 *    // `setTimeout()` and `nextTick()`
 *    toFake?: FakeMethod[] | undefined;

 *    // The maximum number of timers that will be run when calling runAll() (default: 1000)
 *    loopLimit?: number | undefined;

 *    // Tells WebdriverIO to increment mocked time automatically based on the real system
 *    // time shift (e.g. the mocked time will be incremented by 20ms for every 20ms change
 *    // in the real system time)
 *    // @default false
 *    shouldAdvanceTime?: boolean | undefined;

 *    // Relevant only when using with shouldAdvanceTime: true. increment mocked time by
 *    // advanceTimeDelta ms every advanceTimeDelta ms change in the real system time
 *    // @default: 20
 *    advanceTimeDelta?: number | undefined;

 *    // Tells FakeTimers to clear 'native' (i.e. not fake) timers by delegating to their
 *    // respective handlers. These are not cleared by default, leading to potentially
 *    // unexpected behavior if timers existed prior to installing FakeTimers.
 *    // @default: false
 *    shouldClearNativeTimers?: boolean | undefined;
 * }
 * ```
 *
 * @param {string} scope feature of the browser you like to emulate, can be either `clock`, `geolocation`, `userAgent`, `colorScheme` or `onLine`
 * @param {EmulationOptions} options emulation option for specific scope
 * @example https://github.com/webdriverio/example-recipes/blob/9bff2baf8a0678c6886f8591d9fc8dea201895d3/emulate/example.js#L4-L18
 * @example https://github.com/webdriverio/example-recipes/blob/9bff2baf8a0678c6886f8591d9fc8dea201895d3/emulate/example.js#L20-L36
 * @returns {Function}  a function to reset the emulation
 */
export async function emulate<Scope extends SupportedScopes> (
    this: WebdriverIO.Browser,
    scope: Scope,
    options: EmulationOptions[Scope]
) {
    if (!this.isBidi) {
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
        const res = await this.scriptAddPreloadScript({
            functionDeclaration: /*js*/`() => {
                Object.defineProperty(navigator.geolocation, 'getCurrentPosition', {
                    value: (cbSuccess, cbError) => ${patchedFn}
                })
            }`
        })
        const resetFn = async () => this.scriptRemovePreloadScript({ script: res.script })
        storeRestoreFunction(this, 'geolocation', resetFn)
        return resetFn
    }

    if (scope === 'userAgent') {
        if (typeof options !== 'string') {
            throw new Error(`Expected userAgent emulation options to be a string, received ${typeof options}`)
        }

        const res = await this.scriptAddPreloadScript({
            functionDeclaration: /*js*/`() => {
                Object.defineProperty(navigator, 'userAgent', {
                    value: ${JSON.stringify(options)}
                })
            }`
        })
        const resetFn = async () => {
            return this.scriptRemovePreloadScript({ script: res.script })
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

        const res = await this.scriptAddPreloadScript({
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
        const resetFn = async () => this.scriptRemovePreloadScript({ script: res.script })
        storeRestoreFunction(this, 'colorScheme', resetFn)
        return resetFn
    }

    if (scope === 'onLine') {
        if (typeof options !== 'boolean') {
            throw new Error(`Expected "onLine" emulation options to be a boolean, received "${typeof options}"`)
        }

        const res = await this.scriptAddPreloadScript({
            functionDeclaration: /*js*/`() => {
                Object.defineProperty(navigator, 'onLine', {
                    value: ${options}
                })
            }`
        })
        const resetFn = async () => this.scriptRemovePreloadScript({ script: res.script })
        storeRestoreFunction(this, 'onLine', resetFn)
        return resetFn
    }

    throw new Error(`Invalid scope "${scope}", expected one of "geolocation", "userAgent", "colorScheme", "onLine" or "clock"`)
}
