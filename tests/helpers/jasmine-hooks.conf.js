import { config as baseConfig } from './config.js'

export const config = Object.assign({}, baseConfig, {
    beforeTest() {
        // this is a global function defined by Jasmine
        pending('skip test')
    }
})
