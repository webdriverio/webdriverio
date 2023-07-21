import SauceLauncher from './launcher.js'
import SauceService from './service.js'
import type { SauceServiceConfig } from './types.js'

export default SauceService
export const launcher = SauceLauncher
export * from './types.js'

declare global {
    namespace WebdriverIO {
        interface ServiceOption extends SauceServiceConfig {}
    }
}
