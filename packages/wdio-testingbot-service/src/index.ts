/* istanbul ignore file */

import TestingBotLauncher from './launcher.js'
import TestingBotService from './service.js'
import type { TestingbotOptions } from './types.js'

export default TestingBotService
export const launcher = TestingBotLauncher
export * from './types.js'

declare global {
    namespace WebdriverIO {
        interface ServiceOption extends TestingbotOptions {}
    }
}
