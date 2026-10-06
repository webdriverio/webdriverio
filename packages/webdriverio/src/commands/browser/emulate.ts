import type { FakeTimerInstallOpts } from '@sinonjs/fake-timers'
import type { remote } from 'webdriver'

import { ClockManager } from '../../clock.js'
import { deviceDescriptorsSource, type DeviceName } from '../../deviceDescriptorsSource.js'
import { restoreFunctions } from '../../constants.js'
import { getContextManager } from '../../session/context.js'
import { isBrowsingContext } from '../../session/browsingContext.js'
import { claimRestore, rememberOverride, rememberedOverride, type RememberedViewport } from '../../session/emulationState.js'
import type { SupportedScopes } from '../../types.js'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type RestoreFunction = () => Promise<any>
type ColorScheme = 'light' | 'dark'
type ScrollbarType = 'classic' | 'overlay'
type GeolocationEmulation = Partial<GeolocationCoordinates> | { error: 'positionUnavailable' }

interface EmulationOptions {
    geolocation: GeolocationEmulation
    userAgent: string
    colorScheme: ColorScheme
    media: remote.EmulationMediaFeatures
    onLine: boolean
    locale: string
    timezone: string
    touch: number
    orientation: remote.EmulationScreenOrientation
    screen: remote.EmulationScreenArea
    viewportMeta: true
    textLayout: remote.EmulationTextLayoutMode
    scripting: false
    scrollbar: ScrollbarType
    forcedColors: remote.EmulationForcedColorsModeTheme
    device: DeviceName
    clock?: FakeTimerInstallOpts
}

const SCOPES = [
    'geolocation', 'userAgent', 'colorScheme', 'media', 'onLine', 'locale', 'timezone',
    'touch', 'orientation', 'screen', 'viewportMeta', 'textLayout', 'scripting',
    'scrollbar', 'forcedColors', 'device', 'clock'
] as const

const ORIENTATION_NATURAL = ['portrait', 'landscape'] as const
const ORIENTATION_TYPES = ['portrait-primary', 'portrait-secondary', 'landscape-primary', 'landscape-secondary'] as const

function storeRestoreFunction (browser: WebdriverIO.Browser, scope: SupportedScopes, fn: RestoreFunction) {
    if (!restoreFunctions.has(browser)) {
        restoreFunctions.set(browser, new Map())
    }

    const restoreFunctionsList = restoreFunctions.get(browser)?.get(scope)
    const updatedList = restoreFunctionsList ? [...restoreFunctionsList, fn] : [fn]
    restoreFunctions.get(browser)?.set(scope, updatedList)
}

type EmulationTarget = WebdriverIO.Browser | WebdriverIO.BrowsingContext

function browserOf (target: EmulationTarget) {
    return isBrowsingContext(target) ? target.browser : target
}

/**
 * Emulation commands that take `contexts` require a top-level traversable.
 * A held top-level context is its own target. On the browser it is the
 * current top-level context, never a frame the user has switched into.
 */
async function topLevelContexts (target: EmulationTarget) {
    if (isBrowsingContext(target)) {
        return [target.contextId]
    }
    return [await getContextManager(target).getCurrentTopLevelContext()]
}

/**
 * Apply an override for the current top-level context and remember how to
 * clear that same context. A later `restore()` must not follow the user into
 * a different window. An older restore for the same scope and context does
 * not clear an override a newer call has replaced.
 */
async function install (
    target: EmulationTarget,
    scope: SupportedScopes,
    apply: (contexts: string[]) => Promise<unknown>,
    clear: (contexts: string[]) => Promise<unknown>,
    memory?: {
        apply: (context: string) => void
        clear: (context: string) => void
    }
) {
    const browser = browserOf(target)
    const contexts = await topLevelContexts(target)
    await apply(contexts)
    memory?.apply(contexts[0])
    const current = claimRestore(browser, scope, contexts)
    const restore = async () => {
        if (!current()) {
            return
        }
        await clear(contexts)
        memory?.clear(contexts[0])
    }
    storeRestoreFunction(browser, scope, restore)
    return restore
}

