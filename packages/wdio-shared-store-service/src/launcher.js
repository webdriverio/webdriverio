import { writeFile, deleteFile, getPidPath } from './utils'

let server = null

export default class SharedStoreLauncher {
    constructor() {
        // current process pid
        this.pidFile = getPidPath(process.pid)
    }

    async onPrepare () {
        server = require('./server').default
        const result = await server.startServer()

        await writeFile(this.pidFile, result.port)
    }

    async onComplete () {
        await server.stopServer()
        await deleteFile(this.pidFile)
    }
}
