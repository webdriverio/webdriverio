/* istanbul ignore file */

import FirefoxProfileLauncher from './launcher.js'
import type { FirefoxProfileOptions } from './types'

export const launcher = FirefoxProfileLauncher
export * from './types.js'

declare global {
    namespace WebdriverIO {
        interface ServiceOption extends FirefoxProfileOptions {}
    }
}
