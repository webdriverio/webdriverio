/* istanbul ignore file */

import SeleniumStandaloneLauncher from './launcher'
import { SeleniumStandaloneOptions } from './types'

export default class SeleniumStandaloneService {}
export const launcher = SeleniumStandaloneLauncher
export * from './types'

declare global {
    namespace WebdriverIO {
        /**
         * property `args` also exists in Appium
         * ToDo(Christian): fine a better way to extend service options
         */
        interface ServiceOption extends Omit<SeleniumStandaloneOptions, 'args'> {}
    }
}
