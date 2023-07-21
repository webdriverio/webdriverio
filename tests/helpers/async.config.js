import { config as baseConfig } from './config.js'

export const config = Object.assign({}, baseConfig, {
    runnerEnv: {
        WDIO_NO_SYNC_SUPPORT: true
    }
})
