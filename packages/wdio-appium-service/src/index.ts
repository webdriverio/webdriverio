/* istanbul ignore file */

import AppiumLauncher from './launcher'

export default class AppiumService {}
export const launcher = AppiumLauncher

export * from './types'
import { AppiumServiceConfig } from './types'

declare global {
    namespace WebdriverIO {
        interface ServiceOption extends AppiumServiceConfig {}
    }
}
