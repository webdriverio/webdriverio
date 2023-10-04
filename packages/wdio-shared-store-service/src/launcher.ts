import logger from '@wdio/logger'
import type { Capabilities, Services } from '@wdio/types'

import { setPort } from './client.js'
import { CUSTOM_CAP } from './constants.js'
import type { SharedStoreServiceCapabilities } from './types.js'

const log = logger('@wdio/shared-store-service')

let server: SharedStoreServer

export default class SharedStoreLauncher implements Services.HookFunctions {
    private _app?: PolkaInstance

    async onPrepare (_: never, capabilities: Capabilities.RemoteCapabilities) {
        /**
         * import during runtime to avoid unnecessary dependency loading
         */
        server = (await import('./server.js')) as SharedStoreServer
        const { port, app } = await server.startServer()
        this._app = app
        setPort(port)

        const capsList = Array.isArray(capabilities)
            ? capabilities
            : Object.values(capabilities).map((multiremoteOption) => multiremoteOption.capabilities)

        const caps: Partial<SharedStoreServiceCapabilities>[] = capsList.flatMap((c) => {
            const multiremote = c as Capabilities.MultiRemoteCapabilities
            if (!multiremote.browserName && multiremote[Object.keys(multiremote)[0]].capabilities) {
                return Object.values(multiremote).map((options) =>
                    (options.capabilities as Capabilities.W3CCapabilities)?.alwaysMatch ||
                    (options.capabilities as Capabilities.Capabilities)
                )
            }

            const w3cCaps = c as Capabilities.W3CCapabilities
            return w3cCaps.alwaysMatch || c as Capabilities.Capabilities
        })
        caps.forEach((c) => { c[CUSTOM_CAP] = port })
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
