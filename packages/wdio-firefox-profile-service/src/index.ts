/* istanbul ignore file */

import FirefoxProfileLauncher from './launcher'
import type { FirefoxProfileOptions } from './types'

export const launcher = FirefoxProfileLauncher
export * from './types'

declare global {
    namespace WebdriverIO {
        interface ServiceOption extends FirefoxProfileOptions {}
    }
}
