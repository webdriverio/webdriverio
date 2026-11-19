import { SevereServiceError } from 'webdriverio'
import { config as baseConfig } from './config.js'

export const config = Object.assign({}, baseConfig, {
    afterTest() {
        throw new SevereServiceError('afterTest found a problem')
    }
})
