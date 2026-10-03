import logger from '@wdio/logger'
import type { FakeTimerInstallOpts, InstalledClock, install } from '@sinonjs/fake-timers'
import { isBrowsingContext } from './session/browsingContext.js'

const log = logger('webdriverio:ClockManager')

declare global {
    interface Window {
        __clock: InstalledClock
        __wdio_sinon: {
            install: typeof install
        }
    }
}

function installFakeTimers (options: FakeTimerInstallOpts) {
    window.__clock = window.__wdio_sinon.install(options)
}

function uninstallFakeTimers () {
    window.__clock.uninstall()
}

declare const WDIO_FAKER_SCRIPT: string
const fakerScript = WDIO_FAKER_SCRIPT

export class ClockManager {
    #browser: WebdriverIO.Browser
    /**
     * Where the clock runs: the session's current context, or a held tab
     * when `emulate('clock')` was called on one.
     */
    #scope: WebdriverIO.Browser | WebdriverIO.BrowsingContext
    #resetFn: (() => Promise<unknown>) = () => Promise.resolve()
    #isInstalled = false

    constructor(scope: WebdriverIO.Browser | WebdriverIO.BrowsingContext) {
        this.#scope = scope
        this.#browser = isBrowsingContext(scope) ? scope.browser : scope
    }

    #execute<Fn extends (...args: never[]) => unknown> (script: Fn, ...args: Parameters<Fn>) {
        return (this.#scope as WebdriverIO.Browser).execute(script as never, ...(args as never[]))
    }

    /**
     * Install fake timers on the browser. If you call the `emulate` command, WebdriverIO will automatically install
     * the fake timers for you. You can use this method to re-install the fake timers if you have called `restore`.
     *
     * @param options {FakeTimerInstallOpts} Options to pass to the fake clock
     * @returns {Promise<void>}
     */
    async install(options?: FakeTimerInstallOpts) {
        if (this.#isInstalled) {
            return log.warn('Fake timers are already installed')
        }

        /**
         * skip if we are not running in a Node.js environment
         */
        if (globalThis.window) {
            return
        }

        /**
         * load Node.js specific modules dynamically to avoid loading them in the browser
         */
        const emulateOptions = options || {} as FakeTimerInstallOpts
        const functionDeclaration = fakerScript
        const installOptions: FakeTimerInstallOpts = {
            ...emulateOptions,
            now: emulateOptions.now && (emulateOptions.now instanceof Date) ? emulateOptions.now.getTime() : emulateOptions.now
        }

        const [, libScript, restoreInstallScript] = await Promise.all([
            /**
             * install fake timers for current ex
             */
            (isBrowsingContext(this.#scope)
                ? this.#scope.execute(`return (${functionDeclaration}).apply(null, arguments)`)
                : this.#browser.executeScript(`return (${functionDeclaration}).apply(null, arguments)`, [])
            ).then(() => (
                this.#execute(installFakeTimers, installOptions)
            )),
            /**
             * add preload script to to emulate clock for upcoming page loads
             */
            this.#browser.scriptAddPreloadScript({
                functionDeclaration,
                ...(isBrowsingContext(this.#scope) ? { contexts: [this.#scope.contextId] } : {})
            }),
            this.#scope.addInitScript(installFakeTimers, installOptions)
        ])
        this.#resetFn = async () => Promise.all([
            this.#browser.scriptRemovePreloadScript({ script: libScript.script }),
            this.#execute(uninstallFakeTimers),
            restoreInstallScript
        ])
        this.#isInstalled = true
    }

    /**
     * Restore all overridden native functions. This is automatically called between tests, so should not
     * generally be needed.
     *
     * ```ts
     * it('should restore the clock', async () => {
     *   console.log(new Date()) // returns e.g. 1722560447102
     *
     *   const clock = await browser.emulate('clock', { now: new Date(2021, 3, 14) })
     *   console.log(await browser.execute(() => new Date().getTime())) // returns 1618383600000
     *
     *   await clock.restore()
     *   console.log(await browser.execute(() => new Date().getTime())) // returns 1722560447102
     * })
     * ```
     *
     * @returns {Promise<void>}
     */
    async restore() {
        await this.#resetFn()
        this.#isInstalled = false
    }

    /**
     * Move the clock the specified number of `milliseconds`. Any timers within the affected range of time will be called.
     * @param ms {number} The number of milliseconds to move the clock.
     *
     * ```ts
     * it('should move the clock', async () => {
     *   console.log(new Date()) // returns e.g. 1722560447102
     *
     *   const clock = await browser.emulate('clock', { now: new Date(2021, 3, 14) })
     *   console.log(await browser.execute(() => new Date().getTime())) // returns 1618383600000
     *
     *   await clock.tick(1000)
     *   console.log(await browser.execute(() => new Date().getTime())) // returns 1618383601000
     * })
     * ```
     *
     * @param    {number}  ms  The number of milliseconds to move the clock.
     * @returns  {Promise<void>}
     */
    async tick(ms: number) {
        await this.#execute((ms: number) => window.__clock.tick(ms), ms)
    }

    /**
     * Change the system time to the new now. Now can be a timestamp, date object, or not passed in which defaults
     * to 0. No timers will be called, nor will the time left before they trigger change.
     *
     * ```ts
     * it('should set the system time', async () => {
     *   const clock = await browser.emulate('clock', { now: new Date(2021, 3, 14) })
     *   console.log(await browser.execute(() => new Date().getTime())) // returns 1618383600000
     *
     *   await clock.setSystemTime(new Date(2011, 3, 15))
     *   console.log(await browser.execute(() => new Date().getTime())) // returns 1302850800000
     * })
     * ```
     *
     * @param date {Date|number} The new date to set the system time to.
     * @returns    {Promise<void>}
     */
    async setSystemTime(date: number | Date) {
        const serializableSystemTime = date instanceof Date ? date.getTime() : date
        await this.#execute((date: number | Date) => window.__clock.setSystemTime(date), serializableSystemTime)
    }
}
