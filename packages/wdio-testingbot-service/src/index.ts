/* istanbul ignore file */

import TestingBotLauncher from './launcher'
import TestingBotService from './service'
import { TestingbotOptions } from './types'

export default TestingBotService
export const launcher = TestingBotLauncher
export * from './types'

declare global {
    namespace WebdriverIO {
        interface ServiceOption extends TestingbotOptions {}
    }
}
