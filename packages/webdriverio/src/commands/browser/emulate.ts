import url from 'node:url'
import path from 'node:path'
import fs from 'node:fs/promises'
import type { FakeTimerInstallOpts, InstalledClock, install } from '@sinonjs/fake-timers'

import { type SupportedScopes, restoreFunctions } from '../constant.js'

const __dirname = path.dirname(url.fileURLToPath(import.meta.url))
const rootDir = path.resolve(__dirname, '..', '..', '..')

declare global {
    interface Window {
        __clock: InstalledClock
        __wdio_sinon: {
            install: typeof install
        }
    }
}

interface EmulationOptions {
    geolocation: Partial<GeolocationCoordinates>
    userAgent: string
    colorScheme: 'light' | 'dark'
    onLine: boolean
    clock?: FakeTimerInstallOpts
}

function installFakeTimers (options: FakeTimerInstallOpts) {
    window.__clock = window.__wdio_sinon.install(options)
}

function uninstallFakeTimers () {
    window.__clock.uninstall()
}

function storeRestoreFunction (browser: WebdriverIO.Browser, scope: SupportedScopes, fn: () => Promise<any>) {
    if (!restoreFunctions.has(browser)) {
        restoreFunctions.set(browser, new Map())
    }

    const restoreFunctionsList = restoreFunctions.get(browser)?.get(scope)
    const updatedList = restoreFunctionsList ? [...restoreFunctionsList, fn] : [fn]
    restoreFunctions.get(browser)?.set(scope, updatedList)
}

/**
 * WebdriverIO allows you to emulate Web APIs using the `emulate` command. These Web APIs can then
 * behave exactly as you specify it.
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
 * @param {string} scope feature of the browser you like to emulate, can be either `geolocation`, `userAgent`, `colorScheme` or `onLine`
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
        const emulateOptions = options as FakeTimerInstallOpts
        const scriptPath = path.join(rootDir, 'third_party', 'fake-timers.js')
        const functionDeclaration = await fs.readFile(scriptPath, 'utf-8')
        const installOptions: FakeTimerInstallOpts = {
            ...emulateOptions,
            now: emulateOptions.now && (emulateOptions.now instanceof Date) ? emulateOptions.now.getTime() : emulateOptions.now
        }

        const [, libScript, installScript] = await Promise.all([
            /**
             * install fake timers for current ex
             */
            this.execute(`return (${functionDeclaration}).apply(null, arguments)`, []).then(() => (
                this.execute(installFakeTimers, installOptions)
            )),
            /**
             * add preload script to to emulate clock for upcoming page loads
             */
            this.scriptAddPreloadScript({ functionDeclaration }),
            this.addInitScript(installFakeTimers, installOptions)
        ])
        const resetFn = async () => Promise.all([
            this.scriptRemovePreloadScript({ script: libScript.script }),
            this.execute(uninstallFakeTimers),
            installScript
        ])
        storeRestoreFunction(this, 'clock', resetFn)
        return resetFn
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