function isUnsupportedCommand (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    return message.includes('unknown command') || message.includes('unsupported operation')
}

function setCapturedViewport (
    browser: WebdriverIO.Browser,
    context: string,
    viewport: { width: number, height: number } | null,
    devicePixelRatio: number | null
) {
    return browser.browsingContextSetViewport({
        context,
        viewport,
        devicePixelRatio
    })
}

/**
 * `EmulationMediaFeatures` is generated in camelCase. The BiDi command's JSON
 * keys are the CSS media feature names, for example `prefers-color-scheme`.
 */
function toMediaFeatureWire (features: remote.EmulationMediaFeatures): remote.EmulationMediaFeatures {
    const wire: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(features)) {
        if (value === undefined) {
            continue
        }
        wire[key.replace(/[A-Z]/g, (char) => `-${char.toLowerCase()}`)] = value
    }
    return wire as remote.EmulationMediaFeatures
}

function geolocationCoordinates (options: Partial<GeolocationCoordinates>): remote.EmulationGeolocationCoordinates {
    if (typeof options.latitude !== 'number' || typeof options.longitude !== 'number') {
        throw new Error('Expected geolocation emulation options to include numeric "latitude" and "longitude"')
    }

    const coordinates: remote.EmulationGeolocationCoordinates = {
        latitude: options.latitude,
        longitude: options.longitude
    }
    if (typeof options.accuracy === 'number') {
        coordinates.accuracy = options.accuracy
    }
    if (options.altitude !== undefined) {
        coordinates.altitude = options.altitude
    }
    if (options.altitudeAccuracy !== undefined) {
        coordinates.altitudeAccuracy = options.altitudeAccuracy
    }
    if (options.heading !== undefined) {
        coordinates.heading = options.heading
    }
    if (options.speed !== undefined) {
        coordinates.speed = options.speed
    }
    return coordinates
}

function assertNonEmptyString (scope: string, options: unknown) {
    if (typeof options !== 'string' || options.length === 0) {
        throw new Error(`Expected "${scope}" emulation options to be a non-empty string, received ${typeof options === 'string' ? '""' : typeof options}`)
    }
    return options
}

function assertOrientation (options: unknown): remote.EmulationScreenOrientation {
    const value = options as { natural?: unknown, type?: unknown } | null
    const natural = value && typeof value === 'object' ? value.natural : undefined
    const type = value && typeof value === 'object' ? value.type : undefined
    if (
        !ORIENTATION_NATURAL.includes(natural as typeof ORIENTATION_NATURAL[number]) ||
        !ORIENTATION_TYPES.includes(type as typeof ORIENTATION_TYPES[number])
    ) {
        throw new Error('Expected "orientation" emulation options to be { natural: "portrait" | "landscape", type: "portrait-primary" | "portrait-secondary" | "landscape-primary" | "landscape-secondary" }')
    }
    return {
        natural: natural as remote.EmulationScreenOrientationNatural,
        type: type as remote.EmulationScreenOrientationType
    }
}

function assertScreen (options: unknown): remote.EmulationScreenArea {
    const value = options as { width?: unknown, height?: unknown } | null
    if (
        !value || typeof value !== 'object' ||
        !Number.isInteger(value.width) || !Number.isInteger(value.height) ||
        (value.width as number) < 0 || (value.height as number) < 0
    ) {
        throw new Error('Expected "screen" emulation options to be { width, height } with non-negative integers')
    }
    return { width: value.width as number, height: value.height as number }
}

function assertMedia (options: unknown): remote.EmulationMediaFeatures {
    if (!options || typeof options !== 'object' || Array.isArray(options)) {
        throw new Error('Expected "media" emulation options to be an object of media features')
    }
    const entries = Object.entries(options as Record<string, unknown>).filter(([, value]) => value !== undefined)
    if (entries.length === 0) {
        throw new Error('Expected "media" emulation options to include at least one media feature')
    }
    return Object.fromEntries(entries) as remote.EmulationMediaFeatures
}

