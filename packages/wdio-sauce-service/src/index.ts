import SauceLauncher from './launcher'
import SauceService from './service'
import { SauceServiceConfig } from './types'

export default SauceService
export const launcher = SauceLauncher
export * from './types'

declare global {
    namespace WebdriverIO {
        interface ServiceOption extends SauceServiceConfig {}
    }
}
