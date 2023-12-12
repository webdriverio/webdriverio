import { config as baseConfig } from './config.js'

export const config = Object.assign({}, baseConfig, {
    beforeTest() {
        pending()
    }
})
