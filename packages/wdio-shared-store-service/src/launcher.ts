import logger from '@wdio/logger'

import { writeFile, deleteFile, getPidPath } from './utils'

const log = logger('@wdio/shared-store-service')

let server: SharedStoreServer

export default class SharedStoreLauncher {
    pidFile: string
    constructor() {
        // current process pid
        this.pidFile = getPidPath(process.pid)
    }

    async onPrepare () {
        server = require('./server').default
        const result = await server.startServer()

        log.info(`Started shared server on port ${result.port}`)
        await writeFile(this.pidFile, result.port.toString())
    }

    async onComplete () {
        await server.stopServer()
        await deleteFile(this.pidFile)
    }
}
