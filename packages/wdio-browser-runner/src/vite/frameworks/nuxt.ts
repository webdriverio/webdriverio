import path from 'node:path'
import logger from '@wdio/logger'
import type { Options } from '@wdio/types'
import type { InlineConfig } from 'vite'

import { hasFile } from './utils.js'

declare global {
    // eslint-disable-next-line no-var
    var defineNuxtConfig: Function
}

const log = logger('@wdio/browser-runner:NuxtOptimization')

export async function isNuxtFramework (rootDir: string) {
    return (
        await Promise.all([
            getNuxtConfig(rootDir),
            hasFile(path.join(rootDir, '.nuxt'))
        ])
    ).filter(Boolean).length > 0
}

export async function optimizeForNuxt (options: WebdriverIO.BrowserRunnerOptions, config: Options.Testrunner) {
    const Unimport = (await import('unimport/unplugin')).default
    const { scanDirExports } = await import('unimport')
    const { loadNuxtConfig } = await import('@nuxt/kit')
    const rootDir = config.rootDir || process.cwd()
    const nuxtOptions = await loadNuxtConfig({ rootDir })

    if (nuxtOptions.imports?.autoImport === false) {
        return
    }

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
    const composableImports = await scanDirExports(composablesDirs)
    options.viteConfig = (options.viteConfig || {}) as InlineConfig

    /**
     * propagate "alias" config
     */
    options.viteConfig.resolve = Object.assign(options.viteConfig.resolve || {}, {
        alias: nuxtOptions.alias || {}
    })

    const viteConfig = (options.viteConfig || {}) as InlineConfig
    if (!Array.isArray(viteConfig.plugins)) {
        viteConfig.plugins = []
    }

    viteConfig.plugins.push(Unimport.vite({
        presets: ['vue'],
        imports: composableImports
    }))
    log.info(`Optimized Vite config for Nuxt project at ${rootDir}`)
}

async function getNuxtConfig (rootDir: string) {
    const pathOptions = [
        path.join(rootDir, 'nuxt.config.js'),
        path.join(rootDir, 'nuxt.config.ts'),
        path.join(rootDir, 'nuxt.config.mjs'),
        path.join(rootDir, 'nuxt.config.mts')
    ]
    return (
        await Promise.all(
            pathOptions.map(
                async (o) => (await hasFile(o)) && o
            )
        ).then(
            (res) => res.filter(Boolean)
        )
    )[0] as string | undefined
}
