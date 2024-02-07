/* istanbul ignore file */

import BrowserstackLauncher from './launcher'
import BrowserstackService from './service'
import type { BrowserstackConfig } from './types'
import { configure } from './log4jsAppender'
import logReportingAPI from './logReportingAPI'

export default BrowserstackService
export const launcher = BrowserstackLauncher
export const log4jsAppender = { configure }
export const BStackTestOpsLogger = logReportingAPI

import * as Percy from './Percy/PercySDK'
export const PercySDK = Percy

export * from './types'

declare global {
    namespace WebdriverIO {
        interface ServiceOption extends BrowserstackConfig {}
    }
}
