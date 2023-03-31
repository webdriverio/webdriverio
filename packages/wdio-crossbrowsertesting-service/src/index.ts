/* istanbul ignore file */

import CrossBrowserTestingLauncher from './launcher.js'
import CrossBrowserTestingService from './service.js'
import type { CrossBrowserTestingConfig } from './types.js'

export default CrossBrowserTestingService
export const launcher = CrossBrowserTestingLauncher
export * from './types.js'

declare global {
    namespace WebdriverIO {
        interface ServiceOption extends CrossBrowserTestingConfig {}
    }
}
