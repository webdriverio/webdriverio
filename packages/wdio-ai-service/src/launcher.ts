import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'

import type { Services } from '@wdio/types'

import { resolveMode } from './cache.js'
import { formatSummary, readRecords, RUN_DIR_ENV } from './stats.js'
import type { AiServiceOptions } from './types.js'

/**
 * Collects the records the workers write and prints the end-of-run summary.
 */
export default class AiLauncher implements Services.ServiceInstance {
    readonly #options: AiServiceOptions
    readonly #config: Partial<WebdriverIO.Config>
    #dir?: string

    constructor (options: AiServiceOptions = {}, _capabilities?: unknown, config: Partial<WebdriverIO.Config> = {}) {
        this.#options = options
        this.#config = config
    }

    async onPrepare () {
        this.#dir = await fs.mkdtemp(path.join(os.tmpdir(), 'wdio-ai-run-'))
        /**
         * workers start after onPrepare and inherit the environment
         */
        process.env[RUN_DIR_ENV] = this.#dir
    }

    async onComplete () {
        if (!this.#dir) {
            return
        }
        const records = await readRecords(this.#dir)
        const summary = formatSummary(records, {
            mode: resolveMode(this.#options.cache, { updateSnapshots: this.#config.updateSnapshots }),
            outputDir: this.#config.outputDir
        })
        if (summary) {
            console.log(`\n${summary}\n`)
        }
        await fs.rm(this.#dir, { recursive: true, force: true })
        delete process.env[RUN_DIR_ENV]
    }
}
