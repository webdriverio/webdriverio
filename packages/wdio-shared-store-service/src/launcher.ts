import logger from '@wdio/logger'

import { setPort } from './client.js'
import type { SharedStoreServiceCapabilities } from './types.js'

const log = logger('@wdio/shared-store-service')

let server: SharedStoreServer

export default class SharedStoreLauncher {
    private _app?: PolkaInstance

    async onPrepare (_: never, capabilities: SharedStoreServiceCapabilities[]) {
        /**
         * import during runtime to avoid unnecessary dependency loading
         */
        server = (await import('./server.js')) as SharedStoreServer
        const { port, app } = await server.startServer()
        this._app = app
        setPort(port)
        capabilities.forEach((capability) => {
            capability['wdio:sharedStoreServicePort'] = port
        })

        log.info(`Started shared server on port ${port}`)
    }

    async onComplete () {
        return new Promise<void>((resolve) => {
            if (this._app && this._app.server.close) {
                this._app.server.close(() => resolve())
            }
            return resolve()
        })
    }
}