/**
 * `device` composes the descriptor into the BiDi overrides a page actually
 * observes. Viewport is not `screen.width`, and the descriptor has no
 * orientation, so those stay on the `screen` and `orientation` scopes.
 */
async function emulateDevice (target: EmulationTarget, name: unknown) {
    const browser = browserOf(target)
    if (typeof name !== 'string') {
        throw new Error(`Expected "device" emulation options to be a string, received "${typeof name}"`)
    }

    const device = deviceDescriptorsSource[name as DeviceName]
    if (!device) {
        throw new Error(`Unknown device name "${name}", please use one of the following: ${Object.keys(deviceDescriptorsSource).join(', ')}`)
    }

    const contexts = await topLevelContexts(target)
    const context = contexts[0]
    const previous = rememberedOverride(browser, context)
    const desktop = deviceDescriptorsSource['Desktop Chrome']
    const deviceViewport: RememberedViewport = {
        width: device.viewport.width,
        height: device.viewport.height,
        devicePixelRatio: device.deviceScaleFactor
    }
    const deviceTouch = device.hasTouch ? 1 : null
    const deviceTextLayout = device.isMobile ? 'mobile' as const : null
    const deviceViewportMeta = device.isMobile ? true as const : null
    type Step = {
        apply: () => Promise<unknown>
        undo: () => Promise<unknown>
        clear: () => Promise<unknown>
        /**
         * `null` clears the override. Skip the call when there is nothing to
         * clear, so a desktop device does not need every command.
         */
        skip?: boolean
        /**
         * Newer BiDi commands that not every browser implements. If the
         * browser rejects one as unknown, the rest of the device still applies.
         */
        optional?: boolean
    }
    const steps: Step[] = [
        {
            apply: () => browser.emulationSetUserAgentOverride({ userAgent: device.userAgent, contexts }),
            undo: () => browser.emulationSetUserAgentOverride({
                userAgent: previous.userAgent === undefined ? null : previous.userAgent,
                contexts
            }),
            clear: () => browser.emulationSetUserAgentOverride({ userAgent: null, contexts })
        },
        {
            apply: () => setCapturedViewport(browser, context, {
                width: deviceViewport.width,
                height: deviceViewport.height
            }, deviceViewport.devicePixelRatio),
            undo: () => previous.viewport
                ? setCapturedViewport(browser, context, {
                    width: previous.viewport.width,
                    height: previous.viewport.height
                }, previous.viewport.devicePixelRatio)
                : setCapturedViewport(browser, context, null, null),
            clear: () => setCapturedViewport(browser, context, {
                width: desktop.viewport.width,
                height: desktop.viewport.height
            }, desktop.deviceScaleFactor)
        },
        {
            apply: () => browser.emulationSetTouchOverride({ maxTouchPoints: deviceTouch, contexts }),
            undo: () => browser.emulationSetTouchOverride({
                maxTouchPoints: previous.touch === undefined ? null : previous.touch,
                contexts
            }),
            clear: () => browser.emulationSetTouchOverride({ maxTouchPoints: null, contexts }),
            skip: deviceTouch === null && (previous.touch ?? null) === null
        },
        {
            apply: () => browser.emulationSetTextLayoutModeOverride({ textLayoutMode: deviceTextLayout, contexts }),
            undo: () => browser.emulationSetTextLayoutModeOverride({
                textLayoutMode: previous.textLayout === undefined ? null : previous.textLayout,
                contexts
            }),
            clear: () => browser.emulationSetTextLayoutModeOverride({ textLayoutMode: null, contexts }),
            skip: deviceTextLayout === null && (previous.textLayout ?? null) === null,
            optional: true
        },
        {
            apply: () => browser.emulationSetViewportMetaOverride({ viewportMeta: deviceViewportMeta, contexts }),
            undo: () => browser.emulationSetViewportMetaOverride({
                viewportMeta: previous.viewportMeta === undefined ? null : previous.viewportMeta,
                contexts
            }),
            clear: () => browser.emulationSetViewportMetaOverride({ viewportMeta: null, contexts }),
            skip: deviceViewportMeta === null && (previous.viewportMeta ?? null) === null,
            optional: true
        }
    ]

    /**
     * A browser can reject a required piece (`unknown command` or
     * `unsupported operation`). Put back the previous override for each piece
     * that already landed, on the context captured above, so a custom user
     * agent or viewport is not discarded and another window is not resized.
     */
    const applied: Step[] = []
    try {
        for (const step of steps) {
            if (step.skip) {
                continue
            }
            try {
                await step.apply()
            } catch (err) {
                if (step.optional && isUnsupportedCommand(err)) {
                    continue
                }
                throw err
            }
            applied.push(step)
        }
    } catch (err) {
        for (const step of [...applied].reverse()) {
            await Promise.resolve(step.undo()).catch(() => {})
        }
        throw err
    }

    const current = claimRestore(browser, 'device', contexts)
    const [, , , textLayoutStep, viewportMetaStep] = steps
    rememberOverride(browser, context, {
        userAgent: device.userAgent,
        touch: deviceTouch,
        textLayout: applied.includes(textLayoutStep) ? deviceTextLayout : previous.textLayout,
        viewportMeta: applied.includes(viewportMetaStep) ? deviceViewportMeta : previous.viewportMeta,
        viewport: deviceViewport
    })
    const restore = async () => {
        if (!current()) {
            return
        }
        for (const step of [...applied].reverse()) {
            await step.clear()
        }
        rememberOverride(browser, context, {
            userAgent: null,
            touch: null,
            textLayout: null,
            viewportMeta: null,
            viewport: {
                width: desktop.viewport.width,
                height: desktop.viewport.height,
                devicePixelRatio: desktop.deviceScaleFactor
            }
        })
    }
    storeRestoreFunction(browser, 'device', restore)
    return restore
}

