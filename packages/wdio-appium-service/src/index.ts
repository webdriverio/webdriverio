/* istanbul ignore file */

import AppiumLauncher from './launcher.js'

export default class AppiumService {}
export const launcher = AppiumLauncher

export * from './types.js'
import type { AppiumServiceConfig } from './types'

declare global {
    namespace WebdriverIO {
        interface ServiceOption extends AppiumServiceConfig {}
    }
}
