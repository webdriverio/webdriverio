import express from 'express'
import fs from 'fs-extra'
import morgan from 'morgan'
import path from 'path'
import logger from '@wdio/logger'

const log = logger('@wdio/static-server-service')

const DEFAULT_LOG_NAME = 'wdio-static-server-service.log'

export default class StaticServerLauncher {
    onPrepare({
        outputDir,
        staticServerFolders: folders,
        staticServerPort: port = 4567,
        staticServerMiddleware: middleware = []
    }) {
        if (!folders) {
            return
        }

        this.server = express()
        this.folders = folders
        this.port = port

        if (outputDir) {
            const file = path.join(outputDir, DEFAULT_LOG_NAME)
            fs.createFileSync(file)
            const stream = fs.createWriteStream(file)
            this.server.use(morgan('tiny', { stream }))
        }

        (Array.isArray(folders) ? folders : [folders]).forEach((folder) => {
            log.info('Mounting folder `%s` at `%s`', path.resolve(folder.path), folder.mount)
            this.server.use(folder.mount, express.static(folder.path))
        })

        middleware.forEach(
            (ware) => this.server.use(ware.mount, ware.middleware))

        return new Promise((resolve, reject) => this.server.listen(this.port, (err) => {
            /* istanbul ignore next */
            if (err) {
                log.error(`Couldn't start static server: ${err.message}`)
                return reject(err)
            }

            log.info(`Static server running at http://localhost:${port}`)
            resolve()
        }))
    }
}
