import url from 'node:url'
import path from 'node:path'
import { access } from 'node:fs/promises'

import { resolve } from 'import-meta-resolve'

import logger from '@wdio/logger'
import type { Options } from '@wdio/types'

import { objectToEnv } from '../utils.js'
import type { ModuleImportService } from '../types.js'

const log = logger('@wdio/config:utils')

export async function loadTypeScriptCompiler (autoCompileConfig: Options.AutoCompileConfig) {
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
        if (process.env.VITEST_WORKER_ID && process.env.THROW_TSNODE_RESOLVE) {
            throw new Error('test fail')
        }
        await resolve('ts-node', import.meta.url)
        const loaderPath = await resolve('ts-node/esm/transpile-only.mjs', import.meta.url)
        await access(new URL(loaderPath))
        process.env.WDIO_LOAD_TS_NODE = '1'
        objectToEnv(autoCompileConfig.tsNodeOpts)
        return true
    } catch (err: any) {
        log.debug(`Failed loading TS Node: ${err.message}`)
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

export async function loadAutoCompilers(autoCompileConfig: Options.AutoCompileConfig, requireService: ModuleImportService) {
    if (!autoCompileConfig.autoCompile) {
        return
    }

    return (
        await loadTypeScriptCompiler(autoCompileConfig) ||
        await loadBabelCompiler(
            autoCompileConfig.babelOpts,
            requireService
        )
    )
}

export async function loadBabelCompiler (babelOpts: Record<string, any> = {}, requireService: ModuleImportService) {
    try {
        /**
         * only for testing purposes
         */
        if (process.env.VITEST_WORKER_ID && process.env.THROW_BABEL_REGISTER) {
            throw new Error('test fail')
        }

        (await requireService.import('@babel/register') as any)(babelOpts)
        log.debug('Found \'@babel/register\' package, auto-compiling files with Babel')
        return true
    } catch (err: any) {
        return false
    }
}
