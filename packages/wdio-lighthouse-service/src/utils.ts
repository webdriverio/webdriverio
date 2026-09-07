import { Driver } from 'lighthouse/core/gather/driver.js'

import { IGNORED_URLS, UNSUPPORTED_ERROR_MESSAGE } from './constants.js'
import type { RequestPayload } from './handler/network.js'
import type { Page } from 'puppeteer-core'

const CUSTOM_COMMANDS = [
    'getMetrics',
    'startTracing',
    'getDiagnostics',
    'getCoverageReport',
    'enablePerformanceAudits',
    'disablePerformanceAudits',
    'getMainThreadWorkBreakdown',
    'checkPWA'
]

export function setUnsupportedCommand (browser: WebdriverIO.Browser | WebdriverIO.MultiRemoteBrowser) {
    for (const command of CUSTOM_COMMANDS) {
        (browser as WebdriverIO.Browser).addCommand(command, /* istanbul ignore next */() => {
            throw new Error(UNSUPPORTED_ERROR_MESSAGE)
        }, {})
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
// export async function getLighthouseDriver (session: CDPSession, target: Target): Promise<Driver> {
//     const connection = session.connection()

//     if (!connection) {
//         throw new Error('Couldn\'t find a CDP connection')
//     }

//     const cUrl = new URL(connection.url())
//     const cdpConnection = new ChromeProtocol(Number(cUrl.port), cUrl.hostname)

//     /**
//      * only create a new DevTools session if our WebSocket url doesn't already indicate
//      * that we are using one
//      */
//     if (!cUrl.pathname.startsWith('/devtools/browser')) {
//         // @ts-expect-error -- TODO to review
//         await cdpConnection._connectToSocket({
//             webSocketDebuggerUrl: connection.url(),
//             id: (await target.asPage()).mainFrame()._id
//         })
//         const { sessionId } = await cdpConnection.sendCommand(
//             'Target.attachToTarget',
//             undefined,
//             { targetId: (await target.asPage()).mainFrame()._id, flatten: true }
//         )
//         cdpConnection.setSessionId(sessionId)
//         return new Driver(cdpConnection)
//     }

//     // @ts-expect-error -- TODO to review
//     const list = await cdpConnection._runJsonCommand('list')
//     // @ts-expect-error -- TODO to review
//     await cdpConnection._connectToSocket(list[0])
//     return new Driver(cdpConnection)
// }

export async function getLighthouseDriver (page: Page): Promise<Driver> {
    const driver = new Driver(page)
    await driver.connect()
    return driver
}
