/* istanbul ignore file */

import AppiumLauncher from './launcher.js'
import type { AppiumServiceConfig } from './types'

export default class AppiumService {}
export const launcher = AppiumLauncher

export * from './types.js'

declare global {
    namespace WebdriverIO {
        interface ServiceOption extends AppiumServiceConfig {}
    }
}
