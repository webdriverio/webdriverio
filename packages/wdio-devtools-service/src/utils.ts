import type { Browser, MultiRemoteBrowser } from 'webdriverio'
import type { Capabilities } from '@wdio/types'
import type { CDPSession } from 'puppeteer-core/lib/cjs/puppeteer/common/Connection'
import type { Target } from 'puppeteer-core/lib/cjs/puppeteer/common/Target'
import Driver from 'lighthouse/lighthouse-core/gather/driver.js'

import ChromeProtocol from './lighthouse/cri.js'
import { IGNORED_URLS, UNSUPPORTED_ERROR_MESSAGE } from './constants.js'
import { RequestPayload } from './handler/network.js'
import type { GathererDriver } from './types'

const VERSION_PROPS = ['browserVersion', 'browser_version', 'version']
const SUPPORTED_BROWSERS_AND_MIN_VERSIONS = {
    'chrome': 63,
    'chromium' : 63,
    'googlechrome': 63,
    'google chrome': 63,
    'firefox': 86
}

export function setUnsupportedCommand (browser: Browser<'async'> | MultiRemoteBrowser<'async'>) {
    return browser.addCommand('cdp', /* istanbul ignore next */() => {
        throw new Error(UNSUPPORTED_ERROR_MESSAGE)
    })
}

/**
 * Create a sum of a specific key from a list of objects
 * @param list list of key/value objects
 * @param key  key of value to be summed up
 */
export function sumByKey (list: RequestPayload[], key: keyof RequestPayload) {
    return list.map((data) => data[key]).reduce((acc, val) => acc + val, 0)
}

/**
 * check if url is supported for tracing
 * @param  {String}  url to check for
 * @return {Boolean}     true if url was opened by user
 */
export function isSupportedUrl (url: string) {
    return IGNORED_URLS.filter((ignoredUrl) => url.startsWith(ignoredUrl)).length === 0
}

/**
 * check if browser version is lower than `minVersion`
 * @param {object} caps capabilities
 * @param {number} minVersion minimal chrome browser version
 */
export function isBrowserVersionLower (caps: Capabilities.Capabilities, minVersion: number) {
    const versionProp = VERSION_PROPS.find(
        (prop: keyof Capabilities.Capabilities) => caps[prop]
    ) as 'browserVersion'
    const browserVersion = getBrowserMajorVersion(caps[versionProp])
    return typeof browserVersion === 'number' && browserVersion < minVersion
}

/**
 * get chromedriver major version
 * @param   {string|*}      version chromedriver version like `78.0.3904.11` or just `78`
 * @return  {number|*}              either major version, ex `78`, or whatever value is passed
 */
export function getBrowserMajorVersion (version?: string | number) {
    if (typeof version === 'string') {
        const majorVersion = Number(version.split('.')[0])
        return isNaN(majorVersion) ? parseInt(version, 10) : majorVersion
    }
    return version
}

/**
 * check if browser is supported based on caps.browserName and caps.version
 * @param {object} caps capabilities
 */
export function isBrowserSupported(caps: Capabilities.Capabilities) {
    if (
        !caps.browserName ||
        !(caps.browserName.toLowerCase() in SUPPORTED_BROWSERS_AND_MIN_VERSIONS) ||
        isBrowserVersionLower(
            caps,
            SUPPORTED_BROWSERS_AND_MIN_VERSIONS[
                caps.browserName.toLowerCase() as keyof typeof SUPPORTED_BROWSERS_AND_MIN_VERSIONS
            ]
        )
    ) {
        return false
    }

    return true
}

/**
 * Either request the page list directly from the browser or if Selenium
 * or Selenoid is used connect to a target manually
 */
export async function getLighthouseDriver (session: CDPSession, target: Target): Promise<GathererDriver> {
    const connection = session.connection()

    if (!connection) {
        throw new Error('Couldn\'t find a CDP connection')
    }

    const cUrl = new URL(connection.url())
    const cdpConnection = new ChromeProtocol(cUrl.port, cUrl.hostname)

    /**
     * only create a new DevTools session if our WebSocket url doesn't already indicate
     * that we are using one
     */
    if (!cUrl.pathname.startsWith('/devtools/browser')) {
        await cdpConnection._connectToSocket({
            webSocketDebuggerUrl: connection.url(),
            id: target._targetId
        })
        const { sessionId } = await cdpConnection.sendCommand(
            'Target.attachToTarget',
            undefined,
            { targetId: target._targetId, flatten: true }
        )
        cdpConnection.setSessionId(sessionId)
        return new Driver(cdpConnection)
    }

    const list = await cdpConnection._runJsonCommand('list')
    await cdpConnection._connectToSocket(list[0])
    return new Driver(cdpConnection)
}
