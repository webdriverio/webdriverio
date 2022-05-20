import { join, resolve } from 'node:path'
import { promisify } from 'node:util'
import express from 'express'
import fs from 'fs-extra'
import morgan from 'morgan'
import logger from '@wdio/logger'
import type { Services } from '@wdio/types'

import type { FolderOption, MiddleWareOption } from './types'

const log = logger('@wdio/static-server-service')

const DEFAULT_LOG_NAME = 'wdio-static-server-service.log'

export default class StaticServerLauncher implements Services.ServiceInstance {
    private _folders: FolderOption[] | null
    private _port: number
    private _middleware: MiddleWareOption[]
    private _server?: express.Express

    constructor({ folders, port = 4567, middleware = [] }: { folders?: FolderOption[] | FolderOption, port?: number, middleware?: MiddleWareOption[] }) {
        this._folders = folders ? Array.isArray(folders) ? folders : [folders] : null
        this._port = port
        this._middleware = middleware
    }

    async onPrepare({ outputDir }: { outputDir?: string }) {
        if (!this._folders) {
            return
        }

        this._server = express()

        if (outputDir) {
            const file = join(outputDir, DEFAULT_LOG_NAME)
            fs.createFileSync(file)
            const stream = fs.createWriteStream(file)
            this._server.use(morgan('tiny', { stream }))
        }

        this._folders.forEach((folder: FolderOption) => {
            log.info('Mounting folder `%s` at `%s`', resolve(folder.path), folder.mount)
            this._server!.use(folder.mount, express.static(folder.path))
        })

        this._middleware.forEach(
            (ware: MiddleWareOption) => this._server!.use(ware.mount, ware.middleware as unknown as express.Application))

        const listen = <(port: number) => Promise<any>> promisify(this._server.listen.bind(this._server))
        await listen(this._port)
        log.info(`Static server running at http://localhost:${this._port}`)
    }
}
