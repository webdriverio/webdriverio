/// <reference path="./@types/bstack-service-types.d.ts" />
import InsightsHandler from './insights-handler.js'
import { CustomTagAccumulator } from './customTags.js'
import type { CustomMetadata } from './customTags.js'
import { o11yClassErrorHandler } from './util.js'
import { BStackLogger } from './bstackLogger.js'

/**
 * Legacy/Listener-path handler for `browser.setCustomTags`.
 *
 * Registered from service.ts in the `!BrowserstackCLI.getInstance().isRunning()`
 * branch (alongside AccessibilityHandler.before() / InsightsHandler.before()).
 * Deliberately NOT folded into InsightsHandler.before() — that method registers
 * no browser methods and is SKIPPED when the CLI is running.
 *
 * Accumulates (key, value) pairs per active test, keyed on
 * InsightsHandler.currentTest.uuid (set in beforeTest / setTestData). The
 * accumulator is static so InsightsHandler.getRunData can drain it into the
 * TestData.custom_metadata field at TestRunFinished (flushed in afterTest).
 */
class _CustomTagsHandler {
    // Static so the flush sink (InsightsHandler.getRunData) can read it without a
    // handler reference. Keyed on the per-test uuid.
    public static accumulator: CustomTagAccumulator = new CustomTagAccumulator()

    constructor(
        private _browser: WebdriverIO.Browser | WebdriverIO.MultiRemoteBrowser,
        private _caps: WebdriverIO.Capabilities | Record<string, unknown>,
        private _framework?: string
    ) {}

    before() {
        const register = (browser: WebdriverIO.Browser | WebdriverIO.MultiRemoteBrowser) => {
            (browser as WebdriverIO.Browser).setCustomTags = async (key: string, value: string): Promise<void> => {
                try {
                    if (this._framework !== 'mocha') {
                        BStackLogger.warn('setCustomTags is only supported for the mocha framework; ignoring call')
                        return
                    }
                    if (!key || !value) {
                        BStackLogger.warn('setCustomTags: key and value are required; ignoring call')
                        return
                    }
                    const testUuid = InsightsHandler.currentTest.uuid
                    if (!testUuid) {
                        BStackLogger.warn('setCustomTags called outside of a resolvable test context; ignoring')
                        return
                    }
                    const added = _CustomTagsHandler.accumulator.add(testUuid, key, value)
                    if (!added) {
                        BStackLogger.warn(`setCustomTags: no usable values parsed from "${value}"; ignoring call`)
                        return
                    }
                    BStackLogger.debug(`setCustomTags: recorded key=${key} value="${value}" for test=${testUuid}`)
                } catch (error) {
                    BStackLogger.warn(`setCustomTags: error while recording custom tags: ${error}`)
                }
            }
        }

        // Fan out to every MultiRemote instance (mirror service._executeCommand),
        // plus the top-level browser object the user calls directly.
        register(this._browser)
        if ((this._browser as WebdriverIO.Browser).isMultiremote) {
            const multiRemoteBrowser = this._browser as unknown as WebdriverIO.MultiRemoteBrowser
            Object.keys(this._caps).forEach((browserName) => {
                try {
                    const instance = multiRemoteBrowser.getInstance(browserName)
                    if (instance) {
                        register(instance)
                    }
                } catch (error) {
                    BStackLogger.debug(`setCustomTags: could not register on multiremote instance ${browserName}: ${error}`)
                }
            })
        }
    }

    /** Drain the accumulated custom_metadata for a test uuid; clears after read. */
    static drain(testUuid: string | undefined): CustomMetadata | undefined {
        const data = _CustomTagsHandler.accumulator.get(testUuid)
        _CustomTagsHandler.accumulator.clear(testUuid)
        return data
    }
}

// https://github.com/microsoft/TypeScript/issues/6543
const CustomTagsHandler: typeof _CustomTagsHandler = o11yClassErrorHandler(_CustomTagsHandler)
type CustomTagsHandler = _CustomTagsHandler

export default CustomTagsHandler
