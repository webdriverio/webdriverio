import type { Options } from '@wdio/types'
import type { InlineConfig } from 'vite'

import { isNuxtFramework, optimizeForNuxt } from './nuxt.js'
import { isUsingTailwindCSS, optimizeForTailwindCSS } from './tailwindcss.js'
import { isUsingStencilJS, optimizeForStencil } from './stencil.js'

export default async function updateViteConfig (options: WebdriverIO.BrowserRunnerOptions, config: Options.Testrunner) {
    const optimizations: InlineConfig = {}
    const rootDir = options.rootDir || config.rootDir || process.cwd()

    const isNuxt = await isNuxtFramework(rootDir)
    if (isNuxt) {
        Object.assign(optimizations, await optimizeForNuxt(options, config))
    }

    const isTailwind = await isUsingTailwindCSS(rootDir)
    if (isTailwind) {
        Object.assign(optimizations, await optimizeForTailwindCSS(rootDir))
    }

    if (isUsingStencilJS(rootDir, options)) {
        Object.assign(optimizations, await optimizeForStencil(rootDir))
    }

    return optimizations
}