export async function emulate(scope: 'clock', options?: FakeTimerInstallOpts): Promise<ClockManager>
export async function emulate(scope: 'geolocation', geolocation: GeolocationEmulation): Promise<RestoreFunction>
export async function emulate(scope: 'userAgent', userAgent: string): Promise<RestoreFunction>
export async function emulate(scope: 'device', device: DeviceName): Promise<RestoreFunction>
export async function emulate(scope: 'colorScheme', colorScheme: ColorScheme): Promise<RestoreFunction>
export async function emulate(scope: 'media', features: remote.EmulationMediaFeatures): Promise<RestoreFunction>
export async function emulate(scope: 'onLine', state: boolean): Promise<RestoreFunction>
export async function emulate(scope: 'locale', locale: string): Promise<RestoreFunction>
export async function emulate(scope: 'timezone', timezone: string): Promise<RestoreFunction>
export async function emulate(scope: 'touch', maxTouchPoints: number): Promise<RestoreFunction>
export async function emulate(scope: 'orientation', orientation: remote.EmulationScreenOrientation): Promise<RestoreFunction>
export async function emulate(scope: 'screen', screen: remote.EmulationScreenArea): Promise<RestoreFunction>
export async function emulate(scope: 'viewportMeta', viewportMeta: true): Promise<RestoreFunction>
export async function emulate(scope: 'textLayout', textLayout: 'mobile'): Promise<RestoreFunction>
export async function emulate(scope: 'scripting', enabled: false): Promise<RestoreFunction>
export async function emulate(scope: 'scrollbar', scrollbarType: ScrollbarType): Promise<RestoreFunction>
export async function emulate(scope: 'forcedColors', theme: ColorScheme): Promise<RestoreFunction>

