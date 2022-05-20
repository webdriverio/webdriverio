import logger from '@wdio/logger'

import { setPort } from './client.js'
import type { SharedStoreServiceCapabilities } from './types'

const log = logger('@wdio/shared-store-service')

let server: SharedStoreServer

export default class SharedStoreLauncher {
    async onPrepare (_: never, capabilities: SharedStoreServiceCapabilities[]) {
        /**
         * import during runtime to avoid unnecessary dependency loading
         */
        server = (await import('./server')) as SharedStoreServer
        const result = await server.startServer()
        setPort(result.port)
        capabilities.forEach((capability) => {
            capability['wdio:sharedStoreServicePort'] = result.port
        })

        log.info(`Started shared server on port ${result.port}`)
    }
}
