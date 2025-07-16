import logger from '@wdio/logger'
import type { Capabilities } from '@wdio/types'

import { definesRemoteDriver } from './utils.js'

const log = logger('@wdio/utils')

export async function startWebDriver (options: Capabilities.RemoteConfig) {
    /**
     * if any of the connection parameter are set, don't start any driver
     */
    if (definesRemoteDriver(options)) {
        log.info(`Connecting to existing driver at ${options.protocol}://${options.hostname}:${options.port}${options.path}`)
        return
    }

    /**
     * only import `startWebDriver` when run in Node.js
     */
    if (globalThis.process) {
        /**
         * import like this so Vite doesn't inline the import
         */
        const nodeModule = './node/index.js'
        const { startWebDriver } = await import(nodeModule)
        return startWebDriver(options)
    }

    throw new Error('Please provide a valid `hostname` and `port` to start WebDriver sessions in the browser!')
}
