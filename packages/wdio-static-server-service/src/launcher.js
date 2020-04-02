import path from 'path'
import { promisify } from 'util'

import express from 'express'
import fs from 'fs-extra'
import morgan from 'morgan'
import logger from '@wdio/logger'

const log = logger('@wdio/static-server-service')

const DEFAULT_LOG_NAME = 'wdio-static-server-service.log'

export default class StaticServerLauncher {
    constructor ({ folders, port = 4567, middleware = [] }) {
        this.folders = folders ? Array.isArray(folders) ? folders : [folders] : null
        this.port = port
        this.middleware = middleware
    }

    async onPrepare ({ outputDir }) {
        if (!this.folders) {
            return
        }

        this.server = express()

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

        this.middleware.forEach(
            (ware) => this.server.use(ware.mount, ware.middleware))

        await promisify(this.server.listen.bind(this.server))(this.port)
        log.info(`Static server running at http://localhost:${this.port}`)
    }
}
