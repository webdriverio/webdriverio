/* istanbul ignore file */

import CrossBrowserTestingLauncher from './launcher'
import CrossBrowserTestingService from './service'
import { CrossBrowserTestingConfig } from './types'

export default CrossBrowserTestingService
export const launcher = CrossBrowserTestingLauncher
export * from './types'

declare global {
    namespace WebdriverIO {
        interface ServiceOption extends CrossBrowserTestingConfig {}
    }
}
