import logger from '@wdio/logger'

import { setPort } from './client'
import type { SharedStoreServiceCapabilities } from './types'

const log = logger('@wdio/shared-store-service')

let server: SharedStoreServer

export default class SharedStoreLauncher {
    async onPrepare (_: never, capabilities: SharedStoreServiceCapabilities[]) {
        server = require('./server').default
        const result = await server.startServer()
        setPort(result.port)
        capabilities.forEach(capability => {capability['wdio:sharedStoreServicePort'] = result.port})

        log.info(`Started shared server on port ${result.port}`)
    }
}
