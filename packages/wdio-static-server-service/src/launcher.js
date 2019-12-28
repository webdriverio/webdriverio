import path from 'path'
import { promisify } from 'util'

import express from 'express'
import fs from 'fs-extra'
import morgan from 'morgan'
import logger from '@wdio/logger'

const log = logger('@wdio/static-server-service')

const DEFAULT_LOG_NAME = 'wdio-static-server-service.log'

export default class StaticServerLauncher {
    async onPrepare({ folders, port = 4567, middleware = [] }, caps, { outputDir }) {
        if (!folders) {
            return
        }

        this.server = express()
        this.folders = Array.isArray(folders) ? folders : [folders]
        this.port = port

        if (outputDir) {
            const file = path.join(outputDir, DEFAULT_LOG_NAME)
            fs.createFileSync(file)
            const stream = fs.createWriteStream(file)
            this.server.use(morgan('tiny', { stream }))
        }

        this.folders.forEach((folder) => {
            log.info('Mounting folder `%s` at `%s`', path.resolve(folder.path), folder.mount)
            this.server.use(folder.mount, express.static(folder.path))
        })

        middleware.forEach(
            (ware) => this.server.use(ware.mount, ware.middleware))

        await promisify(this.server.listen)(this.port)
        log.info(`Static server running at http://localhost:${this.port}`)
    }
}
