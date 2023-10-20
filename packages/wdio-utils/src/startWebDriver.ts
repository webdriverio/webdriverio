import logger from '@wdio/logger'
import type { Options } from '@wdio/types'

import { definesRemoteDriver } from './utils.js'

const log = logger('@wdio/utils')

export async function startWebDriver (options: Options.WebDriver) {
    /**
     * if any of the connection parameter are set, don't start any driver
     */
    if (definesRemoteDriver(options)) {
        log.info(`Connecting to existing driver at ${options.protocol}://${options.hostname}:${options.port}${options.path}`)
        return
    }

    if (globalThis.process) {
        const { startWebDriver } = await import('./node/index.js')
        return startWebDriver(options)
    }

    throw new Error('Please provide a valid `hostname` and `port` to start WebDriver sessions in the browser!')
}
