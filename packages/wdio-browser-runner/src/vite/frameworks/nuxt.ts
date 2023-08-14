import url from 'node:url'
import path from 'node:path'
import logger from '@wdio/logger'
import { resolve } from 'import-meta-resolve'
import type { Options } from '@wdio/types'
import type { InlineConfig } from 'vite'

import { hasFileByExtensions, hasDir } from '../utils.js'

declare global {
    // eslint-disable-next-line no-var
    var defineNuxtConfig: Function
}

const log = logger('@wdio/browser-runner:NuxtOptimization')

export async function isNuxtFramework (rootDir: string) {
    return (
        await Promise.all([
            hasFileByExtensions(path.join(rootDir, 'nuxt.config')),
            hasDir(path.join(rootDir, '.nuxt'))
        ])
    ).filter(Boolean).length > 0
}

export async function optimizeForNuxt (options: WebdriverIO.BrowserRunnerOptions, config: Options.Testrunner): Promise<InlineConfig> {
    const Unimport = (await import('unimport/unplugin')).default
    const { scanDirExports, scanExports } = await import('unimport')
    const { loadNuxtConfig } = await import('@nuxt/kit')
    const rootDir = config.rootDir || process.cwd()
    const nuxtOptions = await loadNuxtConfig({ rootDir })

    if (nuxtOptions.imports?.autoImport === false) {
        return {}
    }

    const nuxtDepPath = await resolve('nuxt', import.meta.url)
    const composablesDirs: string[] = []
    for (const layer of nuxtOptions._layers) {
        composablesDirs.push(path.resolve(layer.config.srcDir, 'composables'))
        composablesDirs.push(path.resolve(layer.config.srcDir, 'utils'))
        for (const dir of (layer.config.imports?.dirs ?? [])) {
            if (!dir) {
                continue
            }
            composablesDirs.push(path.resolve(layer.config.srcDir, dir))
        }
    }
    const composableImports = await Promise.all([
        scanDirExports([
            ...composablesDirs,
            path.resolve(path.dirname(url.fileURLToPath(nuxtDepPath)), 'app', 'components')
        ]),
        scanExports(path.resolve(path.dirname(url.fileURLToPath(nuxtDepPath)), 'app', 'composables', 'index.js'))
    ]).then((scannedExports) => scannedExports.flat().map((ci) => {
        /**
         * auto mock nuxt composables as they can't be loaded within the browser
         */
        if (ci.from.includes('/nuxt/dist/app/composables')) {
            ci.from = 'virtual:wdio'
            ci.name = 'wrappedFn'
        }
        return ci
    }))

    const viteConfig: InlineConfig = {
        resolve: {
            alias: nuxtOptions.alias || {}
        },
        plugins: [Unimport.vite({
            presets: ['vue'],
            imports: composableImports
        })]
    }

    log.info(`Optimized Vite config for Nuxt project at ${rootDir}`)
    return viteConfig
}
