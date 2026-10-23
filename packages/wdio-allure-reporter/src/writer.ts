import { basename, dirname, join, resolve } from 'node:path'
import { renameSync } from 'node:fs'
import logger from '@wdio/logger'
import { FileSystemWriter } from 'allure-js-commons/sdk/reporter'

import { PENDING_ATTACHMENT_PREFIX, PENDING_ATTACHMENT_SUFFIX } from './worker.js'

const log = logger('@wdio/allure-reporter')

export class LinkingFileSystemWriter extends FileSystemWriter {
    #resultsDir: string

    constructor(resultsDir: string) {
        super({ resultsDir })
        this.#resultsDir = resolve(resultsDir)
    }

    writeAttachmentFromPath(distFileName: string, from: string) {
        const source = resolve(from)
        const name = basename(source)
        if (dirname(source) !== this.#resultsDir || !name.startsWith(PENDING_ATTACHMENT_PREFIX) || !name.endsWith(PENDING_ATTACHMENT_SUFFIX)) {
            return super.writeAttachmentFromPath(distFileName, from)
        }
        try {
            renameSync(source, join(this.#resultsDir, distFileName))
        } catch (err) {
            log.warn(`Could not move the attachment ${source} into the Allure results: ${(err as Error).message}`)
        }
    }
}
