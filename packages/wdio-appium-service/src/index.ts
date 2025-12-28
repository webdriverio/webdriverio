/* istanbul ignore file */

import AppiumLauncher from './launcher.js'
import SelectorPerformanceService from './mspo/mspo-service.js'

export default class AppiumService extends SelectorPerformanceService {}
export const launcher = AppiumLauncher

export * from './types.js'
import type { AppiumServiceConfig } from './types.js'

declare global {
    namespace WebdriverIO {
        interface ServiceOption extends AppiumServiceConfig {}
    }
}