/**
 * Emulate browser behavior with the WebDriver BiDi emulation module. The
 * returned function clears that scope. `browser.restore()` clears every scope
 * that is still active.
 *
 * The following scopes are supported:
 *
 * - `geolocation`: coordinates, or `{ error: 'positionUnavailable' }`
 * - `userAgent`: the browser user-agent override
 * - `colorScheme`: `prefers-color-scheme` (`'light'` or `'dark'`)
 * - `media`: any other [media features](https://w3c.github.io/webdriver-bidi/#type-emulation-MediaFeatures)
 * - `onLine`: `false` takes the browsing context offline
 * - `locale`: a BCP 47 locale
 * - `timezone`: an IANA time zone name or an offset
 * - `touch`: `maxTouchPoints`, an integer `>= 1`
 * - `orientation`: `{ natural, type }`
 * - `screen`: `{ width, height }` in CSS pixels
 * - `viewportMeta`: `true` to honor the viewport meta tag
 * - `textLayout`: `'mobile'`
 * - `scripting`: `false` to disable scripting
 * - `scrollbar`: `'classic'` or `'overlay'`
 * - `forcedColors`: the forced-colors theme, `'light'` or `'dark'`
 * - `device`: a known device name
 * - `clock`: fake timers
 *
 * Every BiDi scope is sent with `contexts` set to the current top-level
 * browsing context. The override applies without a reload. `clock` has no BiDi
 * command and still installs fake timers into the current page and later pages.
 *
 * `colorScheme` and `media` share one media-feature map. The command replaces
 * the whole map, so the later call wins, and restoring either scope clears it.
 * `forcedColors` is the theme override, not the `forced-colors` media feature.
 *
 * `device` sets the descriptor's user agent, viewport, and device scale factor
 * on the top-level context captured when the call starts. Touch is
 * `maxTouchPoints: 1` when the descriptor has touch, otherwise cleared. Mobile
 * text layout and the viewport meta tag are set when the descriptor is mobile,
 * otherwise cleared. An override is only cleared when one is active, so a
 * desktop device does not send commands it does not need. Screen size and
 * orientation are not inferred from the device name. Restoring the device
 * targets that same context.
 *
 * A browser that does not implement a command rejects the call with its own
 * error (`unknown command` or `unsupported operation`). WebdriverIO does not
 * fall back to a preload script or to CDP. For `device`, text layout and
 * viewport meta are best effort: a browser that does not implement those
 * commands still gets the user agent, viewport and touch. If `device` is
 * rejected part way through, the previous user agent, viewport, touch, text
 * layout and viewport meta are put back. Calling an older `restore()` does not
 * clear an override that a newer call of the same scope has replaced.
 *
 * :::info
 *
 * This feature requires WebDriver Bidi support for the browser. While recent versions of Chrome, Edge
 * and Firefox have such support, Safari __does not__. For updates follow [wpt.fyi](https://wpt.fyi/results/webdriver/tests/bidi/emulation?label=experimental&label=master&aligned).
 * Furthermore if you use a cloud vendor for spawning browsers, make sure your vendor also supports WebDriver Bidi.
 *
 * :::
 *
 * | Scope          | Options                                                                                                      |
 * |----------------|--------------------------------------------------------------------------------------------------------------|
 * | `geolocation`  | `{ latitude, longitude, accuracy?, altitude?, altitudeAccuracy?, heading?, speed? }` or `{ error: 'positionUnavailable' }` |
 * | `userAgent`    | `string`                                                                                                     |
 * | `colorScheme`  | `'light' \| 'dark'`                                                                                          |
 * | `media`        | `EmulationMediaFeatures`                                                                                     |
 * | `onLine`       | `boolean`                                                                                                    |
 * | `locale`       | `string`                                                                                                     |
 * | `timezone`     | `string`                                                                                                     |
 * | `touch`        | `number`                                                                                                     |
 * | `orientation`  | `{ natural: 'portrait' \| 'landscape', type: 'portrait-primary' \| 'portrait-secondary' \| 'landscape-primary' \| 'landscape-secondary' }` |
 * | `screen`       | `{ width: number, height: number }`                                                                          |
 * | `viewportMeta` | `true`                                                                                                       |
 * | `textLayout`   | `'mobile'`                                                                                                   |
 * | `scripting`    | `false`                                                                                                      |
 * | `scrollbar`    | `'classic' \| 'overlay'`                                                                                     |
 * | `forcedColors` | `'light' \| 'dark'`                                                                                          |
 * | `device`       | device name                                                                                                  |
 * | `clock`        | `FakeTimerInstallOpts`                                                                                       |
 *
 * @param {string} scope feature of the browser you like to emulate
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
    const target = this
    const browser = browserOf(target)
    if (!browser.isBidi) {
        throw new Error('emulate command is only supported for Bidi')
    }

    if (scope === 'geolocation') {
        if (!options || typeof options !== 'object') {
            throw new Error('Missing geolocation emulation options')
        }
        if ('error' in options) {
            if (options.error !== 'positionUnavailable') {
                throw new Error('Expected geolocation error to be "positionUnavailable"')
            }
            return install(
                target,
                'geolocation',
                (contexts) => browser.emulationSetGeolocationOverride({
                    error: { type: 'positionUnavailable' },
                    contexts
                }),
                (contexts) => browser.emulationSetGeolocationOverride({ coordinates: null, contexts })
            )
        }
        const coordinates = geolocationCoordinates(options as Partial<GeolocationCoordinates>)
        return install(
            target,
            'geolocation',
            (contexts) => browser.emulationSetGeolocationOverride({ coordinates, contexts }),
            (contexts) => browser.emulationSetGeolocationOverride({ coordinates: null, contexts })
        )
    }

    if (scope === 'userAgent') {
        if (typeof options !== 'string') {
            throw new Error(`Expected userAgent emulation options to be a string, received ${typeof options}`)
        }
        return install(
            target,
            'userAgent',
            (contexts) => browser.emulationSetUserAgentOverride({ userAgent: options, contexts }),
            (contexts) => browser.emulationSetUserAgentOverride({ userAgent: null, contexts }),
            {
                apply: (context) => rememberOverride(browser, context, { userAgent: options }),
                clear: (context) => rememberOverride(browser, context, { userAgent: null })
            }
        )
    }

    if (scope === 'clock') {
        const clock = new ClockManager(target)
        await clock.install(options as FakeTimerInstallOpts)
        storeRestoreFunction(browser, 'clock', clock.restore.bind(clock))
        return clock
    }

    if (scope === 'colorScheme') {
        if (options !== 'light' && options !== 'dark') {
            throw new Error(`Expected "colorScheme" emulation options to be either "light" or "dark", received "${options}"`)
        }
        const features = toMediaFeatureWire({ prefersColorScheme: options })
        return install(
            target,
            'colorScheme',
            (contexts) => browser.emulationSetMediaFeaturesOverride({ features, contexts }),
            (contexts) => browser.emulationSetMediaFeaturesOverride({ features: null, contexts })
        )
    }

    if (scope === 'media') {
        const features = toMediaFeatureWire(assertMedia(options))
        return install(
            target,
            'media',
            (contexts) => browser.emulationSetMediaFeaturesOverride({ features, contexts }),
            (contexts) => browser.emulationSetMediaFeaturesOverride({ features: null, contexts })
        )
    }

    if (scope === 'onLine') {
        if (typeof options !== 'boolean') {
            throw new Error(`Expected "onLine" emulation options to be a boolean, received "${typeof options}"`)
        }
        return install(
            target,
            'onLine',
            (contexts) => browser.emulationSetNetworkConditions({
                networkConditions: options ? null : { type: 'offline' },
                contexts
            }),
            (contexts) => browser.emulationSetNetworkConditions({ networkConditions: null, contexts })
        )
    }

    if (scope === 'locale') {
        const locale = assertNonEmptyString('locale', options)
        return install(
            target,
            'locale',
            (contexts) => browser.emulationSetLocaleOverride({ locale, contexts }),
            (contexts) => browser.emulationSetLocaleOverride({ locale: null, contexts })
        )
    }

    if (scope === 'timezone') {
        const timezone = assertNonEmptyString('timezone', options)
        return install(
            target,
            'timezone',
            (contexts) => browser.emulationSetTimezoneOverride({ timezone, contexts }),
            (contexts) => browser.emulationSetTimezoneOverride({ timezone: null, contexts })
        )
    }

    if (scope === 'touch') {
        if (typeof options !== 'number' || !Number.isInteger(options) || options < 1) {
            throw new Error(`Expected "touch" emulation options to be an integer >= 1, received "${options}"`)
        }
        return install(
            target,
            'touch',
            (contexts) => browser.emulationSetTouchOverride({ maxTouchPoints: options, contexts }),
            (contexts) => browser.emulationSetTouchOverride({ maxTouchPoints: null, contexts }),
            {
                apply: (context) => rememberOverride(browser, context, { touch: options }),
                clear: (context) => rememberOverride(browser, context, { touch: null })
            }
        )
    }

    if (scope === 'orientation') {
        const screenOrientation = assertOrientation(options)
        return install(
            target,
            'orientation',
            (contexts) => browser.emulationSetScreenOrientationOverride({ screenOrientation, contexts }),
            (contexts) => browser.emulationSetScreenOrientationOverride({ screenOrientation: null, contexts })
        )
    }

    if (scope === 'screen') {
        const screenArea = assertScreen(options)
        return install(
            target,
            'screen',
            (contexts) => browser.emulationSetScreenSettingsOverride({ screenArea, contexts }),
            (contexts) => browser.emulationSetScreenSettingsOverride({ screenArea: null, contexts })
        )
    }

    if (scope === 'viewportMeta') {
        if (options !== true) {
            throw new Error('Expected "viewportMeta" emulation options to be true')
        }
        return install(
            target,
            'viewportMeta',
            (contexts) => browser.emulationSetViewportMetaOverride({ viewportMeta: true, contexts }),
            (contexts) => browser.emulationSetViewportMetaOverride({ viewportMeta: null, contexts }),
            {
                apply: (context) => rememberOverride(browser, context, { viewportMeta: true }),
                clear: (context) => rememberOverride(browser, context, { viewportMeta: null })
            }
        )
    }

    if (scope === 'textLayout') {
        if (options !== 'mobile') {
            throw new Error('Expected "textLayout" emulation options to be "mobile"')
        }
        return install(
            target,
            'textLayout',
            (contexts) => browser.emulationSetTextLayoutModeOverride({ textLayoutMode: 'mobile', contexts }),
            (contexts) => browser.emulationSetTextLayoutModeOverride({ textLayoutMode: null, contexts }),
            {
                apply: (context) => rememberOverride(browser, context, { textLayout: 'mobile' }),
                clear: (context) => rememberOverride(browser, context, { textLayout: null })
            }
        )
    }

    if (scope === 'scripting') {
        if (options !== false) {
            throw new Error('Expected "scripting" emulation options to be false')
        }
        return install(
            target,
            'scripting',
            (contexts) => browser.emulationSetScriptingEnabled({ enabled: false, contexts }),
            (contexts) => browser.emulationSetScriptingEnabled({ enabled: null, contexts })
        )
    }

    if (scope === 'scrollbar') {
        if (options !== 'classic' && options !== 'overlay') {
            throw new Error(`Expected "scrollbar" emulation options to be "classic" or "overlay", received "${options}"`)
        }
        return install(
            target,
            'scrollbar',
            (contexts) => browser.emulationSetScrollbarTypeOverride({ scrollbarType: options, contexts }),
            (contexts) => browser.emulationSetScrollbarTypeOverride({ scrollbarType: null, contexts })
        )
    }

    if (scope === 'forcedColors') {
        if (options !== 'light' && options !== 'dark') {
            throw new Error(`Expected "forcedColors" emulation options to be "light" or "dark", received "${options}"`)
        }
        return install(
            target,
            'forcedColors',
            (contexts) => browser.emulationSetForcedColorsModeThemeOverride({ theme: options, contexts }),
            (contexts) => browser.emulationSetForcedColorsModeThemeOverride({ theme: null, contexts })
        )
    }

    if (scope === 'device') {
        return emulateDevice(target, options)
    }

    throw new Error(`Invalid scope "${scope}", expected one of ${SCOPES.map((name) => `"${name}"`).join(', ')}`)
}
