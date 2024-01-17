/* istanbul ignore file */

import BrowserstackLauncher from './launcher.js'
import BrowserstackService from './service.js'
import type { BrowserstackConfig } from './types.js'
import { configure } from './log4jsAppender.js'
import logReportingAPI from './logReportingAPI.js'

export default BrowserstackService
export const launcher = BrowserstackLauncher
export const log4jsAppender = { configure }
export const BStackTestOpsLogger = logReportingAPI

import * as Percy from './Percy/PercySDK.js'
export const PercySDK = Percy

export * from './types.js'

declare global {
    namespace WebdriverIO {
        interface ServiceOption extends BrowserstackConfig {}
    }
}
