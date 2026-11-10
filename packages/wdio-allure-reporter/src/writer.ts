import { basename, dirname, join, resolve } from 'node:path'
import { renameSync, rmSync } from 'node:fs'
import logger from '@wdio/logger'
import { LabelName, type TestResult } from 'allure-js-commons'
import { FileSystemWriter } from 'allure-js-commons/sdk/reporter'

import { PENDING_ATTACHMENT_PREFIX, PENDING_ATTACHMENT_SUFFIX } from './worker.js'

const log = logger('@wdio/allure-reporter')

export class LinkingFileSystemWriter extends FileSystemWriter {
    #resultsDir: string
    #defaultHost?: string

    constructor(resultsDir: string, defaultHost?: string) {
        super({ resultsDir })
        this.#resultsDir = resolve(resultsDir)
        this.#defaultHost = defaultHost
    }

    writeResult(result: TestResult) {
        const isDefault = (label: TestResult['labels'][number]) => label.name === LabelName.HOST && label.value === this.#defaultHost
        const hosts = result.labels.filter((label) => label.name === LabelName.HOST)
        if (this.#defaultHost === undefined || hosts.length < 2) {
            return super.writeResult(result)
        }
        // a host of the test itself (a tag, addLabel, ALLURE_LABEL_host) replaces the default one
        const ownHost = hosts.some((label) => !isDefault(label))
        const firstDefault = result.labels.findIndex(isDefault)
        const labels = result.labels.filter((label, i) => !isDefault(label) || (!ownHost && i === firstDefault))
        return super.writeResult({ ...result, labels })
    }

    writeAttachmentFromPath(distFileName: string, from: string) {
        const source = resolve(from)
        const name = basename(source)
        if (dirname(source) !== this.#resultsDir || !name.startsWith(PENDING_ATTACHMENT_PREFIX) || !name.endsWith(PENDING_ATTACHMENT_SUFFIX)) {
            return super.writeAttachmentFromPath(distFileName, from)
        }
        try {
            renameSync(source, join(this.#resultsDir, distFileName))
        } catch (renameErr) {
            try {
                super.writeAttachmentFromPath(distFileName, from)
                rmSync(source, { force: true })
            } catch {
                log.warn(`Could not move the attachment ${source} into the Allure results: ${(renameErr as Error).message}`)
            }
        }
    }
}
