import type { CDPSession } from 'puppeteer-core/lib/esm/puppeteer/common/Connection.js'
import type { Target } from 'puppeteer-core/lib/esm/puppeteer/common/Target.js'
import Driver from 'lighthouse/lighthouse-core/gather/driver.js'

import ChromeProtocol from './lighthouse/cri.js'
import { IGNORED_URLS, UNSUPPORTED_ERROR_MESSAGE } from './constants.js'
import type { RequestPayload } from './handler/network.js'
import type { GathererDriver } from './types.js'

const CUSTOM_COMMANDS = [
    'cdp',
    'getNodeId',
    'getMetrics',
    'startTracing',
    'getDiagnostics',
    'getCoverageReport',
    'enablePerformanceAudits',
    'disablePerformanceAudits',
    'getMainThreadWorkBreakdown',
    'emulateDevice',
    'checkPWA'
]

export function setUnsupportedCommand (browser: WebdriverIO.Browser | WebdriverIO.MultiRemoteBrowser) {
    for (const command of CUSTOM_COMMANDS) {
        browser.addCommand(command, /* istanbul ignore next */() => {
            throw new Error(UNSUPPORTED_ERROR_MESSAGE)
        })
    }
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
 * @param  {string}  url to check for
 * @return {Boolean}     true if url was opened by user
 */
export function isSupportedUrl (url: string) {
    return IGNORED_URLS.filter((ignoredUrl) => url.startsWith(ignoredUrl)).length === 0
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
