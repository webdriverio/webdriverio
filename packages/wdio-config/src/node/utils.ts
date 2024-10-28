import url from 'node:url'
import path from 'node:path'
import { access } from 'node:fs/promises'

import { resolve } from 'import-meta-resolve'

import logger from '@wdio/logger'

import { objectToEnv } from '../utils.js'

const log = logger('@wdio/config:utils')

export async function loadTypeScriptCompiler (tsConfigPath?: string) {
    /**
     * don't auto compile within worker as it already was spawn with a loader
     */
    if (process.env.WDIO_WORKER_ID) {
        return false
    }

    try {
        /**
         * only for testing purposes
         */
        if (process.env.WDIO_UNIT_TESTS && process.env.THROW_TSX_RESOLVE) {
            throw new Error('test fail')
        }
        const loaderPath = await resolve('tsx', import.meta.url)
        await access(new URL(loaderPath))
        process.env.WDIO_LOAD_TSX = '1'
        objectToEnv({ tsConfigPath })
        return true
    } catch (err: any) {
        log.debug(`Failed loading TSX: ${err.message}`)
        return false
    }
}

export function makeRelativeToCWD (files: (string | string[])[] = []): (string | string[])[] {
    const returnFiles: (string | string[])[] = []

    for (const file of files) {
        if (Array.isArray(file)) {
            returnFiles.push(makeRelativeToCWD(file) as string[])
            continue
        }

        returnFiles.push(file.startsWith('file:///')
            ? url.fileURLToPath(file)
            : file.includes('/')
                ? path.resolve(process.cwd(), file)
                : file
        )
    }

    return returnFiles
}

