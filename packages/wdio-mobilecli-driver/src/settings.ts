import type { Capabilities } from '@wdio/types'

import { DEFAULT_SETTINGS, DEFAULT_WAIT_INTERVAL, DEFAULT_WAIT_TIMEOUT, PACKAGE_NAME } from './constants.js'
import type { Session, Settings, WaitOptions } from './types.js'

const SETTING_NAMES = ['actionTimeout', 'pollInterval', ...Object.keys(DEFAULT_SETTINGS)]

function isTime (value: unknown): value is number {
    return typeof value === 'number' && Number.isFinite(value) && value >= 0
}

/**
 * The settings of a session: the capability `mobilecli:options` on top of
 * the defaults. A setting that the driver does not know or that is not a
 * time fails the session, so that a typo does not go unseen.
 */
export function getSettings (capabilities: WebdriverIO.Capabilities = {}): Settings {
    const options: Capabilities.MobilecliOptions = capabilities['mobilecli:options'] ?? {}
    if (typeof options !== 'object' || Array.isArray(options)) {
        throw new Error(`The capability "mobilecli:options" has to be an object, got: ${JSON.stringify(options)}`)
    }

    for (const [name, value] of Object.entries(options)) {
        if (!SETTING_NAMES.includes(name)) {
            throw new Error(
                `The capability "mobilecli:options" has the unknown setting "${name}". ` +
                `${PACKAGE_NAME} knows: ${SETTING_NAMES.join(', ')}.`
            )
        }
        if (!isTime(value)) {
            throw new Error(`The setting "${name}" of the capability "mobilecli:options" has to be a number of 0 or more, got: ${JSON.stringify(value)}`)
        }
    }
    return { ...DEFAULT_SETTINGS, ...options }
}

interface WaitSettings {
    waitforTimeout?: number
    waitforInterval?: number
}

/**
 * How long the commands of a session wait for their element, and how long
 * between two looks at the screen. The first of these that is set:
 * - the timeout: `browser.setTimeout({ implicit })`, `actionTimeout` of
 *   `mobilecli:options`, `waitforTimeout` of WebdriverIO
 * - the interval: `pollInterval` of `mobilecli:options`, `waitforInterval`
 *   of WebdriverIO
 * @param options  the options of the WebdriverIO session
 */
export function getWaitOptions (session: Pick<Session, 'settings' | 'timeouts'>, options: object = {}): WaitOptions {
    const { waitforTimeout, waitforInterval } = options as WaitSettings
    return {
        timeout: session.timeouts.implicit ?? session.settings.actionTimeout ??
            (typeof waitforTimeout === 'number' ? waitforTimeout : DEFAULT_WAIT_TIMEOUT),
        interval: session.settings.pollInterval ??
            (typeof waitforInterval === 'number' ? waitforInterval : DEFAULT_WAIT_INTERVAL)
    }
}
