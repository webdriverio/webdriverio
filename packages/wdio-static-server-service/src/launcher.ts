import { join, resolve } from "path";
import { promisify } from 'util'

import express from 'express'
import fs from 'fs-extra'
import morgan from 'morgan'
import logger from '@wdio/logger'
import { FolderOption, MiddleWareOption } from './types'

const log = logger('@wdio/static-server-service')

const DEFAULT_LOG_NAME = 'wdio-static-server-service.log'

export default class StaticServerLauncher {
    folders: FolderOption[] | null
    port: number
    middleware: MiddleWareOption[]
    server: any
    constructor({ folders, port = 4567, middleware = [] }: { folders?: FolderOption[] | FolderOption, port?: number, middleware?: MiddleWareOption[] }) {
        this.folders = folders ? Array.isArray(folders) ? folders : [folders] : null
        this.port = port
        this.middleware = middleware
    }

    async onPrepare({ outputDir }: { outputDir?: string }) {
        if (!this.folders) {
            return
        }

        this.server = express()

        if (outputDir) {
            const file = join(outputDir, DEFAULT_LOG_NAME)
            fs.createFileSync(file)
            const stream = fs.createWriteStream(file)
            this.server.use(morgan('tiny', { stream }))
        }

        this.folders.forEach((folder: FolderOption) => {
            log.info('Mounting folder `%s` at `%s`', resolve(folder.path), folder.mount)
            this.server.use(folder.mount, express.static(folder.path))
        })

        this.middleware.forEach(
            (ware: MiddleWareOption) => this.server.use(ware.mount, ware.middleware))

        await promisify(this.server.listen.bind(this.server))(this.port)
        log.info(`Static server running at http://localhost:${this.port}`)
    }
}
