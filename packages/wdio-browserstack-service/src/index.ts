/* istanbul ignore file */

import BrowserstackLauncher from './launcher.js'
import BrowserstackService from './service.js'
import type { BrowserstackConfig } from './types'

export default BrowserstackService
export const launcher = BrowserstackLauncher
export * from './types.js'

declare global {
    namespace WebdriverIO {
        interface ServiceOption extends BrowserstackConfig {}
    }
}
