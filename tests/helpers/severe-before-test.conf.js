import { SevereServiceError } from 'webdriverio'
import { config as baseConfig } from './config.js'

export const config = Object.assign({}, baseConfig, {
    beforeTest() {
        throw new SevereServiceError('beforeTest found a problem')
    }
})
