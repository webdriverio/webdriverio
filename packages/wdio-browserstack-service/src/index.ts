/* istanbul ignore file */

import BrowserstackLauncher from './launcher'
import BrowserstackService from './service'
import type { BrowserstackConfig } from './types'

export default BrowserstackService
export const launcher = BrowserstackLauncher
export * from './types'

declare global {
    namespace WebdriverIO {
        interface ServiceOption extends BrowserstackConfig {}
    }
}
